import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Wrench } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface ScheduledAppointment {
  id: string;
  time: string;
  duration: string;
  workOrder: string;
  title: string;
  location: string;
  technician: string;
  priority: "emergency" | "high" | "normal" | "low";
  status: "scheduled" | "in-progress" | "completed";
}

const appointments: ScheduledAppointment[] = [
  {
    id: "1",
    time: "08:00",
    duration: "2h",
    workOrder: "WO-1234",
    title: "Kitchen sink leaking - urgent repair",
    location: "Building A · Unit 205",
    technician: "Mike Rodriguez",
    priority: "emergency",
    status: "scheduled"
  },
  {
    id: "2",
    time: "08:30",
    duration: "1.5h",
    workOrder: "WO-1242",
    title: "HVAC not cooling properly",
    location: "Building B · Unit 312",
    technician: "Sarah Thompson",
    priority: "high",
    status: "scheduled"
  },
  {
    id: "3",
    time: "10:30",
    duration: "3h",
    workOrder: "WO-1256",
    title: "Bathroom tile replacement needed",
    location: "Building A · Unit 101",
    technician: "Mike Rodriguez",
    priority: "normal",
    status: "in-progress"
  },
  {
    id: "4",
    time: "11:00",
    duration: "1h",
    workOrder: "WO-1267",
    title: "Light fixture replacement",
    location: "Building C · Unit 405",
    technician: "David Chen",
    priority: "low",
    status: "scheduled"
  },
  {
    id: "5",
    time: "13:00",
    duration: "2h",
    workOrder: "WO-1278",
    title: "Dishwasher not draining",
    location: "Building B · Unit 201",
    technician: "Sarah Thompson",
    priority: "normal",
    status: "scheduled"
  },
  {
    id: "6",
    time: "14:00",
    duration: "1.5h",
    workOrder: "WO-1289",
    title: "Door lock maintenance",
    location: "Building A · Unit 304",
    technician: "Mike Rodriguez",
    priority: "normal",
    status: "completed"
  },
  {
    id: "7",
    time: "15:30",
    duration: "2h",
    workOrder: "WO-1290",
    title: "Water heater inspection",
    location: "Building C · Unit 102",
    technician: "David Chen",
    priority: "normal",
    status: "scheduled"
  }
];

const technicians = [
  { name: "Mike Rodriguez", color: "#2563EB", appointments: 4 },
  { name: "Sarah Thompson", color: "#8B5CF6", appointments: 2 },
  { name: "David Chen", color: "#059669", appointments: 2 }
];

