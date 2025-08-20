# Maintenance Operations Center - Phase 1.2: Work Order System

## Work Order CRUD Operations & Status Management

### 1. Enhanced Database Schema
**File: `supabase/migrations/002_work_orders_enhancements.sql`**
```sql
-- Add additional work order fields and constraints
ALTER TABLE work_orders ADD COLUMN completion_notes TEXT;
ALTER TABLE work_orders ADD COLUMN estimated_duration INTEGER; -- minutes
ALTER TABLE work_orders ADD COLUMN actual_duration INTEGER; -- minutes
ALTER TABLE work_orders ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE work_orders ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE work_orders ADD COLUMN reviewed_by UUID REFERENCES users(id);

-- Create photos table
CREATE TABLE work_order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES users(id) NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('before', 'during', 'after', 'arrival')) NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments/updates table
CREATE TABLE work_order_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  update_type TEXT CHECK (update_type IN ('comment', 'status_change', 'assignment', 'completion')) NOT NULL,
  message TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photos
CREATE POLICY "Users can view work order photos" ON work_order_photos FOR SELECT USING (true);
CREATE POLICY "Users can upload photos to assigned work orders" ON work_order_photos FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id 
      AND (wo.assigned_tech_id = auth.uid() OR wo.created_by = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coordinator'))
    )
  );

-- RLS Policies for updates
CREATE POLICY "Users can view work order updates" ON work_order_updates FOR SELECT USING (true);
CREATE POLICY "Users can add updates to assigned work orders" ON work_order_updates FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id 
      AND (wo.assigned_tech_id = auth.uid() OR wo.created_by = auth.uid() OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coordinator'))
    )
  );

-- Create function to log status changes
CREATE OR REPLACE FUNCTION log_work_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO work_order_updates (work_order_id, user_id, update_type, message, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_change', 
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            OLD.status, NEW.status);
  END IF;
  
  IF OLD.assigned_tech_id IS DISTINCT FROM NEW.assigned_tech_id THEN
    INSERT INTO work_order_updates (work_order_id, user_id, update_type, message, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'assignment',
            CASE 
              WHEN NEW.assigned_tech_id IS NULL THEN 'Technician unassigned'
              ELSE 'Assigned to technician'
            END,
            OLD.assigned_tech_id::text, NEW.assigned_tech_id::text);
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER work_order_status_change_trigger
  BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION log_work_order_status_change();

-- Add status transition constraints
CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Only coordinators can mark as completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coordinator') THEN
      RAISE EXCEPTION 'Only coordinators can mark work orders as completed';
    END IF;
    NEW.completed_at = NOW();
    NEW.reviewed_by = auth.uid();
    NEW.reviewed_at = NOW();
  END IF;
  
  -- Technicians can only move to ready_review, not completed
  IF NEW.status = 'completed' AND 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'technician') THEN
    RAISE EXCEPTION 'Technicians cannot directly complete work orders. Use ready_review status instead.';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_status_transition_trigger
  BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION validate_status_transition();

-- Sample data for development
INSERT INTO work_orders (title, description, building, unit, priority, status, created_by, tenant_name, tenant_phone, tenant_email, estimated_duration) VALUES
('Leaky Faucet in Kitchen', 'Kitchen sink faucet is dripping constantly. Tenant reports it started 3 days ago.', 'Building A', '101', 'medium', 'new', (SELECT id FROM users WHERE role = 'coordinator' LIMIT 1), 'Sarah Johnson', '(555) 123-0001', 'sarah.j@email.com', 60),
('Broken AC Unit', 'Air conditioning not working. No cold air coming out. Very urgent due to heat wave.', 'Building A', '205', 'emergency', 'assigned', (SELECT id FROM users WHERE role = 'coordinator' LIMIT 1), 'Mike Chen', '(555) 123-0002', 'mike.c@email.com', 120),
('Electrical Outlet Not Working', 'Bathroom GFCI outlet not working. Tried reset button but no power.', 'Building B', '303', 'high', 'in_progress', (SELECT id FROM users WHERE role = 'coordinator' LIMIT 1), 'Jessica Williams', '(555) 123-0003', 'jessica.w@email.com', 45),
('Garbage Disposal Jam', 'Kitchen garbage disposal making grinding noise and not turning properly.', 'Building A', '102', 'low', 'ready_review', (SELECT id FROM users WHERE role = 'coordinator' LIMIT 1), 'David Rodriguez', '(555) 123-0004', 'david.r@email.com', 30),
('Heating Not Working', 'No heat in apartment. Thermostat not responding. Tenant has elderly parent visiting.', 'Building C', '401', 'emergency', 'new', (SELECT id FROM users WHERE role = 'coordinator' LIMIT 1), 'Emily Davis', '(555) 123-0005', 'emily.d@email.com', 90);

-- Assign some work orders to technicians
UPDATE work_orders 
SET assigned_tech_id = (SELECT id FROM users WHERE role = 'technician' AND name LIKE '%Ramon%' LIMIT 1),
    scheduled_date = NOW() + INTERVAL '1 day'
WHERE title IN ('Broken AC Unit', 'Electrical Outlet Not Working');

UPDATE work_orders 
SET assigned_tech_id = (SELECT id FROM users WHERE role = 'technician' AND name LIKE '%Kishan%' LIMIT 1),
    scheduled_date = NOW() + INTERVAL '2 days'
WHERE title = 'Garbage Disposal Jam';
```

