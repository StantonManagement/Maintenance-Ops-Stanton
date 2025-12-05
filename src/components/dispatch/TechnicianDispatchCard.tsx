import { Technician } from "../../types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MapPin, AlertTriangle, User } from "lucide-react";
import { CapacityRing } from "./CapacityRing";

interface TechnicianDispatchCardProps {
  technician: Technician;
  onAssign: (technicianId: string) => void;
}

export function TechnicianDispatchCard({ technician, onAssign }: TechnicianDispatchCardProps) {
  const statusColors = {
    available: 'var(--status-success-icon)',
    'in-transit': 'var(--status-warning-icon)',
    unavailable: 'var(--status-critical-icon)',
  };

  return (
    <div 
      className="p-6 border rounded-lg bg-card shadow-sm transition-all hover:shadow-md flex flex-col h-full"
      style={{ borderColor: 'var(--border-default)' }}
    >
      {/* Turnover Banner */}
      {technician.pulledForTurnover && technician.turnoverInfo && (
        <div className="mb-4 p-3 border border-amber-200 bg-amber-50 rounded text-amber-800 text-xs flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">PULLED FOR TURNOVER</div>
            <div>{technician.turnoverInfo.building} · Back {technician.turnoverInfo.estimatedReturn}</div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div 
              className="h-12 w-12 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: 'var(--action-primary)' }}
            >
              {technician.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div 
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
              style={{ backgroundColor: statusColors[technician.status] }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{technician.name}</h3>
            <div className="text-xs text-muted-foreground capitalize">{technician.status}</div>
          </div>
        </div>
        
        <CapacityRing current={technician.capacity.current} max={technician.capacity.max} size={60} strokeWidth={5} />
      </div>

      <div className="space-y-3 mb-6 flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {technician.inTransit 
              ? `En route to ${technician.currentLocation}`
              : technician.currentLocation
            }
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {technician.skills.map(skill => (
            <Badge key={skill} variant="secondary" className="text-[10px]">
              {skill}
            </Badge>
          ))}
        </div>

        {technician.assignedWorkOrders.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs font-medium mb-2 text-muted-foreground">Active Job</div>
            <div className="text-sm truncate bg-muted/50 p-2 rounded">
              {technician.assignedWorkOrders[0].title}
            </div>
          </div>
        )}
      </div>

      <Button 
        className="w-full mt-auto" 
        onClick={() => onAssign(technician.id)}
        disabled={technician.status === 'unavailable' || technician.capacity.current >= technician.capacity.max}
      >
        <User className="h-4 w-4 mr-2" />
        Assign Work
      </Button>
    </div>
  );
}
