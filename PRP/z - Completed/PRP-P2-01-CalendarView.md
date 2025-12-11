# PRP-P2-01: Calendar View

## Goal
Build a visual calendar showing scheduled work orders by technician and date. View-only in this PRP (drag-drop assignment is Dispatch).

## Success Criteria
- [ ] Week view showing 5 days (Mon-Fri) or 7 days
- [ ] Technicians as rows, dates/times as columns
- [ ] Scheduled work orders appear as colored blocks
- [ ] Click block to view work order details
- [ ] Navigate between weeks (prev/next)
- [ ] Toggle between Day, Week, Month views
- [ ] Show technician capacity per day
- [ ] Color-code by priority or status

---

## Context

**Files involved:**
- `src/pages/CalendarPage.tsx` - Main calendar page
- `src/components/calendar/ScheduleCalendar.tsx` - Calendar grid
- `src/hooks/useCalendarData.ts` - Fetch assignments for date range
- Library: `react-big-calendar` (already installed)

**Current state:**
- CalendarPage exists with Phase 2 lock overlay
- react-big-calendar is in package.json
- Assignments table has scheduled_date and scheduled_time fields

**Data needed:**
- All technicians
- Work order assignments within date range
- Work order details for each assignment

---

## Tasks

### Task 1: Create Calendar Data Hook

CREATE `src/hooks/useCalendarData.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Technician, WorkOrderAssignment, WorkOrder } from '@/types';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string; // technician_id
  workOrder: WorkOrder;
  assignment: WorkOrderAssignment;
  priority: number;
  status: string;
}

interface UseCalendarDataResult {
  events: CalendarEvent[];
  technicians: Technician[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCalendarData(
  startDate: Date,
  endDate: Date
): UseCalendarDataResult {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch technicians
      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .select('*')
        .order('name');

      if (techError) throw techError;
      setTechnicians(techData || []);

      // Fetch assignments with work orders for date range
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      const { data: assignmentData, error: assignmentError } = await supabase
        .from('work_order_assignments')
        .select(`
          *,
          work_order:work_orders(*)
        `)
        .gte('scheduled_date', startStr)
        .lte('scheduled_date', endStr)
        .not('technician_id', 'is', null);

      if (assignmentError) throw assignmentError;

      // Transform to calendar events
      const calendarEvents: CalendarEvent[] = (assignmentData || []).map(assignment => {
        const wo = assignment.work_order;
        const scheduledDate = new Date(assignment.scheduled_date);
        
        // Parse time or use defaults
        const startTime = assignment.scheduled_time_start || '09:00';
        const endTime = assignment.scheduled_time_end || '10:00';
        
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const start = new Date(scheduledDate);
        start.setHours(startHour, startMin, 0, 0);
        
        const end = new Date(scheduledDate);
        end.setHours(endHour, endMin, 0, 0);

        return {
          id: assignment.id,
          title: `${wo?.title || 'Work Order'} - ${wo?.unit || ''}`,
          start,
          end,
          resourceId: assignment.technician_id,
          workOrder: wo,
          assignment,
          priority: wo?.priority || 3,
          status: assignment.status,
        };
      });

      setEvents(calendarEvents);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    events,
    technicians,
    loading,
    error,
    refetch: fetchData,
  };
}
```

### Task 2: Update Calendar Page

MODIFY `src/pages/CalendarPage.tsx`:

