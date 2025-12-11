# PRP-P2-03: Voice Queue (Telegram Integration)

## Goal
Process voice notes from Telegram into transcribed work order requests with AI extraction of key details.

## Success Criteria
- [ ] Telegram bot receives voice messages
- [ ] Voice transcribed to text (OpenAI Whisper)
- [ ] AI extracts work order details (issue, location, priority, urgency)
- [ ] Queue displays pending voice requests
- [ ] Coordinator can review, edit, and create work order from voice
- [ ] Reject option with reason
- [ ] Original audio playable for verification

---

## Context

**Files involved:**
- `src/pages/VoiceQueuePage.tsx` - Voice queue UI
- `src/components/voice/VoiceQueueList.tsx` - List of voice requests
- `src/components/voice/VoiceReviewCard.tsx` - Review interface
- New backend: Telegram webhook handler
- New: `src/services/voiceProcessingService.ts`

**Current state:**
- VoiceQueuePage exists with mock data
- OpenAI integration exists (gpt-4o-mini)
- No Telegram integration

**External dependencies:**
- Telegram Bot API (need bot token)
- OpenAI Whisper API (for transcription)
- OpenAI GPT (for extraction)

---

## Tasks

### Task 1: Create Voice Request Table

RUN in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS voice_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id TEXT,
  telegram_username TEXT,
  audio_url TEXT NOT NULL,
  audio_duration_seconds INTEGER,
  transcription TEXT,
  extracted_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'approved', 'rejected')),
  work_order_id TEXT REFERENCES work_orders(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE INDEX idx_voice_requests_status ON voice_requests(status);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE voice_requests;
```

### Task 2: Create Telegram Webhook Handler

This needs a backend endpoint. If using Supabase Edge Functions:

CREATE `supabase/functions/telegram-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const update = await req.json();

  // Handle voice message
  if (update.message?.voice) {
    const voice = update.message.voice;
    const userId = update.message.from.id;
    const username = update.message.from.username;

    try {
      // Get file path from Telegram
      const fileResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${voice.file_id}`
      );
      const fileData = await fileResponse.json();
      const filePath = fileData.result.file_path;
      const audioUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

      // Download audio
      const audioResponse = await fetch(audioUrl);
      const audioBlob = await audioResponse.blob();

      // Upload to Supabase Storage
      const fileName = `voice-${Date.now()}.ogg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, { contentType: 'audio/ogg' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      // Create voice request record
      const { data: voiceRequest, error: insertError } = await supabase
        .from('voice_requests')
        .insert({
          telegram_user_id: String(userId),
          telegram_username: username,
          audio_url: urlData.publicUrl,
          audio_duration_seconds: voice.duration,
          status: 'processing',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger async processing (transcription + extraction)
      // This could be another edge function or a queue
      await processVoiceRequest(voiceRequest.id, audioBlob, supabase);

      // Acknowledge to user
      await sendTelegramMessage(
        userId,
        '✅ Voice message received! Processing your request...'
      );

    } catch (error) {
      console.error('Voice processing error:', error);
      await sendTelegramMessage(
        userId,
        '❌ Sorry, there was an error processing your voice message. Please try again.'
      );
    }
  }

  return new Response('OK', { status: 200 });
});

async function processVoiceRequest(
  requestId: string,
  audioBlob: Blob,
  supabase: any
) {
  // Transcribe with Whisper
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.ogg');
  formData.append('model', 'whisper-1');

  const whisperResponse = await fetch(
    'https://api.openai.com/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    }
  );

  const transcriptionData = await whisperResponse.json();
  const transcription = transcriptionData.text;

  // Extract work order details with GPT
  const extractionResponse = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a maintenance work order assistant. Extract structured information from voice transcriptions.
            
Return JSON with:
- issue: Brief description of the maintenance issue
- location: Building/unit if mentioned
- urgency: "emergency", "high", "medium", or "low"
- category: "plumbing", "electrical", "hvac", "appliance", "structural", or "other"
- tenant_name: If mentioned
- phone: If mentioned
- additional_notes: Any other relevant details

If information is not clear, use null.`,
          },
          {
            role: 'user',
            content: transcription,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    }
  );

  const extractionData = await extractionResponse.json();
  const extracted = JSON.parse(extractionData.choices[0].message.content);

  // Update voice request with results
  await supabase
    .from('voice_requests')
    .update({
      transcription,
      extracted_data: extracted,
      status: 'ready',
      processed_at: new Date().toISOString(),
    })
    .eq('id', requestId);
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }
  );
}
```

### Task 3: Create Storage Bucket

RUN in Supabase:

```sql
-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true);

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-messages');

-- Allow service role to insert
CREATE POLICY "Service role insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'voice-messages');
```

### Task 4: Create Voice Queue Hook

CREATE `src/hooks/useVoiceQueue.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface VoiceRequest {
  id: string;
  telegram_user_id: string;
  telegram_username: string | null;
  audio_url: string;
  audio_duration_seconds: number;
  transcription: string | null;
  extracted_data: {
    issue?: string;
    location?: string;
    urgency?: 'emergency' | 'high' | 'medium' | 'low';
    category?: string;
    tenant_name?: string;
    phone?: string;
    additional_notes?: string;
  } | null;
  status: 'pending' | 'processing' | 'ready' | 'approved' | 'rejected';
  work_order_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  processed_at: string | null;
}

export function useVoiceQueue() {
  const [requests, setRequests] = useState<VoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('voice_requests')
      .select('*')
      .in('status', ['pending', 'processing', 'ready'])
      .order('created_at', { ascending: false });

    if (error) {
      setError(error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('voice-queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voice_requests' },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  // Approve and create work order
  const approveRequest = async (
    requestId: string,
    workOrderData: Partial<WorkOrder>
  ) => {
    // Create work order
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .insert({
        title: workOrderData.title,
        description: workOrderData.description,
        priority: workOrderData.priority,
        status: 'new',
        property_address: workOrderData.property_address,
        unit: workOrderData.unit,
        resident_name: workOrderData.resident_name,
        source: 'voice',
      })
      .select()
      .single();

    if (woError) throw woError;

    // Update voice request
    await supabase
      .from('voice_requests')
      .update({
        status: 'approved',
        work_order_id: wo.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return wo;
  };

  // Reject request
  const rejectRequest = async (requestId: string, reason: string) => {
    await supabase
      .from('voice_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);
  };

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    approveRequest,
    rejectRequest,
  };
}
```

### Task 5: Update Voice Queue Page

MODIFY `src/pages/VoiceQueuePage.tsx`:

```typescript
import { useState } from 'react';
import { useVoiceQueue, VoiceRequest } from '@/hooks/useVoiceQueue';
import { VoiceRequestCard } from '@/components/voice/VoiceRequestCard';
import { VoiceReviewModal } from '@/components/voice/VoiceReviewModal';
import { Badge } from '@/components/ui/badge';
import { Mic, Loader2 } from 'lucide-react';

export function VoiceQueuePage() {
  const { requests, loading, approveRequest, rejectRequest } = useVoiceQueue();
  const [selectedRequest, setSelectedRequest] = useState<VoiceRequest | null>(null);

  const readyRequests = requests.filter(r => r.status === 'ready');
  const processingRequests = requests.filter(r => r.status === 'processing' || r.status === 'pending');

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="h-6 w-6" />
            Voice Queue
          </h1>
          <p className="text-muted-foreground">
            Review voice messages and create work orders
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">
            {readyRequests.length} Ready for Review
          </Badge>
          {processingRequests.length > 0 && (
            <Badge variant="outline">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {processingRequests.length} Processing
            </Badge>
          )}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No voice messages in queue</p>
          <p className="text-sm">Voice messages from Telegram will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <VoiceRequestCard
              key={request.id}
              request={request}
              onReview={() => setSelectedRequest(request)}
            />
          ))}
        </div>
      )}

      {selectedRequest && (
        <VoiceReviewModal
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          onApprove={approveRequest}
          onReject={rejectRequest}
        />
      )}
    </div>
  );
}
```

### Task 6: Create Voice Request Card

CREATE `src/components/voice/VoiceRequestCard.tsx`:

```typescript
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Clock, User, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef } from 'react';
import type { VoiceRequest } from '@/hooks/useVoiceQueue';

interface VoiceRequestCardProps {
  request: VoiceRequest;
  onReview: () => void;
}

export function VoiceRequestCard({ request, onReview }: VoiceRequestCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const urgencyColors: Record<string, string> = {
    emergency: 'bg-red-100 text-red-800',
    high: 'bg-amber-100 text-amber-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-green-100 text-green-800',
  };

  const isProcessing = request.status === 'processing' || request.status === 'pending';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Audio Player */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={togglePlay}
              disabled={isProcessing}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <audio
              ref={audioRef}
              src={request.audio_url}
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isProcessing ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing voice message...</span>
              </div>
            ) : (
              <>
                {/* Extracted Issue */}
                <p className="font-medium mb-1">
                  {request.extracted_data?.issue || 'Unable to extract issue'}
                </p>

                {/* Transcription Preview */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  "{request.transcription}"
                </p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {request.telegram_username && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      @{request.telegram_username}
                    </span>
                  )}
                  {request.extracted_data?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {request.extracted_data.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {request.audio_duration_seconds}s
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-end gap-2">
            {request.extracted_data?.urgency && (
              <Badge className={urgencyColors[request.extracted_data.urgency]}>
                {request.extracted_data.urgency === 'emergency' && (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {request.extracted_data.urgency}
              </Badge>
            )}
            
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </span>

            {!isProcessing && (
              <Button size="sm" onClick={onReview}>
                Review
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Task 7: Create Voice Review Modal

CREATE `src/components/voice/VoiceReviewModal.tsx`:

```typescript
import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Pause, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { VoiceRequest } from '@/hooks/useVoiceQueue';

interface VoiceReviewModalProps {
  request: VoiceRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (requestId: string, workOrderData: any) => Promise<any>;
  onReject: (requestId: string, reason: string) => Promise<void>;
}

export function VoiceReviewModal({
  request,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: VoiceReviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Form state with extracted defaults
  const [formData, setFormData] = useState({
    title: request.extracted_data?.issue || '',
    description: request.transcription || '',
    priority: request.extracted_data?.urgency === 'emergency' ? '1' :
              request.extracted_data?.urgency === 'high' ? '2' :
              request.extracted_data?.urgency === 'medium' ? '3' : '4',
    property_address: request.extracted_data?.location || '',
    unit: '',
    resident_name: request.extracted_data?.tenant_name || '',
  });

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await onApprove(request.id, {
        ...formData,
        priority: parseInt(formData.priority),
      });
      toast.success('Work order created');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create work order');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setProcessing(true);
    try {
      await onReject(request.id, rejectReason);
      toast.success('Request rejected');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Voice Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Audio Player */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium">Original Recording</p>
              <p className="text-xs text-muted-foreground">
                {request.audio_duration_seconds} seconds • 
                @{request.telegram_username || 'Unknown'}
              </p>
            </div>
            <audio
              ref={audioRef}
              src={request.audio_url}
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          {/* Transcription */}
          <div>
            <Label>Transcription</Label>
            <div className="p-3 bg-muted rounded-lg text-sm">
              "{request.transcription}"
            </div>
          </div>

          {rejectMode ? (
            /* Reject Form */
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Why is this request being rejected?"
                rows={3}
              />
            </div>
          ) : (
            /* Work Order Form */
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief issue description"
                />
              </div>

              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Emergency</SelectItem>
                    <SelectItem value="2">High</SelectItem>
                    <SelectItem value="3">Medium</SelectItem>
                    <SelectItem value="4">Low</SelectItem>
                    <SelectItem value="5">Cosmetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Resident Name</Label>
                <Input
                  value={formData.resident_name}
                  onChange={(e) => setFormData({ ...formData, resident_name: e.target.value })}
                />
              </div>

              <div>
                <Label>Property Address</Label>
                <Input
                  value={formData.property_address}
                  onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                />
              </div>

              <div>
                <Label>Unit</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {rejectMode ? (
            <>
              <Button variant="outline" onClick={() => setRejectMode(false)}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || processing}
              >
                <X className="h-4 w-4 mr-2" />
                Confirm Reject
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setRejectMode(true)}
              >
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!formData.title.trim() || processing}
              >
                <Check className="h-4 w-4 mr-2" />
                Create Work Order
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Validation

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Manual testing:
# 1. Set up Telegram bot and webhook
# 2. Send voice message to bot
# 3. Check /voice-queue page
# 4. Processing indicator shows
# 5. After processing, "Ready" card appears
# 6. Click Review - modal opens with extracted data
# 7. Edit if needed, approve - work order created
# 8. Or reject with reason
```

---

## Setup Notes

**Telegram Bot Setup:**
1. Create bot via @BotFather
2. Get bot token
3. Set webhook: `https://your-project.supabase.co/functions/v1/telegram-webhook`
4. Add token to Supabase secrets

**Environment Variables:**
```
TELEGRAM_BOT_TOKEN=your_bot_token
OPENAI_API_KEY=your_openai_key
```

**Deploy Edge Function:**
```bash
supabase functions deploy telegram-webhook
```
