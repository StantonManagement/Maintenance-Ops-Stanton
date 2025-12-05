import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidence: number; // 0-100
  fieldName: string;
  showLabel?: boolean;
}

export function ConfidenceIndicator({ confidence, fieldName, showLabel = false }: ConfidenceIndicatorProps) {
  const getConfidenceLevel = () => {
    if (confidence >= 80) return { level: 'high', color: 'var(--status-success-text)', bg: 'var(--status-success-bg)', icon: CheckCircle, label: 'High confidence' };
    if (confidence >= 50) return { level: 'medium', color: 'var(--status-warning-text)', bg: 'var(--status-warning-bg)', icon: HelpCircle, label: 'Medium confidence' };
    return { level: 'low', color: 'var(--status-critical-text)', bg: 'var(--status-critical-bg)', icon: AlertCircle, label: 'Low confidence' };
  };

  const { color, bg, icon: Icon, label } = getConfidenceLevel();

  if (confidence === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
            >
              <AlertCircle size={12} />
              {showLabel && 'Not detected'}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI could not extract {fieldName} from the transcription</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-help"
            style={{ backgroundColor: bg, color }}
          >
            <Icon size={12} />
            {showLabel && `${confidence}%`}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {confidence}% confident in {fieldName}</p>
          <p className="text-xs opacity-70 mt-1">
            {confidence >= 80 
              ? 'AI is confident this is correct' 
              : confidence >= 50 
                ? 'Please verify this field'
                : 'This field needs manual review'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ConfidenceBadgeProps {
  confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const getStyle = () => {
    if (confidence >= 80) return { bg: 'var(--status-success-bg)', border: 'var(--status-success-border)', text: 'var(--status-success-text)' };
    if (confidence >= 50) return { bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)', text: 'var(--status-warning-text)' };
    return { bg: 'var(--status-critical-bg)', border: 'var(--status-critical-border)', text: 'var(--status-critical-text)' };
  };

  const style = getStyle();

  return (
    <span 
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
      style={{ 
        backgroundColor: style.bg, 
        borderColor: style.border,
        color: style.text,
        border: '1px solid'
      }}
    >
      {confidence}%
    </span>
  );
}
