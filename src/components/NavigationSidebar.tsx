import { MessageSquare, ClipboardList, CheckSquare, Calendar, Users, BarChart3, TrendingUp, Settings, Lock, Clock, UserCheck, DollarSign, History, Brain, Mic, Building, Wrench, Settings2, Building2, Activity } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

export type NavigationView = "messages" | "work-orders" | "approval-queue" | "calendar" | "technicians" | "dispatch" | "voice-queue" | "vendors" | "preventive-maintenance" | "rules" | "portfolio" | "sensors" | "analytics" | "financials" | "overrides" | "ai-settings" | "settings";

interface NavigationItem {
  icon: React.ComponentType<any>;
  label: string;
  badge?: string;
  phase: 1 | 2 | 3;
  view: NavigationView;
}

const navigationItems: NavigationItem[] = [
  { icon: ClipboardList, label: "Work Orders", phase: 1, view: "work-orders" },
  { icon: Calendar, label: "Calendar", phase: 2, view: "calendar" },
  { icon: Users, label: "Technicians", phase: 2, view: "technicians" },
  { icon: BarChart3, label: "Dispatch", phase: 2, view: "dispatch" },
  { icon: Mic, label: "Voice Queue", phase: 2, view: "voice-queue" },
  { icon: Building, label: "Vendors", phase: 2, view: "vendors" },
  { icon: Wrench, label: "Preventive Maint.", phase: 3, view: "preventive-maintenance" },
  { icon: Settings2, label: "Rules Engine", phase: 3, view: "rules" },
  { icon: Building2, label: "Portfolio", phase: 3, view: "portfolio" },
  { icon: Activity, label: "IoT Sensors", phase: 3, view: "sensors" },
  { icon: TrendingUp, label: "Analytics", phase: 3, view: "analytics" },
  { icon: DollarSign, label: "Financials", phase: 3, view: "financials" },
  { icon: History, label: "Override Log", phase: 3, view: "overrides" },
  { icon: Brain, label: "AI Settings", phase: 3, view: "ai-settings" },
  { icon: Settings, label: "Settings", phase: 3, view: "settings" },
];

interface NavigationSidebarProps {
  activeView?: NavigationView;
  onNavigate?: (view: NavigationView) => void;
  unlockAllFeatures?: boolean;
}

