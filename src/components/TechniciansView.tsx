import { Users, Star, MapPin, Phone, Mail, Award } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Technician {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: "available" | "on-job" | "off-duty";
  rating: number;
  completedJobs: number;
  phone: string;
  email: string;
  currentLocation?: string;
  skills: string[];
  certifications: string[];
  todayStats: {
    scheduled: number;
    completed: number;
    inProgress: number;
  };
}

const technicians: Technician[] = [
  {
    id: "1",
    name: "Mike Rodriguez",
    initials: "MR",
    role: "Senior Maintenance Technician",
    status: "on-job",
    rating: 4.8,
    completedJobs: 342,
    phone: "(555) 123-4567",
    email: "mike.r@maintenanceops.com",
    currentLocation: "Building A · Unit 205",
    skills: ["Plumbing", "HVAC", "Electrical", "Carpentry"],
    certifications: ["EPA 608", "Master Plumber"],
    todayStats: {
      scheduled: 4,
      completed: 1,
      inProgress: 1
    }
  },
  {
    id: "2",
    name: "Sarah Thompson",
    initials: "ST",
    role: "HVAC Specialist",
    status: "available",
    rating: 4.9,
    completedJobs: 289,
    phone: "(555) 234-5678",
    email: "sarah.t@maintenanceops.com",
    skills: ["HVAC", "Refrigeration", "Electrical"],
    certifications: ["EPA 608", "HVAC Excellence"],
    todayStats: {
      scheduled: 2,
      completed: 0,
      inProgress: 0
    }
  },
  {
    id: "3",
    name: "David Chen",
    initials: "DC",
    role: "Maintenance Technician",
    status: "available",
    rating: 4.7,
    completedJobs: 198,
    phone: "(555) 345-6789",
    email: "david.c@maintenanceops.com",
    skills: ["General Maintenance", "Electrical", "Appliances"],
    certifications: ["Licensed Electrician"],
    todayStats: {
      scheduled: 2,
      completed: 0,
      inProgress: 0
    }
  },
  {
    id: "4",
    name: "Jennifer Martinez",
    initials: "JM",
    role: "Plumbing Specialist",
    status: "on-job",
    rating: 4.8,
    completedJobs: 256,
    phone: "(555) 456-7890",
    email: "jennifer.m@maintenanceops.com",
    currentLocation: "Building C · Unit 102",
    skills: ["Plumbing", "Water Systems", "Gas Lines"],
    certifications: ["Master Plumber", "Gas Fitting"],
    todayStats: {
      scheduled: 3,
      completed: 2,
      inProgress: 1
    }
  },
  {
    id: "5",
    name: "Robert Kim",
    initials: "RK",
    role: "Maintenance Technician",
    status: "off-duty",
    rating: 4.6,
    completedJobs: 176,
    phone: "(555) 567-8901",
    email: "robert.k@maintenanceops.com",
    skills: ["Carpentry", "Drywall", "Painting", "General"],
    certifications: ["Carpentry License"],
    todayStats: {
      scheduled: 0,
      completed: 0,
      inProgress: 0
    }
  }
];

