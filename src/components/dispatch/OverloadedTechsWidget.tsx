import { Technician } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

interface OverloadedTechsWidgetProps {
  technicians: Technician[];
  onReassign: (technicianId: string) => void;
}

export function OverloadedTechsWidget({ technicians, onReassign }: OverloadedTechsWidgetProps) {
  const overloadedTechs = technicians.filter(t => {
    // Simple check for demo - ideally use useCapacityCheck logic here too
    // but for a widget we can just check the raw counts if we assume updated data
    const activeLoad = t.assignedWorkOrders.filter(wo => 
      !wo.status.toLowerCase().includes('waiting') && 
      wo.status !== 'completed'
    ).length;
    return activeLoad >= 6;
  });

  if (overloadedTechs.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          <CardTitle className="text-base">Overloaded Technicians</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {overloadedTechs.map(tech => (
            <div key={tech.id} className="flex items-center justify-between bg-white p-3 rounded border border-amber-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                  {tech.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-sm">{tech.name}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-amber-600">{tech.capacity.current}/{tech.capacity.max}</span> Active Jobs
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs gap-1 hover:bg-amber-50 hover:text-amber-700"
                onClick={() => onReassign(tech.id)}
              >
                Reassign <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
