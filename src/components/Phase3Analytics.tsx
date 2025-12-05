import React from "react";
import { TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react";
import { NavigationSidebar } from "./NavigationSidebar";

export function Phase3Analytics() {
  const metrics = [
    {
      title: "First-Time Completion",
      value: "87%",
      target: "85%",
      trend: "+3%",
      trendUp: true,
      color: "var(--status-success-icon)",
    },
    {
      title: "Response Time",
      value: "1.8 hrs",
      target: "< 2 hrs",
      trend: "-0.2h",
      trendUp: true,
      color: "var(--status-success-icon)",
    },
    {
      title: "Tenant Satisfaction",
      value: "4.6/5.0",
      target: "4.4",
      trend: "+0.1",
      trendUp: true,
      color: "var(--status-success-icon)",
    },
    {
      title: "Rework Rate",
      value: "12%",
      target: "< 15%",
      trend: "-2%",
      trendUp: true,
      color: "var(--status-success-icon)",
    },
  ];

  const categoryData = [
    { name: "Plumbing", value: 35, color: "#3B82F6" },
    { name: "Electrical", value: 25, color: "#8B5CF6" },
    { name: "HVAC", value: 20, color: "#10B981" },
    { name: "General", value: 20, color: "#F59E0B" },
  ];

  const techPerformance = [
    { name: "Ramon M.", completion: 94, teamAvg: 87 },
    { name: "Sarah L.", completion: 91, teamAvg: 87 },
    { name: "Mike K.", completion: 88, teamAvg: 87 },
    { name: "Lisa P.", completion: 85, teamAvg: 87 },
    { name: "Dean P.", completion: 82, teamAvg: 87 },
  ];

  return (
    <div className="h-screen flex" style={{ backgroundColor: "var(--bg-primary)" }}>
      <NavigationSidebar />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div
          className="sticky top-0 z-10 h-16 border-b flex items-center justify-between px-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex items-center gap-4">
            <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Advanced Analytics</h2>
            <div
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: "var(--phase-3-overlay)",
                color: "white",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Phase 3
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 rounded border"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-default)",
                fontSize: "14px",
              }}
            >
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Last 12 months</option>
            </select>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {metric.title}
                  </div>
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded"
                    style={{
                      backgroundColor: "var(--status-success-bg)",
                      color: "var(--status-success-text)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {metric.trendUp ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {metric.trend}
                  </div>
                </div>

                <div style={{ fontSize: "32px", fontWeight: 600, marginBottom: "8px" }}>
                  {metric.value}
                </div>

                <div className="flex items-center gap-2">
                  <Target size={14} style={{ color: "var(--text-tertiary)" }} />
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    Target: {metric.target}
                  </span>
                </div>

                {/* Mini sparkline */}
                <div className="mt-4 h-12 flex items-end gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t"
                      style={{
                        height: `${Math.random() * 100}%`,
                        backgroundColor: metric.color,
                        opacity: 0.6,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Work Order Volume Chart */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
                  Work Order Volume
                </h3>
                <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Last 90 days
                </div>
              </div>

              <div className="h-64 flex items-end gap-2">
                {Array.from({ length: 12 }).map((_, i) => {
                  const height = 40 + Math.random() * 60;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${height}%`,
                          backgroundColor: "var(--action-primary)",
                        }}
                      />
                      <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                        W{i + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-default)",
              }}
            >
              <h3 className="mb-6" style={{ fontSize: "16px", fontWeight: 600 }}>
                Category Breakdown
              </h3>

              <div className="flex items-center gap-8">
                {/* Pie Chart Visual */}
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {categoryData.reduce((acc, item, index) => {
                      const prevTotal = categoryData.slice(0, index).reduce((sum, cat) => sum + cat.value, 0);
                      const startAngle = (prevTotal / 100) * 360;
                      const endAngle = startAngle + (item.value / 100) * 360;
                      
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      
                      const x1 = 50 + 40 * Math.cos(startRad);
                      const y1 = 50 + 40 * Math.sin(startRad);
                      const x2 = 50 + 40 * Math.cos(endRad);
                      const y2 = 50 + 40 * Math.sin(endRad);
                      
                      const largeArc = item.value > 50 ? 1 : 0;
                      
                      acc.push(
                        <path
                          key={index}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={item.color}
                          opacity="0.8"
                        />
                      );
                      return acc;
                    }, [] as React.JSX.Element[])}
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                  {categoryData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                          {item.name}
                        </span>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Technician Performance */}
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-default)",
            }}
          >
            <h3 className="mb-6" style={{ fontSize: "16px", fontWeight: 600 }}>
              Technician Performance
            </h3>

            <div className="space-y-4">
              {techPerformance.map((tech, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-32" style={{ fontSize: "14px" }}>
                    {tech.name}
                  </div>
                  <div className="flex-1 h-8 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-hover)" }}>
                    <div
                      className="h-full rounded-full flex items-center justify-end px-3"
                      style={{
                        width: `${tech.completion}%`,
                        backgroundColor: tech.completion >= tech.teamAvg ? "var(--status-success-icon)" : "var(--status-warning-icon)",
                        transition: "width 0.5s ease",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "white" }}>
                        {tech.completion}%
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-24 text-right"
                    style={{
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    Avg: {tech.teamAvg}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Phase 3 Lock Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          backgroundColor: "rgba(107, 114, 128, 0.20)",
          backdropFilter: "blur(3px)",
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              backgroundColor: "white",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <BarChart3 size={48} style={{ color: "var(--phase-3-icon)" }} />
          </div>
          <div
            className="px-6 py-3 rounded-full"
            style={{
              backgroundColor: "var(--phase-3-overlay)",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            🔒 Phase 3 Feature
          </div>
        </div>

        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            border: "4px solid var(--phase-3-border)",
          }}
        />
      </div>
    </div>
  );
}
