import { useState } from "react";
import { WorkOrder } from "../../types";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "../ui/sheet";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Search, ArrowRight } from "lucide-react";
import { Input } from "../ui/input";

interface QuickAssignPanelProps {
  isOpen: boolean;
  onClose: () => void;
  technicianName: string;
  workOrders: WorkOrder[];
  onConfirmAssign: (workOrderId: string) => void;
}

export function QuickAssignPanel({
  isOpen,
  onClose,
  technicianName,
  workOrders,
  onConfirmAssign
}: QuickAssignPanelProps) {
  const [filter, setFilter] = useState("");

  const unscheduledOrders = workOrders.filter(wo => 
    (!wo.schedulingStatus || wo.schedulingStatus === 'unscheduled') &&
    (wo.title.toLowerCase().includes(filter.toLowerCase()) ||
     wo.propertyCode.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Assign Work to {technicianName}</SheetTitle>
          <SheetDescription>
            Select a work order to immediately assign to this technician.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search unscheduled orders..." 
              className="pl-8"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="space-y-3">
            {unscheduledOrders.map((wo) => (
              <div
                key={wo.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group relative"
                onClick={() => onConfirmAssign(wo.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge 
                    variant="outline" 
                    className={`${getPriorityColor(wo.priority)} border-transparent bg-opacity-10`}
                  >
                    {wo.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{wo.createdDate}</span>
                </div>
                
                <h4 className="font-medium text-sm mb-1">{wo.title}</h4>
                <div className="text-xs text-muted-foreground mb-2">
                  {wo.propertyCode} · {wo.residentName}
                </div>

                <div className="flex gap-2">
                  {wo.permissionToEnter === 'yes' && (
                    <Badge variant="secondary" className="text-[10px] h-5">Entry Allowed</Badge>
                  )}
                </div>

                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {unscheduledOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No matching unscheduled orders found.
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'emergency': return 'text-red-600 bg-red-100';
    case 'high': return 'text-amber-600 bg-amber-100';
    case 'normal': return 'text-blue-600 bg-blue-100';
    case 'low': return 'text-emerald-600 bg-emerald-100';
    default: return 'text-slate-600 bg-slate-100';
  }
}
