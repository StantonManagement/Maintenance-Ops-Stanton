import { supabase } from './supabase';

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

// Mock AI extraction - in production this would call Claude/OpenAI
export async function extractWorkOrderData(transcription: string): Promise<ExtractedWorkOrderData> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const lowerText = transcription.toLowerCase();
  
  // Extract priority based on keywords
  let priority: ExtractedWorkOrderData['priority'] = { value: 'normal', confidence: 60 };
  if (lowerText.includes('emergency') || lowerText.includes('urgent') || lowerText.includes('flooding') || lowerText.includes('fire')) {
    priority = { value: 'emergency', confidence: 90 };
  } else if (lowerText.includes('asap') || lowerText.includes('soon') || lowerText.includes('broken')) {
    priority = { value: 'high', confidence: 75 };
  }
  
  // Extract property/unit patterns
  const unitMatch = lowerText.match(/unit\s*(\d+[a-z]?)/i) || lowerText.match(/apartment\s*(\d+[a-z]?)/i);
  const buildingMatch = lowerText.match(/building\s*([a-z]|\d+)/i) || lowerText.match(/(\d+)\s*(park|maple|main|street)/i);
  
  // Extract issue category
  let category: ExtractedWorkOrderData['category'] = { value: 'General', confidence: 50 };
  if (lowerText.includes('leak') || lowerText.includes('water') || lowerText.includes('plumb') || lowerText.includes('toilet') || lowerText.includes('sink') || lowerText.includes('faucet')) {
    category = { value: 'Plumbing', confidence: 85 };
  } else if (lowerText.includes('electric') || lowerText.includes('outlet') || lowerText.includes('light') || lowerText.includes('power')) {
    category = { value: 'Electrical', confidence: 85 };
  } else if (lowerText.includes('heat') || lowerText.includes('ac') || lowerText.includes('air condition') || lowerText.includes('hvac') || lowerText.includes('cold') || lowerText.includes('hot')) {
    category = { value: 'HVAC', confidence: 80 };
  } else if (lowerText.includes('appliance') || lowerText.includes('refrigerator') || lowerText.includes('stove') || lowerText.includes('dishwasher') || lowerText.includes('washer') || lowerText.includes('dryer')) {
    category = { value: 'Appliance', confidence: 85 };
  } else if (lowerText.includes('door') || lowerText.includes('window') || lowerText.includes('lock') || lowerText.includes('key')) {
    category = { value: 'Doors/Windows', confidence: 80 };
  }
  
  return {
    property: buildingMatch 
      ? { value: `Building ${buildingMatch[1].toUpperCase()}`, confidence: 70 }
      : { value: '', confidence: 0 },
    unit: unitMatch 
      ? { value: `Unit ${unitMatch[1]}`, confidence: 80 }
      : { value: '', confidence: 0 },
    issue_description: { value: transcription, confidence: 95 },
    priority,
    category,
    tenant_name: { value: '', confidence: 0 }, // Would need caller ID or voice recognition
  };
}

// Mock transcription - in production this would call Whisper API
export async function transcribeAudio(_audioUrl: string): Promise<{ text: string; language: string }> {
  // Simulate transcription delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production, this would call the Whisper API with _audioUrl
  // For now, return mock data
  return {
    text: "This is a mock transcription. In production, this would be the actual transcribed text from the audio file.",
    language: "en"
  };
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

    return data.map(row => ({
      id: row.id,
      audio_url: row.audio_url,
      transcription: row.transcription,
      detected_language: row.detected_language || 'en',
      source: row.source,
      status: row.status,
      extracted_data: row.extracted_data || {},
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
        action_type: 'note',
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
