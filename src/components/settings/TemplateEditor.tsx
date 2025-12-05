import { useState } from 'react';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type TriggerType = 'assignment' | 'enRoute' | 'reminder' | 'completion';

const DEFAULT_TEMPLATES: Record<TriggerType, string> = {
  assignment: "Hi {{tenant_name}}, a technician has been assigned to your request '{{work_order_title}}'. {{technician_name}} will be in touch shortly.",
  enRoute: "Hi {{tenant_name}}, {{technician_name}} is on the way to {{property_address}} for your maintenance request.",
  reminder: "Reminder: You have a maintenance appointment scheduled for {{scheduled_date}}. Please reply to confirm.",
  completion: "Good news! The work for '{{work_order_title}}' has been marked as complete. Please let us know if you have any questions."
};

export function TemplateEditor() {
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType>('assignment');
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [previewData] = useState({
    tenant_name: "Maria Lopez",
    technician_name: "Ramon M.",
    work_order_title: "Leaking Sink",
    property_address: "Building A, Unit 205",
    scheduled_date: "tomorrow at 2:00 PM"
  });

  const handleTemplateChange = (value: string) => {
    setTemplates(prev => ({
      ...prev,
      [selectedTrigger]: value
    }));
  };

  const handleSave = () => {
    // In a real app, save to Supabase here
    toast.success('Template saved successfully');
  };

  const handleReset = () => {
    setTemplates(prev => ({
      ...prev,
      [selectedTrigger]: DEFAULT_TEMPLATES[selectedTrigger]
    }));
    toast.info('Template reset to default');
  };

  const getPreviewText = () => {
    let text = templates[selectedTrigger];
    Object.entries(previewData).forEach(([key, value]) => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return text;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Message Templates</h3>
          <p className="text-sm text-muted-foreground">
            Customize the messages sent for each trigger event.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>
              Select a trigger and edit the message template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Trigger Event</Label>
              <Select 
                value={selectedTrigger} 
                onValueChange={(v) => setSelectedTrigger(v as TriggerType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Assignment Notification</SelectItem>
                  <SelectItem value="enRoute">En Route Notification</SelectItem>
                  <SelectItem value="reminder">Appointment Reminder</SelectItem>
                  <SelectItem value="completion">Completion Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message Body</Label>
              <Textarea
                value={templates[selectedTrigger]}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Variables: {'{{tenant_name}}'}, {'{{technician_name}}'}, {'{{work_order_title}}'}, {'{{property_address}}'}, {'{{scheduled_date}}'}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 gap-2">
                <Save className="h-4 w-4" />
                Save Template
              </Button>
              <Button variant="outline" onClick={handleReset} size="icon" title="Reset to default">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              See how the message looks with sample data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg border space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Sample Data:</span>
                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                  {Object.entries(previewData).map(([k, v]) => (
                    <div key={k}><span className="opacity-70">{k}:</span> {v}</div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="bg-white p-3 rounded border shadow-sm relative">
                  <div className="absolute -left-2 top-3 w-2 h-2 bg-white border-l border-b transform rotate-45"></div>
                  <p className="text-sm text-primary">{getPreviewText()}</p>
                </div>
                <p className="text-xs text-right text-muted-foreground mt-1">Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
