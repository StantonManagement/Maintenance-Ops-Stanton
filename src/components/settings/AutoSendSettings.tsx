import { useState } from 'react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bell, MessageSquare, Clock, CheckCircle, Truck } from 'lucide-react';

export interface AutoSendConfig {
  globalEnabled: boolean;
  triggers: {
    assignment: boolean;
    enRoute: boolean;
    reminder: boolean;
    completion: boolean;
  };
}

export function AutoSendSettings() {
  const [config, setConfig] = useState<AutoSendConfig>({
    globalEnabled: true,
    triggers: {
      assignment: true,
      enRoute: true,
      reminder: true,
      completion: true,
    }
  });

  const toggleTrigger = (key: keyof AutoSendConfig['triggers']) => {
    setConfig(prev => ({
      ...prev,
      triggers: {
        ...prev.triggers,
        [key]: !prev.triggers[key]
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Automated Communications</h3>
          <p className="text-sm text-muted-foreground">
            Manage automatic messages sent to tenants and technicians.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="global-mode"
            checked={config.globalEnabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, globalEnabled: checked }))}
          />
          <Label htmlFor="global-mode">Global Auto-Send</Label>
        </div>
      </div>

      <div className={`grid gap-4 ${!config.globalEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Notification Triggers</CardTitle>
            </div>
            <CardDescription>Configure which events trigger automatic messages.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-md text-blue-600">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-base">Assignment Notification</Label>
                  <p className="text-sm text-muted-foreground">
                    Sent to tenant when a technician is assigned.
                  </p>
                </div>
              </div>
              <Switch
                checked={config.triggers.assignment}
                onCheckedChange={() => toggleTrigger('assignment')}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-md text-amber-600">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-base">En Route Notification</Label>
                  <p className="text-sm text-muted-foreground">
                    Sent when technician taps "On my way".
                  </p>
                </div>
              </div>
              <Switch
                checked={config.triggers.enRoute}
                onCheckedChange={() => toggleTrigger('enRoute')}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-md text-purple-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-base">Appointment Reminder</Label>
                  <p className="text-sm text-muted-foreground">
                    Sent 24 hours before scheduled time.
                  </p>
                </div>
              </div>
              <Switch
                checked={config.triggers.reminder}
                onCheckedChange={() => toggleTrigger('reminder')}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-md text-green-600">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <Label className="text-base">Completion Notification</Label>
                  <p className="text-sm text-muted-foreground">
                    Sent when work is marked complete.
                  </p>
                </div>
              </div>
              <Switch
                checked={config.triggers.completion}
                onCheckedChange={() => toggleTrigger('completion')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
