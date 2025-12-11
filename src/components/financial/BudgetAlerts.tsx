import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { AlertTriangle } from 'lucide-react';
import { getBudgetStatus, BudgetStatus } from '../../services/analyticsService';

export function BudgetAlerts() {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBudgets() {
      const data = await getBudgetStatus();
      setBudgets(data);
      setLoading(false);
    }
    fetchBudgets();
  }, []);

  if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading budgets...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {budgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No budget data available.</p>
          ) : (
            budgets.map((item) => {
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
                    value={Math.min(percent, 100)} 
                    className="h-2" 
                  />
                  {percent >= 90 && (
                    <p className="text-xs text-red-500 font-medium">Critical: Budget nearly exceeded</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
