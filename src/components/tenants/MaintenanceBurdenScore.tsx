import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface ScoreProps {
  score: 'Low' | 'Medium' | 'High';
  trend: 'up' | 'down' | 'stable';
  requestCount: number;
  avgCost: number;
}

export function MaintenanceBurdenScore({ score, trend, requestCount, avgCost }: ScoreProps) {
  const getColor = (s: string) => {
    if (s === 'High') return 'text-red-600 bg-red-100 border-red-200';
    if (s === 'Medium') return 'text-amber-600 bg-amber-100 border-amber-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Maintenance Burden Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className={`text-lg px-3 py-1 ${getColor(score)}`}>
            {score} Burden
          </Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            {trend === 'up' ? <TrendingUp className="h-4 w-4 text-red-500 mr-1" /> : <TrendingDown className="h-4 w-4 text-green-500 mr-1" />}
            <span>vs last year</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Requests/Year</div>
            <div className="font-semibold text-lg">{requestCount}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Avg Cost/WO</div>
            <div className="font-semibold text-lg">${avgCost}</div>
          </div>
        </div>

        {score === 'High' && (
          <div className="mt-4 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>High frequency of tenant-responsible damage reported.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
