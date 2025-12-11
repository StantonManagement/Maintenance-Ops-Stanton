import { Badge } from "./ui/badge";
import { Clock, AlertCircle, Calendar, AlertTriangle } from "lucide-react";
import type { SLAStatus, DeadlineInfo, DeadlineStage } from "../types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface DeadlineWarningBadgeProps {
  hoursUntilBreach?: number;
  slaStatus?: SLAStatus;
  deadlineInfo?: DeadlineInfo;
  size?: 'sm' | 'lg';
  className?: string;
}

const stageConfig: Record<DeadlineStage, { color: string; icon: React.ElementType }> = {
  planning: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: Calendar },
  scheduled: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: Calendar },
  attention: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  urgent: { color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertTriangle },
  critical: { color: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
  emergency: { color: "bg-red-100 text-red-800 border-red-300 font-bold", icon: AlertCircle },
  overdue: { color: "bg-red-600 text-white border-red-700 animate-pulse", icon: AlertCircle },
  completed: { color: "hidden", icon: Clock }
};

export function DeadlineWarningBadge({ 
  hoursUntilBreach, 
  slaStatus, 
  deadlineInfo,
  size = 'sm',
  className = ''
}: DeadlineWarningBadgeProps) {
  // If we have detailed info, use it
  if (deadlineInfo) {
    if (deadlineInfo.stage === 'completed' || deadlineInfo.stage === 'planning') return null;

    const config = stageConfig[deadlineInfo.stage];
    const Icon = config.icon;
    const isSmall = size === 'sm';
    
    // Format label based on timeline
    let label = '';
    if (deadlineInfo.stage === 'overdue') {
      label = `OVERDUE +${Math.abs(Math.round(deadlineInfo.hoursRemaining))}h`;
    } else if (deadlineInfo.daysRemaining > 1) {
      label = `${deadlineInfo.daysRemaining}d left`;
    } else {
      label = `${Math.round(deadlineInfo.hoursRemaining)}h left`;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`gap-1 border ${config.color} ${isSmall ? 'text-[10px] px-1.5 h-5' : 'text-xs px-2 h-6'} ${className}`}
            >
              <Icon className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
              <span>{label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{deadlineInfo.suggestedAction}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback for legacy slaStatus
  if (!slaStatus || slaStatus === 'completed' || slaStatus === 'on_track') {
    return null;
  }

  const isSmall = size === 'sm';
  const hours = hoursUntilBreach ? Math.abs(Math.round(hoursUntilBreach)) : 0;

  if (slaStatus === 'overdue') {
    return (
      <Badge 
        variant="destructive" 
        className={`gap-1 animate-pulse font-medium ${isSmall ? 'text-[10px] px-1.5 h-5' : 'text-xs px-2 h-6'} ${className}`}
      >
        <AlertCircle className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>OVERDUE +{hours}h</span>
      </Badge>
    );
  }

  if (slaStatus === 'warning') {
    return (
      <Badge 
        variant="outline" 
        className={`gap-1 border-amber-500 text-amber-600 bg-amber-50 font-medium ${isSmall ? 'text-[10px] px-1.5 h-5' : 'text-xs px-2 h-6'} ${className}`}
      >
        <Clock className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>{hours}h left</span>
      </Badge>
    );
  }

  return null;
}