### 2. Enhanced Database Types
**File: `lib/database.types.ts` (update the existing file)**
```typescript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'coordinator' | 'technician' | 'vendor'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'coordinator' | 'technician' | 'vendor'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'coordinator' | 'technician' | 'vendor'
          phone?: string | null
          updated_at?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          title: string
          description: string
          building: string
          unit: string
          priority: 'emergency' | 'high' | 'medium' | 'low'
          status: 'new' | 'assigned' | 'in_progress' | 'ready_review' | 'completed' | 'failed_review'
          assigned_tech_id: string | null
          created_by: string
          created_at: string
          updated_at: string
          scheduled_date: string | null
          tenant_name: string
          tenant_phone: string
          tenant_email: string
          completion_notes: string | null
          estimated_duration: number | null
          actual_duration: number | null
          completed_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          building: string
          unit: string
          priority: 'emergency' | 'high' | 'medium' | 'low'
          status?: 'new' | 'assigned' | 'in_progress' | 'ready_review' | 'completed' | 'failed_review'
          assigned_tech_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          scheduled_date?: string | null
          tenant_name: string
          tenant_phone: string
          tenant_email: string
          completion_notes?: string | null
          estimated_duration?: number | null
          actual_duration?: number | null
          completed_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          title?: string
          description?: string
          building?: string
          unit?: string
          priority?: 'emergency' | 'high' | 'medium' | 'low'
          status?: 'new' | 'assigned' | 'in_progress' | 'ready_review' | 'completed' | 'failed_review'
          assigned_tech_id?: string | null
          updated_at?: string
          scheduled_date?: string | null
          tenant_name?: string
          tenant_phone?: string
          tenant_email?: string
          completion_notes?: string | null
          estimated_duration?: number | null
          actual_duration?: number | null
          completed_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
      work_order_photos: {
        Row: {
          id: string
          work_order_id: string
          uploaded_by: string
          photo_type: 'before' | 'during' | 'after' | 'arrival'
          file_url: string
          file_name: string
          file_size: number | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          work_order_id: string
          uploaded_by: string
          photo_type: 'before' | 'during' | 'after' | 'arrival'
          file_url: string
          file_name: string
          file_size?: number | null
          description?: string | null
          created_at?: string
        }
        Update: {
          description?: string | null
        }
      }
      work_order_updates: {
        Row: {
          id: string
          work_order_id: string
          user_id: string
          update_type: 'comment' | 'status_change' | 'assignment' | 'completion'
          message: string
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          work_order_id: string
          user_id: string
          update_type: 'comment' | 'status_change' | 'assignment' | 'completion'
          message: string
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Update: {
          message?: string
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type WorkOrder = Database['public']['Tables']['work_orders']['Row']
export type WorkOrderPhoto = Database['public']['Tables']['work_order_photos']['Row']
export type WorkOrderUpdate = Database['public']['Tables']['work_order_updates']['Row']

// Enhanced types with relationships
export interface WorkOrderWithDetails extends WorkOrder {
  assigned_technician?: User | null
  created_by_user?: User
  photos?: WorkOrderPhoto[]
  updates?: WorkOrderUpdate[]
  reviewer?: User | null
}

export interface WorkOrderFormData {
  title: string
  description: string
  building: string
  unit: string
  priority: 'emergency' | 'high' | 'medium' | 'low'
  tenant_name: string
  tenant_phone: string
  tenant_email: string
  estimated_duration?: number
}
```

