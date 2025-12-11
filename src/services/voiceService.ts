import { supabase, VoiceSubmissionDB } from './supabase';

export interface VoiceSubmission {
  id: string;
  audio_url?: string;
  transcription: string;
  detected_language: string;
  source: 'telegram' | 'twilio' | 'voicemail' | 'manual';
  status: 'pending' | 'processing' | 'ready' | 'created' | 'discarded';
  extracted_data: ExtractedWorkOrderData;
  created_at: string;
  processed_at?: string;
  work_order_id?: string;
}

export interface ExtractedWorkOrderData {
  property?: { value: string; confidence: number };
  unit?: { value: string; confidence: number };
  issue_description?: { value: string; confidence: number };
  priority?: { value: 'emergency' | 'high' | 'normal' | 'low'; confidence: number };
  tenant_name?: { value: string; confidence: number };
  category?: { value: string; confidence: number };
}

export interface ConfidenceField<T> {
  value: T;
  confidence: number; // 0-100
}

export interface ExtractedWorkOrder {
  unit: string;
  building: string;
  priority: 'emergency' | 'high' | 'medium' | 'low';
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'general' | 'structural';
  description: string;
  urgencyIndicators: string[];
  confidence: number;
}

// Real AI extraction via Edge Function
export async function extractWorkOrderData(transcription: string): Promise<ExtractedWorkOrderData> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-work-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ transcription })
    });

    if (!response.ok) throw new Error('Extraction failed');

    const extracted: ExtractedWorkOrder = await response.json();
    
    // Map to frontend structure
    return {
      property: { value: extracted.building, confidence: extracted.confidence * 100 },
      unit: { value: extracted.unit, confidence: extracted.confidence * 100 },
      issue_description: { value: extracted.description, confidence: 95 },
      priority: { value: extracted.priority as any, confidence: extracted.confidence * 100 },
      category: { value: extracted.category, confidence: extracted.confidence * 100 },
      tenant_name: { value: '', confidence: 0 }
    };
  } catch (err) {
    console.error('Extraction error:', err);
    // Fallback to basic extraction on error
    return {
      issue_description: { value: transcription, confidence: 100 },
      priority: { value: 'normal', confidence: 50 },
      category: { value: 'General', confidence: 50 }
    };
  }
}

// Real transcription via Edge Function (Whisper)
export async function transcribeAudio(audioUrl: string): Promise<{ text: string; language: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ audioUrl })
    });

    if (!response.ok) throw new Error('Transcription failed');

    const result = await response.json();
    return {
      text: result.transcription,
      language: result.language || 'en'
    };
  } catch (err) {
    console.error('Transcription error:', err);
    return {
      text: "Error transcribing audio. Please listen manually.",
      language: "en"
    };
  }
}

// Orchestrate full processing
export async function processVoiceSubmission(submissionId: string): Promise<{
  transcription: string
  extracted: ExtractedWorkOrderData
}> {
  // Get submission from DB
  const { data: submission } = await supabase
    .from('voice_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (!submission?.audio_url) {
    throw new Error('Submission not found or missing audio');
  }

  // Step 1: Transcribe
  const { text: transcription } = await transcribeAudio(submission.audio_url);

  // Step 2: Extract entities
  const extracted = await extractWorkOrderData(transcription);

  // Step 3: Update submission record
  await supabase
    .from('voice_submissions')
    .update({
      transcription,
      extracted_data: extracted, // extracted_data column is JSONB, compatible
      status: 'ready', // Mark as ready for review
      processed_at: new Date().toISOString()
    })
    .eq('id', submissionId);

  return { transcription, extracted };
}

// Voice queue operations
export async function getVoiceQueue(): Promise<VoiceSubmission[]> {
  try {
    const { data, error } = await supabase
      .from('voice_submissions')
      .select('*')
      .in('status', ['pending', 'processing', 'ready'])
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase voice_submissions error, using mock data:', error.message);
      return getMockVoiceQueue();
    }

    if (!data || data.length === 0) {
      console.log('No voice submissions in DB, using mock data');
      return getMockVoiceQueue();
    }

    return data.map((row: VoiceSubmissionDB) => ({
      id: row.id,
      audio_url: row.audio_url,
      transcription: row.transcription,
      detected_language: row.detected_language || 'en',
      source: row.source,
      status: row.status,
      extracted_data: (row.extracted_data as unknown) as ExtractedWorkOrderData || {},
      created_at: row.created_at,
      processed_at: row.processed_at,
      work_order_id: row.work_order_id
    }));
  } catch (err) {
    console.warn('Failed to fetch voice queue from Supabase:', err);
    return getMockVoiceQueue();
  }
}

