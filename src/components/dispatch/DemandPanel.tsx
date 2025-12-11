import { WorkOrder } from '@/types';
import { DemandCard } from './DemandCard';
import { Button } from '@/components/ui/button';
import { Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface DemandFilters {
  urgency: 'all' | 'critical' | 'warning' | 'watch';
  skillsNeeded: string[];
  propertyId: string | null;
  search: string;
}

interface DemandPanelProps {
  workOrders: WorkOrder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filters: DemandFilters;
  onFilterChange: (filters: DemandFilters) => void;
}

export function DemandPanel({ workOrders, selectedId, onSelect, filters, onFilterChange }: DemandPanelProps) {
  return (
    <div className="flex flex-col h-full border-r bg-muted/10">
      <div className="p-4 border-b bg-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Demand ({workOrders.length})</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search unassigned..." 
            className="pl-8 h-9 bg-background" 
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {workOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
             <p className="text-sm">No unassigned work orders</p>
             <p className="text-xs opacity-70">Great job!</p>
          </div>
        ) : (
          workOrders.map(wo => (
            <DemandCard 
              key={wo.id} 
              workOrder={wo} 
              selected={selectedId === wo.id} 
              onSelect={() => onSelect(wo.id)} 
            />
          ))
        )}
      </div>
    </div>
  );
}
