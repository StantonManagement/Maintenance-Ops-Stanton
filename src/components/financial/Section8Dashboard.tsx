import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Badge } from '../ui/badge';

const SECTION_8_DATA = [
  { name: 'Inspection Repairs', value: 12, color: '#ef4444' }, // red
  { name: 'Tenant Maintenance', value: 8, color: '#3b82f6' }, // blue
  { name: 'Pre-Inspection', value: 5, color: '#eab308' }, // yellow
  { name: 'Owner Responsibility', value: 15, color: '#22c55e' }, // green
];

const INSPECTIONS = [
  { id: 1, unit: '104', date: '2023-12-10', status: 'Scheduled', type: 'Annual' },
  { id: 2, unit: '205', date: '2023-12-08', status: 'Failed', type: 'Initial' },
  { id: 3, unit: '312', date: '2023-12-15', status: 'Passed', type: 'Re-inspection' },
];

export function Section8Dashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Work Order Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SECTION_8_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {SECTION_8_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {INSPECTIONS.map((inspection) => (
              <div key={inspection.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <div className="font-medium">Unit {inspection.unit}</div>
                  <div className="text-sm text-muted-foreground">{inspection.type} - {inspection.date}</div>
                </div>
                <Badge 
                  variant={inspection.status === 'Failed' ? 'destructive' : inspection.status === 'Passed' ? 'default' : 'secondary'}
                >
                  {inspection.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
