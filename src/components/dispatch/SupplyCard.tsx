import { Technician } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface SupplyCardProps {
  technician: Technician;
  highlighted: boolean;
  onAssign: () => void;
  onViewSchedule: () => void;
  isDropTarget?: boolean;
}

export function SupplyCard({ technician, highlighted, onAssign, onViewSchedule }: SupplyCardProps) {
  const isOverloaded = technician.capacity.current >= technician.capacity.max;
  
  return (
    <div className={cn(
      "p-3 rounded-lg border bg-card transition-all",
      highlighted && "border-green-500 ring-1 ring-green-500 bg-green-50/30",
      isOverloaded && "bg-amber-50/50"
    )}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", 
            technician.status === 'available' ? 'bg-green-500' : 
            technician.status === 'in-transit' ? 'bg-amber-500' : 'bg-gray-400'
          )} />
          <span className="font-medium text-sm">{technician.name}</span>
        </div>
        <div className={cn("text-xs font-medium px-1.5 py-0.5 rounded",
            isOverloaded ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
        )}>
            {technician.capacity.current}/{technician.capacity.max}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {technician.skills.slice(0, 3).map(skill => (
            <Badge key={skill} variant="outline" className="text-[10px] h-5 px-1 bg-background border-muted-foreground/30">
                {skill}
            </Badge>
        ))}
        {technician.skills.length > 3 && (
            <span className="text-[10px] text-muted-foreground self-center">+{technician.skills.length - 3}</span>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        <Button size="sm" className="h-7 text-xs flex-1" onClick={(e) => { e.stopPropagation(); onAssign(); }}>
            Assign
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onViewSchedule(); }}>
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
