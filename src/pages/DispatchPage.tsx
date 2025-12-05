import { useState } from "react";
import { useTechnicians } from "../hooks/useTechnicians";
import { useWorkOrders } from "../hooks/useWorkOrders";
import { supabase } from "../services/supabase";
import { TechnicianGrid } from "../components/dispatch/TechnicianGrid";
import { QuickAssignPanel } from "../components/dispatch/QuickAssignPanel";
import { Button } from "../components/ui/button";
import { LayoutGrid, Map as MapIcon, Filter } from "lucide-react";
import { toast } from "sonner";
import { useCapacityCheck } from "../hooks/useCapacityCheck";
import { useOverrideNotification } from "../hooks/useOverrideNotification";
import { CapacityOverrideModal } from "../components/dispatch/CapacityOverrideModal";
import { OverloadedTechsWidget } from "../components/dispatch/OverloadedTechsWidget";

export default function DispatchPage() {
  const { technicians, loading: loadingTechs } = useTechnicians();
  const { workOrders, loading: loadingOrders } = useWorkOrders();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // Hooks
  const { checkCapacity } = useCapacityCheck();
  const { triggerOverrideNotification } = useOverrideNotification();

  // Assignment State
  const [assignPanel, setAssignPanel] = useState<{
    isOpen: boolean;
    technicianId: string | null;
  }>({ isOpen: false, technicianId: null });

  // Override Modal State
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    technicianId: string | null;
    workOrderId: string | null;
    currentLoad: number;
    maxLoad: number;
  }>({ 
    isOpen: false, 
    technicianId: null, 
    workOrderId: null,
    currentLoad: 0,
    maxLoad: 0
  });

  const handleOpenAssign = (technicianId: string) => {
    setAssignPanel({ isOpen: true, technicianId });
  };

  const performAssignment = async (techId: string, woId: string, overrideReason?: string) => {
    const tech = technicians.find(t => t.id === techId);
    const wo = workOrders.find(w => w.id === woId);
    
    if (tech && wo) {
      try {
        // 1. Create assignment record in work_order_assignments table
        const { error: assignError } = await supabase
          .from('work_order_assignments')
          .insert({
            work_order_id: woId,
            technician_id: techId,
            scheduled_date: new Date().toISOString().split('T')[0],
            assigned_by: 'coordinator',
            status: 'scheduled',
            notes: overrideReason ? `[OVERRIDE] ${overrideReason}` : null
          });

        if (assignError) {
          console.error('Failed to create assignment:', assignError.message);
          toast.error('Failed to save assignment');
          return;
        }

        // 2. Also log to work_order_actions for audit trail
        await supabase
          .from('work_order_actions')
          .insert({
            work_order_id: woId,
            action_type: 'assignment',
            action_data: {
              technician_id: techId,
              technician_name: tech.name,
              override_reason: overrideReason || null,
              assigned_at: new Date().toISOString()
            },
            created_by: 'coordinator'
          });

        toast.success(`Assigned "${wo.title}" to ${tech.name}`);
      } catch (err) {
        console.error('Assignment error:', err);
        toast.error('Assignment failed');
      }
      
      setAssignPanel({ isOpen: false, technicianId: null });
    }
  };

  const handleConfirmAssign = async (workOrderId: string) => {
    const techId = assignPanel.technicianId;
    if (!techId) return;

    const tech = technicians.find(t => t.id === techId);
    if (!tech) return;

    const capacity = await checkCapacity(tech.id);

    if (capacity.canAssign) {
      performAssignment(techId, workOrderId);
      if (capacity.status === 'warning') {
        toast.info(`Note: ${tech.name} is now at ${capacity.current + 1}/${capacity.max} capacity.`);
      }
    } else {
      // Trigger Override Flow
      setOverrideModal({
        isOpen: true,
        technicianId: techId,
        workOrderId,
        currentLoad: capacity.current,
        maxLoad: capacity.max
      });
    }
  };

  const handleOverrideConfirm = async (reason: string, notes: string) => {
    const { technicianId, workOrderId } = overrideModal;
    if (technicianId && workOrderId) {
      const tech = technicians.find(t => t.id === technicianId);
      const wo = workOrders.find(w => w.id === workOrderId);
      
      if (tech && wo) {
        await triggerOverrideNotification(tech.name, wo.title, reason, notes);
        performAssignment(technicianId, workOrderId, reason);
      }
    }
    setOverrideModal(prev => ({ ...prev, isOpen: false }));
  };

  if (loadingTechs || loadingOrders) {
    return <div className="flex items-center justify-center h-full">Loading dispatch view...</div>;
  }

  const selectedTech = technicians.find(t => t.id === assignPanel.technicianId);
  const overrideTech = technicians.find(t => t.id === overrideModal.technicianId);

  return (
    <div className="flex flex-col h-full bg-muted/10">
      {/* Toolbar */}
      <div className="h-14 border-b bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg">Dispatch Center</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-l pl-4">
            <span>{technicians.filter(t => t.status === 'available').length} Available</span>
            <span>·</span>
            <span>{technicians.filter(t => t.status === 'in-transit').length} In Transit</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <div className="flex bg-muted p-1 rounded-md border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-sm transition-all ${viewMode === 'map' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}
            >
              <MapIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'grid' ? (
          <div className="flex flex-col">
            {/* Widget Section */}
            <div className="px-6 pt-6">
              <OverloadedTechsWidget 
                technicians={technicians} 
                onReassign={handleOpenAssign} 
              />
            </div>
            <TechnicianGrid technicians={technicians} onAssign={handleOpenAssign} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Map view coming in future update (Google Maps Integration)
          </div>
        )}
      </div>

      {/* Quick Assign Panel */}
      <QuickAssignPanel
        isOpen={assignPanel.isOpen}
        onClose={() => setAssignPanel({ isOpen: false, technicianId: null })}
        technicianId={assignPanel.technicianId}
        technicianName={selectedTech?.name || "Technician"}
        workOrders={workOrders}
        onConfirmAssign={handleConfirmAssign}
      />

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
