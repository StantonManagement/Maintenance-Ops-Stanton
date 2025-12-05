import { useState } from 'react';
import { MetricsCardRow } from '../components/analytics/MetricsCardRow';
import { WorkOrderTrendsChart } from '../components/analytics/WorkOrderTrendsChart';
import { TechnicianLeaderboard } from '../components/analytics/TechnicianLeaderboard';
import { PropertyPerformance } from '../components/analytics/PropertyPerformance';
import { ResponseTimeChart } from '../components/analytics/ResponseTimeChart';
import { ReportExport } from '../components/analytics/ReportExport';
import { Button } from '../components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// Mock Data
const MOCK_METRICS = [
  { label: "Completion Rate", value: "92%", target: "85%", trend: "up", trendValue: "+4%", status: "success" },
  { label: "Avg Response Time", value: "2.4h", target: "4h", trend: "down", trendValue: "-1.2h", status: "success" },
  { label: "Tenant Satisfaction", value: "4.8", target: "4.5", trend: "up", trendValue: "+0.2", status: "success" },
  { label: "Overdue Orders", value: "12", target: "0", trend: "up", trendValue: "+3", status: "warning" },
] as const;

const MOCK_TRENDS = [
  { date: 'Mon', created: 12, completed: 10, emergency: 2, high: 4, normal: 6 },
  { date: 'Tue', created: 15, completed: 13, emergency: 1, high: 5, normal: 9 },
  { date: 'Wed', created: 18, completed: 16, emergency: 3, high: 6, normal: 9 },
  { date: 'Thu', created: 14, completed: 18, emergency: 0, high: 4, normal: 10 },
  { date: 'Fri', created: 20, completed: 15, emergency: 4, high: 8, normal: 8 },
  { date: 'Sat', created: 8, completed: 10, emergency: 1, high: 2, normal: 5 },
  { date: 'Sun', created: 5, completed: 5, emergency: 0, high: 1, normal: 4 },
];

const MOCK_TECH_STATS = [
  { id: '1', name: 'Ramon M.', completed: 45, firstTimeFixRate: 94, avgTime: '1.8h', rating: 4.9 },
  { id: '2', name: 'Sarah L.', completed: 38, firstTimeFixRate: 89, avgTime: '2.1h', rating: 4.8 },
  { id: '3', name: 'Mike T.', completed: 42, firstTimeFixRate: 82, avgTime: '2.5h', rating: 4.6 },
  { id: '4', name: 'Jenny W.', completed: 31, firstTimeFixRate: 96, avgTime: '1.9h', rating: 4.9 },
];

const MOCK_PROPERTY_STATS = [
  { id: '1', name: 'Sunset Heights', workOrders: 145, avgCompletionTime: '2.1h', cost: 12500, trend: 'up' },
  { id: '2', name: 'Highland Park', workOrders: 98, avgCompletionTime: '1.9h', cost: 8400, trend: 'stable' },
  { id: '3', name: 'River Valley', workOrders: 112, avgCompletionTime: '2.8h', cost: 15600, trend: 'down' },
];

const MOCK_RESPONSE_DATA = [
  { priority: 'emergency', responseTime: 0.5, resolutionTime: 2.5 },
  { priority: 'high', responseTime: 2.1, resolutionTime: 8.4 },
  { priority: 'normal', responseTime: 14.5, resolutionTime: 48.2 },
  { priority: 'low', responseTime: 36.2, resolutionTime: 96.5 },
];

export default function AnalyticsPage() {
  const [dateRange] = useState("Last 30 Days");

  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Operational metrics and performance insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange}
          </Button>
          <ReportExport />
        </div>
      </div>

      {/* Metrics Row */}
      <MetricsCardRow metrics={[...MOCK_METRICS] as any} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technicians">Technician Performance</TabsTrigger>
          <TabsTrigger value="properties">Property Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
            <WorkOrderTrendsChart data={MOCK_TRENDS} />
            <ResponseTimeChart data={MOCK_RESPONSE_DATA} />
          </div>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TechnicianLeaderboard data={MOCK_TECH_STATS} />
            <ResponseTimeChart data={MOCK_RESPONSE_DATA} />
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <PropertyPerformance data={[...MOCK_PROPERTY_STATS] as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
