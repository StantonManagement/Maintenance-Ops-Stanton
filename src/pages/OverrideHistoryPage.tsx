import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Download, Filter, History } from 'lucide-react';

interface OverrideLog {
  id: string;
  timestamp: string;
  technicianName: string;
  workOrderTitle: string;
  overriddenBy: string;
  reason: string;
  notes?: string;
}

const MOCK_LOGS: OverrideLog[] = [
  {
    id: '1',
    timestamp: '2023-12-04T14:30:00',
    technicianName: 'Ramon M.',
    workOrderTitle: 'Emergency Pipe Burst',
    overriddenBy: 'Kristine Chen',
    reason: 'emergency',
    notes: 'Water actively flooding unit 204'
  },
  {
    id: '2',
    timestamp: '2023-12-03T09:15:00',
    technicianName: 'Sarah L.',
    workOrderTitle: 'HVAC Failure - Unit 501',
    overriddenBy: 'Marcus Johnson',
    reason: 'specialist',
    notes: 'Sarah is the only certified HVAC tech available today'
  },
  {
    id: '3',
    timestamp: '2023-12-01T16:45:00',
    technicianName: 'Ramon M.',
    workOrderTitle: 'Key Replacement',
    overriddenBy: 'Kristine Chen',
    reason: 'manager_request',
    notes: 'Prop Mgr requested immediate service'
  }
];

export default function OverrideHistoryPage() {
  const [logs] = useState<OverrideLog[]>(MOCK_LOGS);

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'emergency': return <Badge className="bg-red-100 text-red-800 border-red-200">Emergency</Badge>;
      case 'turnover': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Turnover</Badge>;
      case 'manager_request': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Manager Request</Badge>;
      default: return <Badge variant="secondary" className="capitalize">{reason.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/10 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-6 w-6 text-muted-foreground" />
            Capacity Override Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Audit trail of all work orders assigned to technicians exceeding their daily capacity.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Overrides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="h-12 px-4 font-medium">Date & Time</th>
                  <th className="h-12 px-4 font-medium">Technician</th>
                  <th className="h-12 px-4 font-medium">Work Order</th>
                  <th className="h-12 px-4 font-medium">Reason</th>
                  <th className="h-12 px-4 font-medium">Overridden By</th>
                  <th className="h-12 px-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium">{log.technicianName}</td>
                    <td className="p-4">{log.workOrderTitle}</td>
                    <td className="p-4">{getReasonBadge(log.reason)}</td>
                    <td className="p-4 text-muted-foreground">{log.overriddenBy}</td>
                    <td className="p-4 text-muted-foreground max-w-xs truncate" title={log.notes}>
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
