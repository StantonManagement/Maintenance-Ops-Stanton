import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Plus, AlertTriangle, CheckCircle, Wrench } from "lucide-react";

interface Equipment {
  id: string;
  type: string;
  make: string;
  model: string;
  installDate: string;
  lifespan: number;
  status: 'good' | 'warning' | 'critical';
  warrantyEnds?: string;
}

const MOCK_EQUIPMENT: Equipment[] = [
  { id: '1', type: 'HVAC Unit', make: 'Carrier', model: 'X500', installDate: '2015-06-15', lifespan: 15, status: 'good', warrantyEnds: '2025-06-15' },
  { id: '2', type: 'Water Heater', make: 'Rheem', model: 'GL40', installDate: '2012-03-10', lifespan: 12, status: 'critical' },
  { id: '3', type: 'Refrigerator', make: 'Whirlpool', model: 'WRT311', installDate: '2019-11-20', lifespan: 10, status: 'good', warrantyEnds: '2020-11-20' },
  { id: '4', type: 'Dishwasher', make: 'GE', model: 'GDF530', installDate: '2018-08-05', lifespan: 10, status: 'warning', warrantyEnds: '2019-08-05' },
];

export function EquipmentInventory() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Equipment Inventory</CardTitle>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Equipment
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_EQUIPMENT.map((item) => {
            const age = new Date().getFullYear() - new Date(item.installDate).getFullYear();
            const lifeRemaining = item.lifespan - age;
            
            return (
              <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${item.status === 'critical' ? 'bg-red-100 text-red-600' : item.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{item.type}</div>
                    <div className="text-sm text-muted-foreground">{item.make} {item.model}</div>
                  </div>
                </div>
                
                <div className="text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-muted-foreground">Installed: {item.installDate}</span>
                    {item.status === 'critical' && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> Replace Soon
                      </Badge>
                    )}
                    {item.status === 'warning' && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        Service Due
                      </Badge>
                    )}
                    {item.status === 'good' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 gap-1">
                        <CheckCircle className="h-3 w-3" /> Good
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {age} years old (Est. {lifeRemaining} years left)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
