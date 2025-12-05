import { Technician } from "../../types";
import { TechnicianDispatchCard } from "./TechnicianDispatchCard";

interface TechnicianGridProps {
  technicians: Technician[];
  onAssign: (technicianId: string) => void;
}

export function TechnicianGrid({ technicians, onAssign }: TechnicianGridProps) {
  // Sort: Available first, then by capacity (most available first)
  const sortedTechnicians = [...technicians].sort((a, b) => {
    if (a.status === 'available' && b.status !== 'available') return -1;
    if (a.status !== 'available' && b.status === 'available') return 1;
    
    const aCap = a.capacity.current / a.capacity.max;
    const bCap = b.capacity.current / b.capacity.max;
    return aCap - bCap;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {sortedTechnicians.map((tech) => (
        <TechnicianDispatchCard 
          key={tech.id} 
          technician={tech} 
          onAssign={onAssign} 
        />
      ))}
    </div>
  );
}
