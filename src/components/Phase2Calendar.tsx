import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { NavigationSidebar } from "./NavigationSidebar";

export function Phase2Calendar() {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM - 6 PM
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  const technicians = [
    { name: "Ramon M.", color: "#3B82F6" },
    { name: "Sarah L.", color: "#8B5CF6" },
    { name: "Mike K.", color: "#10B981" },
  ];

  const appointments = [
    { day: 1, hour: 9, duration: 2, tech: 0, title: "WO-1234 Kitchen Leak", location: "Building A · 205" },
    { day: 1, hour: 13, duration: 1.5, tech: 0, title: "WO-1235 HVAC Issue", location: "Building B · 101" },
    { day: 2, hour: 10, duration: 3, tech: 1, title: "WO-1236 Electrical", location: "Building C · 304" },
    { day: 2, hour: 14, duration: 2, tech: 2, title: "WO-1237 Plumbing", location: "Building A · 102" },
    { day: 3, hour: 9, duration: 1, tech: 1, title: "WO-1238 Door Repair", location: "Building D · 201" },
    { day: 3, hour: 11, duration: 2, tech: 0, title: "WO-1239 Window", location: "Building B · 305" },
    { day: 4, hour: 10, duration: 2.5, tech: 2, title: "WO-1240 Appliance", location: "Building C · 102" },
  ];

  return (
    <div className="h-screen flex" style={{ backgroundColor: "var(--bg-primary)" }}>
      <NavigationSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="h-16 border-b flex items-center justify-between px-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex items-center gap-4">
            <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Calendar Scheduling</h2>
            <div
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: "var(--phase-2-border)",
                color: "white",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Phase 2
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {technicians.map((tech, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: tech.color,
                    backgroundColor: `${tech.color}15`,
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tech.color }}
                  />
                  <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                    {tech.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div
          className="h-14 border-b flex items-center justify-between px-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded hover:bg-gray-100"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronLeft size={20} />
            </button>
            <span style={{ fontSize: "16px", fontWeight: 600 }}>
              Oct 14-20, 2025
            </span>
            <button
              className="p-2 rounded hover:bg-gray-100"
              style={{ color: "var(--text-secondary)" }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button
            className="px-4 py-2 rounded border"
            style={{
              backgroundColor: "var(--action-primary)",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              borderColor: "var(--action-primary)",
            }}
          >
            Today
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-default)",
            }}
          >
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b" style={{ borderColor: "var(--border-default)" }}>
              <div className="p-3" style={{ width: "80px" }} />
              {days.map((day, index) => (
                <div
                  key={index}
                  className="p-3 text-center border-l"
                  style={{
                    borderColor: "var(--border-default)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {day}
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                    Oct {14 + index}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="relative">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-8 border-b"
                  style={{
                    borderColor: "var(--border-default)",
                    height: "80px",
                  }}
                >
                  <div
                    className="p-3 flex items-start justify-end"
                    style={{
                      width: "80px",
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </div>
                  {days.map((_, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="border-l"
                      style={{
                        borderColor: "var(--border-default)",
                        backgroundColor: "var(--bg-primary)",
                      }}
                    />
                  ))}
                </div>
              ))}

              {/* Appointment Blocks */}
              {appointments.map((apt, index) => {
                const tech = technicians[apt.tech];
                return (
                  <div
                    key={index}
                    className="absolute rounded border-l-4 p-2"
                    style={{
                      left: `calc(80px + ${apt.day * (100 / 7)}%)`,
                      top: `${(apt.hour - 8) * 80}px`,
                      width: `calc(${100 / 7}% - 8px)`,
                      height: `${apt.duration * 80 - 4}px`,
                      backgroundColor: `${tech.color}15`,
                      borderColor: tech.color,
                      borderWidth: "1px",
                      borderLeftWidth: "4px",
                      cursor: "grab",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {apt.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {apt.location}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tech.color }}
                      >
                        <span style={{ fontSize: "8px", color: "white", fontWeight: 600 }}>
                          {tech.name.split(" ")[0][0]}
                        </span>
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                        {apt.duration}h
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Current Time Indicator */}
              <div
                className="absolute left-0 right-0"
                style={{
                  top: `${(11 - 8) * 80 + 40}px`, // 11:30 AM
                  height: "2px",
                  backgroundColor: "var(--status-critical-icon)",
                  zIndex: 10,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full absolute -left-1.5 -top-1.5"
                  style={{ backgroundColor: "var(--status-critical-icon)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2 Lock Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          backgroundColor: "rgba(168, 85, 247, 0.10)",
          backdropFilter: "blur(2px)",
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
            <CalendarIcon size={48} style={{ color: "var(--phase-2-icon)" }} />
          </div>
          <div
            className="px-6 py-3 rounded-full"
            style={{
              backgroundColor: "var(--phase-2-border)",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            🔒 Phase 2 Feature
          </div>
        </div>

        {/* Border Frame */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            border: "4px solid var(--phase-2-border)",
          }}
        />
      </div>
    </div>
  );
}
