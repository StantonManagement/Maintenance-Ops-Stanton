import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AlertOctagon, ArrowRight, Zap } from "lucide-react";

const PREDICTIONS = [
  {
    id: 1,
    title: "Potential Roof Leak - Building A",
    reason: "3 ceiling leak reports in past 60 days on top floor units.",
    urgency: "high",
    action: "Schedule Roof Inspection"
  },
  {
    id: 2,
    title: "Water Heater End-of-Life - Unit 205",
    reason: "Unit is 11 years old (Avg lifespan 10 years). Efficiency dropping.",
    urgency: "medium",
    action: "Plan Replacement"
  }
];

export function PredictiveMaintenanceAlerts() {
  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Zap className="h-5 w-5" />
          Predictive Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {PREDICTIONS.map((pred) => (
            <div key={pred.id} className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-purple-900">{pred.title}</h4>
                <Badge variant={pred.urgency === 'high' ? 'destructive' : 'secondary'}>
                  {pred.urgency.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3 flex gap-2">
                <AlertOctagon className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                {pred.reason}
              </p>
              <Button size="sm" variant="outline" className="w-full text-purple-700 border-purple-200 hover:bg-purple-50">
                {pred.action} <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
