import { PhotoThumbnailGrid } from './PhotoThumbnailGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface WorkOrderForApproval {
  id: string;
  description: string;
  propertyCode: string;
  unitNumber: string;
  technicianName: string;
  completedAt: string;
  deadline: string;
  photos: {
    before: string[];
    after: string[];
    cleanup: string[];
  };
  techNotes?: string;
  status: string;
}

interface QuickReviewCardProps {
  workOrder: WorkOrderForApproval;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onExpand: (id: string) => void;
  onPhotoClick: (url: string, category: string) => void;
  focused?: boolean;
}

export function QuickReviewCard({ workOrder, onApprove, onReject, onExpand, onPhotoClick, focused }: QuickReviewCardProps) {
  return (
    <div 
      className={cn(
        "bg-card border rounded-lg overflow-hidden transition-all scroll-mt-20",
        focused && "ring-2 ring-primary border-primary shadow-md"
      )}
    >
      <div className="p-4 border-b bg-muted/10 flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{workOrder.propertyCode} - Unit {workOrder.unitNumber}</span>
            <Badge variant="outline" className="font-mono text-xs">{workOrder.id}</Badge>
          </div>
          <p className="text-sm font-medium">{workOrder.description}</p>
          <div className="text-xs text-muted-foreground flex gap-3 mt-1">
            <span>Tech: <span className="text-foreground">{workOrder.technicianName}</span></span>
            <span>Completed: <span className="text-foreground">{formatDistanceToNow(new Date(workOrder.completedAt), { addSuffix: true })}</span></span>
            <span>Due: <span className="text-foreground">{formatDistanceToNow(new Date(workOrder.deadline), { addSuffix: true })}</span></span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => onExpand(workOrder.id)}>
          Expand <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <PhotoThumbnailGrid 
          before={workOrder.photos.before}
          after={workOrder.photos.after}
          cleanup={workOrder.photos.cleanup}
          onPhotoClick={onPhotoClick}
        />

        {workOrder.techNotes && (
          <div className="bg-muted/30 p-3 rounded-md text-sm border">
            <span className="font-semibold text-xs uppercase text-muted-foreground mr-2">Tech Notes:</span>
            "{workOrder.techNotes}"
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button 
            variant="default" 
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            onClick={() => onApprove(workOrder.id)}
          >
            <Check className="h-4 w-4" />
            Approve
          </Button>
          <Button 
            variant="outline" 
            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 gap-2"
            onClick={() => onReject(workOrder.id, '')}
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
