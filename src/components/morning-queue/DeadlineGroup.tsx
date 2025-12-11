import { useState } from 'react';
import { WorkOrderWithExtras } from '@/components/work-orders/WorkOrderRow';
import { QueueItemRow } from './QueueItemRow';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DeadlineGroupProps {
  tier: 'critical' | 'warning' | 'watch' | 'scheduled' | 'overdue' | 'due-today';
  items: WorkOrderWithExtras[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onBulkAction: (action: string, itemIds: string[]) => void;
  defaultExpanded?: boolean;
}

const tierConfig = {
  'overdue': { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-600' },
  'due-today': { label: 'Due Today', color: 'text-red-600', bg: 'bg-red-50/50', dot: 'bg-red-500' },
  'critical': { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50/30', dot: 'bg-red-500' },
  'warning': { label: 'Warning', color: 'text-amber-600', bg: 'bg-amber-50/30', dot: 'bg-amber-500' },
  'watch': { label: 'Watch', color: 'text-gray-600', bg: 'bg-gray-50/30', dot: 'bg-gray-400' },
  'scheduled': { label: 'Scheduled', color: 'text-gray-500', bg: 'bg-gray-50/10', dot: 'bg-gray-300' },
};

export function DeadlineGroup({ tier, items, selectedIds, onSelect, onBulkAction, defaultExpanded = true }: DeadlineGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = tierConfig[tier] || tierConfig.watch;
  
  if (items.length === 0) return null;

  const groupSelectedIds = items.map(i => i.id).filter(id => selectedIds.includes(id));

  return (
    <div className="border rounded-lg overflow-hidden mb-4 bg-card shadow-sm">
      <div 
        className={cn("flex items-center justify-between p-3 cursor-pointer select-none transition-colors", config.bg)}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
           <button className="text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
           </button>
           <div className={cn("w-2 h-2 rounded-full", config.dot)} />
           <span className={cn("font-medium", config.color)}>{config.label}</span>
           <span className="text-muted-foreground text-sm">({items.length})</span>
        </div>
        
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
           {groupSelectedIds.length > 0 && (
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="outline" size="sm" className="h-7 text-xs bg-background">
                    Bulk Actions ({groupSelectedIds.length}) <MoreHorizontal className="ml-1 h-3 w-3" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={() => onBulkAction('reassign', groupSelectedIds)}>Reassign Selected</DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onBulkAction('reschedule', groupSelectedIds)}>Reschedule Selected</DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onBulkAction('escalate', groupSelectedIds)}>Escalate Selected</DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           )}
        </div>
      </div>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
             <tbody>
                {items.map(item => (
                   <QueueItemRow 
                     key={item.id}
                     item={item}
                     selected={selectedIds.includes(item.id)}
                     onSelect={() => onSelect(item.id)}
                     onClick={() => {}} // Row click logic
                   />
                ))}
             </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
