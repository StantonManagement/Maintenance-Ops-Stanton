import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { NavigationSidebar, NavigationView } from "../NavigationSidebar";
import { useState, useEffect } from "react";
import { Toaster } from "../ui/sonner";
import { Button } from "../ui/button";
import { Smartphone, Monitor, Unlock, Lock } from "lucide-react";
import { Switch } from "../ui/switch";
import MobileApp from "../MobileApp";
import { ConnectionStatus } from "../ui/ConnectionStatus";
import { useAutoSend } from "../../hooks/useAutoSend";
import { PreSendPreviewModal } from "../messages/PreSendPreviewModal";

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [unlockAllFeatures, setUnlockAllFeatures] = useState(true);
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  
  // Global Auto-Send Handler
  const { pendingMessage, confirmSend, cancelSend } = useAutoSend();

  // Map current path to NavigationView
  const getActiveView = (): NavigationView => {
    const path = location.pathname.split('/')[1];
    switch (path) {
      case 'work-orders': return 'work-orders';
      case 'messages': return 'messages';
      case 'approval-queue': return 'approval-queue';
      case 'calendar': return 'calendar';
      case 'technicians': return 'technicians';
      case 'dispatch': return 'dispatch';
      case 'analytics': return 'analytics';
      case 'settings': return 'settings';
      default: return 'work-orders';
    }
  };

  const handleNavigate = (view: NavigationView) => {
    navigate(`/${view}`);
  };

  // Auto-detect mobile viewport
  useEffect(() => {
    const checkViewport = () => {
      setDeviceView(window.innerWidth < 768 ? "mobile" : "desktop");
    };
    
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Mobile view
  if (deviceView === "mobile") {
    return (
      <>
        <Toaster position="top-center" />
        {/* Device Toggle (for demo) */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setDeviceView("desktop")}
            className="rounded-full flex items-center justify-center"
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <Monitor size={24} style={{ color: "var(--text-primary)" }} />
          </button>
          <button
            onClick={() => setUnlockAllFeatures(!unlockAllFeatures)}
            className="rounded-full flex items-center justify-center"
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: unlockAllFeatures ? 'var(--action-primary)' : 'var(--bg-card)',
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {unlockAllFeatures ? (
              <Unlock size={24} style={{ color: "white" }} />
            ) : (
              <Lock size={24} style={{ color: "var(--text-primary)" }} />
            )}
          </button>
        </div>
        <MobileApp unlockAllFeatures={unlockAllFeatures} />
      </>
    );
  }

  return (
    <div className="h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Toaster position="top-center" />
      
      {/* Unlock All Features Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <div
          className="flex items-center gap-3 px-4 py-3 border transition-all"
          style={{
            backgroundColor: unlockAllFeatures ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-card)',
            borderColor: unlockAllFeatures ? 'var(--action-primary)' : 'var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {unlockAllFeatures ? (
            <Unlock className="h-4 w-4" style={{ color: 'var(--action-primary)' }} />
          ) : (
            <Lock className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          )}
          <span className="text-[14px]" style={{ color: 'var(--text-primary)' }}>
            Unlock All Features
          </span>
          <Switch
            checked={unlockAllFeatures}
            onCheckedChange={setUnlockAllFeatures}
          />
        </div>
      </div>
      
      {/* View Toggles (temporary for demo) */}
      <div className="fixed bottom-6 left-[260px] z-30 flex gap-3">
        <Button
          className="h-10 px-5 text-[14px] border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
          }}
          onClick={() => navigate("/dispatch")}
        >
          Phase 2: Dispatch →
        </Button>
        <Button
          className="h-10 px-5 text-[14px] border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
          }}
          onClick={() => navigate("/future")}
        >
          🔮 Future Features
        </Button>
        <Button
          className="h-10 px-5 text-[14px] border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
          }}
          onClick={() => navigate("/design")}
        >
          📐 Design System
        </Button>
        <Button
          className="h-10 px-5 text-[14px] border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
          }}
          onClick={() => setDeviceView("mobile")}
        >
          <Smartphone size={16} style={{ marginRight: "8px" }} />
          Mobile View
        </Button>
      </div>

      {/* Left Sidebar Navigation */}
      <NavigationSidebar 
        activeView={getActiveView()}
        onNavigate={handleNavigate}
        unlockAllFeatures={unlockAllFeatures}
      />

      {/* Content Area (Center + Right Columns) */}
      <Outlet context={{ unlockAllFeatures }} />
      
      <ConnectionStatus />

      {/* Global Auto-Send Preview Modal */}
      {pendingMessage && (
        <PreSendPreviewModal 
          isOpen={true}
          recipient={pendingMessage.recipient}
          content={pendingMessage.content}
          triggerType={pendingMessage.trigger}
          onSend={confirmSend}
          onCancel={cancelSend}
        />
      )}
    </div>
  );
}
