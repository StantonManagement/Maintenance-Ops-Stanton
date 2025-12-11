import { WorkOrder } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DeadlineCountdown } from '@/components/ui/DeadlineCountdown';

interface DemandCardProps {
  workOrder: WorkOrder;
  selected: boolean;
  onSelect: () => void;
}

export function DemandCard({ workOrder, selected, onSelect }: DemandCardProps) {
  // Mock unit rent if not present
  const unitRent = 1500; 

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-sm",
        selected && "border-primary bg-primary/5 ring-1 ring-primary"
      )}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <DeadlineCountdown 
            deadline={workOrder.deadlineInfo ? new Date(Date.now() + workOrder.deadlineInfo.hoursRemaining * 3600000).toISOString() : null}
            exposure={unitRent}
            showExposure={true}
            size="sm"
        />
      </div>
      
      <div className="text-sm font-medium mb-1 line-clamp-1">{workOrder.propertyCode} - Unit {workOrder.unit}</div>
      <div className="text-xs text-muted-foreground mb-2 line-clamp-2">{workOrder.description}</div>
      
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="text-[10px] h-5 px-1 bg-background">
          {workOrder.aiCategory || 'General'}
        </Badge>
        {workOrder.aiSkillsRequired?.map(skill => (
            <Badge key={skill} variant="secondary" className="text-[10px] h-5 px-1">
                {skill}
            </Badge>
        ))}
      </div>
    </div>
  );
}
