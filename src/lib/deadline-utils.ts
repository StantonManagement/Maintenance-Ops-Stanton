import { differenceInDays, differenceInHours, isPast, format } from 'date-fns';

export type UrgencyTier = 'watch' | 'scheduled' | 'warning' | 'critical' | 'due-today' | 'overdue';

export function getUrgencyTier(deadline: Date | string | null): UrgencyTier | null {
  if (!deadline) return null;
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const daysUntil = differenceInDays(deadlineDate, now);
  
  if (isPast(deadlineDate) && daysUntil < 0) return 'overdue';
  // differenceInDays returns 0 if same day, but isPast might be true if time passed.
  // We need to be careful. date-fns differenceInDays counts full 24h periods or calendar days depending on usage?
  // Actually, differenceInDays(later, earlier) returns positive integer.
  
  // Let's stick to the logic provided in the prompt but double check isPast.
  // If isPast is true, it could be overdue OR due today (if just a few hours past but same calendar day).
  // However, the prompt logic puts isPast check first.
  
  // Refined logic based on prompt:
  if (isPast(deadlineDate)) {
      // If it's effectively today (e.g. earlier today), maybe we want due-today?
      // But the prompt says: if isPast -> overdue.
      // Wait, if I have a deadline at 5pm and it's 6pm, is it overdue? Yes.
      // But if the deadline is "today" (often 00:00 or 23:59), handling varies.
      // Let's stick EXACTLY to the prompt code for now to avoid deviating from the spec.
      
      // Prompt said:
      // if (isPast(deadlineDate)) return 'overdue';
      // if (daysUntil === 0) return 'due-today';
      
      // Actually, if isPast is true, it returns 'overdue'. 
      // If I set deadline to today 23:59 and it is now today 10:00, isPast is false. differenceInDays is 0. -> due-today.
      // If I set deadline to today 09:00 and it is now today 10:00, isPast is true. -> overdue.
      
      // That seems strict but fine.
      return 'overdue';
  }
  
  if (daysUntil === 0) return 'due-today';
  if (daysUntil <= 2) return 'critical';
  if (daysUntil <= 6) return 'warning';
  if (daysUntil <= 14) return 'scheduled';
  return 'watch';
}

export function getCountdownText(deadline: Date | string | null): string {
  if (!deadline) return 'No deadline';
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  
  if (isPast(deadlineDate)) {
    const daysOverdue = differenceInDays(now, deadlineDate);
    if (daysOverdue === 0) return 'OVERDUE';
    return `OVERDUE +${daysOverdue}d`;
  }
  
  const daysUntil = differenceInDays(deadlineDate, now);
  if (daysUntil === 0) {
    const hoursUntil = differenceInHours(deadlineDate, now);
    return `${hoursUntil}h`;
  }
  if (daysUntil === 1) return '1 day';
  return `${daysUntil} days`;
}

export function formatExposure(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount}`;
}

export function getDeadlineTooltip(deadline: Date | string | null): string {
  if (!deadline) return 'No deadline set';
  
  const deadlineDate = new Date(deadline);
  const formatted = format(deadlineDate, "MMM d, yyyy 'at' h:mm a");
  
  if (isPast(deadlineDate)) {
    const daysAgo = differenceInDays(new Date(), deadlineDate);
    return `Was due: ${formatted} (${daysAgo} days ago)`;
  }
  return `Due: ${formatted}`;
}
