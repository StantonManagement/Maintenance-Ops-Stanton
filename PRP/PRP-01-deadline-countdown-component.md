# PRP-01: Deadline Countdown Component

## Goal
Create a reusable component that displays deadline pressure as the primary visual indicator across all work order displays. This becomes the universal urgency language throughout the app.

## Success Criteria
- [ ] Component shows countdown in human-readable format ("3 days", "8 hours", "OVERDUE")
- [ ] Visual treatment changes based on urgency tier (color, weight)
- [ ] Works in card, table row, and detail panel contexts
- [ ] Includes optional exposure badge as secondary indicator
- [ ] Tooltip shows actual deadline date/time on hover

## Context

### Urgency Tiers
| Days Out | Tier | Visual Treatment |
|----------|------|------------------|
| >14 | Watch | Muted gray, normal weight |
| 7-14 | Scheduled | Default text, normal weight |
| 3-6 | Warning | Amber text, medium weight |
| 1-2 | Critical | Red text, bold weight |
| 0 | Due Today | Red background badge, bold |
| <0 | Overdue | Dark red background, "OVERDUE +X days" |

### Exposure Display Rules
- Only show exposure badge if > $500
- Muted color (gray or subtle amber)
- Format: "$1.2k" for thousands
- Position: Secondary to countdown, smaller text

## Implementation Tasks

### Task 1: Create Utility Functions

CREATE `src/lib/deadline-utils.ts`:

```typescript
import { differenceInDays, differenceInHours, isPast, format } from 'date-fns';

export type UrgencyTier = 'watch' | 'scheduled' | 'warning' | 'critical' | 'due-today' | 'overdue';

export function getUrgencyTier(deadline: Date | string | null): UrgencyTier | null {
  if (!deadline) return null;
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const daysUntil = differenceInDays(deadlineDate, now);
  
  if (isPast(deadlineDate)) return 'overdue';
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
```

### Task 2: Create Component

CREATE `src/components/ui/DeadlineCountdown.tsx`:

```typescript
import React from 'react';
import { getUrgencyTier, getCountdownText, formatExposure, getDeadlineTooltip } from '@/lib/deadline-utils';
import { cn } from '@/lib/utils';

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
```

### Task 3: Export from UI index

MODIFY `src/components/ui/index.ts` (or wherever UI components are exported):
- ADD export for DeadlineCountdown

### Task 4: Add Unit Tests

CREATE `src/lib/__tests__/deadline-utils.test.ts`:

Test cases:
- 30 days out → 'watch'
- 10 days out → 'scheduled'  
- 5 days out → 'warning'
- 1 day out → 'critical'
- Same day → 'due-today'
- Yesterday → 'overdue'
- Null deadline → null tier, "No deadline" text
- Exposure formatting: 500 → "$500", 1500 → "$1.5k"

## Validation Checkpoints

### Checkpoint 1: Utils Work
```bash
npm run test src/lib/__tests__/deadline-utils.test.ts
# All tests pass
```

### Checkpoint 2: Component Renders
```bash
npm run dev
# Import and render component with test data
# Verify all 6 tiers display correctly
```

### Checkpoint 3: Build Passes
```bash
npm run build
# No TypeScript errors
```

## Usage Examples

```tsx
// Table row - compact
<DeadlineCountdown deadline={wo.deadline} size="sm" />

// Card - with exposure
<DeadlineCountdown 
  deadline={wo.deadline} 
  exposure={wo.unitRent * daysAtRisk}
  showExposure={true}
  size="md" 
/>

// Detail panel - large
<DeadlineCountdown deadline={wo.deadline} size="lg" />
```

## Dependencies
- date-fns (should already be installed)
- cn utility (should exist - standard shadcn pattern)

## Notes
- Build this FIRST - other PRPs depend on it
- Keep it pure/presentational - no data fetching
- Deadline values come from work order data
- Exposure calculation happens in parent component or data layer
