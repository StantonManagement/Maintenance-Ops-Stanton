import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import { useMorningGate } from '../../hooks/useMorningGate';
import { IncompleteWOCard } from './IncompleteWOCard';
import { toast } from 'sonner';

interface MorningGateModalProps {
  technicianId: string | null;
  technicianName?: string;
  onGateCleared?: () => void;
}

export function MorningGateModal({
  technicianId,
  technicianName = 'Technician',
  onGateCleared,
}: MorningGateModalProps) {
  const {
    status,
    loading,
    submitting,
    submitExplanation,
    getRecommendedDate,
    isHighPriority,
    remainingCount,
  } = useMorningGate(technicianId);

  // Notify when gate is cleared (only after user addressed items, not on initial load)
  useEffect(() => {
    if (status.gateCleared && status.addressedCount > 0) {
      toast.success('Morning check complete! You can now view your schedule.');
      onGateCleared?.();
    }
  }, [status.gateCleared, status.addressedCount, onGateCleared]);

  // Don't show if gate is cleared or loading
  if (loading || status.gateCleared) {
    return null;
  }

  const progress = status.incompleteCount > 0
    ? ((status.addressedCount / status.incompleteCount) * 100)
    : 0;

  return (
    <Dialog open={!status.gateCleared} modal>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Good Morning, {technicianName}!
              </DialogTitle>
              <DialogDescription>
                Please address these incomplete work orders before viewing your schedule.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Section */}
        <div className="py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Progress: {status.addressedCount} of {status.incompleteCount} addressed
            </span>
            <Badge variant={remainingCount === 0 ? 'default' : 'secondary'}>
              {remainingCount} remaining
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Work Order List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[200px]">
          {status.pendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
              <h3 className="font-semibold text-lg">All Done!</h3>
              <p className="text-muted-foreground">
                You've addressed all incomplete work orders.
              </p>
            </div>
          ) : (
            <>
              {/* High priority items first */}
              {status.pendingItems
                .filter(item => isHighPriority(item.priority))
                .map(item => (
                  <IncompleteWOCard
                    key={item.assignmentId}
                    item={item}
                    onSubmit={submitExplanation}
                    isHighPriority={true}
                    recommendedDate={getRecommendedDate(item.priority)}
                    submitting={submitting}
                  />
                ))}
              
              {/* Normal priority items */}
              {status.pendingItems
                .filter(item => !isHighPriority(item.priority))
                .map(item => (
                  <IncompleteWOCard
                    key={item.assignmentId}
                    item={item}
                    onSubmit={submitExplanation}
                    isHighPriority={false}
                    recommendedDate={getRecommendedDate(item.priority)}
                    submitting={submitting}
                  />
                ))}
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p>
              <strong>High/Emergency priority</strong> work orders will be sent to your coordinator for review.
              <strong> Normal/Low priority</strong> items can be rescheduled directly.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
