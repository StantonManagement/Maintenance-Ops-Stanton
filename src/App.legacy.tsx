import { useState, useEffect } from "react";
import { NavigationSidebar, NavigationView } from "./components/NavigationSidebar";
import { WorkOrderList } from "./components/WorkOrderList";
import { ConversationThread } from "./components/ConversationThread";
import { ApprovalInterface } from "./components/ApprovalInterface";
import { WorkOrderPreview } from "./components/WorkOrderPreview";
import { WorkOrder } from "./types";
import DispatchInterface from "./components/DispatchInterface";
import { CalendarView } from "./components/CalendarView";
import { TechniciansView } from "./components/TechniciansView";
import { AnalyticsView } from "./components/AnalyticsView";
import { SettingsView } from "./components/SettingsView";
import MobileApp from "./components/MobileApp";
import FutureFeatures from "./components/FutureFeatures";
import DesignSystemShowcase from "./components/DesignSystemShowcase";
import { Button } from "./components/ui/button";
import { Switch } from "./components/ui/switch";
import { Toaster } from "./components/ui/sonner";
import { Smartphone, Monitor, MessageSquare, Unlock, Lock } from "lucide-react";

export default function App() {
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | undefined>(undefined);
  const [view, setView] = useState<"messages" | "dispatch" | "future" | "design">("messages");
  const [navigationView, setNavigationView] = useState<NavigationView>("messages");
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [unlockAllFeatures, setUnlockAllFeatures] = useState(true);

  // Auto-detect mobile viewport
  useEffect(() => {
    const checkViewport = () => {
      setDeviceView(window.innerWidth < 768 ? "mobile" : "desktop");
    };
    
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Handle navigation from sidebar
  const handleNavigate = (navView: NavigationView) => {
    setNavigationView(navView);
    // Reset selected work order when switching views
    setSelectedWorkOrder(undefined);
  };

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

  // Desktop - Design System view
  if (view === "design") {
    return (
      <>
        <Toaster position="top-center" />
        <DesignSystemShowcase onClose={() => setView("messages")} />
      </>
    );
  }

  // Desktop - Future Features view
  if (view === "future") {
    return (
      <>
        <Toaster position="top-center" />
        <FutureFeatures onClose={() => setView("messages")} />
      </>
    );
  }

  // Desktop - Dispatch view
  if (view === "dispatch") {
    return (
      <>
        <Toaster position="top-center" />
        {/* Device Toggle (for demo) */}
        <div className="fixed top-6 right-6 z-50 flex gap-2">
          <Button
            className="h-10 px-4 border rounded-full"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-lg)",
            }}
            onClick={() => setDeviceView("mobile")}
          >
            <Smartphone size={20} style={{ marginRight: "8px" }} />
            Mobile View
          </Button>
        </div>
        <DispatchInterface 
          onBackToMessages={() => setView("messages")} 
          unlockAllFeatures={unlockAllFeatures}
        />
      </>
    );
  }

  // Desktop - Messages/Work Orders/Approval Queue view
  const renderCenterColumn = () => {
    // Phase 1 views - WorkOrderList
    if (navigationView === "messages" || navigationView === "work-orders" || navigationView === "approval-queue") {
      return (
        <WorkOrderList
          selectedWorkOrderId={selectedWorkOrder?.id}
          onSelectWorkOrder={setSelectedWorkOrder}
          viewMode={navigationView}
        />
      );
    }
    
    // Phase 2/3 views - Show placeholder views when unlocked
    if (unlockAllFeatures) {
      switch (navigationView) {
        case "calendar":
          return <CalendarView />;
        case "technicians":
          return <TechniciansView />;
        case "analytics":
          return <AnalyticsView />;
        case "settings":
          return <SettingsView />;
        case "dispatch":
          return <DispatchInterface unlockAllFeatures={unlockAllFeatures} />;
        default:
          return null;
      }
    }
    
    // Locked state - show simple placeholder
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <h2 className="text-[24px] mb-2" style={{ color: 'var(--text-primary)' }}>
            {navigationView.charAt(0).toUpperCase() + navigationView.slice(1).replace('-', ' ')}
          </h2>
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            This feature is coming in a future phase
          </p>
        </div>
      </div>
    );
  };

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
          onClick={() => setView("dispatch")}
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
          onClick={() => setView("future")}
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
          onClick={() => setView("design")}
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
        activeView={navigationView}
        onNavigate={handleNavigate}
        unlockAllFeatures={unlockAllFeatures}
      />

      {/* Center Column - Content based on navigation */}
      {renderCenterColumn()}

      {/* Right Column - Context based on navigation view */}
      {/* Only show right column for Phase 1 views */}
      {(navigationView === "messages" || navigationView === "work-orders" || navigationView === "approval-queue") && (
        <>
          {navigationView === "approval-queue" ? (
            <ApprovalInterface workOrder={selectedWorkOrder} />
          ) : navigationView === "work-orders" ? (
            // Table view - show work order preview with photos/details
            <WorkOrderPreview workOrder={selectedWorkOrder} />
          ) : (
            // Messages view - show conversation thread if work order has messages
            selectedWorkOrder?.messageCount && selectedWorkOrder.messageCount > 0 ? (
              <ConversationThread workOrder={selectedWorkOrder} />
            ) : (
              <div className="w-[480px] border-l flex flex-col" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-card)" }}>
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: "var(--bg-hover)" }}
                  >
                    <MessageSquare className="h-8 w-8" style={{ color: "var(--text-tertiary)" }} />
                  </div>
                  <h3 className="text-[18px] mb-2" style={{ color: "var(--text-primary)" }}>
                    {selectedWorkOrder ? "No conversation yet" : "Select a work order"}
                  </h3>
                  <p className="text-[14px] text-center" style={{ color: "var(--text-secondary)" }}>
                    {selectedWorkOrder 
                      ? "Start a conversation by sending a message to the tenant or technician"
                      : "Choose a work order from the list to view details and conversations"
                    }
                  </p>
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
