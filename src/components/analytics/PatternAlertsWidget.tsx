import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatternAlert } from '@/hooks/usePatternDetection';
import { AlertTriangle, Info, AlertOctagon, Check, X } from 'lucide-react';

interface PatternAlertsWidgetProps {
  alerts: PatternAlert[];
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  onScan?: () => void;
  scanning?: boolean;
}

export function PatternAlertsWidget({ alerts, onAcknowledge, onDismiss, onScan, scanning }: PatternAlertsWidgetProps) {
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          Pattern Alerts
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2 rounded-full w-6 h-6 p-0 flex items-center justify-center">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
        {onScan && (
          <Button variant="outline" size="sm" onClick={onScan} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Run Scan'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>No active pattern alerts.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="border rounded-md p-3 bg-card shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <Badge variant="outline" className="text-xs capitalize">{alert.pattern_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  
                  {alert.affected_units && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {alert.affected_units.map(u => (
                        <span key={u} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Unit {u}</span>
                      ))}
                    </div>
                  )}

                  <div className="bg-muted/30 p-2 rounded mt-2 text-sm border-l-2 border-primary">
                    <span className="font-medium text-xs uppercase text-muted-foreground block mb-0.5">Recommended Action</span>
                    {alert.recommended_action}
                  </div>

                  <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onDismiss(alert.id)}>
                      <X className="w-3 h-3 mr-1" /> Dismiss
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onAcknowledge(alert.id)}>
                      <Check className="w-3 h-3 mr-1" /> Acknowledge
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