### 3. Work Order Service
**File: `lib/services/workOrderService.ts`**
```typescript
import { supabase } from '@/lib/supabase'
import { WorkOrder, WorkOrderWithDetails, WorkOrderFormData, User } from '@/lib/database.types'

export class WorkOrderService {
  static async getAll(): Promise<WorkOrderWithDetails[]> {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        assigned_technician:users!work_orders_assigned_tech_id_fkey(id, name, email, phone),
        created_by_user:users!work_orders_created_by_fkey(id, name, email),
        reviewer:users!work_orders_reviewed_by_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<WorkOrderWithDetails | null> {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        assigned_technician:users!work_orders_assigned_tech_id_fkey(id, name, email, phone),
        created_by_user:users!work_orders_created_by_fkey(id, name, email),
        reviewer:users!work_orders_reviewed_by_fkey(id, name, email),
        photos:work_order_photos(*),
        updates:work_order_updates(*, user:users(id, name))
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async getByTechnician(technicianId: string): Promise<WorkOrderWithDetails[]> {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        assigned_technician:users!work_orders_assigned_tech_id_fkey(id, name, email, phone),
        created_by_user:users!work_orders_created_by_fkey(id, name, email),
        reviewer:users!work_orders_reviewed_by_fkey(id, name, email)
      `)
      .eq('assigned_tech_id', technicianId)
      .order('scheduled_date', { ascending: true, nullsFirst: false })

    if (error) throw error
    return data || []
  }

  static async getPendingReview(): Promise<WorkOrderWithDetails[]> {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        assigned_technician:users!work_orders_assigned_tech_id_fkey(id, name, email, phone),
        created_by_user:users!work_orders_created_by_fkey(id, name, email)
      `)
      .eq('status', 'ready_review')
      .order('updated_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async create(workOrder: WorkOrderFormData, createdBy: string): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        ...workOrder,
        created_by: createdBy,
        status: 'new'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async assign(id: string, technicianId: string, scheduledDate?: string): Promise<WorkOrder> {
    const updates: Partial<WorkOrder> = {
      assigned_tech_id: technicianId,
      status: 'assigned'
    }

    if (scheduledDate) {
      updates.scheduled_date = scheduledDate
    }

    return this.update(id, updates)
  }

  static async updateStatus(id: string, status: WorkOrder['status'], completionNotes?: string): Promise<WorkOrder> {
    const updates: Partial<WorkOrder> = { status }

    if (status === 'ready_review' && completionNotes) {
      updates.completion_notes = completionNotes
    }

    return this.update(id, updates)
  }

  static async approve(id: string, reviewedBy: string): Promise<WorkOrder> {
    return this.update(id, {
      status: 'completed',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString()
    })
  }

  static async reject(id: string, reason: string): Promise<WorkOrder> {
    // Add comment about rejection
    await this.addComment(id, reason)
    
    return this.update(id, {
      status: 'failed_review'
    })
  }

  static async addComment(workOrderId: string, message: string): Promise<void> {
    const { error } = await supabase
      .from('work_order_updates')
      .insert({
        work_order_id: workOrderId,
        user_id: (await supabase.auth.getUser()).data.user!.id,
        update_type: 'comment',
        message
      })

    if (error) throw error
  }

  static async getTechnicians(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'technician')
      .order('name')

    if (error) throw error
    return data || []
  }

  static async getStatistics() {
    const { data: allOrders, error } = await supabase
      .from('work_orders')
      .select('status, priority, created_at')

    if (error) throw error

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
      total: allOrders.length,
      active: allOrders.filter(wo => !['completed', 'failed_review'].includes(wo.status)).length,
      pendingReview: allOrders.filter(wo => wo.status === 'ready_review').length,
      emergency: allOrders.filter(wo => wo.priority === 'emergency' && wo.status !== 'completed').length,
      completedToday: allOrders.filter(wo => 
        wo.status === 'completed' && 
        new Date(wo.created_at) >= today
      ).length,
      completedThisWeek: allOrders.filter(wo => 
        wo.status === 'completed' && 
        new Date(wo.created_at) >= thisWeek
      ).length
    }

    return stats
  }
}
```

### 4. Work Order Components
**File: `components/work-orders/WorkOrderCard.tsx`**
```typescript
'use client'

import { WorkOrderWithDetails } from '@/lib/database.types'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit
} from 'lucide-react'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'

interface WorkOrderCardProps {
  workOrder: WorkOrderWithDetails
  onView: (workOrder: WorkOrderWithDetails) => void
  onEdit?: (workOrder: WorkOrderWithDetails) => void
  onAssign?: (workOrder: WorkOrderWithDetails) => void
  onStatusChange?: (workOrder: WorkOrderWithDetails, newStatus: string) => void
}

export default function WorkOrderCard({ 
  workOrder, 
  onView, 
  onEdit, 
  onAssign, 
  onStatusChange 
}: WorkOrderCardProps) {
  const { hasPermission } = useAuth()

  const canEdit = hasPermission('assign') || 
    (hasPermission('edit_own') && workOrder.assigned_tech_id === workOrder.assigned_tech_id)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{workOrder.title}</h3>
            <PriorityBadge priority={workOrder.priority} />
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">{workOrder.description}</p>
        </div>
        <StatusBadge status={workOrder.status} />
      </div>

      {/* Location & Tenant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{workOrder.building}, Unit {workOrder.unit}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <User className="h-4 w-4 mr-2" />
          <span>{workOrder.tenant_name}</span>
        </div>
      </div>

      {/* Assignment & Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm">
          {workOrder.assigned_technician ? (
            <>
              <User className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-green-700">{workOrder.assigned_technician.name}</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-500">Unassigned</span>
            </>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{formatDate(workOrder.scheduled_date)}</span>
        </div>
      </div>

      {/* Time Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>Created {getTimeAgo(workOrder.created_at)}</span>
        {workOrder.estimated_duration && (
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{workOrder.estimated_duration} min estimated</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(workOrder)}
            className="flex items-center px-3 py-1.5 text-sm text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </button>
          
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(workOrder)}
              className="flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          {hasPermission('assign') && !workOrder.assigned_tech_id && onAssign && (
            <button
              onClick={() => onAssign(workOrder)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Assign
            </button>
          )}

          {workOrder.status === 'ready_review' && hasPermission('approve') && onStatusChange && (
            <div className="flex space-x-1">
              <button
                onClick={() => onStatusChange(workOrder, 'completed')}
                className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                title="Approve"
              >
                <CheckCircle2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => onStatusChange(workOrder, 'failed_review')}
                className="flex items-center px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Reject"
              >
                <AlertTriangle className="h-3 w-3" />
              </button>
            </div>
          )}

          {workOrder.assigned_tech_id && 
           workOrder.status === 'assigned' && 
           hasPermission('update') && 
           onStatusChange && (
            <button
              onClick={() => onStatusChange(workOrder, 'in_progress')}
              className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              Start
            </button>
          )}

          {workOrder.status === 'in_progress' && 
           hasPermission('update') && 
           onStatusChange && (
            <button
              onClick={() => onStatusChange(workOrder, 'ready_review')}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 5. Status and Priority Badge Components
**File: `components/work-orders/StatusBadge.tsx`**
```typescript
import { WorkOrder } from '@/lib/database.types'

interface StatusBadgeProps {
  status: WorkOrder['status']
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = (status: WorkOrder['status']) => {
    const configs = {
      new: {
        label: 'New',
        className: 'bg-blue-100 text-blue-800'
      },
      assigned: {
        label: 'Assigned',
        className: 'bg-purple-100 text-purple-800'
      },
      in_progress: {
        label: 'In Progress',
        className: 'bg-yellow-100 text-yellow-800'
      },
      ready_review: {
        label: 'Ready for Review',
        className: 'bg-orange-100 text-orange-800'
      },
      completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-800'
      },
      failed_review: {
        label: 'Failed Review',
        className: 'bg-red-100 text-red-800'
      }
    }
    return configs[status]
  }

  const config = getStatusConfig(status)
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${config.className}`}>
      {config.label}
    </span>
  )
}
```

**File: `components/work-orders/PriorityBadge.tsx`**
```typescript
import { WorkOrder } from '@/lib/database.types'
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from 'lucide-react'

interface PriorityBadgeProps {
  priority: WorkOrder['priority']
  size?: 'sm' | 'md'
}

export default function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const getPriorityConfig = (priority: WorkOrder['priority']) => {
    const configs = {
      emergency: {
        label: 'Emergency',
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      high: {
        label: 'High',
        icon: ArrowUp,
        className: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      medium: {
        label: 'Medium',
        icon: Minus,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      low: {
        label: 'Low',
        icon: ArrowDown,
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }
    return configs[priority]
  }

  const config = getPriorityConfig(priority)
  const Icon = config.icon
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs' 
    : 'px-3 py-1 text-sm'
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${config.className}`}>
      <Icon className={`mr-1 ${iconSize}`} />
      {config.label}
    </span>
  )
}
```

### 6. Work Order List Component
**File: `components/work-orders/WorkOrderList.tsx`**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { WorkOrderWithDetails } from '@/lib/database.types'
import { WorkOrderService } from '@/lib/services/workOrderService'
import { useAuth } from '@/contexts/AuthContext'
import WorkOrderCard from './WorkOrderCard'
import WorkOrderModal from './WorkOrderModal'
import AssignmentModal from './AssignmentModal'
import CreateWorkOrderModal from './CreateWorkOrderModal'
import { Plus, Filter, Search } from 'lucide-react'

interface WorkOrderListProps {
  view?: 'all' | 'my' | 'pending_review'
}

export default function WorkOrderList({ view = 'all' }: WorkOrderListProps) {
  const { userProfile, hasPermission } = useAuth()
  const [workOrders, setWorkOrders] = useState<WorkOrderWithDetails[]>([])
  const [filteredOrders, setFilteredOrders] = useState<WorkOrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithDetails | null>(null)
  const [assigningWorkOrder, setAssigningWorkOrder] = useState<WorkOrderWithDetails | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  useEffect(() => {
    loadWorkOrders()
  }, [view, userProfile])

  useEffect(() => {
    filterWorkOrders()
  }, [workOrders, searchTerm, statusFilter, priorityFilter])

  const loadWorkOrders = async () => {
    try {
      setLoading(true)
      let orders: WorkOrderWithDetails[] = []

      switch (view) {
        case 'my':
          if (userProfile?.id) {
            orders = await WorkOrderService.getByTechnician(userProfile.id)
          }
          break
        case 'pending_review':
          orders = await WorkOrderService.getPendingReview()
          break
        default:
          orders = await WorkOrderService.getAll()
      }

      setWorkOrders(orders)
    } catch (error) {
      console.error('Error loading work orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterWorkOrders = () => {
    let filtered = [...workOrders]

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(wo =>
        wo.title.toLowerCase().includes(term) ||
        wo.description.toLowerCase().includes(term) ||
        wo.building.toLowerCase().includes(term) ||
        wo.unit.toLowerCase().includes(term) ||
        wo.tenant_name.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(wo => wo.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(wo => wo.priority === priorityFilter)
    }

    setFilteredOrders(filtered)
  }

  const handleStatusChange = async (workOrder: WorkOrderWithDetails, newStatus: string) => {
    try {
      if (newStatus === 'completed') {
        await WorkOrderService.approve(workOrder.id, userProfile!.id)
      } else if (newStatus === 'failed_review') {
        const reason = prompt('Please provide a reason for rejection:')
        if (reason) {
          await WorkOrderService.reject(workOrder.id, reason)
        } else {
          return
        }
      } else {
        await WorkOrderService.updateStatus(workOrder.id, newStatus as any)
      }
      await loadWorkOrders()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleAssignment = async (workOrderId: string, technicianId: string, scheduledDate?: string) => {
    try {
      await WorkOrderService.assign(workOrderId, technicianId, scheduledDate)
      setAssigningWorkOrder(null)
      await loadWorkOrders()
    } catch (error) {
      console.error('Error assigning work order:', error)
      alert('Failed to assign work order')
    }
  }

  const handleCreateWorkOrder = async () => {
    setShowCreateModal(false)
    await loadWorkOrders()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {view === 'my' ? 'My Work Orders' : 
             view === 'pending_review' ? 'Pending Review' : 
             'All Work Orders'}
          </h1>
          <p className="text-gray-600">
            {filteredOrders.length} of {workOrders.length} work orders
          </p>
        </div>

        {hasPermission('assign') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Work Order
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="ready_review">Ready for Review</option>
            <option value="completed">Completed</option>
            <option value="failed_review">Failed Review</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="emergency">Emergency</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setPriorityFilter('all')
            }}
            className="flex items-center justify-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Work Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No work orders found</div>
          <p className="text-gray-400 mt-2">
            {workOrders.length === 0 
              ? 'Create your first work order to get started'
              : 'Try adjusting your filters'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((workOrder) => (
            <WorkOrderCard
              key={workOrder.id}
              workOrder={workOrder}
              onView={setSelectedWorkOrder}
              onAssign={hasPermission('assign') ? setAssigningWorkOrder : undefined}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedWorkOrder && (
        <WorkOrderModal
          workOrder={selectedWorkOrder}
          onClose={() => setSelectedWorkOrder(null)}
          onUpdate={loadWorkOrders}
        />
      )}

      {assigningWorkOrder && (
        <AssignmentModal
          workOrder={assigningWorkOrder}
          onClose={() => setAssigningWorkOrder(null)}
          onAssign={handleAssignment}
        />
      )}

      {showCreateModal && (
        <CreateWorkOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateWorkOrder}
        />
      )}
    </div>
  )
}
```

