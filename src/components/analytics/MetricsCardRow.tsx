import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  target: string | number;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  status: 'success' | 'warning' | 'critical';
}

interface MetricsCardRowProps {
  metrics: Metric[];
}

export function MetricsCardRow({ metrics }: MetricsCardRowProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, idx) => (
        <Card key={idx}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.label}
            </CardTitle>
            {metric.trend === 'up' ? (
              <ArrowUp className={`h-4 w-4 ${metric.status === 'success' ? 'text-green-500' : 'text-red-500'}`} />
            ) : metric.trend === 'down' ? (
              <ArrowDown className={`h-4 w-4 ${metric.status === 'success' ? 'text-green-500' : 'text-red-500'}`} />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className={metric.status === 'success' ? 'text-green-600' : metric.status === 'critical' ? 'text-red-600' : 'text-muted-foreground'}>
                {metric.trendValue}
              </span>{' '}
              vs target {metric.target}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
