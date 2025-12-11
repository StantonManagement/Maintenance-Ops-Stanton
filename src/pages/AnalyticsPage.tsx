import { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { MetricsCardRow } from '../components/analytics/MetricsCardRow';
import { WorkOrderTrendsChart } from '../components/analytics/WorkOrderTrendsChart';
import { TechnicianLeaderboard } from '../components/analytics/TechnicianLeaderboard';
import { PropertyPerformance } from '../components/analytics/PropertyPerformance';
import { ResponseTimeChart } from '../components/analytics/ResponseTimeChart';
import { ReportExport } from '../components/analytics/ReportExport';
import { Button } from '../components/ui/button';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// Kept as mocks for now until hook extends to cover these
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
  const { metrics, trends, technicianStats, propertyStats, loading } = useAnalytics();
  const [dateRange] = useState("Last 30 Days");

  const metricCards = [
    { label: "Completion Rate", value: metrics.completionRate.value, target: "85%", trend: metrics.completionRate.trend, trendValue: metrics.completionRate.trendValue, status: "success" },
    { label: "Avg Response Time", value: metrics.avgResponseTime.value, target: "4h", trend: metrics.avgResponseTime.trend, trendValue: metrics.avgResponseTime.trendValue, status: "success" },
    { label: "Tenant Satisfaction", value: metrics.tenantSatisfaction.value, target: "4.5", trend: metrics.tenantSatisfaction.trend, trendValue: metrics.tenantSatisfaction.trendValue, status: "success" },
    { label: "Overdue Orders", value: metrics.overdueOrders.value, target: "0", trend: metrics.overdueOrders.trend, trendValue: metrics.overdueOrders.trendValue, status: parseInt(metrics.overdueOrders.value) > 0 ? "warning" : "success" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

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
      <MetricsCardRow metrics={metricCards as any} />

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
            <WorkOrderTrendsChart data={trends} />
            <ResponseTimeChart data={MOCK_RESPONSE_DATA} />
          </div>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TechnicianLeaderboard data={technicianStats} />
            <ResponseTimeChart data={MOCK_RESPONSE_DATA} />
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <PropertyPerformance data={propertyStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