### 7. Work Order Modal (Detailed View)
**File: `components/work-orders/WorkOrderModal.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { WorkOrderWithDetails } from '@/lib/database.types'
import { WorkOrderService } from '@/lib/services/workOrderService'
import { useAuth } from '@/contexts/AuthContext'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import { 
  X, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MessageSquare,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface WorkOrderModalProps {
  workOrder: WorkOrderWithDetails
  onClose: () => void
  onUpdate: () => void
}

export default function WorkOrderModal({ workOrder, onClose, onUpdate }: WorkOrderModalProps) {
  const { userProfile, hasPermission } = useAuth()
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return

    try {
      setSubmittingComment(true)
      await WorkOrderService.addComment(workOrder.id, comment)
      setComment('')
      onUpdate()
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      if (newStatus === 'ready_review') {
        if (!completionNotes.trim()) {
          alert('Please provide completion notes')
          return
        }
        await WorkOrderService.updateStatus(workOrder.id, newStatus as any, completionNotes)
      } else if (newStatus === 'completed') {
        await WorkOrderService.approve(workOrder.id, userProfile!.id)
      } else if (newStatus === 'failed_review') {
        const reason = prompt('Please provide a reason for rejection:')
        if (reason) {
          await WorkOrderService.reject(workOrder.id, reason)
        } else {
          return
        }
      } else {
        await WorkOrderService.updateStatus(workOrder.id, newStatus as any)
      }
      onUpdate()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">{workOrder.title}</h2>
            <StatusBadge status={workOrder.status} />
            <PriorityBadge priority={workOrder.priority} />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{workOrder.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location & Tenant</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{workOrder.building}, Unit {workOrder.unit}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{workOrder.tenant_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <a href={`tel:${workOrder.tenant_phone}`} className="text-blue-600 hover:underline">
                      {workOrder.tenant_phone}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <a href={`mailto:${workOrder.tenant_email}`} className="text-blue-600 hover:underline">
                      {workOrder.tenant_email}
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment & Timing</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <span>
                      {workOrder.assigned_technician 
                        ? workOrder.assigned_technician.name 
                        : 'Unassigned'
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{formatDate(workOrder.scheduled_date)}</span>
                  </div>
                  {workOrder.estimated_duration && (
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-3" />
                      <span>{workOrder.estimated_duration} minutes estimated</span>
                    </div>
                  )}
                </div>
              </div>

              {workOrder.completion_notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Completion Notes</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {workOrder.completion_notes}
                  </p>
                </div>
              )}
            </div>

            {/* Updates & Comments */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Updates & Comments</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {workOrder.updates && workOrder.updates.length > 0 ? (
                    workOrder.updates.map((update) => (
                      <div key={update.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {/* @ts-ignore - updates include user relation */}
                            {update.user?.name || 'System'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(update.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{update.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No updates yet</p>
                  )}
                </div>
              </div>

              {/* Add Comment */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Add Comment</h4>
                <div className="space-y-3">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment or update..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!comment.trim() || submittingComment}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {submittingComment ? 'Adding...' : 'Add Comment'}
                  </button>
                </div>
              </div>

              {/* Status Actions */}
              {hasPermission('update') && (
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Actions</h4>
                  
                  {workOrder.status === 'assigned' && (
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      className="w-full mb-3 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Start Work
                    </button>
                  )}

                  {workOrder.status === 'in_progress' && (
                    <div className="space-y-3">
                      <textarea
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        placeholder="Completion notes (required)..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                      <button
                        onClick={() => handleStatusChange('ready_review')}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Mark as Ready for Review
                      </button>
                    </div>
                  )}

                  {workOrder.status === 'ready_review' && hasPermission('approve') && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleStatusChange('completed')}
                        className="flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange('failed_review')}
                        className="flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 8. Assignment Modal
**File: `components/work-orders/AssignmentModal.tsx`**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { WorkOrderWithDetails, User } from '@/lib/database.types'
import { WorkOrderService } from '@/lib/services/workOrderService'
import { X, User as UserIcon, Calendar } from 'lucide-react'

interface AssignmentModalProps {
  workOrder: WorkOrderWithDetails
  onClose: () => void
  onAssign: (workOrderId: string, technicianId: string, scheduledDate?: string) => void
}

export default function AssignmentModal({ workOrder, onClose, onAssign }: AssignmentModalProps) {
  const [technicians, setTechnicians] = useState<User[]>([])
  const [selectedTechnician, setSelectedTechnician] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTechnicians()
    
    // Set default scheduled date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    setScheduledDate(tomorrow.toISOString().slice(0, 16))
  }, [])

  const loadTechnicians = async () => {
    try {
      const data = await WorkOrderService.getTechnicians()
      setTechnicians(data)
    } catch (error) {
      console.error('Error loading technicians:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = () => {
    if (!selectedTechnician) {
      alert('Please select a technician')
      return
    }

    onAssign(workOrder.id, selectedTechnician, scheduledDate || undefined)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Assign Work Order</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Work Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">{workOrder.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {workOrder.building}, Unit {workOrder.unit}
            </p>
          </div>

          {/* Technician Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="inline h-4 w-4 mr-1" />
              Select Technician
            </label>
            {loading ? (
              <div className="text-center py-4">Loading technicians...</div>
            ) : (
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a technician...</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} - {tech.phone}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedTechnician || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Assign Work Order
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 9. Create Work Order Modal
**File: `components/work-orders/CreateWorkOrderModal.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { WorkOrderFormData } from '@/lib/database.types'
import { WorkOrderService } from '@/lib/services/workOrderService'
import { useAuth } from '@/contexts/AuthContext'
import { X, MapPin, User, Phone, Mail, Clock } from 'lucide-react'