export function TechniciansView() {
  const navigate = useNavigate();
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return {
          bg: 'var(--status-success-bg)',
          text: 'var(--status-success-text)',
          label: 'Available',
          icon: '🟢'
        };
      case "on-job":
        return {
          bg: 'rgba(37, 99, 235, 0.1)',
          text: 'var(--action-primary)',
          label: 'On Job',
          icon: '🔵'
        };
      case "off-duty":
        return {
          bg: 'var(--status-neutral-bg)',
          text: 'var(--status-neutral-text)',
          label: 'Off Duty',
          icon: '⚪'
        };
      default:
        return {
          bg: 'var(--bg-card)',
          text: 'var(--text-primary)',
          label: status,
          icon: '⚪'
        };
    }
  };

  const availableCount = technicians.filter(t => t.status === "available").length;
  const onJobCount = technicians.filter(t => t.status === "on-job").length;
  const totalScheduled = technicians.reduce((sum, t) => sum + t.todayStats.scheduled, 0);
  const totalCompleted = technicians.reduce((sum, t) => sum + t.todayStats.completed, 0);

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
          <Users className="h-5 w-5" style={{ color: 'var(--phase-2-icon)' }} />
          <h1 className="text-[20px]" style={{ color: 'var(--text-primary)' }}>Team Management</h1>
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
        <Button
          className="h-9 px-4 text-[14px]"
          style={{
            backgroundColor: 'var(--action-primary)',
            color: 'var(--text-inverted)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          + Add Technician
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Team Overview */}
        <div className="w-[280px] border-r p-6 space-y-6 overflow-y-auto" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
          <div>
            <h3 className="text-[14px] mb-3" style={{ color: 'var(--text-secondary)' }}>Team Overview</h3>
            <div className="space-y-3">
              <div
                className="p-3 border"
                style={{
                  backgroundColor: 'var(--status-success-bg)',
                  borderColor: 'var(--status-success-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="text-[24px] mb-1" style={{ color: 'var(--status-success-text)' }}>
                  {availableCount}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--status-success-text)' }}>
                  Available Now
                </div>
              </div>
              <div
                className="p-3 border"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  borderColor: 'var(--action-primary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="text-[24px] mb-1" style={{ color: 'var(--action-primary)' }}>
                  {onJobCount}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--action-primary)' }}>
                  Currently on Jobs
                </div>
              </div>
            </div>
          </div>

          <div className="h-px" style={{ backgroundColor: 'var(--border-default)' }} />

          <div>
            <h3 className="text-[14px] mb-3" style={{ color: 'var(--text-secondary)' }}>Today's Stats</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Scheduled</span>
                <span className="text-[14px] font-mono" style={{ color: 'var(--text-primary)' }}>{totalScheduled}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Completed</span>
                <span className="text-[14px] font-mono" style={{ color: 'var(--status-success-text)' }}>{totalCompleted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Avg Rating</span>
                <span className="text-[14px] font-mono" style={{ color: 'var(--text-primary)' }}>4.76</span>
              </div>
            </div>
          </div>

          <div className="h-px" style={{ backgroundColor: 'var(--border-default)' }} />

          <div>
            <h3 className="text-[14px] mb-3" style={{ color: 'var(--text-secondary)' }}>Quick Actions</h3>
            <div className="space-y-2">
              <Button
                className="w-full h-9 text-[13px] justify-start border"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                }}
                onClick={() => navigate('/dispatch')}
              >
                📍 View on Map
              </Button>
              <Button
                className="w-full h-9 text-[13px] justify-start border"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                }}
                onClick={() => toast.info('Performance reports coming soon')}
              >
                📊 Performance Report
              </Button>
              <Button
                className="w-full h-9 text-[13px] justify-start border"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-md)',
                }}
                onClick={() => navigate('/calendar')}
              >
                📅 Manage Schedules
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Technician Cards */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {technicians.map((tech) => {
              const statusConfig = getStatusConfig(tech.status);

              return (
                <div
                  key={tech.id}
                  className="border transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  {/* Header */}
                  <div className="p-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="flex items-start gap-4">
                      <div
                        className="h-14 w-14 flex items-center justify-center text-[18px]"
                        style={{
                          backgroundColor: 'var(--action-primary)',
                          color: 'var(--text-inverted)',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        {tech.initials}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[16px] mb-1" style={{ color: 'var(--text-primary)' }}>
                          {tech.name}
                        </h3>
                        <p className="text-[13px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                          {tech.role}
                        </p>
                        <Badge
                          className="px-2 py-1 text-[11px]"
                          style={{
                            backgroundColor: statusConfig.bg,
                            color: statusConfig.text,
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="p-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="h-3 w-3" style={{ color: 'var(--status-warning-icon)' }} />
                          <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
                            {tech.rating}
                          </span>
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          Rating
                        </div>
                      </div>
                      <div>
                        <div className="text-[14px] mb-1" style={{ color: 'var(--text-primary)' }}>
                          {tech.completedJobs}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          Completed
                        </div>
                      </div>
                      <div>
                        <div className="text-[14px] mb-1" style={{ color: 'var(--text-primary)' }}>
                          {tech.todayStats.scheduled}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                          Today
                        </div>
                      </div>
                    </div>

                    {tech.currentLocation && (
                      <div
                        className="flex items-center gap-2 p-2 text-[12px]"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-secondary)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <MapPin className="h-3 w-3" />
                        <span>Currently at: {tech.currentLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="p-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        <Phone className="h-3 w-3" />
                        <span>{tech.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        <Mail className="h-3 w-3" />
                        <span>{tech.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Certifications */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h4 className="text-[12px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {tech.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-[11px]"
                            style={{
                              backgroundColor: 'var(--action-secondary)',
                              color: 'var(--text-primary)',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[12px] mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        Certifications
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {tech.certifications.map((cert, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-[11px] flex items-center gap-1"
                            style={{
                              backgroundColor: 'var(--status-success-bg)',
                              color: 'var(--status-success-text)',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <Award className="h-3 w-3" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t flex gap-2" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-primary)' }}>
                    <Button
                      className="flex-1 h-9 text-[13px]"
                      style={{
                        backgroundColor: 'var(--action-primary)',
                        color: 'var(--text-inverted)',
                        borderRadius: 'var(--radius-md)',
                      }}
                      onClick={() => toast.info(`Assign work order to ${tech.name} - coming soon`)}
                    >
                      Assign Work Order
                    </Button>
                    <Button
                      className="h-9 px-3 text-[13px] border"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)',
                        borderRadius: 'var(--radius-md)',
                      }}
                      onClick={() => navigate(`/calendar?technician=${tech.id}`)}
                    >
                      View Schedule
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
