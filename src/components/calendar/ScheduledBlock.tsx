import { WorkOrder } from '../../types';
import { AlertCircle, Clock } from 'lucide-react';

interface ScheduledBlockProps {
  event: {
    title: string;
    data: WorkOrder;
  };
}

export function ScheduledBlock({ event }: ScheduledBlockProps) {
  const { data: wo } = event;
  
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'emergency': return { border: '#ef4444', bg: '#fee2e2', text: '#991b1b' };
      case 'high': return { border: '#f59e0b', bg: '#fef3c7', text: '#92400e' };
      case 'normal': return { border: '#3b82f6', bg: '#dbeafe', text: '#1e40af' };
      case 'low': return { border: '#10b981', bg: '#d1fae5', text: '#065f46' };
      default: return { border: '#94a3b8', bg: '#f1f5f9', text: '#475569' };
    }
  };

  const styles = getPriorityStyles(wo.priority);

  return (
    <div 
      className="h-full w-full p-1.5 text-xs flex flex-col overflow-hidden rounded-sm border-l-4 shadow-sm transition-all hover:shadow-md"
      style={{ 
        backgroundColor: styles.bg,
        borderLeftColor: styles.border,
        color: styles.text
      }}
    >
      <div className="font-semibold truncate flex items-center gap-1">
        {wo.priority === 'emergency' && <AlertCircle size={12} className="shrink-0" />}
        {wo.title}
      </div>
      <div className="text-[10px] opacity-90 truncate mt-0.5">
        {wo.propertyCode} · {wo.residentName}
      </div>
      {wo.id && (
        <div className="mt-auto pt-1 flex items-center gap-1 opacity-75 text-[9px]">
          <Clock size={10} />
          <span>#{wo.serviceRequestId}</span>
        </div>
      )}
    </div>
  );
}
