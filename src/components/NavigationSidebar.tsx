import { useState } from "react";
import { 
  MessageSquare, ClipboardList, CheckSquare, Calendar, Users, BarChart3, 
  TrendingUp, Settings, DollarSign, History, Brain, Mic, 
  Building, Wrench, Settings2, Building2, Activity, GitMerge, ClipboardCheck,
  ChevronDown, ChevronRight, Briefcase
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { useSidebarStats } from "@/hooks/useSidebarStats";
import { useOverrides } from "@/hooks/useOverrides";
import { useActivePortfolio } from "@/providers/PortfolioProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useAuth } from "@/providers/AuthProvider";
import { useRole } from "@/providers/RoleProvider";

export type NavigationView = "messages" | "work-orders" | "approval-queue" | "duplicates" | "morning-queue" | "calendar" | "technicians" | "dispatch" | "property-operations" | "voice-queue" | "vendors" | "preventive-maintenance" | "rules" | "portfolio" | "sensors" | "analytics" | "financials" | "overrides" | "ai-settings" | "settings" | "units" | "vendor-requests";

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: NavigationView;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavigationSidebarProps {
  activeView?: NavigationView;
  onNavigate?: (view: NavigationView) => void;
  unlockAllFeatures?: boolean;
}

export function NavigationSidebar({ activeView = "messages", onNavigate }: NavigationSidebarProps) {
  const { stats, loading } = useSidebarStats();
  const { unacknowledgedOverrides } = useOverrides();
  const { activePortfolio, setActivePortfolio, portfolios, isLoading: portfoliosLoading } = useActivePortfolio();
  const { profile } = useAuth();
  const { role } = useRole();
  
  // Default expanded state
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Operations"]);

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupLabel) 
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  const navGroups: NavGroup[] = [
    {
      label: "Operations",
      items: [
        { icon: BarChart3, label: "Dispatch", view: "dispatch" },
        { icon: ClipboardCheck, label: "Morning Queue", view: "morning-queue" },
        { icon: ClipboardList, label: "Work Orders", view: "work-orders" },
        { icon: CheckSquare, label: "Approval Queue", view: "approval-queue", badge: stats.approvalQueue > 0 ? stats.approvalQueue.toString() : undefined },
        { icon: GitMerge, label: "Duplicates", view: "duplicates" }
      ]
    },
    {
      label: "Communication",
      items: [
        { icon: MessageSquare, label: "Messages", view: "messages", badge: stats.unreadMessages > 0 ? stats.unreadMessages.toString() : undefined },
        { icon: Mic, label: "Voice Queue", view: "voice-queue" }
      ]
    },
    {
      label: "Team",
      items: [
        { icon: Users, label: "Technicians", view: "technicians" },
        { icon: Calendar, label: "Calendar", view: "calendar" },
        { icon: History, label: "Override Log", view: "overrides", badge: unacknowledgedOverrides.length > 0 ? unacknowledgedOverrides.length.toString() : undefined }
      ]
    },
    {
      label: "Vendors",
      items: [
        { icon: Building, label: "Vendor Directory", view: "vendors" }
      ]
    },
    {
      label: "Properties",
      items: [
        { icon: Building2, label: "Property Ops", view: "property-operations" },
        { icon: Building2, label: "Portfolio", view: "portfolio" },
        { icon: Activity, label: "IoT Sensors", view: "sensors" },
        { icon: Wrench, label: "Preventive Maint.", view: "preventive-maintenance" }
      ]
    },
    {
      label: "Intelligence",
      items: [
        { icon: TrendingUp, label: "Analytics", view: "analytics" },
        { icon: DollarSign, label: "Financials", view: "financials" },
        { icon: Settings2, label: "Rules Engine", view: "rules" }
      ]
    }
  ];

  return (
    <div  
      className="w-[240px] border-r flex flex-col h-screen"
      style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-default)'
      }}
    >
      {/* Portfolio Selector Header */}
      <div className="h-16 flex flex-col justify-center px-4 border-b space-y-1" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
          <Briefcase className="h-3 w-3" />
          <span>Portfolio</span>
        </div>
        <Select 
          value={activePortfolio?.id} 
          onValueChange={(val) => {
            const selected = portfolios.find(p => p.id === val);
            setActivePortfolio(selected || null);
          }}
          disabled={portfoliosLoading}
        >
          <SelectTrigger className="w-full h-8 text-sm border-0 p-0 shadow-none bg-transparent focus:ring-0 font-bold px-1 hover:bg-accent/50 rounded-sm">
            <SelectValue placeholder="Select Portfolio" />
          </SelectTrigger>
          <SelectContent>
            {portfolios.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
            {portfolios.length === 0 && (
              <div className="p-2 text-xs text-muted-foreground">No portfolios found</div>
            )}
          </SelectContent>
        </Select>
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
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {profile?.full_name || 'User'}
            </p>
            <p className="text-[12px] capitalize" style={{ color: 'var(--text-secondary)' }}>
              {role || 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* Active Alerts Card (Summary) */}
      <div className="px-3 pt-4 pb-2">
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
              <span style={{ color: '#1A1A1A', fontWeight: 500 }}>({unacknowledgedOverrides.length})</span>
            </div>
            {stats.emergencyCount > 0 && (
              <div className="flex items-center justify-between text-[12px]">
                <span style={{ color: '#78716C' }}>Emergency</span>
                <span className="font-bold text-red-600">({stats.emergencyCount})</span>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        <div className="space-y-4">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.label);
            return (
              <div key={group.label} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{group.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="space-y-0.5 ml-1">
                    {group.items.map((item) => (
                      <button
                        key={item.view}
                        onClick={() => onNavigate?.(item.view)}
                        className="w-full h-9 flex items-center gap-3 px-3 relative group transition-all"
                        style={{
                          backgroundColor: activeView === item.view ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                          borderLeft: activeView === item.view ? '3px solid var(--action-primary)' : '3px solid transparent',
                          borderRadius: 'var(--radius-sm)',
                          color: activeView === item.view ? 'var(--action-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-[13px] flex-1 text-left">
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge 
                            className="h-5 min-w-5 px-1.5 text-[10px] flex items-center justify-center"
                            style={{ 
                              backgroundColor: 'var(--action-primary)',
                              color: 'var(--text-inverted)',
                              borderRadius: 'var(--radius-full)'
                            }}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Settings Section */}
          <div className="pt-2 border-t mt-2">
            <button
              onClick={() => onNavigate?.("settings")}
              className="w-full h-9 flex items-center gap-3 px-3 relative transition-all"
              style={{
                backgroundColor: activeView === "settings" ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                borderLeft: activeView === "settings" ? '3px solid var(--action-primary)' : '3px solid transparent',
                borderRadius: 'var(--radius-sm)',
                color: activeView === "settings" ? 'var(--action-primary)' : 'var(--text-secondary)',
              }}
            >
              <Settings className="h-4 w-4" />
              <span className="text-[13px] flex-1 text-left">Settings</span>
            </button>
            <button
              onClick={() => onNavigate?.("ai-settings")}
              className="w-full h-9 flex items-center gap-3 px-3 relative transition-all"
              style={{
                backgroundColor: activeView === "ai-settings" ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                borderLeft: activeView === "ai-settings" ? '3px solid var(--action-primary)' : '3px solid transparent',
                borderRadius: 'var(--radius-sm)',
                color: activeView === "ai-settings" ? 'var(--action-primary)' : 'var(--text-secondary)',
              }}
            >
              <Brain className="h-4 w-4" />
              <span className="text-[13px] flex-1 text-left">AI Settings</span>
            </button>
          </div>
        </div>
      </nav>

      {/* System Status - Today's Overview Only */}
      <div className="p-3 border-t">
        <Card 
          className="p-3 border shadow-none"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <h3 className="text-[11px] mb-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Today's Overview</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <StatItem 
              label="New" 
              value={stats.newToday} 
              loading={loading}
            />
            <StatItem 
              label="In Progress" 
              value={stats.inProgress}
              loading={loading}
            />
            <StatItem 
              label="Emergency" 
              value={stats.emergencyCount}
              loading={loading}
              variant="danger"
            />
            <StatItem 
              label="Pending" 
              value={stats.approvalQueue}
              loading={loading}
              variant="warning"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// Helper Components
// ============================================

interface StatItemProps {
  label: string;
  value: number;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

function StatItem({ label, value, loading, variant = 'default' }: StatItemProps) {
  const valueColor = {
    default: 'text-foreground',
    danger: 'text-red-500',
    warning: 'text-amber-500',
    success: 'text-green-500',
  }[variant];

  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-[10px]">{label}</span>
      {loading ? (
        <span className="text-sm font-semibold animate-pulse">--</span>
      ) : (
        <span className={`text-sm font-semibold ${valueColor}`}>
          {value}
        </span>
      )}
    </div>
  );
}
