import { useState } from "react";
import { NavigationSidebar } from "./NavigationSidebar";
import { Lock, MapIcon, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DraggableWorkOrderCard, DraggableWorkOrder } from "./DraggableWorkOrderCard";
import { TechnicianCard } from "./TechnicianCard";
import { Technician } from "../types";
import { UndoBanner, UndoAction } from "./UndoBanner";
import { toast } from "sonner";

const mockUnassignedWorkOrders: DraggableWorkOrder[] = [
  {
    id: "WO-1234",
    title: "Kitchen sink leaking - urgent repair",
    location: "Building A · Unit 205",
    tenant: "Maria Lopez",
    tenantLanguage: "ES",
    priority: "emergency",
    estimatedTime: "2-3 hrs",
    skillsRequired: ["Plumbing", "General"],
    lastContact: "2 hrs ago",
  },
  {
    id: "WO-1242",
    title: "Water leak from ceiling in bathroom",
    location: "Building A · Unit 304",
    tenant: "John Chen",
    tenantLanguage: "EN",
    priority: "emergency",
    estimatedTime: "3-4 hrs",
    skillsRequired: ["Plumbing"],
    lastContact: "15 mins ago",
  },
  {
    id: "WO-1240",
    title: "HVAC not cooling properly",
    location: "Building C · Unit 512",
    tenant: "Sarah Johnson",
    tenantLanguage: "EN",
    priority: "high",
    estimatedTime: "2 hrs",
    skillsRequired: ["HVAC"],
    lastContact: "1 hour ago",
  },
  {
    id: "WO-1238",
    title: "Broken window in living room",
    location: "Building B · Unit 108",
    tenant: "David Kim",
    tenantLanguage: "KO",
    priority: "high",
    estimatedTime: "1-2 hrs",
    skillsRequired: ["General"],
    lastContact: "3 hours ago",
  },
];

const mockTechnicians: Technician[] = [
  {
    id: "tech-1",
    name: "Ramon M.",
    capacity: { current: 4, max: 6 },
    skills: ["Plumbing", "General", "Appliance"],
    currentLocation: "Building A",
    inTransit: false,
    status: "available",
    assignedWorkOrders: [
      { id: "WO-1230", title: "Kitchen leak", status: "In Progress" },
      { id: "WO-1225", title: "Dishwasher repair", status: "Assigned" },
    ],
  },
  {
    id: "tech-2",
    name: "Sarah L.",
    capacity: { current: 5, max: 6 },
    skills: ["General", "Appliance", "Electrical"],
    currentLocation: "Building C",
    inTransit: true,
    estimatedArrival: "15 min",
    status: "in-transit",
    assignedWorkOrders: [
      { id: "WO-1228", title: "Outlet not working", status: "In Progress" },
      { id: "WO-1220", title: "Light fixture", status: "Assigned" },
      { id: "WO-1215", title: "Cabinet door", status: "Ready for Review" },
    ],
  },
  {
    id: "tech-3",
    name: "Miguel R.",
    capacity: { current: 3, max: 6 },
    skills: ["HVAC", "Plumbing", "General"],
    currentLocation: "Building B",
    inTransit: false,
    status: "available",
    assignedWorkOrders: [
      { id: "WO-1227", title: "AC not cooling", status: "In Progress" },
    ],
  },
  {
    id: "tech-4",
    name: "Dean P.",
    capacity: { current: 6, max: 6 },
    skills: ["General", "Paint", "Appliance"],
    currentLocation: "Building D",
    inTransit: false,
    status: "available",
    pulledForTurnover: true,
    turnoverInfo: {
      building: "Building C",
      estimatedReturn: "2:30 PM",
    },
    assignedWorkOrders: [
      { id: "WO-1210", title: "Paint touch-up", status: "In Progress" },
      { id: "WO-1205", title: "Fridge noise", status: "Assigned" },
    ],
  },
  {
    id: "tech-5",
    name: "Lisa W.",
    capacity: { current: 2, max: 6 },
    skills: ["Electrical", "General"],
    currentLocation: "Building A",
    inTransit: false,
    status: "available",
    assignedWorkOrders: [
      { id: "WO-1208", title: "Breaker issue", status: "In Progress" },
    ],
  },
  {
    id: "tech-6",
    name: "Carlos M.",
    capacity: { current: 4, max: 6 },
    skills: ["Plumbing", "HVAC", "General"],
    currentLocation: "Building B",
    inTransit: false,
    status: "available",
    assignedWorkOrders: [
      { id: "WO-1200", title: "Toilet leak", status: "In Progress" },
      { id: "WO-1198", title: "AC filter", status: "Assigned" },
    ],
  },
];