export function CalendarView() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "emergency": return { bg: 'var(--status-critical-bg)', border: 'var(--status-critical-border)', text: 'var(--status-critical-text)' };
      case "high": return { bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)', text: 'var(--status-warning-text)' };
      case "normal": return { bg: 'var(--action-secondary)', border: 'var(--border-default)', text: 'var(--text-primary)' };
      case "low": return { bg: 'var(--status-neutral-bg)', border: 'var(--status-neutral-border)', text: 'var(--status-neutral-text)' };
      default: return { bg: 'var(--bg-card)', border: 'var(--border-default)', text: 'var(--text-primary)' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return { bg: 'var(--status-success-bg)', text: 'var(--status-success-text)', label: 'Completed' };
      case "in-progress": return { bg: 'var(--action-secondary)', text: 'var(--text-primary)', label: 'In Progress' };
      case "scheduled": return { bg: 'rgba(37, 99, 235, 0.1)', text: 'var(--action-primary)', label: 'Scheduled' };
      default: return { bg: 'var(--bg-card)', text: 'var(--text-primary)', label: status };
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div 
        className="h-16 border-b flex items-center justify-between px-6"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5" style={{ color: 'var(--phase-2-icon)' }} />
          <h1 className="text-[20px]" style={{ color: 'var(--text-primary)' }}>Calendar & Scheduling</h1>
          <Badge
            className="px-2 py-1 text-[11px]"
            style={{
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: 'var(--phase-2-icon)',
              border: '1px solid var(--phase-2-border)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            Phase 2 Preview
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="h-9 px-4 text-[14px] border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            Today
          </Button>
          <div className="flex items-center gap-2 px-3 py-2 border" style={{ borderColor: 'var(--border-default)', borderRadius: 'var(--radius-md)' }}>
            <button className="p-1" style={{ color: 'var(--text-secondary)' }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[14px] min-w-[120px] text-center" style={{ color: 'var(--text-primary)' }}>
              Wed, Oct 8, 2025
            </span>
            <button className="p-1" style={{ color: 'var(--text-secondary)' }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Technician Summary */}
        <div className="w-[280px] border-r p-6 space-y-4 overflow-y-auto" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
          <div>
            <h3 className="text-[14px] mb-3" style={{ color: 'var(--text-secondary)' }}>Today's Schedule</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Total Appointments</span>
                <span className="text-[14px] font-mono" style={{ color: 'var(--text-primary)' }}>8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>In Progress</span>
                <span className="text-[14px] font-mono" style={{ color: 'var(--text-primary)' }}>1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Completed</span>
                <span className="text-[14px] font-mono" style={{ color: 'var(--status-success-text)' }}>1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Remaining</span>
                <span className="text-[14px] font-mono" style={{ color: 'var(--text-primary)' }}>6</span>
              </div>
            </div>
          </div>

          <div className="h-px" style={{ backgroundColor: 'var(--border-default)' }} />

          <div>
            <h3 className="text-[14px] mb-3" style={{ color: 'var(--text-secondary)' }}>Technicians</h3>
            <div className="space-y-3">
              {technicians.map((tech, idx) => (
                <div
                  key={idx}
                  className="p-3 border"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tech.color }}
                    />
                    <span className="text-[13px] flex-1" style={{ color: 'var(--text-primary)' }}>
                      {tech.name}
                    </span>
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {tech.appointments} appointments
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="w-full h-10 text-[14px]"
            style={{
              backgroundColor: 'var(--action-primary)',
              color: 'var(--text-inverted)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            + Schedule New
          </Button>
        </div>

        {/* Main Calendar View */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Time Grid */}
            <div className="space-y-1">
              {Array.from({ length: 12 }, (_, i) => {
                const hour = i + 8; // 8am - 7pm
                const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                const appointmentsInSlot = appointments.filter(apt => apt.time === timeSlot);

                return (
                  <div key={hour} className="flex gap-4">
                    {/* Time Label */}
                    <div className="w-16 text-[12px] pt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {timeSlot}
                    </div>

                    {/* Appointment Area */}
                    <div className="flex-1 min-h-[60px] border-t pt-2" style={{ borderColor: 'var(--border-default)' }}>
                      {appointmentsInSlot.map((apt) => {
                        const colors = getPriorityColor(apt.priority);
                        const status = getStatusBadge(apt.status);
                        const techColor = technicians.find(t => t.name === apt.technician)?.color || '#6B7280';

                        return (
                          <div
                            key={apt.id}
                            className="mb-2 p-3 border-l-[3px] cursor-pointer transition-all hover:shadow-md"
                            style={{
                              backgroundColor: colors.bg,
                              borderLeftColor: techColor,
                              borderTopColor: 'var(--border-default)',
                              borderRightColor: 'var(--border-default)',
                              borderBottomColor: 'var(--border-default)',
                              borderWidth: '1px',
                              borderLeftWidth: '3px',
                              borderRadius: 'var(--radius-md)',
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
                                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                                  {apt.time} · {apt.duration}
                                </span>
                              </div>
                              <Badge
                                className="px-2 py-0.5 text-[11px]"
                                style={{
                                  backgroundColor: status.bg,
                                  color: status.text,
                                  borderRadius: 'var(--radius-sm)',
                                }}
                              >
                                {status.label}
                              </Badge>
                            </div>
                            <div className="mb-1">
                              <span className="text-[13px]" style={{ color: colors.text }}>
                                {apt.workOrder}
                              </span>
                              <span className="text-[13px] mx-1.5" style={{ color: 'var(--text-tertiary)' }}>·</span>
                              <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                                {apt.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{apt.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Wrench className="h-3 w-3" />
                                <span>{apt.technician}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
