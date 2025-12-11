import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ChevronDown,
  ChevronUp,
  Send,
  ArrowRight
} from 'lucide-react';
import { cn } from '../ui/utils';
import { toast } from 'sonner';
import { 
  IncompleteWorkOrder, 
  IncompleteReason, 
  REASON_LABELS 
} from '../../hooks/useMorningGate';

// Simple date formatter
const formatDate = (date: Date, style: 'short' | 'long' = 'long') => {
  if (style === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

interface IncompleteWOCardProps {
  item: IncompleteWorkOrder;
  onSubmit: (
    assignmentId: string,
    reason: IncompleteReason,
    detail?: string,
    newDate?: Date
  ) => Promise<{ success: boolean; message: string; escalated: boolean }>;
  isHighPriority: boolean;
  recommendedDate: Date;
  submitting: boolean;
}

export function IncompleteWOCard({
  item,
  onSubmit,
  isHighPriority,
  recommendedDate,
  submitting,
}: IncompleteWOCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState<IncompleteReason | ''>('');
  const [detail, setDetail] = useState('');
  const [newDate, setNewDate] = useState<Date>(recommendedDate);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    
    setLocalSubmitting(true);
    const result = await onSubmit(
      item.assignmentId,
      reason,
      detail || undefined,
      isHighPriority ? undefined : newDate
    );
    setLocalSubmitting(false);

    if (result.success) {
      toast.success(result.escalated ? 'Sent to coordinator' : 'Work order rescheduled');
    } else {
      toast.error(result.message || 'Failed to submit explanation');
    }
  };

  const priorityColor = {
    Emergency: 'bg-red-500',
    Urgent: 'bg-orange-500',
    High: 'bg-amber-500',
    Normal: 'bg-blue-500',
    Low: 'bg-gray-500',
  }[item.priority] || 'bg-gray-500';

  return (
    <Card className={cn(
      'overflow-hidden transition-all',
      isHighPriority && 'border-amber-400 border-2'
    )}>
      {/* Header - Always visible */}
      <div 
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn('text-white', priorityColor)}>
                {item.priority}
              </Badge>
              {isHighPriority && (
                <Badge variant="outline" className="text-amber-600 border-amber-400">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requires Coordinator
                </Badge>
              )}
              {item.daysOverdue > 1 && (
                <Badge variant="destructive">
                  {item.daysOverdue} days overdue
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {item.property} · Unit {item.unit}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Scheduled: {item.scheduledDate}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="ml-2">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Form */}
      {expanded && (
        <div className="px-4 pb-4 border-t bg-muted/30">
          <div className="pt-4 space-y-4">
            {/* Reason Select */}
            <div className="space-y-2">
              <Label>Why wasn't this completed?</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as IncompleteReason)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detail */}
            <div className="space-y-2">
              <Label>Additional details (optional)</Label>
              <Textarea
                placeholder="Provide any additional context..."
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={2}
              />
            </div>

            {/* Date picker - only for non-high priority */}
            {!isHighPriority && (
              <div className="space-y-2">
                <Label>Reschedule to</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !newDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDate ? formatDate(newDate) : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newDate}
                      onSelect={(date) => date && setNewDate(date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* High priority notice */}
            {isHighPriority && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">High Priority Work Order</p>
                    <p className="text-amber-700">
                      This will be escalated to Kristine for review and reassignment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!reason || localSubmitting || submitting}
            >
              {localSubmitting ? (
                'Submitting...'
              ) : isHighPriority ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Coordinator
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Reschedule to {formatDate(newDate, 'short')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
