import { useState } from "react";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileWorkOrderList } from "./MobileWorkOrderList";
import { MobileConversation } from "./MobileConversation";
import { WorkOrder } from "../types";

interface MobileAppProps {
  unlockAllFeatures?: boolean;
}

export default function MobileApp({}: MobileAppProps) {
  const [activeTab, setActiveTab] = useState<"messages" | "orders" | "calendar" | "team" | "more">("messages");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | undefined>(undefined);

  const handleTabChange = (tab: "messages" | "orders" | "calendar" | "team" | "more") => {
    // Always allow navigation - all features are visible
    setActiveTab(tab);
  };

  const handleSelectWorkOrder = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
  };

  const handleBackToList = () => {
    setSelectedWorkOrder(undefined);
  };

  // Show conversation view
  if (selectedWorkOrder) {
    return (
      <>
        <MobileConversation workOrder={selectedWorkOrder} onBack={handleBackToList} />
        <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </>
    );
  }

  // Show placeholder for Calendar and Team features
  if (activeTab === "calendar" || activeTab === "team") {
    return (
      <>
        <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {/* Header */}
          <div 
            className="h-14 border-b flex items-center justify-center px-4"
            style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)'
            }}
          >
            <h1 className="text-[18px]" style={{ color: 'var(--text-primary)' }}>
              {activeTab === "calendar" ? "Calendar" : "Team"}
            </h1>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}
              >
                <span className="text-[32px]">
                  {activeTab === "calendar" ? "📅" : "👥"}
                </span>
              </div>
              <h2 className="text-[20px] mb-2" style={{ color: 'var(--text-primary)' }}>
                {activeTab === "calendar" ? "Calendar View" : "Team Management"}
              </h2>
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                {activeTab === "calendar" 
                  ? "Drag-and-drop scheduling and appointment management"
                  : "View and manage technician assignments"
                }
              </p>
            </div>
          </div>
        </div>
        <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </>
    );
  }

  // Show work order list
  return (
    <>
      <MobileWorkOrderList
        onSelectWorkOrder={handleSelectWorkOrder}
      />
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </>
  );
}
