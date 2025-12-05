import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowRight, CalendarClock, DollarSign } from "lucide-react";

const PREDICTIONS = [
  { id: 1, item: 'Water Heater', replaceDate: '2024-03', cost: 1200, confidence: 85 },
  { id: 2, item: 'HVAC Filter', replaceDate: '2023-12', cost: 25, confidence: 98 },
  { id: 3, item: 'Dishwasher', replaceDate: '2024-08', cost: 650, confidence: 60 },
];

export function PredictiveReplacement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-blue-500" />
          Predictive Replacement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {PREDICTIONS.map((pred) => (
            <div key={pred.id} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div>
                <div className="font-medium">{pred.item}</div>
                <div className="text-sm text-muted-foreground">Est. Replacement: {pred.replaceDate}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 font-medium text-slate-700">
                  <DollarSign className="h-3 w-3" /> {pred.cost}
                </div>
                <div className="text-xs text-muted-foreground">{pred.confidence}% Confidence</div>
              </div>
            </div>
          ))}
          <Button className="w-full mt-2" variant="outline">
            Schedule Preventive Service <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
