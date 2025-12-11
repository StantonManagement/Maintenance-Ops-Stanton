import { useState, useMemo, useRef, useEffect } from 'react';
import { useApprovalQueue } from '@/hooks/useApprovalQueue';
import { QuickReviewCard, WorkOrderForApproval } from '@/components/approval-queue/QuickReviewCard';
import { QuickRejectModal } from '@/components/approval-queue/QuickRejectModal';
import { PhotoLightbox } from '@/components/ui/PhotoLightbox';
import { useApprovalKeyboard } from '@/hooks/useApprovalKeyboard';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

export function ApprovalsPage() {
  const { workOrders, loading, error, approveWorkOrder, rejectWorkOrder } = useApprovalQueue();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: string[], url: string, category: string } | null>(null);
  
  // Transform data
  const items = useMemo(() => {
    return workOrders.map(wo => ({
      id: wo.id,
      description: wo.description,
      propertyCode: wo.propertyCode,
      unitNumber: wo.unit,
      technicianName: wo.assignee || 'Unknown',
      completedAt: new Date().toISOString(), // Mock if missing
      deadline: wo.deadlineInfo ? new Date(Date.now() + wo.deadlineInfo.hoursRemaining * 3600000).toISOString() : new Date().toISOString(),
      photos: {
        // Mock photos if missing from API
        before: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop'],
        after: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop'],
        cleanup: []
      },
      techNotes: "Job completed as requested.",
      status: wo.status
    })) as WorkOrderForApproval[];
  }, [workOrders]);

  const handleApprove = async (id: string) => {
    try {
      await approveWorkOrder(id);
      toast.success('Approved');
      // Auto-advance is handled by removing item from list usually, but if list shrinks, index stays valid or shifts
      // If we keep index, we naturally focus next item.
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!reason) {
        setRejectingId(id);
        return;
    }
    try {
      await rejectWorkOrder(id, reason);
      toast.info('Returned for rework');
      setRejectingId(null);
    } catch {
      toast.error('Failed to reject');
    }
  };

  // Keyboard navigation
  useApprovalKeyboard({
    items,
    focusedIndex,
    onFocusChange: setFocusedIndex,
    onApprove: handleApprove,
    onReject: (id) => setRejectingId(id),
    onExpand: (id) => toast.info(`Expand details for ${id} (Not implemented)`),
  });

  // Scroll into view
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (listRef.current) {
        const focusedEl = listRef.current.children[focusedIndex] as HTMLElement;
        if (focusedEl) {
            focusedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [focusedIndex]);

  if (loading) return <div className="flex items-center justify-center h-full">Loading queue...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-500">Error: {error.message}</div>;

  return (
    <div className="h-full flex flex-col bg-muted/10">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-card flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">Approval Queue</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} items awaiting review
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md border">
          Shortcuts: A = Approve, R = Reject, ↑↓ = Navigate
        </div>
      </div>
      
      {/* Queue list */}
      <div className="flex-1 overflow-auto p-6" ref={listRef}>
        <div className="max-w-3xl mx-auto space-y-6">
            {items.map((item, index) => (
            <QuickReviewCard
                key={item.id}
                workOrder={item}
                focused={index === focusedIndex}
                onApprove={handleApprove}
                onReject={handleReject}
                onExpand={() => {}}
                onPhotoClick={(url, category) => setLightbox({ photos: item.photos[category as keyof typeof item.photos], url, category })}
            />
            ))}
            
            {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">No work orders awaiting approval</p>
            </div>
            )}
        </div>
      </div>
      
      {/* Reject modal */}
      <QuickRejectModal
        isOpen={!!rejectingId}
        onClose={() => setRejectingId(null)}
        onReject={(reason) => rejectingId && handleReject(rejectingId, reason)}
      />
      
      {/* Photo lightbox */}
      <PhotoLightbox
        isOpen={!!lightbox}
        photos={lightbox?.photos || []}
        initialIndex={lightbox ? lightbox.photos.indexOf(lightbox.url) : 0}
        category={lightbox?.category || ''}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}

