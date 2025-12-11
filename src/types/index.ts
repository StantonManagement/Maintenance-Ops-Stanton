export type Priority = 'emergency' | 'high' | 'normal' | 'low';

export type WorkOrderStatus = 
  | 'NEW'
  | 'ASSIGNED'
  | 'IN PROGRESS'
  | 'Ready for Review'
  | 'COMPLETED'
  | 'Waiting for Access'
  | string;

export interface WorkOrder {
  id: string;
  serviceRequestId: string;
  workOrderNumber: number;
  title: string;
  description: string;
  propertyCode: string;
  propertyAddress: string;
  unit: string;
  ownerEntity?: string;
  residentName: string;
  priority: Priority;
  status: WorkOrderStatus;
  createdDate: string;
  createdTime?: string;
  vendor?: string;
  assignee?: string;
  permissionToEnter?: "yes" | "no" | "n/a";
  residentAvailability?: string;
  hasIssueDetails?: boolean;
  issueDetails?: {
    category: string;
    questions: { question: string; answer: string }[];
  };
  hasScheduling?: boolean;
  schedulingStatus?: string;
  unread?: boolean;
  messageCount?: number;
  unreadCount?: number;
  lastMessage?: string;
  isNew?: boolean;
  isResidentSubmitted?: boolean;
  originalLanguage?: string;
  translation?: string;
  actionsLog?: {
    timestamp: string;
    action: string;
    user: string;
  }[];
  hoursOld?: number;
  // AI Classification Fields
  aiPriority?: 'emergency' | 'high' | 'medium' | 'low' | 'cosmetic';
  aiPriorityConfidence?: number;
  aiPriorityReasoning?: string;
  aiSkillsRequired?: string[];
  aiEstimatedHours?: number;
  aiEstimatedHoursConfidence?: number;
  aiLikelyParts?: {
    highConfidence: string[];
    bringJustInCase: string[];
  };
  aiCategory?: string;
  aiFlags?: {
    safetyConcern: boolean;
    possibleTenantDamage: boolean;
    likelyRecurring: boolean;
    multiVisitLikely: boolean;
  };
  aiClassifiedAt?: string;
  // New fields for Property Operations Dashboard
  propertyId?: string;
  stuckInfo?: WorkOrderStuckInfo;
  hoursUntilSLABreach?: number;
  isOverdue?: boolean;
  lastProgressUpdate?: string;
  scheduledDate?: string; // Adding as it's used in MorningAccountabilityGate
  assignedTechnicianName?: string; // Adding for convenience
  slaStatus?: SLAStatus;
  deadlineInfo?: DeadlineInfo;
}

export type SLAStatus = 'on_track' | 'warning' | 'overdue' | 'completed';

export type DeadlineStage = 
  | 'planning'      // >30 days
  | 'scheduled'     // 14-30 days  
  | 'attention'     // 7-14 days
  | 'urgent'        // 3-7 days
  | 'critical'      // 1-3 days
  | 'emergency'     // 0-1 days
  | 'overdue'       // past due
  | 'completed';

export interface DeadlineInfo {
  stage: DeadlineStage;
  daysRemaining: number;
  hoursRemaining: number;
  suggestedAction: string;
}

// Property operational status for prioritization
export type PropertyOperationalStatus = 
  | 'compliance_critical'    // Section 8 inspection or CAO license imminent
  | 'emergency_active'       // Has active emergency work orders
  | 'backlog_high'          // >5 work orders waiting >72 hours
  | 'on_track'              // Meeting SLA targets
  | 'healthy';              // All clear

// Property health metrics
export interface PropertyHealthMetrics {
  id: string;
  propertyCode: string;
  propertyName: string;
  status: PropertyOperationalStatus;
  totalUnits: number;
  
  // Work order counts
  openWorkOrders: number;
  emergencyCount: number;
  overdueCount: number;           // Past SLA
  stuckCount: number;             // >72 hours no progress
  readyForReviewCount: number;    // Awaiting coordinator approval
  
  // Compliance tracking
  nextInspectionDate?: string;    // ISO date
  inspectionType?: 'section_8' | 'cao_license' | 'city_code' | 'routine';
  daysUntilInspection?: number;
  nextInspectionType?: ComplianceDeadlineType; // New field
  unitsAtRisk?: number; // New field
  inspectionRentAtRisk?: number; // New field
  
  // Performance metrics
  avgResolutionHours: number;
  firstTimeFixRate: number;       // 0-1
  tenantSatisfactionScore: number; // 0-1
  
  // Revenue impact
  monthlyMaintenanceCost: number;
  estimatedLiabilityAtStake: number;
  
  created_at: string;
  updated_at: string;
}

// Work order stuck reasons
export type StuckReason = 
  | 'waiting_parts'
  | 'waiting_access'
  | 'waiting_vendor'
  | 'waiting_approval'
  | 'technician_overloaded'
  | 'unassigned'
  | 'unknown';

