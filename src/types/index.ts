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