export async function createWorkOrderFromVoice(
  submissionId: string, 
  data: {
    property: string;
    unit: string;
    description: string;
    priority: string;
    category: string;
  }
): Promise<{ success: boolean; workOrderId?: string; error?: string }> {
  console.log('Creating work order from voice submission:', submissionId, data);
  
  // Generate a work order ID
  const workOrderId = `WO-VOICE-${Date.now()}`;
  
  try {
    // First, create a work_order_actions entry to track this
    const { error: actionError } = await supabase
      .from('work_order_actions')
      .insert({
        work_order_id: workOrderId,
        action_type: 'note' as const,
        action_data: {
          type: 'voice_submission_created',
          voice_submission_id: submissionId,
          property: data.property,
          unit: data.unit,
          description: data.description,
          priority: data.priority,
          category: data.category,
          created_from: 'voice_queue'
        },
        created_by: 'voice_system'
      });

    if (actionError) {
      console.warn('Failed to create work order action:', actionError.message);
    }

    // Update the voice submission status
    const { error: updateError } = await supabase
      .from('voice_submissions')
      .update({ 
        status: 'created', 
        work_order_id: workOrderId,
        processed_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) {
      console.warn('Failed to update voice submission:', updateError.message);
      // Still return success since we created the action
    }

    return {
      success: true,
      workOrderId
    };
  } catch (err) {
    console.error('Error creating work order from voice:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export async function discardVoiceSubmission(submissionId: string): Promise<{ success: boolean }> {
  console.log('Discarding voice submission:', submissionId);
  
  try {
    const { error } = await supabase
      .from('voice_submissions')
      .update({ 
        status: 'discarded',
        processed_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) {
      console.warn('Failed to discard voice submission in DB:', error.message);
      // Still return success for UI purposes
    }

    return { success: true };
  } catch (err) {
    console.warn('Error discarding voice submission:', err);
    return { success: true }; // Return success anyway to update UI
  }
}

// Insert a new voice submission (for webhook/manual entry)
export async function insertVoiceSubmission(submission: {
  source: 'telegram' | 'twilio' | 'voicemail' | 'manual';
  transcription: string;
  audio_url?: string;
  detected_language?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Extract data from transcription
    const extractedData = await extractWorkOrderData(submission.transcription);
    
    const { data, error } = await supabase
      .from('voice_submissions')
      .insert({
        source: submission.source,
        transcription: submission.transcription,
        audio_url: submission.audio_url,
        detected_language: submission.detected_language || 'en',
        extracted_data: extractedData,
        status: 'ready'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to insert voice submission:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error('Error inserting voice submission:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

// Mock data for development
function getMockVoiceQueue(): VoiceSubmission[] {
  return [
    {
      id: 'voice-001',
      transcription: "Hi, this is Maria from Unit 205 in Building A. My kitchen sink is leaking really bad, water is going everywhere. Please send someone as soon as possible, it's an emergency!",
      detected_language: 'en',
      source: 'twilio',
      status: 'ready',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      extracted_data: {
        property: { value: 'Building A', confidence: 85 },
        unit: { value: 'Unit 205', confidence: 90 },
        issue_description: { value: 'Kitchen sink leaking, water everywhere', confidence: 95 },
        priority: { value: 'emergency', confidence: 92 },
        category: { value: 'Plumbing', confidence: 88 },
        tenant_name: { value: 'Maria', confidence: 75 },
      }
    },
    {
      id: 'voice-002',
      transcription: "Hola, soy Carlos del apartamento 310. El aire acondicionado no funciona y hace mucho calor. Gracias.",
      detected_language: 'es',
      source: 'telegram',
      status: 'ready',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      extracted_data: {
        property: { value: '', confidence: 0 },
        unit: { value: 'Unit 310', confidence: 85 },
        issue_description: { value: 'Air conditioning not working, very hot', confidence: 90 },
        priority: { value: 'high', confidence: 70 },
        category: { value: 'HVAC', confidence: 92 },
        tenant_name: { value: 'Carlos', confidence: 80 },
      }
    },
    {
      id: 'voice-003',
      transcription: "Yeah um, the light in my bathroom stopped working. It's apartment 104 at 90 Park Street. Not urgent but would be nice to get fixed this week.",
      detected_language: 'en',
      source: 'voicemail',
      status: 'ready',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      extracted_data: {
        property: { value: '90 Park St', confidence: 82 },
        unit: { value: 'Unit 104', confidence: 88 },
        issue_description: { value: 'Bathroom light stopped working', confidence: 95 },
        priority: { value: 'normal', confidence: 85 },
        category: { value: 'Electrical', confidence: 90 },
        tenant_name: { value: '', confidence: 0 },
      }
    },
    {
      id: 'voice-004',
      transcription: "我是张伟，住在238号公寓。我的冰箱不制冷了，里面的食物都要坏了。请尽快派人来修理。",
      detected_language: 'zh',
      source: 'telegram',
      status: 'ready',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      extracted_data: {
        property: { value: '', confidence: 0 },
        unit: { value: 'Unit 238', confidence: 75 },
        issue_description: { value: 'Refrigerator not cooling, food spoiling', confidence: 88 },
        priority: { value: 'high', confidence: 80 },
        category: { value: 'Appliance', confidence: 95 },
        tenant_name: { value: '张伟', confidence: 70 },
      }
    },
  ];
}
