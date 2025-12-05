import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { AlertTriangle } from 'lucide-react';

const BUDGETS = [
  { property: 'Sunset Heights', budget: 5000, actual: 4200, warning: false },
  { property: 'Highland Park', budget: 3000, actual: 2950, warning: true },
  { property: 'River Valley', budget: 6000, actual: 3500, warning: false },
];

export function BudgetAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {BUDGETS.map((item) => {
            const percent = (item.actual / item.budget) * 100;
            return (
              <div key={item.property} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.property}</span>
                    {item.warning && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    ${item.actual.toLocaleString()} / ${item.budget.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={percent} 
                  className="h-2" 
                  // Note: 'indicatorClassName' is not standard shadcn/ui prop for color, 
                  // usually handled by passing a class to Progress or customizing the component.
                  // Assuming default Progress implementation for now.
                />
                {percent >= 90 && (
                  <p className="text-xs text-red-500 font-medium">Critical: Budget nearly exceeded</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
