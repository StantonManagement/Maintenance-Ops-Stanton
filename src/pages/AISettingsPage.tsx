import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Button } from '../components/ui/button';
import { Brain, Settings, Activity, RotateCcw } from 'lucide-react';

export default function AISettingsPage() {
  const [autoAssignThreshold, setAutoAssignThreshold] = useState([85]);
  const [reviewThreshold, setReviewThreshold] = useState([60]);
  
  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-8 w-8 text-purple-600" />
          AI Configuration
        </h1>
        <p className="text-muted-foreground">
          Tune the sensitivity and autonomy of AI agents.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Confidence Thresholds
            </CardTitle>
            <CardDescription>Determine when AI takes action vs requests review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Auto-Assign Confidence ({autoAssignThreshold}%)</Label>
                </div>
                <Slider 
                  value={autoAssignThreshold} 
                  onValueChange={setAutoAssignThreshold} 
                  max={100} 
                  step={1} 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Scores above this will automatically assign technicians without human review.
                </p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Suggestion Queue ({reviewThreshold}%)</Label>
                </div>
                <Slider 
                  value={reviewThreshold} 
                  onValueChange={setReviewThreshold} 
                  max={100} 
                  step={1} 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Scores above this (but below auto-assign) will appear as suggestions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Feature Toggles
            </CardTitle>
            <CardDescription>Enable or disable specific AI capabilities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Smart Classification</Label>
                <p className="text-xs text-muted-foreground">Auto-tag priority and category</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Technician Ranking</Label>
                <p className="text-xs text-muted-foreground">Suggest best tech for the job</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Photo Analysis</Label>
                <p className="text-xs text-muted-foreground">Scan completion photos for issues</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Predictive Alerts</Label>
                <p className="text-xs text-muted-foreground">Forecast equipment failures</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">94%</div>
              <div className="text-xs text-muted-foreground">Classification Accuracy</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">12%</div>
              <div className="text-xs text-muted-foreground">Override Rate</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">1.2s</div>
              <div className="text-xs text-muted-foreground">Avg Latency</div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Retrain Model
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
