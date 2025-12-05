import { TrendingUp, Clock, DollarSign, CheckCircle2, AlertCircle, Calendar, Building2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Mock data for charts
const completionTrendData = [
  { month: "Apr", completed: 145, average: 138 },
  { month: "May", completed: 162, average: 145 },
  { month: "Jun", completed: 178, average: 152 },
  { month: "Jul", completed: 189, average: 161 },
  { month: "Aug", completed: 201, average: 168 },
  { month: "Sep", completed: 195, average: 175 },
  { month: "Oct", completed: 208, average: 180 },
];

const categoryBreakdownData = [
  { name: "Plumbing", value: 156, color: "#2563EB" },
  { name: "HVAC", value: 98, color: "#8B5CF6" },
  { name: "Electrical", value: 87, color: "#059669" },
  { name: "Appliances", value: 72, color: "#F59E0B" },
  { name: "Carpentry", value: 54, color: "#EF4444" },
  { name: "Other", value: 43, color: "#6B7280" },
];

const responseTimeData = [
  { priority: "Emergency", avgHours: 0.8, target: 1.0 },
  { priority: "High", avgHours: 4.2, target: 4.0 },
  { priority: "Normal", avgHours: 18.5, target: 24.0 },
  { priority: "Low", avgHours: 42.3, target: 48.0 },
];

const propertyPerformanceData = [
  { property: "Building A", tickets: 142, avgTime: 12.3, satisfaction: 4.7 },
  { property: "Building B", tickets: 98, avgTime: 14.8, satisfaction: 4.5 },
  { property: "Building C", tickets: 87, avgTime: 11.2, satisfaction: 4.8 },
  { property: "Building D", tickets: 76, avgTime: 15.6, satisfaction: 4.3 },
  { property: "Building E", tickets: 107, avgTime: 13.1, satisfaction: 4.6 },
];

export function AnalyticsView() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div 
        className="h-16 border-b flex items-center justify-between px-6"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex items-center gap-4">
          <TrendingUp className="h-5 w-5" style={{ color: 'var(--phase-3-icon)' }} />
          <h1 className="text-[20px]" style={{ color: 'var(--text-primary)' }}>Analytics & Insights</h1>
          <Badge
            className="px-2 py-1 text-[11px]"
            style={{
              backgroundColor: 'rgba(107, 114, 128, 0.15)',
              color: 'var(--phase-3-icon)',
              border: '1px solid var(--phase-3-border)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            Phase 3 Preview
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 px-3 text-[14px] border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
            <option>Last 12 Months</option>
          </select>
          <button
            className="h-9 px-4 text-[14px] border"
            style={{
              backgroundColor: 'var(--action-primary)',
              color: 'var(--text-inverted)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-6">
            {/* Avg Response Time */}
            <Card
              className="p-5 border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="h-10 w-10 flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <Clock className="h-5 w-5" style={{ color: 'var(--action-primary)' }} />
                </div>
                <div className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--status-success-text)' }}>
                  <ArrowDownRight className="h-3 w-3" />
                  <span>12%</span>
                </div>
              </div>
              <div className="text-[28px] mb-1" style={{ color: 'var(--text-primary)' }}>
                8.2h
              </div>
              <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Avg Response Time
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  Target: 12h · <span style={{ color: 'var(--status-success-text)' }}>Exceeding</span>
                </div>
              </div>
            </Card>

            {/* Resolution Rate */}
            <Card
              className="p-5 border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="h-10 w-10 flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--status-success-bg)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--status-success-icon)' }} />
                </div>
                <div className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--status-success-text)' }}>
                  <ArrowUpRight className="h-3 w-3" />
                  <span>5%</span>
                </div>
              </div>
              <div className="text-[28px] mb-1" style={{ color: 'var(--text-primary)' }}>
                94.3%
              </div>
              <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Resolution Rate
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  510 of 541 work orders completed
                </div>
              </div>
            </Card>

            {/* Total Cost */}
            <Card
              className="p-5 border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="h-10 w-10 flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <DollarSign className="h-5 w-5" style={{ color: 'var(--status-warning-icon)' }} />
                </div>
                <div className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--status-warning-text)' }}>
                  <ArrowUpRight className="h-3 w-3" />
                  <span>8%</span>
                </div>
              </div>
              <div className="text-[28px] mb-1" style={{ color: 'var(--text-primary)' }}>
                $42.3K
              </div>
              <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Total Maintenance Cost
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  $78.23 per work order average
                </div>
              </div>
            </Card>

            {/* Open Tickets */}
            <Card
              className="p-5 border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="h-10 w-10 flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <AlertCircle className="h-5 w-5" style={{ color: 'var(--status-critical-icon)' }} />
                </div>
                <div className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--status-success-text)' }}>
                  <ArrowDownRight className="h-3 w-3" />
                  <span>15%</span>
                </div>
              </div>
              <div className="text-[28px] mb-1" style={{ color: 'var(--text-primary)' }}>
                31
              </div>
              <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Currently Open
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                  3 emergency · 8 high priority
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-3 gap-6">
            {/* Completion Trend */}
            <Card
              className="col-span-2 p-5 border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h3 className="text-[16px] mb-4" style={{ color: 'var(--text-primary)' }}>
                Completion Trend
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={completionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#2563EB" 
                    strokeWidth={2}
                    name="Completed"
                    dot={{ fill: '#2563EB', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="#9CA3AF" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Industry Avg"
                    dot={{ fill: '#9CA3AF', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Category Breakdown */}
            <Card
              className="p-5 border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h3 className="text-[16px] mb-4" style={{ color: 'var(--text-primary)' }}>
                Work Order Categories
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {categoryBreakdownData.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                    </div>
                    <span style={{ color: 'var(--text-primary)' }}>{cat.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-2 gap-6">
            {/* Response Time by Priority */}
            <Card
              className="p-5 border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h3 className="text-[16px] mb-4" style={{ color: 'var(--text-primary)' }}>
                Response Time by Priority
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={responseTimeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    label={{ value: 'Hours', position: 'insideBottom', offset: -5, fontSize: 12 }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="priority"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="avgHours" fill="#2563EB" name="Actual Avg" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="target" fill="#D1D5DB" name="Target" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Property Performance */}
            <Card
              className="p-5 border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h3 className="text-[16px] mb-4" style={{ color: 'var(--text-primary)' }}>
                Property Performance
              </h3>
              <div className="space-y-3">
                {propertyPerformanceData.map((prop, idx) => (
                  <div
                    key={idx}
                    className="p-3 border"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                        <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
                          {prop.property}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[13px]" style={{ color: 'var(--status-warning-icon)' }}>
                          ★
                        </span>
                        <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                          {prop.satisfaction}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      <span>{prop.tickets} tickets</span>
                      <span>Avg: {prop.avgTime}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Bottom Stats */}
          <Card
            className="p-5 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <h3 className="text-[16px] mb-4" style={{ color: 'var(--text-primary)' }}>
              Quick Stats
            </h3>
            <div className="grid grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-[24px] mb-1" style={{ color: 'var(--text-primary)' }}>
                  541
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  Total Work Orders
                </div>
              </div>
              <div className="text-center">
                <div className="text-[24px] mb-1" style={{ color: 'var(--status-success-text)' }}>
                  510
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  Completed
                </div>
              </div>
              <div className="text-center">
                <div className="text-[24px] mb-1" style={{ color: 'var(--action-primary)' }}>
                  18
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  In Progress
                </div>
              </div>
              <div className="text-center">
                <div className="text-[24px] mb-1" style={{ color: 'var(--status-warning-text)' }}>
                  13
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  Awaiting Approval
                </div>
              </div>
              <div className="text-center">
                <div className="text-[24px] mb-1" style={{ color: 'var(--text-primary)' }}>
                  4.6
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  Avg Satisfaction
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
