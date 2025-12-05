import { Settings, Bell, Users, Globe, Zap, Shield, User, AlertTriangle, Save, MessageSquare } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Card } from "./ui/card";
import { useState } from "react";
import { AutoSendSettings } from "./settings/AutoSendSettings";
import { TemplateEditor } from "./settings/TemplateEditor";

export function SettingsView() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [autoAssign, setAutoAssign] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case "notifications":
        return (
          <Card
            className="p-6 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <Bell className="h-5 w-5" style={{ color: 'var(--action-primary)' }} />
              <h2 className="text-[18px]" style={{ color: 'var(--text-primary)' }}>
                Notification Preferences
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <div>
                  <div className="text-[14px] mb-1" style={{ color: 'var(--text-primary)' }}>
                    Email Notifications
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    Receive email alerts for new work orders and updates
                  </div>
                </div>
                <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
              </div>

              <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <div>
                  <div className="text-[14px] mb-1" style={{ color: 'var(--text-primary)' }}>
                    Push Notifications
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    Get instant mobile alerts for urgent requests
                  </div>
                </div>
                <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
              </div>

              <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <div>
                  <div className="text-[14px] mb-1" style={{ color: 'var(--text-primary)' }}>
                    SMS Notifications
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    Receive text messages for emergency work orders
                  </div>
                </div>
                <Switch checked={smsNotifs} onCheckedChange={setSmsNotifs} />
              </div>
            </div>
          </Card>
        );
      case "communication":
        return (
          <div className="space-y-6">
            <AutoSendSettings />
            <TemplateEditor />
          </div>
        );
      case "team":
        return (
          <Card
            className="p-6 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <Users className="h-5 w-5" style={{ color: 'var(--action-primary)' }} />
              <h2 className="text-[18px]" style={{ color: 'var(--text-primary)' }}>
                Team Management
              </h2>
            </div>
            {/* Mock Team Content */}
            <div className="text-sm text-muted-foreground">Team management features coming soon.</div>
          </Card>
        );
      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Select a category to view settings
          </div>
        );
    }
  };

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
          <Settings className="h-5 w-5" style={{ color: 'var(--phase-3-icon)' }} />
          <h1 className="text-[20px]" style={{ color: 'var(--text-primary)' }}>Settings & Configuration</h1>
        </div>
        <Button
          className="h-9 px-4 text-[14px]"
          style={{
            backgroundColor: 'var(--action-primary)',
            color: 'var(--text-inverted)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Settings Navigation */}
        <div className="w-[240px] border-r p-4 overflow-y-auto" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
          <nav className="space-y-1">
            {[
              { id: "notifications", icon: Bell, label: "Notifications" },
              { id: "communication", icon: MessageSquare, label: "Communication" },
              { id: "team", icon: Users, label: "Team Management" },
              { id: "language", icon: Globe, label: "Language" },
              { id: "automation", icon: Zap, label: "Automation" },
              { id: "security", icon: Shield, label: "Security" },
              { id: "profile", icon: User, label: "Profile" },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[14px] transition-all"
                  style={{
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                    color: isActive ? 'var(--action-primary)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: isActive ? '3px solid var(--action-primary)' : '3px solid transparent',
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[900px]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
