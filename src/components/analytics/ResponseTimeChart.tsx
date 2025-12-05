import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ResponseTimeData {
  priority: string;
  responseTime: number; // hours
  resolutionTime: number; // hours
}

interface ResponseTimeChartProps {
  data: ResponseTimeData[];
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  return (
    <Card className="col-span-4 lg:col-span-3">
      <CardHeader>
        <CardTitle>Response vs Resolution Time (Hours)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis type="number" className="text-xs text-muted-foreground" />
            <YAxis 
              dataKey="priority" 
              type="category" 
              className="text-xs font-medium capitalize" 
              width={80}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-default)' }}
              cursor={{ fill: 'var(--bg-muted)' }}
            />
            <Legend />
            <Bar dataKey="responseTime" name="Response Time" fill="var(--action-secondary)" radius={[0, 4, 4, 0]} barSize={20} />
            <Bar dataKey="resolutionTime" name="Resolution Time" fill="var(--action-primary)" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
