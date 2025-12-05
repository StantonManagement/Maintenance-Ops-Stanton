import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface CapacityRingProps {
  current: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}

export function CapacityRing({ current, max, size = 80, strokeWidth = 6 }: CapacityRingProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isCritical = percentage >= 100;

  const getColor = () => {
    if (isCritical) return 'var(--status-critical-icon)';
    if (percentage >= 80) return 'var(--status-warning-icon)';
    return 'var(--status-success-icon)';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {isCritical && (
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: 'var(--status-critical-icon)' }}
              />
            )}
            <svg className="transform -rotate-90 relative z-10" width={size} height={size}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--border-default)"
                strokeWidth={strokeWidth}
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={getColor()}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="text-lg font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                {current}/{max}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Workload: {percentage.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Active: {current}</p>
          <p className="text-xs text-muted-foreground">Remaining: {Math.max(0, max - current)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
