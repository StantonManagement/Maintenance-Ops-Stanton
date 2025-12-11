import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, FileText, Image as ImageIcon } from "lucide-react";
import { useWorkOrder } from '@/hooks/useWorkOrders';
import { StatusBadge } from './StatusBadge';
import { DeadlineCountdown } from '@/components/ui/DeadlineCountdown';
import { ConversationThread } from "@/components/ConversationThread";
import { AssignTechnicianModal } from './AssignTechnicianModal';
import { ChangeStatusModal } from './ChangeStatusModal';
import { useRole } from '@/providers/RoleProvider';

interface WorkOrderDetailPanelProps {
  workOrderId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export function WorkOrderDetailPanel({ workOrderId, onClose, onRefresh }: WorkOrderDetailPanelProps) {
  const { workOrder, loading, error } = useWorkOrder(workOrderId || undefined);
  const { canAssignTechnician } = useRole();
  const open = !!workOrderId;
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const handleActionComplete = () => {
    setAssignModalOpen(false);
    setStatusModalOpen(false);
    onRefresh?.();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:w-[540px] sm:max-w-none p-0 flex flex-col">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center flex-col gap-4 p-8 text-center">
            <p className="text-destructive font-medium">Failed to load work order</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : workOrder ? (
          <>
            <SheetHeader className="p-6 pb-2 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">#{workOrder.workOrderNumber}</Badge>
                    <StatusBadge status={workOrder.status} />
                    {workOrder.priority === 'emergency' && (
                      <Badge variant="destructive" className="text-[10px] h-5 px-1.5 uppercase">Emergency</Badge>
                    )}
                  </div>
                  <SheetTitle className="text-xl leading-tight mt-2">{workOrder.title}</SheetTitle>
                  <SheetDescription className="line-clamp-2">
                     {workOrder.propertyAddress} • Unit {workOrder.unit} • {workOrder.residentName}
                  </SheetDescription>
                </div>
                {/* Close button is handled by Sheet primitive but we can add actions here */}
              </div>
              
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <DeadlineCountdown deadline={workOrder.deadlineInfo ? new Date(Date.now() + workOrder.deadlineInfo.hoursRemaining * 3600000).toISOString() : null} size="sm" />
                {workOrder.assignee && (
                  <span>Assigned: <span className="text-foreground font-medium">{workOrder.assignee}</span></span>
                )}
              </div>
            </SheetHeader>

            <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b">
                <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-6">
                  <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                    <FileText className="mr-2 h-4 w-4" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Messages
                    {workOrder.messageCount && workOrder.messageCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">{workOrder.messageCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="photos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Photos
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="details" className="p-6 m-0 space-y-6">
                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Description</h3>
                    <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed">
                      {workOrder.description}
                    </div>
                  </div>

                  {/* AI Analysis (Placeholder/Real) */}
                  {(workOrder.aiPriority || workOrder.aiCategory) && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        AI Analysis
                        <Badge variant="secondary" className="text-[10px]">Beta</Badge>
                      </h3>
                      <div className="grid gap-3 p-4 rounded-lg border bg-card text-sm">
                        {workOrder.aiCategory && (
                          <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">Category</span>
                            <span className="col-span-2 font-medium">{workOrder.aiCategory}</span>
                          </div>
                        )}
                         {workOrder.aiLikelyParts && workOrder.aiLikelyParts.highConfidence.length > 0 && (
                          <div className="grid grid-cols-3">
                            <span className="text-muted-foreground">Parts</span>
                            <div className="col-span-2 flex flex-wrap gap-1">
                                {workOrder.aiLikelyParts.highConfidence.map((part: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs">{part}</Badge>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Access & Contact</h3>
                    <div className="grid gap-3 p-4 rounded-lg border bg-card text-sm">
                      <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Resident</span>
                        <span className="col-span-2 font-medium">{workOrder.residentName}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Entry Permission</span>
                         <span className="col-span-2 font-medium capitalize">{workOrder.permissionToEnter || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="messages" className="h-full m-0">
                   <ConversationThread workOrder={workOrder} />
                </TabsContent>

                <TabsContent value="photos" className="p-6 m-0">
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                    <p>No photos uploaded yet</p>
                    <Button variant="link">Upload Photos</Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            
            <div className="p-4 border-t bg-background mt-auto">
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => setStatusModalOpen(true)}>
                      Change Status
                    </Button>
                    {canAssignTechnician && (
                      <Button onClick={() => setAssignModalOpen(true)}>
                        {workOrder.assignee ? 'Reassign' : 'Assign Technician'}
                      </Button>
                    )}
                </div>
            </div>

            {/* Assign Technician Modal */}
            <AssignTechnicianModal
              open={assignModalOpen}
              onOpenChange={setAssignModalOpen}
              workOrderId={workOrder.id}
              workOrderCategory={workOrder.aiCategory || workOrder.issueDetails?.category}
              onAssigned={handleActionComplete}
            />

            {/* Change Status Modal */}
            <ChangeStatusModal
              open={statusModalOpen}
              onOpenChange={setStatusModalOpen}
              workOrderId={workOrder.id}
              currentStatus={workOrder.status}
              onStatusChanged={handleActionComplete}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No details found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