```typescript
import { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addWeeks, subWeeks, startOfMonth, endOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useCalendarData, CalendarEvent } from '@/hooks/useCalendarData';
import { WorkOrderDetailModal } from '@/components/WorkOrderDetailModal';

// Setup date-fns localizer
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Calculate date range based on view
  const getDateRange = () => {
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = addWeeks(start, 1);
      return { start, end };
    } else if (view === 'month') {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    } else {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  };

  const { start, end } = getDateRange();
  const { events, technicians, loading, error } = useCalendarData(start, end);

  // Navigation
  const goToToday = () => setCurrentDate(new Date());
  const goToPrev = () => {
    if (view === 'week') setCurrentDate(d => subWeeks(d, 1));
    else if (view === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1));
    else setCurrentDate(d => new Date(d.getTime() - 86400000));
  };
  const goToNext = () => {
    if (view === 'week') setCurrentDate(d => addWeeks(d, 1));
    else if (view === 'month') setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1));
    else setCurrentDate(d => new Date(d.getTime() + 86400000));
  };

  // Event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const priorityColors: Record<number, string> = {
      1: '#DC2626', // Emergency - red
      2: '#F59E0B', // High - amber
      3: '#3B82F6', // Medium - blue
      4: '#10B981', // Low - green
      5: '#6B7280', // Cosmetic - gray
    };

    const statusOpacity: Record<string, number> = {
      completed: 0.5,
      cancelled: 0.3,
      scheduled: 1,
      in_progress: 0.8,
    };

    return {
      style: {
        backgroundColor: priorityColors[event.priority] || '#3B82F6',
        opacity: statusOpacity[event.status] || 1,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
      },
    };
  };

  // Handle event click
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error loading calendar: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Schedule Calendar</h1>
          <p className="text-muted-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex border rounded-lg">
            {(['day', 'week', 'month'] as const).map(v => (
              <Button
                key={v}
                variant={view === v ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView(v)}
                className="rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-600" />
          <span>Emergency</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Low</span>
        </div>
      </div>

      {/* Calendar */}
      <Card className="flex-1 p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            view={view}
            onView={(v) => setView(v as typeof view)}
            onNavigate={setCurrentDate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            resources={view === 'day' ? technicians.map(t => ({ id: t.id, title: t.name })) : undefined}
            resourceIdAccessor="id"
            resourceTitleAccessor="title"
            style={{ height: '100%' }}
            min={new Date(0, 0, 0, 7, 0, 0)} // 7 AM
            max={new Date(0, 0, 0, 19, 0, 0)} // 7 PM
          />
        )}
      </Card>

      {/* Work Order Detail Modal */}
      {selectedEvent && (
        <WorkOrderDetailModal
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
          workOrder={selectedEvent.workOrder}
          assignment={selectedEvent.assignment}
        />
      )}
    </div>
  );
}
```

### Task 3: Add Calendar CSS Customization

ADD to `src/index.css`:

```css
/* Calendar Customizations */
.rbc-calendar {
  font-family: inherit;
}

.rbc-header {
  padding: 8px;
  font-weight: 600;
}

.rbc-event {
  padding: 4px 8px;
  font-size: 12px;
}

.rbc-event-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rbc-today {
  background-color: hsl(var(--accent) / 0.3);
}

.rbc-current-time-indicator {
  background-color: hsl(var(--primary));
  height: 2px;
}

.rbc-time-view .rbc-row {
  min-height: 60px;
}

.rbc-toolbar {
  display: none; /* Using custom toolbar */
}
```

### Task 4: Create Work Order Detail Modal (if doesn't exist)

CREATE `src/components/WorkOrderDetailModal.tsx`:

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { WorkOrder, WorkOrderAssignment } from '@/types';

interface WorkOrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
  assignment?: WorkOrderAssignment;
}

export function WorkOrderDetailModal({
  open,
  onOpenChange,
  workOrder,
  assignment,
}: WorkOrderDetailModalProps) {
  const priorityLabels: Record<number, string> = {
    1: 'Emergency',
    2: 'High',
    3: 'Medium',
    4: 'Low',
    5: 'Cosmetic',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Work Order {workOrder.id}
            <Badge variant={workOrder.priority === 1 ? 'destructive' : 'secondary'}>
              {priorityLabels[workOrder.priority] || 'Unknown'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">
              {workOrder.description || workOrder.title}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-1">Location</h4>
              <p className="text-sm text-muted-foreground">
                {workOrder.property_address}
                <br />
                Unit: {workOrder.unit}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Tenant</h4>
              <p className="text-sm text-muted-foreground">
                {workOrder.resident_name}
              </p>
            </div>
          </div>

          {assignment && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Scheduled</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(assignment.scheduled_date), 'MMM d, yyyy')}
                  {assignment.scheduled_time_start && (
                    <> at {assignment.scheduled_time_start}</>
                  )}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Status</h4>
                <Badge variant="outline">
                  {assignment.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Task 5: Remove Phase Lock Overlay

MODIFY `src/pages/CalendarPage.tsx` or routing to remove any Phase 2 lock:

```typescript
// Remove or comment out phase lock check
// if (!unlockAllFeatures) return <PhaseLockOverlay phase={2} />;
```

---

## Validation

```bash
# Type check
npx tsc --noEmit

# Build  
npm run build

# Manual testing:
# 1. Navigate to /calendar
# 2. Calendar loads with current week
# 3. Scheduled work orders appear as blocks
# 4. Click event - detail modal opens
# 5. Navigate prev/next weeks
# 6. Toggle day/week/month views
# 7. Colors match priority levels
```

---

## Edge Cases

- No assignments in date range → Empty calendar (normal)
- Assignment without time → Use default 9-10 AM
- Past events → Show with reduced opacity
- Cancelled assignments → Show with very low opacity or hide
- Technician has no assignments → Still show in resource view
