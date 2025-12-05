import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { WorkOrder } from '../../types';
import { useTechnicians } from '../../hooks/useTechnicians';
import { TechnicianRow } from './TechnicianRow';
import { ScheduledBlock } from './ScheduledBlock';

// Setup the localizer by providing the moment (or globalize, or Date) Object
const localizer = momentLocalizer(moment);

const DnDCalendar = withDragAndDrop(Calendar);

interface ScheduleCalendarProps {
  date: Date;
  onDateChange: (date: Date) => void;
  view: View;
  onViewChange: (view: View) => void;
  events: CalendarEvent[];
  onEventResize: (args: any) => void;
  onEventDrop: (args: any) => void;
  onDropFromOutside: (args: any) => void;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string; // technicianId
  data: WorkOrder;
  allDay?: boolean;
}

export function ScheduleCalendar({
  date,
  onDateChange,
  view,
  onViewChange,
  events,
  onEventResize,
  onEventDrop,
  onDropFromOutside
}: ScheduleCalendarProps) {
  const { technicians, loading } = useTechnicians();

  // Map technicians to "resources" for the calendar
  const resources = technicians.map(tech => ({
    id: tech.id,
    title: tech.name,
    capacity: tech.capacity,
    skills: tech.skills,
    avatar: tech.name // simplistic avatar data
  }));

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading schedule...</div>;
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-sm p-4">
      <DnDCalendar
        localizer={localizer}
        events={events}
        resources={resources}
        resourceIdAccessor={(resource: any) => resource.id}
        resourceTitleAccessor={(resource: any) => resource.title}
        
        date={date}
        onNavigate={onDateChange}
        view={view}
        onView={onViewChange}
        
        defaultView={Views.DAY}
        views={['day', 'work_week']}
        
        // Drag and Drop handlers
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        onDropFromOutside={onDropFromOutside}
        
        // Styling
        step={60} // 1 hour steps
        timeslots={1}
        min={new Date(0, 0, 0, 8, 0, 0)} // Start at 8am
        max={new Date(0, 0, 0, 18, 0, 0)} // End at 6pm
        
        draggableAccessor={() => true}
        resizable
        selectable
        
        components={{
          resourceHeader: TechnicianRow as any, // Cast to any to avoid strict type mismatch for now
          event: ScheduledBlock as any
        }}
        
        eventPropGetter={() => {
          // Remove background color as ScheduledBlock handles it, just keep layout styles
          return {
            style: {
              backgroundColor: 'transparent', 
              border: 'none',
              padding: 0,
              overflow: 'visible'
            }
          };
        }}
      />
    </div>
  );
}
