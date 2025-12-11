import { useState } from "react";
import { X, Phone, MapPin, Clock, User, Calendar, CheckCircle, Image, MessageSquare, FileText, History, Zap, DollarSign } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { WorkOrder } from "../types";
import { ConversationThread } from "./ConversationThread";
import PhotoViewer from "./PhotoViewer";
import { FinancialClassification } from "./work-orders/FinancialClassification";
import { AISuggestionCard, AIClassificationCard } from "./ai";
import { useAIClassification, AIClassification } from "../hooks/useAIClassification";

interface WorkOrderDetailViewProps {
  workOrder: WorkOrder;
  onClose: () => void;
}

const mockPhotos = [
  { id: 1, url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop", caption: "Kitchen sink leak", timestamp: "2:34 PM" },
  { id: 2, url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&h=600&fit=crop", caption: "Water damage under sink", timestamp: "2:35 PM" },
  { id: 3, url: "https://images.unsplash.com/photo-1604077350836-60dc2f97c78b?w=800&h=600&fit=crop", caption: "Pipe connection", timestamp: "2:36 PM" },
];

const mockHistory = [
  { id: 1, action: "Work order created", user: "System", timestamp: "Today at 2:30 PM", type: "created" },
  { id: 2, action: "Photos uploaded by tenant", user: "Maria Lopez", timestamp: "Today at 2:34 PM", type: "photo" },
  { id: 3, action: "Message sent to tenant", user: "You", timestamp: "Today at 2:45 PM", type: "message" },
  { id: 4, action: "Work order assigned to Ramon M.", user: "You", timestamp: "Today at 3:15 PM", type: "assigned" },
];

export default function WorkOrderDetailView({ workOrder, onClose }: WorkOrderDetailViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [aiClassification, setAiClassification] = useState<AIClassification | null>(() => {
    if (workOrder.aiClassifiedAt && workOrder.aiPriority) {
      return {
        priority: workOrder.aiPriority,
        priorityConfidence: workOrder.aiPriorityConfidence || 0,
        priorityReasoning: workOrder.aiPriorityReasoning || '',
        skillsRequired: workOrder.aiSkillsRequired || [],
        certificationRequired: null,
        estimatedHours: workOrder.aiEstimatedHours || 0,
        estimatedHoursConfidence: workOrder.aiEstimatedHoursConfidence || 0,
        timeFactors: [],
        likelyParts: workOrder.aiLikelyParts || { highConfidence: [], bringJustInCase: [] },
        category: workOrder.aiCategory || 'other',
        subcategory: null,
        flags: workOrder.aiFlags || {
          safetyConcern: false,
          possibleTenantDamage: false,
          likelyRecurring: false,
          multiVisitLikely: false,
        },
      } as AIClassification;
    }
    return null;
  });

  const { classify, classifying, overridePriority } = useAIClassification();

  const handleClassify = async () => {
    const result = await classify({
      id: workOrder.serviceRequestId || workOrder.id,
      description: workOrder.description || workOrder.title,
      property: workOrder.propertyAddress,
      unit: workOrder.unit,
      residentName: workOrder.residentName,
      createdAt: workOrder.createdDate,
    });
    if (result) {
      setAiClassification(result);
    }
  };

  const handleOverridePriority = async (newPriority: string) => {
    if (aiClassification) {
      await overridePriority(
        workOrder.serviceRequestId || workOrder.id,
        aiClassification.priority,
        newPriority
      );
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-5xl max-h-[90vh] rounded-lg flex flex-col animate-fade-in"
          style={{ backgroundColor: "var(--bg-card)", margin: "24px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-start justify-between p-6 border-b"
            style={{ borderColor: "var(--border-default)" }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-1 h-12 rounded-full"
                  style={{
                    backgroundColor:
                      workOrder.priority === "emergency"
                        ? "var(--status-critical-icon)"
                        : workOrder.priority === "high"
                        ? "var(--status-warning-icon)"
                        : "var(--status-neutral-icon)",
                  }}
                />
                <div className="flex-1">
                  <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
                    {workOrder.title}
                  </h2>
                  <div className="flex items-center gap-4">
                    <Badge
                      style={{
                        backgroundColor:
                          workOrder.priority === "emergency"
                            ? "var(--status-critical-bg)"
                            : workOrder.priority === "high"
                            ? "var(--status-warning-bg)"
                            : "var(--status-neutral-bg)",
                        color:
                          workOrder.priority === "emergency"
                            ? "var(--status-critical-text)"
                            : workOrder.priority === "high"
                            ? "var(--status-warning-text)"
                            : "var(--status-neutral-text)",
                        border: `1px solid ${
                          workOrder.priority === "emergency"
                            ? "var(--status-critical-border)"
                            : workOrder.priority === "high"
                            ? "var(--status-warning-border)"
                            : "var(--status-neutral-border)"
                        }`,
                      }}
                    >
                      {workOrder.priority.toUpperCase()}
                    </Badge>
                    <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                      {workOrder.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} style={{ color: "var(--text-tertiary)" }} />
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    {workOrder.propertyAddress} · Unit {workOrder.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} style={{ color: "var(--text-tertiary)" }} />
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    {workOrder.residentName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} style={{ color: "var(--text-tertiary)" }} />
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    {workOrder.hoursOld ? `${workOrder.hoursOld} hours ago` : 'Just now'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} style={{ color: "var(--text-tertiary)" }} />
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    (555) 123-4567
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Auto-Notify</span>
                <Switch defaultChecked />
              </div>
              <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full">
                <X size={20} />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="messages" className="flex-1 flex flex-col overflow-hidden">
            <TabsList
              className="w-full justify-start border-b rounded-none h-14 px-6 gap-6"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border-default)",
              }}
            >
              <TabsTrigger
                value="messages"
                className="gap-2 data-[state=active]:border-b-2"
                style={{
                  borderColor: "var(--action-primary)",
                }}
              >
                <MessageSquare size={16} />
                Messages
                {workOrder.messageCount && (
                  <Badge
                    className="ml-1 h-5 min-w-5 px-1.5"
                    style={{
                      backgroundColor: "var(--status-critical-bg)",
                      color: "var(--status-critical-text)",
                    }}
                  >
                    {workOrder.messageCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-2">
                <FileText size={16} />
                Details
              </TabsTrigger>
              <TabsTrigger value="photos" className="gap-2">
                <Image size={16} />
                Photos
                <Badge className="ml-1 h-5 min-w-5 px-1.5">3</Badge>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History size={16} />
                History
              </TabsTrigger>
              <TabsTrigger value="financials" className="gap-2">
                <DollarSign size={16} />
                Financials
              </TabsTrigger>
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages" className="flex-1 overflow-hidden m-0">
              <div className="h-full">
                <ConversationThread workOrder={workOrder} />
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="flex-1 overflow-y-auto p-6 m-0">
              <div className="max-w-3xl space-y-6">
                {/* AI Classification */}
                <AIClassificationCard
                  classification={aiClassification}
                  isClassifying={classifying === (workOrder.serviceRequestId || workOrder.id)}
                  onClassify={handleClassify}
                  onOverridePriority={handleOverridePriority}
                  workOrderId={workOrder.serviceRequestId || workOrder.id}
                />

                {/* Legacy AI Suggestion - shown if no AI classification yet */}
                {!aiClassification && (
                  <AISuggestionCard
                    title="Priority Upgrade Suggested"
                    description="Based on 'leak' and 'damage', this should be classified as Emergency."
                    confidence={92}
                    reasoning="Keywords detected: 'leak', 'damage', 'kitchen sink'. Water damage risks require immediate attention."
                    onAccept={() => console.log('Accepted')}
                    onReject={() => console.log('Rejected')}
                  />
                )}

                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
                    Work Order Information
                  </h3>
                  <div
                    className="rounded-lg border p-4 space-y-3"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <div className="flex justify-between">
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Status</span>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>{workOrder.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Priority</span>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>{workOrder.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Created</span>
                      <span style={{ fontSize: "14px" }}>Today at 2:30 PM</span>
                    </div>
                    {workOrder.assignee && (
                      <div className="flex justify-between">
                        <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Assigned To</span>
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>{workOrder.assignee}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
                    Description
                  </h3>
                  <div
                    className="rounded-lg border p-4"
                    style={{
                      borderColor: "var(--border-default)",
                      backgroundColor: "var(--bg-hover)",
                    }}
                  >
                    <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
                      Tenant reported a significant leak under the kitchen sink. Water is dripping
                      from the pipe connection and causing damage to the cabinet. Requires immediate
                      attention to prevent further damage.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
                    Location Details
                  </h3>
                  <div
                    className="rounded-lg border p-4 space-y-3"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <div className="flex justify-between">
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Building</span>
                      <span style={{ fontSize: "14px" }}>Building A</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Unit</span>
                      <span style={{ fontSize: "14px" }}>205</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Floor</span>
                      <span style={{ fontSize: "14px" }}>2nd Floor</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Access</span>
                      <span style={{ fontSize: "14px" }}>Tenant will be home after 2pm</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos" className="flex-1 overflow-y-auto p-6 m-0">
              <div className="grid grid-cols-3 gap-4">
                {mockPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-smooth hover-lift"
                    style={{ borderColor: "var(--border-default)" }}
                    onClick={() => setSelectedPhoto(index)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 p-3"
                      style={{
                        background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                      }}
                    >
                      <p style={{ fontSize: "12px", color: "white" }}>{photo.caption}</p>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>
                        {photo.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Financials Tab */}
            <TabsContent value="financials" className="flex-1 overflow-y-auto p-6 m-0">
              <div className="max-w-3xl">
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
                  Financial Classification
                </h3>
                <FinancialClassification 
                  description={workOrder.description} 
                  workType={workOrder.title} 
                  onSave={(data) => console.log('Saved:', data)} 
                />
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="flex-1 overflow-y-auto p-6 m-0">
              <div className="max-w-3xl">
                <div className="space-y-4">
                  {mockHistory.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor:
                              item.type === "created"
                                ? "var(--status-neutral-bg)"
                                : item.type === "assigned"
                                ? "var(--status-success-bg)"
                                : "var(--bg-hover)",
                            color:
                              item.type === "created"
                                ? "var(--status-neutral-icon)"
                                : item.type === "assigned"
                                ? "var(--status-success-icon)"
                                : "var(--text-secondary)",
                          }}
                        >
                          {item.type === "created" && <Calendar size={16} />}
                          {item.type === "assigned" && <CheckCircle size={16} />}
                          {item.type === "message" && <MessageSquare size={16} />}
                          {item.type === "photo" && <Image size={16} />}
                        </div>
                        {index < mockHistory.length - 1 && (
                          <div
                            className="w-0.5 flex-1 mt-2"
                            style={{ backgroundColor: "var(--border-default)", height: "24px" }}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                          {item.action}
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          {item.user} · {item.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Photo Viewer */}
      {selectedPhoto !== null && (
        <PhotoViewer
          photos={mockPhotos}
          initialIndex={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
