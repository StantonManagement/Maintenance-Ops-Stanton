import { useState } from 'react';
import { useVoiceQueue } from '../hooks/useVoiceQueue';
import { VoiceWorkOrderDraft } from '../components/voice/VoiceWorkOrderDraft';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Mic, 
  RefreshCw, 
  Inbox, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceQueuePage() {
  const { submissions, loading, refetch, createWorkOrder, discard, pendingCount } = useVoiceQueue();
  const [filter, setFilter] = useState<'all' | 'high-confidence' | 'needs-review'>('all');

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'all') return true;
    
    const avgConfidence = [
      s.extracted_data.property?.confidence || 0,
      s.extracted_data.unit?.confidence || 0,
      s.extracted_data.issue_description?.confidence || 0,
    ].filter(c => c > 0).reduce((a, b, _, arr) => a + b / arr.length, 0);
    
    if (filter === 'high-confidence') return avgConfidence >= 75;
    if (filter === 'needs-review') return avgConfidence < 75;
    return true;
  });

  const handleCreateWorkOrder = async (submissionId: string, data: {
    property: string;
    unit: string;
    description: string;
    priority: string;
    category: string;
  }) => {
    const result = await createWorkOrder(submissionId, data);
    if (result.success) {
      toast.success(`Work order ${result.workOrderId} created successfully`);
    } else {
      toast.error(result.error || 'Failed to create work order');
    }
    return result;
  };

  const handleDiscard = async (submissionId: string) => {
    await discard(submissionId);
    toast.info('Voice submission discarded');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--action-primary-light)' }}
          >
            <Mic size={24} style={{ color: 'var(--action-primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Voice Queue
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Review and process voice-submitted work orders
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge 
              variant="default" 
              className="ml-2"
              style={{ backgroundColor: 'var(--action-primary)' }}
            >
              {pendingCount} pending
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="h-7 text-xs"
            >
              All
            </Button>
            <Button
              variant={filter === 'high-confidence' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('high-confidence')}
              className="h-7 text-xs"
            >
              <CheckCircle2 size={12} className="mr-1" />
              High Confidence
            </Button>
            <Button
              variant={filter === 'needs-review' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('needs-review')}
              className="h-7 text-xs"
            >
              <AlertCircle size={12} className="mr-1" />
              Needs Review
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading voice submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div 
              className="p-4 rounded-full"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <Inbox size={48} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <div className="text-center">
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {filter === 'all' ? 'No voice submissions' : `No ${filter === 'high-confidence' ? 'high confidence' : 'review needed'} submissions`}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Voice messages from Telegram and phone calls will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl mx-auto">
            {filteredSubmissions.map(submission => (
              <VoiceWorkOrderDraft
                key={submission.id}
                submission={submission}
                onCreateWorkOrder={(data) => handleCreateWorkOrder(submission.id, data)}
                onDiscard={() => handleDiscard(submission.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {!loading && submissions.length > 0 && (
        <div 
          className="px-6 py-3 border-t flex items-center justify-between text-sm"
          style={{ 
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <div className="flex items-center gap-4">
            <span style={{ color: 'var(--text-secondary)' }}>
              Showing {filteredSubmissions.length} of {submissions.length} submissions
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1" style={{ color: 'var(--status-success-text)' }}>
              <CheckCircle2 size={14} />
              {submissions.filter(s => {
                const avg = [s.extracted_data.property?.confidence || 0, s.extracted_data.unit?.confidence || 0].filter(c => c > 0);
                return avg.length > 0 && avg.reduce((a, b) => a + b, 0) / avg.length >= 75;
              }).length} ready to create
            </span>
            <span className="flex items-center gap-1" style={{ color: 'var(--status-warning-text)' }}>
              <AlertCircle size={14} />
              {submissions.filter(s => {
                const avg = [s.extracted_data.property?.confidence || 0, s.extracted_data.unit?.confidence || 0].filter(c => c > 0);
                return avg.length === 0 || avg.reduce((a, b) => a + b, 0) / avg.length < 75;
              }).length} need review
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