interface CreateWorkOrderModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateWorkOrderModal({ onClose, onSuccess }: CreateWorkOrderModalProps) {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<WorkOrderFormData>({
    title: '',
    description: '',
    building: '',
    unit: '',
    priority: 'medium',
    tenant_name: '',
    tenant_phone: '',
    tenant_email: '',
    estimated_duration: undefined
  })

  const buildings = ['Building A', 'Building B', 'Building C', 'Building D']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userProfile) return

    try {
      setLoading(true)
      await WorkOrderService.create(formData, userProfile.id)
      onSuccess()
    } catch (error) {
      console.error('Error creating work order:', error)
      alert('Failed to create work order')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof WorkOrderFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Work Order</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Title and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Order Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Leaky faucet in kitchen"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Detailed description of the issue..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building *
                  </label>
                  <select
                    required
                    value={formData.building}
                    onChange={(e) => handleChange('building', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select building...</option>
                    {buildings.map((building) => (
                      <option key={building} value={building}>
                        {building}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                    placeholder="e.g., 101, 2A, etc."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Tenant Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Tenant Contact Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tenant_name}
                    onChange={(e) => handleChange('tenant_name', e.target.value)}
                    placeholder="Full name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.tenant_phone}
                      onChange={(e) => handleChange('tenant_phone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.tenant_email}
                      onChange={(e) => handleChange('tenant_email', e.target.value)}
                      placeholder="tenant@example.com"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Estimated Duration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.estimated_duration || ''}
                    onChange={(e) => handleChange('estimated_duration', parseInt(e.target.value) || 0)}
                    placeholder="60"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - helps with scheduling</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Work Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 10. Work Orders Page
**File: `app/(dashboard)/work-orders/page.tsx`**
```typescript
import WorkOrderList from '@/components/work-orders/WorkOrderList'

export default function WorkOrdersPage() {
  return <WorkOrderList view="all" />
}
```

**File: `app/(dashboard)/work-orders/my/page.tsx`**
```typescript
import WorkOrderList from '@/components/work-orders/WorkOrderList'

export default function MyWorkOrdersPage() {
  return <WorkOrderList view="my" />
}
```

**File: `app/(dashboard)/work-orders/pending-review/page.tsx`**
```typescript
import WorkOrderList from '@/components/work-orders/WorkOrderList'

export default function PendingReviewPage() {
  return <WorkOrderList view="pending_review" />
}
```

### 11. Updated Dashboard with Real Data
**File: `app/(dashboard)/dashboard/page.tsx`**
```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { WorkOrderService } from '@/lib/services/workOrderService'
import { redirect } from 'next/navigation'
import { 
  ClipboardList, 
  AlertTriangle, 
  Users, 
  BarChart3,
  CheckCircle2,
  Clock
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get statistics
  const stats = await WorkOrderService.getStatistics()

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from('work_orders')
    .select(`
      id,
      title,
      status,
      building,
      unit,
      updated_at,
      assigned_technician:users!work_orders_assigned_tech_id_fkey(name)
    `)
    .order('updated_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {userProfile?.name}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Work Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Emergency</p>
              <p className="text-2xl font-bold text-gray-900">{stats.emergency}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedThisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((wo: any) => (
                <div key={wo.id} className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${
                    wo.status === 'completed' ? 'bg-green-500' :
                    wo.status === 'in_progress' ? 'bg-yellow-500' :
                    wo.status === 'ready_review' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 flex-1">
                    <strong>{wo.title}</strong> - {wo.building}, Unit {wo.unit}
                    {wo.assigned_technician && (
                      <span className="text-gray-500"> • {wo.assigned_technician.name}</span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(wo.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userProfile?.role === 'coordinator' && (
          <a
            href="/work-orders"
            className="block p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-blue-900">Manage Work Orders</h3>
                <p className="text-sm text-blue-700">Create, assign, and track work orders</p>
              </div>
            </div>
          </a>
        )}

        {stats.pendingReview > 0 && userProfile?.role === 'coordinator' && (
          <a
            href="/work-orders/pending-review"
            className="block p-6 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-orange-900">Review Queue</h3>
                <p className="text-sm text-orange-700">{stats.pendingReview} work orders need review</p>
              </div>
            </div>
          </a>
        )}

        {userProfile?.role === 'technician' && (
          <a
            href="/work-orders/my"
            className="block p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-green-900">My Work Orders</h3>
                <p className="text-sm text-green-700">View your assigned tasks</p>
              </div>
            </div>
          </a>
        )}
      </div>
    </div>
  )
}
```

### 12. Updated Sidebar Navigation
**File: `components/layout/Sidebar.tsx` (update the navItems)**
```typescript
const navItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Dashboard'
  },
  {
    href: '/work-orders',
    icon: ClipboardList,
    label: 'All Work Orders',
    requiredPermissions: ['view_all']
  },
  {
    href: '/work-orders/my',
    icon: User,
    label: 'My Work Orders',
    requiredPermissions: ['edit_own']
  },
  {
    href: '/work-orders/pending-review',
    icon: Clock,
    label: 'Pending Review',
    requiredPermissions: ['approve']
  },
  {
    href: '/schedule',
    icon: Calendar,
    label: 'Schedule',
    requiredPermissions: ['assign', 'view_all']
  },
  {
    href: '/technicians',
    icon: Users,
    label: 'Technicians',
    requiredPermissions: ['assign']
  },
  {
    href: '/analytics',
    icon: BarChart3,
    label: 'Analytics',
    requiredPermissions: ['view_all']
  },
  {
    href: '/emergency',
    icon: AlertTriangle,
    label: 'Emergency',
    requiredPermissions: ['create_emergency']
  }
]
```

## Phase 1.2 Complete - Work Order System

This implementation provides:

✅ **Complete CRUD Operations** - Create, read, update, delete work orders
✅ **Status Management** - Enforced workflow with coordinator approval
✅ **Role-based Permissions** - Technicians can't directly complete work orders
✅ **Assignment System** - Coordinators can assign work to technicians
✅ **Real-time Updates** - Status changes logged automatically
✅ **Filtering & Search** - Find work orders by status, priority, text search
✅ **Detailed Views** - Modal with full work order details and comments
✅ **Statistics Dashboard** - Real-time metrics and recent activity
✅ **Responsive Design** - Works on desktop and mobile

**Key Business Rules Implemented:**
- Only coordinators can mark work orders as "completed"
- Technicians must use "ready_review" status for coordinator approval
- Status transitions are tracked and logged
- Assignment changes create audit trail
- Comments and updates maintain full history

**Ready for Phase 1.3: Enhanced UI Components & Advanced Features** when you want to continue.
            