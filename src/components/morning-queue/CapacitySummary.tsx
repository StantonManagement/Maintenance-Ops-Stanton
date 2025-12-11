import { formatExposure } from "@/lib/deadline-utils";
import { cn } from "@/lib/utils";

interface CapacitySummaryProps {
  availableHours: number;
  requiredHours: number;
  itemCount: number;
  totalExposure: number;
}

export function CapacitySummary({ availableHours, requiredHours, itemCount, totalExposure }: CapacitySummaryProps) {
  const percentage = availableHours > 0 ? (requiredHours / availableHours) * 100 : 0;
  
  // Determine color based on capacity
  // Green if required < available
  // Amber if required is 80-100% of available
  // Red if required > available
  let progressColor = "bg-green-500";
  if (percentage > 100) progressColor = "bg-red-500";
  else if (percentage > 80) progressColor = "bg-amber-500";

  return (
    <div className="bg-card border-b p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
           <span className="text-xl font-semibold">📊 This Week's Capacity</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
           <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">{itemCount}</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Exposure:</span>
              <span className="font-medium">{formatExposure(totalExposure)}</span>
           </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
           <span>{requiredHours}h needed</span>
           <span className="text-muted-foreground">{availableHours}h available</span>
        </div>
        <div className="bg-primary/20 relative h-3 w-full overflow-hidden rounded-full">
           <div 
             className={cn("h-full w-full flex-1 transition-all", progressColor)} 
             style={{ transform: `translateX(-${100 - Math.min(percentage, 100)}%)` }}
           />
        </div>
      </div>
    </div>
  );
}