interface DispatchInterfaceProps {
  onBackToMessages?: () => void;
  unlockAllFeatures?: boolean;
}

export default function DispatchInterface({ onBackToMessages, unlockAllFeatures = false }: DispatchInterfaceProps) {
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<Set<string>>(new Set());
  const [undoActions, setUndoActions] = useState<UndoAction[]>([]);
  const [isUnlocked] = useState(false);
  
  // Respect global unlock state
  const effectiveUnlock = isUnlocked || unlockAllFeatures;

  const toggleWorkOrderSelection = (id: string) => {
    const newSelection = new Set(selectedWorkOrders);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedWorkOrders(newSelection);
  };

  const handleAssignment = (technicianName: string, count: number, workOrderId?: string) => {
    const message = count > 1 
      ? `${count} work orders assigned to ${technicianName}`
      : workOrderId 
      ? `${workOrderId} assigned to ${technicianName}`
      : `Work order assigned to ${technicianName}`;
    
    const newAction: UndoAction = {
      id: `undo-${Date.now()}`,
      message,
      onUndo: () => {
        console.log("Undoing assignment");
        removeUndoAction(newAction.id);
      },
      duration: 5,
    };
    setUndoActions([newAction, ...undoActions]);
    setSelectedWorkOrders(new Set());
    
    // Show success toast
    toast.success(`✅ ${message}`);
  };

  const removeUndoAction = (id: string) => {
    setUndoActions(undoActions.filter(action => action.id !== id));
  };

  return (
    <div className="h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Back Button (temporary for demo) */}
      {onBackToMessages && (
        <div className="fixed bottom-6 left-[260px] z-30">
          <Button
            className="h-10 px-5 text-[14px] gap-2 border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={onBackToMessages}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Messages View
          </Button>
        </div>
      )}

      {/* Undo Banners */}
      <UndoBanner actions={undoActions} onActionExpire={removeUndoAction} />

      {/* Left Sidebar Navigation */}
      <NavigationSidebar />

      {/* Unassigned Queue */}
      <div className="w-[480px] flex flex-col border-r" style={{ borderColor: 'var(--border-default)' }}>
        {/* Header */}
        <div
          className="h-16 border-b px-6 flex items-center gap-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-[24px] leading-[32px] tracking-[-0.25px]" style={{ color: 'var(--text-primary)' }}>
                Unassigned Queue
              </h2>
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {mockUnassignedWorkOrders.length} work orders
              </span>
            </div>
          </div>

          {selectedWorkOrders.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge
                className="h-6 px-3 text-[12px]"
                style={{
                  backgroundColor: 'var(--action-primary)',
                  color: 'var(--text-inverted)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {selectedWorkOrders.size} selected
              </Badge>
              <Button
                className="h-10 px-5 text-[14px]"
                style={{
                  backgroundColor: 'var(--action-primary)',
                  color: 'var(--text-inverted)',
                  borderRadius: 'var(--radius-md)',
                }}
                onClick={() => handleAssignment("Sarah L.", selectedWorkOrders.size)}
              >
                Assign Selected
              </Button>
            </div>
          )}
        </div>

        {/* Priority Filters */}
        <div
          className="h-10 px-4 flex items-center gap-2 border-b"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-default)',
          }}
        >
          <button
            className="h-7 px-3 flex items-center gap-2 text-[12px]"
            style={{
              backgroundColor: 'var(--status-critical-bg)',
              color: 'var(--status-critical-text)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            🔴 Emergency (2)
          </button>
          <button
            className="h-7 px-3 flex items-center gap-2 text-[12px]"
            style={{
              backgroundColor: 'var(--status-warning-bg)',
              color: 'var(--status-warning-text)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            🟡 High (2)
          </button>
          <button
            className="h-7 px-3 flex items-center gap-2 text-[12px]"
            style={{
              backgroundColor: 'var(--action-secondary)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            🟢 Medium (0)
          </button>
        </div>

        {/* Work Order List */}
        <div className="flex-1 overflow-y-auto py-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {mockUnassignedWorkOrders.map((wo) => (
            <DraggableWorkOrderCard
              key={wo.id}
              workOrder={wo}
              selected={selectedWorkOrders.has(wo.id)}
              onSelect={() => toggleWorkOrderSelection(wo.id)}
              isUnlocked={isUnlocked}
            />
          ))}
        </div>
      </div>

      {/* Technician Grid */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div
          className="h-16 border-b px-6 flex items-center gap-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="flex-1 flex items-center gap-3">
            <h2 className="text-[24px] leading-[32px] tracking-[-0.25px]" style={{ color: 'var(--text-primary)' }}>
              Available Technicians
            </h2>
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              {mockTechnicians.length} technicians
            </span>
          </div>

          {/* Locked Feature Buttons */}
          <div className="flex items-center gap-2">
            <Button
              className="h-10 px-4 text-[14px] gap-2 border relative opacity-60"
              disabled
              style={{
                backgroundColor: 'var(--action-secondary)',
                borderColor: 'var(--phase-2-border)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'not-allowed',
              }}
            >
              <Lock className="h-4 w-4" style={{ color: 'var(--phase-2-icon)' }} />
              Smart Assignment
            </Button>
            <Button
              className="h-10 px-4 text-[14px] gap-2 border relative opacity-60"
              disabled
              style={{
                backgroundColor: 'var(--action-secondary)',
                borderColor: 'var(--phase-2-border)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'not-allowed',
              }}
            >
              <Lock className="h-4 w-4" style={{ color: 'var(--phase-2-icon)' }} />
              Optimize Routes
            </Button>
            <Button
              className="h-10 px-4 text-[14px] gap-2 border relative opacity-60"
              disabled
              style={{
                backgroundColor: 'var(--action-secondary)',
                borderColor: 'var(--phase-2-border)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'not-allowed',
              }}
            >
              <Lock className="h-4 w-4" style={{ color: 'var(--phase-2-icon)' }} />
              Calendar View
            </Button>
          </div>
        </div>

        {/* Technician Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="grid grid-cols-2 gap-6">
            {mockTechnicians.map((tech) => (
              <TechnicianCard
                key={tech.id}
                technician={tech}
                isValidDrop={false}
                isSkillMismatch={false}
                isAtCapacity={false}
                isDragOver={false}
                onDrop={(workOrderId) => {
                  handleAssignment(tech.name, 1);
                  toast.success(`Work order ${workOrderId} assigned to ${tech.name}`, {
                    description: "Drag-and-drop assignment successful",
                    duration: 3000,
                  });
                }}
                isUnlocked={effectiveUnlock}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Map Panel - Show when unlocked */}
      {effectiveUnlock && (
        <div className="w-[400px] flex flex-col border-l" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
          {/* Map Header */}
          <div className="h-16 border-b px-4 flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
            <div className="flex items-center gap-3">
              <MapIcon className="h-5 w-5" style={{ color: 'var(--phase-2-icon)' }} />
              <h3 className="text-[16px]" style={{ color: 'var(--text-primary)' }}>Live Map</h3>
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
          </div>

          {/* Map View */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Mock Map Container */}
            <div 
              className="w-full h-[400px] border relative mb-4"
              style={{
                backgroundColor: '#E8F0F8',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              {/* Grid overlay to simulate map */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }} />
              
              {/* Building Pins */}
              <div className="absolute top-[20%] left-[30%] flex flex-col items-center">
                <div className="relative group">
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all hover:scale-110"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--action-primary)',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <span className="text-[12px]">🏢</span>
                  </div>
                  <div 
                    className="absolute bottom-full mb-2 px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    Building A (3 WOs)
                  </div>
                  <Badge
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-[10px] p-0"
                    style={{
                      backgroundColor: 'var(--status-critical-bg)',
                      color: 'var(--status-critical-text)',
                      border: '2px solid var(--bg-card)',
                    }}
                  >
                    3
                  </Badge>
                </div>
              </div>

              <div className="absolute top-[45%] left-[60%] flex flex-col items-center">
                <div className="relative group">
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all hover:scale-110"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--action-primary)',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <span className="text-[12px]">🏢</span>
                  </div>
                  <div 
                    className="absolute bottom-full mb-2 px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    Building B (2 WOs)
                  </div>
                  <Badge
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-[10px] p-0"
                    style={{
                      backgroundColor: 'var(--status-warning-bg)',
                      color: 'var(--status-warning-text)',
                      border: '2px solid var(--bg-card)',
                    }}
                  >
                    2
                  </Badge>
                </div>
              </div>

              <div className="absolute top-[65%] left-[25%] flex flex-col items-center">
                <div className="relative group">
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all hover:scale-110"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--action-primary)',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <span className="text-[12px]">🏢</span>
                  </div>
                  <div 
                    className="absolute bottom-full mb-2 px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    Building C (1 WO)
                  </div>
                  <Badge
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-[10px] p-0"
                    style={{
                      backgroundColor: 'var(--status-success-bg)',
                      color: 'var(--status-success-text)',
                      border: '2px solid var(--bg-card)',
                    }}
                  >
                    1
                  </Badge>
                </div>
              </div>

              <div className="absolute top-[30%] left-[75%] flex flex-col items-center">
                <div className="relative group">
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all hover:scale-110"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--action-primary)',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <span className="text-[12px]">🏢</span>
                  </div>
                  <div 
                    className="absolute bottom-full mb-2 px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    Building D (0 WOs)
                  </div>
                </div>
              </div>

              {/* Technician Markers */}
              <div className="absolute top-[25%] left-[35%]">
                <div className="relative group">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center text-[12px] border-4 cursor-pointer transition-all hover:scale-110"
                    style={{
                      backgroundColor: '#10B981',
                      borderColor: 'var(--bg-card)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    RM
                  </div>
                  <div 
                    className="absolute bottom-full mb-2 px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    <div style={{ color: 'var(--text-primary)' }}>Ramon M.</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Building A • On-site</div>
                  </div>
                  {/* Pulse animation */}
                  <div 
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{
                      backgroundColor: '#10B981',
                      opacity: 0.3,
                    }}
                  />
                </div>
              </div>

              <div className="absolute top-[50%] left-[62%]">
                <div className="relative group">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center text-[12px] border-4 cursor-pointer transition-all hover:scale-110"
                    style={{
                      backgroundColor: '#F59E0B',
                      borderColor: 'var(--bg-card)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    SL
                  </div>
                  <div 
                    className="absolute bottom-full mb-2 px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    <div style={{ color: 'var(--text-primary)' }}>Sarah L.</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>In Transit • ETA 15min</div>
                  </div>
                  {/* Movement trail */}
                  <svg className="absolute -left-20 -top-4 w-24 h-12 pointer-events-none opacity-50">
                    <path
                      d="M 0 8 Q 12 4, 24 8 T 48 8 T 72 8 T 96 8"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="4 4"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute top-[68%] left-[28%]">
                <div className="relative group">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center text-[12px] border-4 cursor-pointer transition-all hover:scale-110"
                    style={{
                      backgroundColor: '#10B981',
                      borderColor: 'var(--bg-card)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    MR
                  </div>
                  <div 
                    className="absolute bottom-full mb-2 px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    <div style={{ color: 'var(--text-primary)' }}>Miguel R.</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Building C • On-site</div>
                  </div>
                </div>
              </div>

              {/* Map Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  className="h-8 w-8 flex items-center justify-center border"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <span className="text-[16px]">+</span>
                </button>
                <button
                  className="h-8 w-8 flex items-center justify-center border"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <span className="text-[16px]">−</span>
                </button>
                <button
                  className="h-8 w-8 flex items-center justify-center border"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <span className="text-[10px]">⊙</span>
                </button>
              </div>
            </div>

            {/* Map Legend */}
            <div 
              className="border p-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <h4 className="text-[13px] mb-3" style={{ color: 'var(--text-primary)' }}>Technician Status</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[12px]">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>On-site scheduled</span>
                </div>
                <div className="flex items-center gap-3 text-[12px]">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>In transit</span>
                </div>
                <div className="flex items-center gap-3 text-[12px]">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Off-schedule &gt;20min</span>
                </div>
                <div className="flex items-center gap-3 text-[12px]">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Override active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