// Extended work order status for stuck tracking
export interface WorkOrderStuckInfo {
  workOrderId: string;
  stuckSince: string;             // ISO datetime
  stuckDurationHours: number;
  stuckReason: StuckReason;
  lastActionDate: string;
  lastActionBy: string;
  blockingIssue?: string;
}

export interface Technician {
  id: string;
  name: string;
  capacity: { current: number; max: number };
  skills: string[];
  currentLocation: string;
  inTransit: boolean;
  estimatedArrival?: string;
  status: "available" | "in-transit" | "unavailable";
  assignedWorkOrders: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  pulledForTurnover?: boolean;
  turnoverInfo?: {
    building: string;
    estimatedReturn: string;
  };
}

export interface FilterState {
  status: WorkOrderStatus[];
  priority: Priority[];
  search: string;
  assignedTo?: string;
  dateRange?: { start: Date; end: Date };
}

export interface SortState {
  field: keyof WorkOrder;
  direction: 'asc' | 'desc';
}

// ============================================
// Message Types
// ============================================

export type MessageSenderType = 'coordinator' | 'technician' | 'tenant' | 'system';

export interface Message {
  id: string;
  workOrderId: string;
  senderType: MessageSenderType;
  senderId?: string;
  senderName?: string;
  content: string;
  translatedContent?: string;
  originalLanguage: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttemptMethod = 'phone' | 'text' | 'email' | 'in_person' | 'letter';
export type ContactResult = 'no_answer' | 'refused' | 'rescheduled' | 'successful' | 'voicemail';
export type EscalationStage = 'not_started' | 'initial_attempt' | 'written_notice' | 'caseworker_contact' | 'legal_escalation';

export interface AccessAttempt {
  id: string;
  workOrderId: string;
  attemptNumber: number;
  attemptDate: string;
  attemptMethod: AttemptMethod;
  contactResult: ContactResult;
  notes?: string;
  photoUrls?: string[];
  createdBy: string;
  createdAt: string;
}

export interface AccessEscalationStatus {
  workOrderId: string;
  attemptCount: number;
  lastAttempt: string;
  escalationStage: EscalationStage;
}

export type OverrideReason = 'turnover' | 'emergency' | 'inspection' | 'other';

export interface OverrideAction {
  id: string;
  workOrderId: string;
  overrideBy: string;
  overrideReason: OverrideReason;
  reasonDetails?: string;
  technicianId: string;
  technicianName: string;
  displacedWorkOrders: string[];
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export type ComplianceDeadlineType = 'section_8_annual' | 'section_8_special' | 'cao_license' | 'city_code';
export type ComplianceStatus = 'pending' | 'passed' | 'failed' | 'rescheduled';

export interface ComplianceDeadline {
  id: string;
  propertyId: string;
  deadlineType: ComplianceDeadlineType;
  deadlineDate: string;
  status: ComplianceStatus;
  unitsAtRisk: number;
  monthlyRentAtRisk: number;
  notes?: string;
}

export interface SendMessageInput {
  workOrderId: string;
  senderType: MessageSenderType;
  senderId?: string;
  senderName?: string;
  content: string;
  originalLanguage?: string;
}

export interface MessageThread {
  workOrderId: string;
  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
}

export type VendorRequestStatus = 'pending' | 'responses_received' | 'vendor_selected' | 'completed' | 'cancelled';
export type VendorResponseStatus = 'accepted' | 'declined' | 'quoted' | 'needs_info';

export interface VendorRequest {
  id: string;
  workOrderId: string;
  category: string;
  urgency: 'emergency' | 'standard' | 'project';
  status: VendorRequestStatus;
  requestDetails: string;
  maxBudget?: number;
  responseDeadline: string;
  buildingAccessInfo?: string;
  selectedVendorId?: string;
  responseCount?: number;
  lowestQuote?: number;
  createdBy: string;
  createdAt: string;
}

export interface VendorResponse {
  id: string;
  requestId: string;
  vendorId: string;
  vendorName?: string;
  responseStatus: VendorResponseStatus;
  proposedTimeline?: string;
  quotedAmount?: number;
  declineReason?: string;
  notes?: string;
  respondedAt: string;
}

export type QueueReason = 'incomplete_yesterday' | 'sla_overdue' | 'stuck' | 'access_issue';
export type SuggestedAction = 'reschedule' | 'reassign' | 'escalate';

export interface MorningQueueItem {
  id: string;
  workOrder: WorkOrder;
  queueReason: QueueReason;
  originalScheduledDate?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  suggestedAction: SuggestedAction;
  suggestedReason: string;
}

export interface MorningQueueStats {
  totalItems: number;
  incompleteFromYesterday: number;
  slaOverdue: number;
  stuckWorkOrders: number;
  accessIssues: number;
  yesterdayCompletionRate: number;
}
