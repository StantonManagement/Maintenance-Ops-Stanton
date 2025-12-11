# Current State Audit

## 1. Core Data Types
**File:** [src/types/index.ts](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/types/index.ts:0:0-0:0)

```typescript
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
```

## 2. Key Page Components

### Dispatch Page
**File:** [src/pages/DispatchPage.tsx](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/pages/DispatchPage.tsx:0:0-0:0)
- **Key Features:**
  - Toggles between Grid and Map view.
  - Uses `useTechnicians`, [useWorkOrders](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/hooks/useWorkOrders.ts:6:0-133:1), `useMapData`.
  - Implements `QuickAssignPanel` for drag-and-drop style assignment.
  - Implements `CapacityOverrideModal` for forced assignments.
  - Handles optimistic updates for assignments.

### Work Orders Page
**File:** [src/pages/WorkOrdersPage.tsx](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/pages/WorkOrdersPage.tsx:0:0-0:0)
- **Key Features:**
  - Master-Detail layout (List on left, Preview on right).
  - Uses `WorkOrderList` (shared component).
  - Uses `WorkOrderPreview` for details.
  - URL-driven state (`/work-orders/:id`).

### Morning Queue Page
**File:** [src/pages/MorningQueuePage.tsx](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/pages/MorningQueuePage.tsx:0:0-0:0)
- **Key Features:**
  - Manages "Accountability Queue" (failed/incomplete jobs from previous day).
  - Actions: Approve Reschedule, Reassign, Escalate.
  - Connects to `useCoordinatorMorningQueue` hook.
  - Displays pending count and emergency badges.

### Messages Page
**File:** [src/pages/MessagesPage.tsx](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/pages/MessagesPage.tsx:0:0-0:0)
- **Key Features:**
  - Reuses `WorkOrderList` in "messages" view mode.
  - Uses `ConversationThread` for the actual chat interface.
  - URL-driven selection.

### Property Operations Page
**File:** [src/pages/PropertyOperationsPage.tsx](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/pages/PropertyOperationsPage.tsx:0:0-0:0)
- **Wrapper:** Simply renders `<PropertyOperationsDashboard />`.

**Component:** [src/components/PropertyOperations/PropertyOperationsDashboard.tsx](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/components/PropertyOperations/PropertyOperationsDashboard.tsx:0:0-0:0)
- **Key Features:**
  - Dashboard for high-level property health.
  - Sorts properties by "Operational Urgency" (Compliance > Emergency > Backlog).
  - Aggregates stats (Emergencies, Overdue, Stuck).
  - Renders `PropertyHealthCard` list.

## 3. Navigation
**File:** [src/components/NavigationSidebar.tsx](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/components/NavigationSidebar.tsx:0:0-0:0)
- **State Management:** Controlled component via `activeView` prop, but usually driven by parent `AppRouter` (via URL).
- **Grouping:**
  - **Quick Actions:** Messages (dynamic badge), Approval Queue.
  - **Main Nav:** Work Orders, Duplicates, Morning Queue (Phase 1).
  - **Phase 2/3:** Calendar, Techs, Dispatch, etc. (Visual locking/badges).
- **Badges:** Dynamic badges for unread messages and approval queue items.

## 4. Work Order Status/Lifecycle
- **Definitions:** [WorkOrderStatus](cci:2://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/types/index.ts:2:0-9:11) in [src/types/index.ts](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/types/index.ts:0:0-0:0).
- **Transitions:**
  - **Assignment:** Handled in [useWorkOrders.ts](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/hooks/useWorkOrders.ts:0:0-0:0) -> [assignWorkOrder](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/hooks/useWorkOrders.ts:59:2-90:3). Writes to `work_order_actions` table with type `assignment`.
  - **Status Change:** Handled in [useWorkOrders.ts](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/hooks/useWorkOrders.ts:0:0-0:0) -> [updateWorkOrderStatus](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/hooks/useWorkOrders.ts:92:2-123:3). Writes to `work_order_actions` table with type `status_change`.
- **Deadlines:**
  - Logic found in [src/services/analyticsService.ts](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/analyticsService.ts:0:0-0:0) -> [calculateOverdueCount](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/analyticsService.ts:71:0-104:1).
  - Hardcoded SLA rules in service: Emergency (2h), High (24h), Medium (72h), Low (168h).

## 5. Database Schema
**Core Tables (from [core_schema.sql](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/supabase%20tables/core_schema.sql:0:0-0:0) & [work_order_actions.sql](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/supabase%20tables/work_order_actions.sql:0:0-0:0)):**

1.  **`AF_work_order_new`**: Read-only source of truth for work orders (likely synced from AppFolio).
2.  **`work_order_actions`**: Write-layer for our app. Tracks assignments, status changes, notes.
    *   Columns: `work_order_id`, `action_type`, `action_data` (JSON), `created_by`.
3.  **`technicians`**:
    *   Columns: `id`, `name`, `status` (available, busy, etc.), `skills` (array), `current_load`, `max_daily_workload`.
4.  **`work_order_assignments`**:
    *   Columns: `work_order_id`, `technician_id`, `scheduled_date`, `status`, `assigned_by`.
5.  **`messages`**:
    *   Columns: `work_order_id`, `sender_type`, `content`, `is_read`.

## 6. Services/API Layer
**File:** [src/services/supabase.ts](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/supabase.ts:0:0-0:0)
- **Role:** Main Supabase client configuration and type definitions for all DB tables.
- **Key Types:** [WorkOrderFromDB](cci:2://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/supabase.ts:157:0-219:1), [TechnicianDB](cci:2://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/supabase.ts:28:0-38:1), [MessageDB](cci:2://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/supabase.ts:142:0-155:1).

**File:** [src/services/analyticsService.ts](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/analyticsService.ts:0:0-0:0)
- **Role:** Aggregation logic.
- **Key Functions:**
  - [calculateAvgResponseTime](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/analyticsService.ts:2:0-52:1)
  - [calculateTenantSatisfaction](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/analyticsService.ts:54:0-69:1)
  - [calculateOverdueCount](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/analyticsService.ts:71:0-104:1) (SLA logic here)
  - [getPropertyPerformance](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/services/analyticsService.ts:144:0-178:1)

**File:** [src/hooks/useWorkOrders.ts](cci:7://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/hooks/useWorkOrders.ts:0:0-0:0)
- **Role:** Data fetching and mutation hook.
- **Key Functions:**
  - [fetchWorkOrders](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/hooks/useWorkOrders.ts:33:2-57:3): Joins `AF_work_order_new` with local data.
  - [assignWorkOrder](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/hooks/useWorkOrders.ts:59:2-90:3): Writes to `work_order_actions`.
  - [updateWorkOrderStatus](cci:1://file:///f:/Cursor%20Apps/Maintenance%20Ops%20Center/src/hooks/useWorkOrders.ts:92:2-123:3): Writes to `work_order_actions`.