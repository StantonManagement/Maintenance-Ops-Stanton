import { useState } from 'react';
import { Technician } from '@/types';
import { SupplyCard } from './SupplyCard';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface SupplyFilters {
  status: 'all' | 'available';
  search: string;
}

interface SupplyPanelProps {
  technicians: Technician[];
  selectedWorkOrderSkills: string[];
  onAssign: (techId: string) => void;
  onViewSchedule: (techId: string) => void;
}

export function SupplyPanel({ technicians, selectedWorkOrderSkills, onAssign, onViewSchedule }: SupplyPanelProps) {
  const [filters, setFilters] = useState<SupplyFilters>({ status: 'all', search: '' });

  const filteredTechnicians = technicians.filter(tech => {
    if (filters.status === 'available' && tech.status !== 'available') return false;
    if (filters.search && !tech.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="p-4 border-b bg-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Supply ({filteredTechnicians.length})</h3>
           <div className="flex gap-1">
             <Button 
                variant={filters.status === 'available' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'available' ? 'all' : 'available' }))}
             >
                Available Only
             </Button>
           </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search technicians..." 
            className="pl-8 h-9 bg-background"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-2 gap-3 content-start">
        {filteredTechnicians.map(tech => {
           const matchesSkills = selectedWorkOrderSkills.some(skill => tech.skills.includes(skill));
           return (
            <SupplyCard 
              key={tech.id} 
              technician={tech} 
              highlighted={matchesSkills} 
              onAssign={() => onAssign(tech.id)} 
              onViewSchedule={() => onViewSchedule(tech.id)}
            />
          );
        })}
        {filteredTechnicians.length === 0 && (
            <div className="col-span-full flex items-center justify-center h-40 text-muted-foreground text-sm">
                No technicians found
            </div>
        )}
      </div>
    </div>
  );
}
