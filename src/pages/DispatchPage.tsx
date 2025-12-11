import { useState } from "react";
import { useDispatchData } from "../hooks/useDispatchData";
import { useMapData } from "../hooks/useMapData";
import { DemandPanel, DemandFilters } from "../components/dispatch/DemandPanel";
import { SupplyPanel } from "../components/dispatch/SupplyPanel";
import { DispatchMap } from "../components/map/DispatchMap";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, X } from "lucide-react";
import { toast } from "sonner";

export default function DispatchPage() {
  const { unassignedWorkOrders, technicians, loading, error, assignWorkOrder } = useDispatchData();
  const { technicianPositions, properties, alerts } = useMapData();
  
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [demandFilters, setDemandFilters] = useState<DemandFilters>({ urgency: 'all', skillsNeeded: [], propertyId: null, search: '' });

  // Filter demand
  const filteredWorkOrders = unassignedWorkOrders.filter(wo => {
    if (demandFilters.search) {
       const term = demandFilters.search.toLowerCase();
       return wo.title.toLowerCase().includes(term) || 
              wo.propertyCode.toLowerCase().includes(term) ||
              wo.unit.toLowerCase().includes(term);
    }
    return true;
  });

  const selectedWorkOrder = unassignedWorkOrders.find(wo => wo.id === selectedWorkOrderId);
  const selectedSkills = selectedWorkOrder?.aiSkillsRequired || [];

  const handleAssign = async (techId: string) => {
    if (!selectedWorkOrderId) {
      toast.error("Select a work order first");
      return;
    }
    
    const tech = technicians.find(t => t.id === techId);
    if (!tech) return;

    // Optimistic assignment or wait for result
    const success = await assignWorkOrder(selectedWorkOrderId, techId, tech.name);
    if (success) {
      setSelectedWorkOrderId(null);
    }
  };

  const handleViewSchedule = (techId: string) => {
    toast.info(`View schedule for ${techId} (Not implemented)`);
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading dispatch center...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-500">Error: {error.message}</div>;

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="h-14 border-b bg-card px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg">Dispatch Center</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground border-l pl-4">
            <span>{filteredWorkOrders.length} Unassigned</span>
            <span>·</span>
            <span>{technicians.filter(t => t.status === 'available').length} Available</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant={showMap ? "secondary" : "outline"} size="sm" onClick={() => setShowMap(!showMap)}>
             <MapIcon className="mr-2 h-4 w-4" />
             {showMap ? "Hide Map" : "Show Map"}
           </Button>
        </div>
      </div>

      {/* Split View Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Demand Side (Left) */}
        <div className="flex-1 min-w-[320px] max-w-[50%]">
          <DemandPanel 
            workOrders={filteredWorkOrders}
            selectedId={selectedWorkOrderId}
            onSelect={setSelectedWorkOrderId}
            filters={demandFilters}
            onFilterChange={setDemandFilters}
          />
        </div>

        {/* Supply Side (Right) */}
        <div className="flex-1 bg-muted/10">
           {selectedWorkOrderId ? (
             <SupplyPanel 
               technicians={technicians}
               selectedWorkOrderSkills={selectedSkills}
               onAssign={handleAssign}
               onViewSchedule={handleViewSchedule}
             />
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
               <p className="font-medium mb-1">Select a work order to assign</p>
               <p className="text-sm">Select an item from the demand list to see available technicians</p>
               
               {/* Show full supply even if no selection? PRP implies split view always visible. 
                   Let's show SupplyPanel always but maybe simplified if no selection. 
                   Actually, Coordinator wants to see supply always.
               */}
             </div>
           )}
           {/* Allow seeing supply always, but highlight logic depends on selection. 
               Let's render SupplyPanel always.
           */}
           {!selectedWorkOrderId && (
              <SupplyPanel 
               technicians={technicians}
               selectedWorkOrderSkills={[]}
               onAssign={() => toast.error("Select a work order first")}
               onViewSchedule={handleViewSchedule}
             />
           )}
        </div>
        
        {/* Map Overlay */}
        {showMap && (
          <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex flex-col animate-in fade-in">
             <div className="h-14 border-b px-6 flex items-center justify-between bg-card">
                <h3 className="font-semibold">Map View</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowMap(false)}>
                  <X className="h-4 w-4" />
                </Button>
             </div>
             <div className="flex-1 relative">
                <DispatchMap
                  technicianPositions={technicianPositions}
                  properties={properties}
                  alerts={alerts}
                  showGeofences={true}
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

