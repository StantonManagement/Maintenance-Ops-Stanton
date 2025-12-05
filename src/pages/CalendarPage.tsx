import { useState, useEffect } from 'react';
import { Views, View } from 'react-big-calendar';
import { ScheduleCalendar, CalendarEvent } from '../components/calendar/ScheduleCalendar';
import { UnscheduledQueue } from '../components/calendar/UnscheduledQueue';
import { ScheduleConfirmModal } from '../components/calendar/ScheduleConfirmModal';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useTechnicians } from '../hooks/useTechnicians';
import { WorkOrder } from '../types';
import { toast } from 'sonner';
import moment from 'moment';
import { useCapacityCheck } from '../hooks/useCapacityCheck';
import { useOverrideNotification } from '../hooks/useOverrideNotification';
import { CapacityOverrideModal } from '../components/dispatch/CapacityOverrideModal';

export default function CalendarPage() {
  const { workOrders } = useWorkOrders();
  const { technicians } = useTechnicians();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // Hooks
  const { checkCapacity } = useCapacityCheck();
  const { triggerOverrideNotification } = useOverrideNotification();

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    workOrder?: WorkOrder;
    technicianName?: string;
    date?: Date;
    isReschedule?: boolean;
    tempEvent?: any; // Store drop data temporarily
  }>({ isOpen: false });

  // Override Modal State
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    technicianId: string | null;
    pendingScheduleData: any | null;
    currentLoad: number;
    maxLoad: number;
  }>({ 
    isOpen: false, 
    technicianId: null, 
    pendingScheduleData: null,
    currentLoad: 0,
    maxLoad: 0
  });

  // Filter work orders
  const unscheduledOrders = workOrders.filter(wo => !wo.schedulingStatus || wo.schedulingStatus === 'unscheduled');
  
  // Initialize events from workOrders that have schedules
  useEffect(() => {
    const scheduled = workOrders
      .filter(wo => wo.createdDate && wo.assignee) // Basic check, real logic might be more complex
      .map(wo => {
        // Parse scheduled date/time - this is a simplification as our data might just be strings
        // In a real app, we'd robustly parse ISO strings
        const start = new Date(wo.createdDate); 
        if (wo.createdTime) {
           // logic to add time if available, defaulting to 9am for now
           start.setHours(9, 0, 0);
        }
        const end = new Date(start);
        end.setHours(start.getHours() + 2); // Default 2 hour duration

        return {
          id: wo.id,
          title: wo.title,
          start,
          end,
          resourceId: 'tech-1', // Mock mapping or we need a real technicianId field in WorkOrder
          data: wo
        };
      });
      
    // Merge with local state if we were doing optimistic updates, 
    // but for now let's just use what we mapped or mock some events
    // setEvents(scheduled);
    
    // MOCK EVENTS for visual testing since our WO data might not have valid dates yet
    if (scheduled.length === 0 && workOrders.length > 0) {
       setEvents([
         {
           id: 'evt-1',
           title: 'Kitchen Leak Repair',
           start: moment().hour(10).minute(0).toDate(),
           end: moment().hour(12).minute(0).toDate(),
           resourceId: 'tech-1',
           data: { ...workOrders[0], priority: 'high', title: 'Kitchen Leak Repair' } as WorkOrder
         },
         {
           id: 'evt-2',
           title: 'AC Maintenance',
           start: moment().hour(14).minute(0).toDate(),
           end: moment().hour(16).minute(0).toDate(),
           resourceId: 'tech-2',
           data: { ...workOrders[1], priority: 'normal', title: 'AC Maintenance' } as WorkOrder
         }
       ]);
    } else {
        setEvents(scheduled);
    }
  }, [workOrders]);

  const onDropFromOutside = ({ start, resourceId }: any) => {
    console.log('Dropped from outside:', start, resourceId);
    
    // For now, let's assume the LAST dragged item is what we dropped (safe assumption in single user drag)
    // In a real app, use `dnd-kit` monitor or a global store.
    // We'll mock the "dropped item" as the first unscheduled one for demo if we can't get ID.
    const droppedOrder = unscheduledOrders[0]; 
    
    if (droppedOrder) {
      handleScheduleRequest(droppedOrder, start, resourceId);
    }
  };

  const onEventDrop = ({ event, start, resourceId }: any) => {
    handleScheduleRequest(event.data, start, resourceId, true);
  };

  const handleScheduleRequest = async (workOrder: WorkOrder, start: Date, resourceId: string, isReschedule = false) => {
    // 1. Find the technician
    // Note: resourceId in big-calendar might be 'tech-1', we need to match to real ID
    // For demo, we mock the mapping or assume resourceId matches tech.id if we had it set up that way
    // Let's assume resourceId maps to index 0 or 1 for demo purposes
    const tech = technicians[resourceId === 'tech-2' ? 1 : 0] || technicians[0];

    // 2. Check Capacity
    // Only check if we have a tech object. If mocking fails, proceed unsafe or block.
    if (tech) {
        const capacity = await checkCapacity(tech.id);
        if (!capacity.canAssign) {
            setOverrideModal({
                isOpen: true,
                technicianId: tech.id,
                pendingScheduleData: { workOrder, start, resourceId, isReschedule },
                currentLoad: capacity.current,
                maxLoad: capacity.max
            });
            return;
        }
        if (capacity.status === 'warning') {
             toast.info(`Note: ${tech.name} is at ${capacity.current + 1}/${capacity.max} capacity.`);
        }
    }

    // 3. Proceed to confirm modal
    openConfirmModal(workOrder, start, resourceId, isReschedule);
  };

  const openConfirmModal = (workOrder: WorkOrder, start: Date, resourceId: string, isReschedule: boolean) => {
    setConfirmModal({
      isOpen: true,
      workOrder,
      technicianName: resourceId === 'tech-1' ? 'Ramon M.' : resourceId === 'tech-2' ? 'Sarah L.' : 'Technician', // Mock lookup
      date: start,
      isReschedule,
      tempEvent: { start, end: moment(start).add(2, 'hours').toDate(), resourceId }
    });
  };

  const handleOverrideConfirm = async (reason: string, notes: string) => {
    const { pendingScheduleData, technicianId } = overrideModal;
    if (pendingScheduleData && technicianId) {
         const tech = technicians.find(t => t.id === technicianId);
         if (tech) {
            await triggerOverrideNotification(tech.name, pendingScheduleData.workOrder.title, reason, notes);
            // Proceed to normal confirmation
            openConfirmModal(
                pendingScheduleData.workOrder, 
                pendingScheduleData.start, 
                pendingScheduleData.resourceId, 
                pendingScheduleData.isReschedule
            );
         }
    }
    setOverrideModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirmSchedule = () => {
    const { workOrder, tempEvent, isReschedule } = confirmModal;
    if (!workOrder || !tempEvent) return;

    // Optimistically update UI
    const newEvent: CalendarEvent = {
      id: isReschedule ? `evt-${workOrder.id}` : `evt-${Date.now()}`,
      title: workOrder.title,
      start: tempEvent.start,
      end: tempEvent.end,
      resourceId: tempEvent.resourceId,
      data: workOrder
    };

    setEvents(prev => {
      const filtered = isReschedule ? prev.filter(e => e.data.id !== workOrder.id) : prev;
      return [...filtered, newEvent];
    });

    toast.success(isReschedule ? 'Rescheduled successfully' : 'Work order scheduled');
    setConfirmModal({ isOpen: false });
    
    // Here we would call Supabase update:
    // supabase.from('work_orders').update({ scheduled_date: ... })...
  };

  const overrideTech = technicians.find(t => t.id === overrideModal.technicianId);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar: Unscheduled Queue */}
      <div className="w-[300px] flex-shrink-0 h-full">
        <UnscheduledQueue workOrders={unscheduledOrders} />
      </div>

      {/* Main: Calendar */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        <ScheduleCalendar
          date={date}
          onDateChange={setDate}
          view={view}
          onViewChange={setView}
          events={events}
          onEventResize={() => {}}
          onEventDrop={onEventDrop}
          onDropFromOutside={onDropFromOutside}
        />
      </div>

      {/* Modal */}
      {confirmModal.workOrder && (
        <ScheduleConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false })}
          onConfirm={handleConfirmSchedule}
          workOrder={confirmModal.workOrder}
          technicianName={confirmModal.technicianName || 'Technician'}
          date={confirmModal.date || new Date()}
          isReschedule={confirmModal.isReschedule}
        />
      )}

      {/* Capacity Override Modal */}
      <CapacityOverrideModal
        isOpen={overrideModal.isOpen}
        onClose={() => setOverrideModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleOverrideConfirm}
        technicianName={overrideTech?.name || "Technician"}
        currentLoad={overrideModal.currentLoad}
        maxLoad={overrideModal.maxLoad}
      />
    </div>
  );
}
