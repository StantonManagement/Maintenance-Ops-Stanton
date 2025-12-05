import { Technician } from '../../types';
import { Badge } from '../ui/badge';

interface TechnicianRowProps {
  label: string;
  resource: {
    id: string;
    title: string;
    capacity: { current: number; max: number };
    skills: string[];
    avatar?: string;
  };
}

export function TechnicianRow({ label, resource }: TechnicianRowProps) {
  const capacityPercentage = (resource.capacity.current / resource.capacity.max) * 100;
  
  const getCapacityColor = () => {
    if (capacityPercentage >= 100) return 'var(--status-critical-text)';
    if (capacityPercentage >= 80) return 'var(--status-warning-text)';
    return 'var(--status-success-text)';
  };

  return (
    <div className="flex items-center h-full p-2 gap-3">
      <div className="relative">
        <div 
          className="h-8 w-8 flex items-center justify-center text-xs font-medium rounded-full text-white"
          style={{ backgroundColor: 'var(--action-primary)' }}
        >
          {label.split(' ').map(n => n[0]).join('')}
        </div>
      </div>
      
      <div className="flex flex-col items-start justify-center min-w-0">
        <div className="font-medium text-sm truncate w-full" title={label}>
          {label}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{resource.skills[0]}</span>
          <span>·</span>
          <span style={{ color: getCapacityColor(), fontWeight: 500 }}>
            {resource.capacity.current}/{resource.capacity.max}
          </span>
        </div>
      </div>
    </div>
  );
}
