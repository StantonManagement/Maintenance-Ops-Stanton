import { MessageSquare, ClipboardList, Calendar, Users, Menu } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: "messages" | "orders" | "calendar" | "team" | "more";
  onTabChange: (tab: "messages" | "orders" | "calendar" | "team" | "more") => void;
  unreadCount?: number;
}

export function MobileBottomNav({ activeTab, onTabChange, unreadCount = 8 }: MobileBottomNavProps) {
  const tabs = [
    {
      id: "messages" as const,
      icon: MessageSquare,
      label: "Messages",
      badge: unreadCount,
      locked: false,
    },
    {
      id: "orders" as const,
      icon: ClipboardList,
      label: "Orders",
      locked: false,
    },
    {
      id: "calendar" as const,
      icon: Calendar,
      label: "Calendar",
      locked: false,
    },
    {
      id: "team" as const,
      icon: Users,
      label: "Team",
      locked: false,
    },
    {
      id: "more" as const,
      icon: Menu,
      label: "More",
      locked: false,
    },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        height: '80px',
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-default)',
        boxShadow: '0px -4px 6px rgba(0, 0, 0, 0.05), 0px -2px 4px rgba(0, 0, 0, 0.03)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center flex-1 relative"
              style={{
                cursor: 'pointer',
              }}
            >
              {/* Active indicator line */}
              {isActive && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2"
                  style={{
                    width: '32px',
                    height: '2px',
                    backgroundColor: 'var(--action-primary)',
                  }}
                />
              )}

              {/* Icon with badge */}
              <div className="relative mb-1">
                <Icon
                  size={24}
                  style={{
                    color: isActive
                      ? 'var(--action-primary)'
                      : 'var(--text-secondary)',
                  }}
                />
                {tab.badge && (
                  <div
                    className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full"
                    style={{
                      backgroundColor: 'var(--action-primary)',
                      color: 'var(--text-inverted)',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {tab.badge}
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: '12px',
                  color: isActive
                    ? 'var(--action-primary)'
                    : 'var(--text-secondary)',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