export function NavigationSidebar({ activeView = "messages", onNavigate, unlockAllFeatures = false }: NavigationSidebarProps) {
  return (
    <div 
      className="w-[240px] border-r flex flex-col h-screen"
      style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-default)'
      }}
    >
      {/* Header */}
      <div className="h-12 flex items-center px-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <h1 className="text-[20px] leading-[28px] tracking-wider" style={{ color: 'var(--text-primary)' }}>
          MAINTENANCEOPS
        </h1>
      </div>

      {/* User Info */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3">
          <div 
            className="h-8 w-8 flex items-center justify-center text-[14px]"
            style={{ 
              backgroundColor: 'var(--action-primary)',
              color: 'var(--text-inverted)',
              borderRadius: 'var(--radius-full)'
            }}
          >
            KC
          </div>
          <div>
            <p className="text-[14px]" style={{ color: 'var(--text-primary)' }}>Kristine Chen</p>
            <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Maintenance Coordinator</p>
          </div>
        </div>
      </div>

      {/* Active Alerts Card */}
      <div className="px-3 pt-4">
        <button
          className="w-full p-3 border transition-all"
          style={{
            background: 'linear-gradient(to bottom, #FEF3C7, #FDE68A)',
            borderColor: '#F59E0B',
            borderLeftWidth: '4px',
            borderLeftColor: '#EA580C',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
          onClick={() => onNavigate?.("work-orders")}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px]" style={{ color: '#1A1A1A', fontWeight: 600 }}>⚠️  Active Alerts</span>
          </div>
          <div className="space-y-1 mb-2">
            <div className="flex items-center justify-between text-[12px]">
              <span style={{ color: '#78716C' }}>Override Active</span>
              <span style={{ color: '#1A1A1A', fontWeight: 500 }}>(2)</span>
            </div>
            <div className="flex items-center justify-between text-[12px] opacity-60">
              <span style={{ color: '#78716C' }}>Location Alerts 🔒</span>
              <span style={{ color: '#78716C' }}>(0)</span>
            </div>
          </div>
          <div className="text-[11px] text-center" style={{ color: '#78716C', fontStyle: 'italic' }}>
            Click to review
          </div>
        </button>
      </div>

      {/* Quick Action Sections */}
      <div className="px-3 py-4 space-y-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        {/* Messages Section */}
        <button
          onClick={() => onNavigate?.("messages")}
          className="w-full p-4 border transition-all"
          style={{
            backgroundColor: activeView === "messages" 
              ? 'rgba(37, 99, 235, 0.1)' 
              : 'var(--bg-card)',
            borderColor: activeView === "messages" 
              ? 'var(--action-primary)' 
              : 'var(--border-default)',
            borderLeftWidth: activeView === "messages" ? '4px' : '1px',
            borderLeftColor: activeView === "messages" ? 'var(--action-primary)' : undefined,
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (activeView !== "messages") {
              e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
              e.currentTarget.style.borderColor = 'var(--action-primary)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== "messages") {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare 
              className="h-5 w-5" 
              style={{ color: 'var(--action-primary)' }} 
            />
            <span 
              className="text-[14px] flex-1 text-left"
              style={{ color: 'var(--text-primary)' }}
            >
              Messages
            </span>
            <div
              className="h-5 min-w-5 px-2 flex items-center justify-center text-[11px]"
              style={{
                backgroundColor: 'var(--action-primary)',
                color: 'var(--text-inverted)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              4
            </div>
          </div>
          <div className="flex items-center gap-2 pl-8">
            <Clock className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              3 waiting for reply
            </span>
          </div>
        </button>

        {/* Approval Queue Section */}
        <button
          onClick={() => onNavigate?.("approval-queue")}
          className="w-full p-4 border transition-all"
          style={{
            backgroundColor: activeView === "approval-queue" 
              ? 'rgba(245, 158, 11, 0.15)' 
              : 'var(--bg-card)',
            borderColor: activeView === "approval-queue" 
              ? 'var(--status-warning-border)' 
              : 'var(--border-default)',
            borderLeftWidth: activeView === "approval-queue" ? '4px' : '1px',
            borderLeftColor: activeView === "approval-queue" ? 'var(--status-warning-border)' : undefined,
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (activeView !== "approval-queue") {
              e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
              e.currentTarget.style.borderColor = 'var(--status-warning-border)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeView !== "approval-queue") {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare 
              className="h-5 w-5" 
              style={{ color: 'var(--status-warning-icon)' }} 
            />
            <span 
              className="text-[14px] flex-1 text-left"
              style={{ color: 'var(--text-primary)' }}
            >
              Approval Queue
            </span>
            <div
              className="h-5 min-w-5 px-2 flex items-center justify-center text-[11px]"
              style={{
                backgroundColor: 'var(--status-warning-icon)',
                color: 'var(--text-inverted)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              5
            </div>
          </div>
          <div className="flex items-center gap-2 pl-8">
            <UserCheck className="h-3 w-3" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              Ready for review
            </span>
          </div>
          {/* Urgency Indicator */}
          <div 
            className="mt-2 ml-8 px-2 py-1 inline-block text-[12px]"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: 'var(--status-warning-text)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            3 over 12h
          </div>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isLockedByPhase = item.phase > 1;
            const isLocked = isLockedByPhase && !unlockAllFeatures;
            const isPhase2 = item.phase === 2;
            const isPhase3 = item.phase === 3;

            return (
              <button
                key={index}
                className="w-full h-10 flex items-center gap-3 px-3 relative group transition-all"
                style={{
                  backgroundColor: activeView === item.view ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  borderLeft: activeView === item.view ? '3px solid var(--action-primary)' : '3px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.6 : 1,
                }}
                disabled={isLocked}
                onClick={() => !isLocked && onNavigate?.(item.view)}
                title={isLocked ? `Available in Phase ${item.phase}` : undefined}
              >
                {isLocked && (
                  <Lock 
                    className="h-4 w-4 absolute left-3" 
                    style={{ 
                      color: isPhase2 ? 'var(--phase-2-icon)' : 'var(--phase-3-icon)' 
                    }} 
                  />
                )}
                <Icon 
                  className="h-5 w-5" 
                  style={{ 
                    color: activeView === item.view ? 'var(--action-primary)' : 'var(--text-secondary)',
                    marginLeft: isLocked ? '16px' : '0'
                  }} 
                />
                <span 
                  className="text-[14px] flex-1 text-left"
                  style={{ 
                    color: activeView === item.view ? 'var(--action-primary)' : 'var(--text-primary)'
                  }}
                >
                  {item.label}
                </span>
                {item.badge && !isLocked && (
                  <Badge 
                    className="h-5 min-w-5 px-1.5 text-[11px] flex items-center justify-center"
                    style={{ 
                      backgroundColor: 'var(--action-primary)',
                      color: 'var(--text-inverted)',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {item.badge}
                  </Badge>
                )}
                {/* Show phase badge when unlocked globally but normally locked */}
                {isLockedByPhase && unlockAllFeatures && (
                  <Badge 
                    className="h-5 px-2 text-[11px] flex items-center gap-1"
                    style={{ 
                      backgroundColor: isPhase2 ? 'rgba(168, 85, 247, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                      color: isPhase2 ? 'var(--phase-2-icon)' : 'var(--phase-3-icon)',
                      border: `1px solid ${isPhase2 ? 'var(--phase-2-border)' : 'var(--phase-3-border)'}`,
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    Phase {item.phase}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* System Status */}
      <div className="p-3 space-y-3">
        <Card 
          className="p-4 border"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <h3 className="text-[12px] mb-3" style={{ color: 'var(--text-secondary)' }}>Today's Overview</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>New Requests</span>
              <span className="text-[14px] font-mono" style={{ color: 'var(--text-primary)' }}>12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>In Progress</span>
              <span className="text-[14px] font-mono" style={{ color: 'var(--text-primary)' }}>4</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>Awaiting Approval</span>
              <span className="text-[14px] font-mono" style={{ color: 'var(--text-primary)' }}>8</span>
            </div>
          </div>
        </Card>

        {/* Phase Overview Card */}
        <Card 
          className="p-4 border"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-default)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <h3 className="text-[14px] mb-3" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            🚀 Coming Soon
          </h3>
          <div className="space-y-2">
            <div>
              <div className="text-[12px]" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                Phase 2 (4 features)
              </div>
              <div className="text-[11px]" style={{ color: '#F59E0B' }}>
                Estimated: 4 weeks
              </div>
            </div>
            <div>
              <div className="text-[12px]" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                Phase 3 (2 features)
              </div>
              <div className="text-[11px]" style={{ color: '#9CA3AF' }}>
                Estimated: 12 weeks
              </div>
            </div>
          </div>
          <Button
            className="w-full h-7 mt-3 text-[12px] border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            View Roadmap
          </Button>
        </Card>

        {/* Unlock Status Badge */}
        {unlockAllFeatures ? (
          <div 
            className="mt-4 p-3 flex items-center gap-2"
            style={{ 
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--action-primary)'
            }}
          >
            <span className="text-[12px]" style={{ color: 'var(--action-primary)' }}>
              🔓 All features unlocked
            </span>
          </div>
        ) : (
          <div 
            className="mt-4 p-3 flex items-center gap-2"
            style={{ 
              backgroundColor: 'rgba(107, 114, 128, 0.1)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Lock className="h-3 w-3" style={{ color: 'var(--phase-3-icon)' }} />
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              Phase 2/3 features locked
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
