import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  'new': 'bg-blue-100 text-blue-700',
  'assigned': 'bg-purple-100 text-purple-700',
  'scheduled': 'bg-indigo-100 text-indigo-700',
  'in_progress': 'bg-yellow-100 text-yellow-700',
  'waiting_parts': 'bg-orange-100 text-orange-700',
  'waiting_access': 'bg-orange-100 text-orange-700',
  'ready_review': 'bg-green-100 text-green-700',
  'completed': 'bg-gray-100 text-gray-700',
};

const statusLabels: Record<string, string> = {
  'new': 'New',
  'assigned': 'Assigned',
  'scheduled': 'Scheduled',
  'in_progress': 'In Progress',
  'waiting_parts': 'Waiting Parts',
  'waiting_access': 'Waiting Access',
  'ready_review': 'Ready Review',
  'completed': 'Completed',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const style = statusStyles[normalizedStatus] || 'bg-gray-100 text-gray-700';
  const label = statusLabels[normalizedStatus] || status;

  return (
    <span className={cn(
      'px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap',
      style,
      className
    )}>
      {label}
    </span>
  );
}
