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
import { supabase } from '../services/supabase';

// Store the currently dragged work order for drop handling
let draggedWorkOrder: WorkOrder | null = null;

export function setDraggedWorkOrder(wo: WorkOrder | null) {
  draggedWorkOrder = wo;
}

export default function CalendarPage() {
  const { workOrders, refetch } = useWorkOrders();
  const { technicians } = useTechnicians();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.DAY);
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
    
    // Use the globally stored dragged work order
    const droppedOrder = draggedWorkOrder;
    
    if (droppedOrder) {
      handleScheduleRequest(droppedOrder, start, resourceId);
      draggedWorkOrder = null; // Clear after use
    } else {
      toast.error('Could not identify dropped work order');
    }
  };

  const onEventDrop = ({ event, start, resourceId }: any) => {
    handleScheduleRequest(event.data, start, resourceId, true);
  };

  const handleScheduleRequest = async (workOrder: WorkOrder, start: Date, resourceId: string, isReschedule = false) => {
    // 1. Find the technician by ID (resourceId is now the actual technician ID)
    const tech = technicians.find(t => t.id === resourceId) || technicians[0];

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
    const tech = technicians.find(t => t.id === resourceId);
    setConfirmModal({
      isOpen: true,
      workOrder,
      technicianName: tech?.name || 'Technician',
      date: start,
      isReschedule,
      tempEvent: { start, end: moment(start).add(2, 'hours').toDate(), resourceId, technicianId: resourceId }
    });
  };

  const handleOverrideConfirm = async (reason: string, notes: string) => {
    const { pendingScheduleData, technicianId } = overrideModal;
    if (pendingScheduleData && technicianId) {
         const tech = technicians.find(t => t.id === technicianId);
         if (tech) {
            await triggerOverrideNotification(tech.name, pendingScheduleData.workOrder.title, reason, notes, tech.id);
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

  const handleConfirmSchedule = async () => {
    const { workOrder, tempEvent, isReschedule } = confirmModal;
    if (!workOrder || !tempEvent) return;

    try {
      // Persist to database
      const updateData = {
        assigned_technician_id: tempEvent.technicianId,
        scheduled_date: moment(tempEvent.start).format('YYYY-MM-DD'),
        scheduled_time_start: moment(tempEvent.start).format('HH:mm:ss'),
        scheduled_time_end: moment(tempEvent.end).format('HH:mm:ss'),
        status: 'scheduled'
      };
      
      const { error } = await (supabase
        .from('work_orders') as any)
        .update(updateData)
        .eq('id', workOrder.id);

      if (error) throw error;

      // Optimistically update UI
      const newEvent: CalendarEvent = {
        id: `evt-${workOrder.id}`,
        title: workOrder.title,
        start: tempEvent.start,
        end: tempEvent.end,
        resourceId: tempEvent.technicianId,
        data: { ...workOrder, status: 'scheduled' } as WorkOrder
      };

      setEvents(prev => {
        const filtered = prev.filter(e => e.data.id !== workOrder.id);
        return [...filtered, newEvent];
      });

      toast.success(isReschedule ? 'Rescheduled successfully' : 'Work order scheduled');
      setConfirmModal({ isOpen: false });
      
      // Refetch to sync state
      refetch();
    } catch (err: any) {
      console.error('Failed to schedule work order:', err);
      toast.error(err.message || 'Failed to schedule work order');
    }
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
