import { AlertTriangle, CheckCircle } from "lucide-react";
import { useOverrides } from "../hooks/useOverrides";
import { Button } from "./ui/button";

export function OverrideNotificationBanner() {
  const { unacknowledgedOverrides, acknowledgeOverride } = useOverrides();

  if (unacknowledgedOverrides.length === 0) return null;

  // Just show the most recent one
  const latest = unacknowledgedOverrides[0];

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-md animate-in slide-in-from-top">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-1.5 rounded-full">
          <AlertTriangle className="h-4 w-4 text-white" />
        </div>
        <div className="text-sm font-medium">
          <span className="font-bold">OVERRIDE ALERT:</span> {latest.technicianName} pulled for {latest.overrideReason} by {latest.overrideBy}
          {latest.displacedWorkOrders.length > 0 && (
            <span className="ml-1 opacity-90">({latest.displacedWorkOrders.length} WOs displaced)</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          className="h-7 text-xs bg-white text-amber-600 hover:bg-amber-50"
          onClick={() => acknowledgeOverride(latest.id, "Kristine")}
        >
          <CheckCircle className="h-3 w-3 mr-1.5" />
          Acknowledge
        </Button>
        {unacknowledgedOverrides.length > 1 && (
          <span className="text-xs bg-amber-600 px-2 py-1 rounded-full">
            +{unacknowledgedOverrides.length - 1} more
          </span>
        )}
      </div>
    </div>
  );
}
