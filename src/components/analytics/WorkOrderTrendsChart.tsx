import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface WorkOrderTrendsChartProps {
  data: any[];
}

export function WorkOrderTrendsChart({ data }: WorkOrderTrendsChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Work Order Trends</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <Tabs defaultValue="volume" className="space-y-4">
          <TabsList>
            <TabsTrigger value="volume">Volume Over Time</TabsTrigger>
            <TabsTrigger value="priority">By Priority</TabsTrigger>
          </TabsList>
          
          <TabsContent value="volume" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs text-muted-foreground" 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  className="text-xs text-muted-foreground" 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke="var(--action-primary)" 
                  strokeWidth={2} 
                  activeDot={{ r: 4 }} 
                  name="Created"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="var(--status-success-icon)" 
                  strokeWidth={2} 
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="priority" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  className="text-xs text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-default)' }}
                />
                <Legend />
                <Bar dataKey="emergency" stackId="a" fill="var(--status-critical-icon)" name="Emergency" radius={[0, 0, 4, 4]} />
                <Bar dataKey="high" stackId="a" fill="var(--status-warning-icon)" name="High" />
                <Bar dataKey="normal" stackId="a" fill="var(--action-primary)" name="Normal" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
