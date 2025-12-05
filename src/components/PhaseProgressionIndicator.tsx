import { Check, Lock } from "lucide-react";

export function PhaseProgressionIndicator() {
  const phases = [
    {
      phase: 1,
      label: "ACTIVE",
      color: "var(--phase-1-active)",
      bgColor: "var(--phase-1-bg)",
      features: [
        { name: "Communication Hub", completed: true },
        { name: "Work Order Management", completed: true },
        { name: "Voice Creation", completed: true },
        { name: "Photo Documentation", completed: true },
        { name: "Approval Queue", completed: true },
        { name: "SMS Integration", completed: true },
      ],
    },
    {
      phase: 2,
      label: "NEXT",
      color: "var(--phase-2-overlay)",
      bgColor: "#F3E8FF",
      features: [
        { name: "Drag-Drop Assignment", completed: false },
        { name: "Calendar Scheduling", completed: false },
        { name: "Real-time Tracking", completed: false },
        { name: "AI Photo Analysis", completed: false },
        { name: "Automated Communication", completed: false },
        { name: "Workload Protection", completed: false },
      ],
    },
    {
      phase: 3,
      label: "FUTURE",
      color: "var(--phase-3-overlay)",
      bgColor: "#F3F4F6",
      features: [
        { name: "Advanced Analytics", completed: false },
        { name: "Financial Intelligence", completed: false },
        { name: "Unit/Tenant Profiles", completed: false },
        { name: "Predictive Maintenance", completed: false },
        { name: "Portfolio Scaling", completed: false },
        { name: "Pattern Recognition", completed: false },
      ],
    },
  ];

  return (
    <div className="p-8" style={{ backgroundColor: "var(--bg-card)" }}>
      {/* Timeline */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center gap-16">
          {phases.map((phase, index) => (
            <div key={phase.phase} className="flex items-center">
              {/* Phase Circle */}
              <div className="flex flex-col items-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center relative"
                  style={{
                    backgroundColor: phase.phase === 1 ? phase.color : phase.bgColor,
                    border: `3px solid ${phase.color}`,
                  }}
                >
                  {phase.phase === 1 ? (
                    <Check size={32} style={{ color: "white" }} />
                  ) : (
                    <Lock
                      size={32}
                      style={{
                        color: phase.color,
                        opacity: phase.phase === 2 ? 0.8 : 0.6,
                      }}
                    />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 600,
                      color: phase.color,
                    }}
                  >
                    Phase {phase.phase}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {phase.label}
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              {index < phases.length - 1 && (
                <div
                  className="h-1 mx-4"
                  style={{
                    width: "120px",
                    backgroundColor:
                      phase.phase === 1
                        ? phase.color
                        : "var(--border-default)",
                    opacity: phase.phase === 1 ? 1 : 0.3,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-3 gap-8 max-w-7xl mx-auto">
        {phases.map((phase) => (
          <div
            key={phase.phase}
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: phase.bgColor,
              borderColor: phase.color,
              borderWidth: "2px",
            }}
          >
            <div
              className="mb-4 pb-4 border-b"
              style={{ borderColor: phase.color }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: phase.color,
                }}
              >
                Phase {phase.phase} Features
              </div>
            </div>
            <div className="space-y-3">
              {phase.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  {feature.completed ? (
                    <Check
                      size={20}
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: phase.color }}
                    />
                  ) : (
                    <Lock
                      size={20}
                      className="mt-0.5 flex-shrink-0"
                      style={{
                        color: phase.color,
                        opacity: phase.phase === 2 ? 0.7 : 0.5,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "14px",
                      color: feature.completed
                        ? "var(--text-primary)"
                        : "var(--text-secondary)",
                      opacity: feature.completed ? 1 : 0.8,
                    }}
                  >
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
