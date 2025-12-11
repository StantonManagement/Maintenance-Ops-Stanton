import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { NavigationSidebar, NavigationView } from "../NavigationSidebar";
import { useState, useEffect } from "react";
import { Toaster } from "../ui/sonner";
import { Monitor } from "lucide-react";
import MobileApp from "../MobileApp";
import { ConnectionStatus } from "../ui/ConnectionStatus";
import { useAutoSend } from "../../hooks/useAutoSend";
import { PreSendPreviewModal } from "../messages/PreSendPreviewModal";

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const unlockAllFeatures = true; // Always unlocked
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
      case 'duplicates': return 'duplicates';
      case 'morning-queue': return 'morning-queue';
      case 'calendar': return 'calendar';
      case 'technicians': return 'technicians';
      case 'dispatch': return 'dispatch';
      case 'property-operations': return 'property-operations';
      case 'analytics': return 'analytics';
      case 'settings': return 'settings';
      case 'voice-queue': return 'voice-queue';
      case 'vendors': return 'vendors';
      case 'preventive': return 'preventive-maintenance';
      case 'rules': return 'rules';
      case 'portfolio': return 'portfolio';
      case 'sensors': return 'sensors';
      case 'financials': return 'financials';
      case 'overrides': return 'overrides';
      case 'ai-settings': return 'ai-settings';
      case 'units': return 'units';
      case 'vendor-requests': return 'vendor-requests';
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
                  </div>
        <MobileApp unlockAllFeatures={unlockAllFeatures} />
      </>
    );
  }

  return (
    <div className="h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Toaster position="top-center" />
      
            
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
