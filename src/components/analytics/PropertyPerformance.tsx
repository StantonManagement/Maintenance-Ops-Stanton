import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../ui/button";

interface PropertyStat {
  id: string;
  name: string;
  workOrders: number;
  avgCompletionTime: string;
  cost: number;
  trend: 'up' | 'down' | 'stable';
}

interface PropertyPerformanceProps {
  data: PropertyStat[];
}

export function PropertyPerformance({ data }: PropertyPerformanceProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Property Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="h-12 px-4 font-medium align-middle">
                  <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
                    Property
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </th>
                <th className="h-12 px-4 font-medium align-middle">Work Orders</th>
                <th className="h-12 px-4 font-medium align-middle">Avg Completion</th>
                <th className="h-12 px-4 font-medium align-middle text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.map((property) => (
                <tr key={property.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle font-medium">{property.name}</td>
                  <td className="p-4 align-middle">
                    {property.workOrders}
                    {property.trend === 'up' && <span className="ml-2 text-xs text-red-500">↑</span>}
                    {property.trend === 'down' && <span className="ml-2 text-xs text-green-500">↓</span>}
                  </td>
                  <td className="p-4 align-middle">{property.avgCompletionTime}</td>
                  <td className="p-4 align-middle text-right">${property.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
