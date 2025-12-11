import { getUrgencyTier, getCountdownText, formatExposure, getDeadlineTooltip } from '@/lib/deadline-utils';
import { cn } from './utils';

interface DeadlineCountdownProps {
  deadline: Date | string | null;
  exposure?: number;
  showExposure?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const tierStyles: Record<string, string> = {
  'watch': 'text-gray-500 font-normal',
  'scheduled': 'text-gray-700 font-normal',
  'warning': 'text-amber-600 font-medium',
  'critical': 'text-red-600 font-bold',
  'due-today': 'bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded',
  'overdue': 'bg-red-600 text-white font-bold px-2 py-0.5 rounded',
};

const sizeStyles: Record<string, string> = {
  'sm': 'text-xs',
  'md': 'text-sm',
  'lg': 'text-base',
};

export function DeadlineCountdown({
  deadline,
  exposure,
  showExposure = false,
  size = 'md',
  className,
}: DeadlineCountdownProps) {
  const tier = getUrgencyTier(deadline);
  const countdownText = getCountdownText(deadline);
  const tooltip = getDeadlineTooltip(deadline);
  
  const showExposureBadge = showExposure && exposure && exposure > 500;
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        title={tooltip}
        className={cn(
          sizeStyles[size],
          tier ? tierStyles[tier] : 'text-gray-400'
        )}
      >
        {countdownText}
      </span>
      
      {showExposureBadge && (
        <span className={cn(
          'text-gray-500 font-normal',
          size === 'sm' ? 'text-xs' : 'text-xs'
        )}>
          {formatExposure(exposure)}
        </span>
      )}
    </div>
  );
}
