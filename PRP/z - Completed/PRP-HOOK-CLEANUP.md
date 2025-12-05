# PRP: Hook Cleanup & Navigation Fixes

## Goal
Remove mock data fallbacks from hooks, connect to real Supabase tables, and fix missing navigation links.

## Success Criteria
- [ ] `useTechnicians` returns data from Supabase (no fallback)
- [ ] `useCapacityCheck` calls RPC function instead of client-side calc
- [ ] All Phase 3 pages accessible via sidebar navigation
- [ ] Profile pages use route params to fetch correct data
- [ ] No `MOCK_*` constants used in production paths

## Prerequisites
- PRP-DATABASE-SCHEMA completed (tables exist with seed data)
- PRP-DATABASE-FUNCTIONS completed (RPC functions exist)

---

## Task 1: Fix NavigationSidebar

**File:** `src/components/layout/NavigationSidebar.tsx`

Add missing navigation items:

```typescript
// Add to Phase 1 navigation items (these are functional)
{ 
  name: 'Messages', 
  href: '/messages', 
  icon: MessageSquare,
  badge: unreadCount 
},
{ 
  name: 'Work Orders', 
  href: '/work-orders', 
  icon: ClipboardList 
},
{ 
  name: 'Approval Queue', 
  href: '/approvals', 
  icon: CheckCircle,
  badge: pendingApprovals 
},

// Add these to Phase 2/3 sections (mark locked if not ready)
{
  name: 'Calendar',
  href: '/calendar',
  icon: Calendar,
  phase: 2
},
{
  name: 'Dispatch',
  href: '/dispatch',
  icon: Truck,
  phase: 2
},
{
  name: 'Technicians',
  href: '/technicians',
  icon: Users,
  phase: 2
},
{
  name: 'Analytics',
  href: '/analytics',
  icon: BarChart3,
  phase: 3
},
{
  name: 'Financials',
  href: '/financials',
  icon: DollarSign,
  phase: 3
},
{
  name: 'Override History',
  href: '/overrides',
  icon: AlertTriangle,
  phase: 2
},
{
  name: 'Settings',
  href: '/settings',
  icon: Settings,
  phase: 3
}
```

**Validation:** Navigate to each route manually - all should render without 404.

---

## Task 2: Update useTechnicians Hook

**File:** `src/hooks/useTechnicians.ts`

Replace mock fallback with strict Supabase query:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Technician } from '@/types';

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTechnicians() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: supabaseError } = await supabase
          .from('technicians')
          .select('*')
          .order('name');
        
        if (supabaseError) {
          throw new Error(supabaseError.message);
        }
        
        if (!data || data.length === 0) {
          throw new Error('No technicians found. Run seed data from PRP-DATABASE-SCHEMA.');
        }
        
        // Transform from snake_case to camelCase
        const transformed: Technician[] = data.map(t => ({
          id: t.id,
          name: t.name,
          phone: t.phone,
          email: t.email,
          role: t.role,
          status: t.status,
          skills: t.skills || [],
          certifications: t.certifications || [],
          maxDailyWorkload: t.max_daily_workload,
          currentLocation: t.current_location,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        }));
        
        setTechnicians(transformed);
      } catch (err) {
        console.error('Failed to fetch technicians:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // NO FALLBACK TO MOCK DATA - fail loudly
      } finally {
        setLoading(false);
      }
    }

    fetchTechnicians();
  }, []);

  const refetch = () => {
    setLoading(true);
    // Re-run effect by updating a dependency
  };

  return { technicians, loading, error, refetch };
}
```

**Validation:** Check browser console - should NOT see "falling back to mock data" message.

---

## Task 3: Update useCapacityCheck Hook

**File:** `src/hooks/useCapacityCheck.ts`

Replace client-side calculation with RPC call:

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface CapacityResult {
  canAccept: boolean;
  currentCount: number;
  maxAllowed: number;
  message: string;
}

export function useCapacityCheck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkCapacity = useCallback(async (
    technicianId: string,
    targetDate?: Date
  ): Promise<CapacityResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc(
        'check_technician_capacity',
        {
          p_technician_id: technicianId,
          p_target_date: targetDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
        }
      );
      
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      
      if (!data || data.length === 0) {
        throw new Error('Capacity check returned no data');
      }
      
      const result = data[0];
      return {
        canAccept: result.can_accept,
        currentCount: result.current_count,
        maxAllowed: result.max_allowed,
        message: result.message
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      // Return safe default that prevents assignment
      return {
        canAccept: false,
        currentCount: 0,
        maxAllowed: 0,
        message: 'Capacity check failed: ' + error.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkCapacity, loading, error };
}
```

**Validation:** Call `checkCapacity` with a valid technician ID - should return server data.

---

## Task 4: Create useAssignWorkOrder Hook

**File:** `src/hooks/useAssignWorkOrder.ts` (new file)

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AssignmentResult {
  success: boolean;
  assignmentId: string | null;
  message: string;
}

export function useAssignWorkOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const assignWorkOrder = useCallback(async (
    workOrderId: string,
    technicianId: string,
    scheduledDate: Date,
    scheduledTimeStart?: string,
    scheduledTimeEnd?: string,
    assignedBy: string = 'COORDINATOR'
  ): Promise<AssignmentResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc(
        'assign_work_order',
        {
          p_work_order_id: workOrderId,
          p_technician_id: technicianId,
          p_scheduled_date: scheduledDate.toISOString().split('T')[0],
          p_scheduled_time_start: scheduledTimeStart || null,
          p_scheduled_time_end: scheduledTimeEnd || null,
          p_assigned_by: assignedBy
        }
      );
      
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      
      const result = data[0];
      
      if (result.success) {
        toast.success('Work order assigned successfully');
      } else {
        toast.error(result.message);
      }
      
      return {
        success: result.success,
        assignmentId: result.assignment_id,
        message: result.message
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      toast.error('Assignment failed: ' + error.message);
      return {
        success: false,
        assignmentId: null,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { assignWorkOrder, loading, error };
}
```

---

## Task 5: Create useRecordOverride Hook

**File:** `src/hooks/useRecordOverride.ts` (new file)

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type OverrideReason = 'emergency' | 'turnover' | 'inspection' | 'other';

interface OverrideResult {
  success: boolean;
  overrideId: string | null;
  displacedCount: number;
  message: string;
}

export function useRecordOverride() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const recordOverride = useCallback(async (
    technicianId: string,
    overrideBy: string,
    reason: OverrideReason,
    reasonDetail?: string
  ): Promise<OverrideResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc(
        'record_override',
        {
          p_technician_id: technicianId,
          p_override_by: overrideBy,
          p_reason: reason,
          p_reason_detail: reasonDetail || null
        }
      );
      
      if (rpcError) {
        throw new Error(rpcError.message);
      }
      
      const result = data[0];
      
      if (result.success) {
        toast.warning(
          `Override recorded. ${result.displaced_count} work orders need reassignment.`,
          { duration: 5000 }
        );
      }
      
      return {
        success: result.success,
        overrideId: result.override_id,
        displacedCount: result.displaced_count,
        message: result.message
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      toast.error('Failed to record override: ' + error.message);
      return {
        success: false,
        overrideId: null,
        displacedCount: 0,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { recordOverride, loading, error };
}
```

---

## Task 6: Update Profile Pages to Use Route Params

**File:** `src/pages/UnitProfilePage.tsx`

```typescript
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function UnitProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUnit() {
      if (!id) {
        setError(new Error('No unit ID provided'));
        setLoading(false);
        return;
      }

      try {
        // Fetch unit with property info
        const { data: unitData, error: unitError } = await supabase
          .from('units')
          .select(`
            *,
            property:properties(*)
          `)
          .eq('id', id)
          .single();

        if (unitError) throw new Error(unitError.message);
        setUnit(unitData);

        // Fetch equipment for this unit
        const { data: equipData, error: equipError } = await supabase
          .from('equipment')
          .select('*')
          .eq('unit_id', id);

        if (equipError) throw new Error(equipError.message);
        setEquipment(equipData || []);

      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchUnit();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!unit) return <NotFound message="Unit not found" />;

  return (
    // ... existing UI using real `unit` and `equipment` data
  );
}
```

**File:** `src/pages/TenantProfilePage.tsx`

```typescript
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function TenantProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTenant() {
      if (!id) {
        setError(new Error('No tenant ID provided'));
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('tenants')
          .select(`
            *,
            unit:units(
              *,
              property:properties(*)
            )
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw new Error(fetchError.message);
        setTenant(data);

      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchTenant();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!tenant) return <NotFound message="Tenant not found" />;

  return (
    // ... existing UI using real `tenant` data
  );
}
```

---

## Task 7: Update hooks/index.ts Exports

**File:** `src/hooks/index.ts`

```typescript
// Existing exports
export { useWorkOrders } from './useWorkOrders';
export { useRealtimeSubscription } from './useRealtimeSubscription';

// Updated hooks
export { useTechnicians } from './useTechnicians';
export { useCapacityCheck } from './useCapacityCheck';

// New hooks
export { useAssignWorkOrder } from './useAssignWorkOrder';
export { useRecordOverride } from './useRecordOverride';
```

---

## Task 8: Remove or Quarantine Mock Data Files

**Action:** Move these files to a `__mocks__` folder or delete them:

```
src/data/mockTechnicians.ts → DELETE or move to src/__mocks__/
src/data/mockAnalytics.ts → DELETE or move to src/__mocks__/
src/data/mockFinancials.ts → DELETE or move to src/__mocks__/
```

**If keeping for tests:**
```bash
mkdir -p src/__mocks__
mv src/data/mock*.ts src/__mocks__/
```

---

## Validation Checklist

After completing all tasks:

```bash
# 1. Type check
npm run typecheck
# Expected: No errors

# 2. Build
npm run build
# Expected: Build successful

# 3. Start dev server
npm run dev
# Expected: App loads without console errors

# 4. Manual checks:
# - Navigate to /technicians - should show 4 technicians from seed data
# - Navigate to /financials - should be accessible (may show empty state)
# - Navigate to /overrides - should be accessible
# - Click on any technician capacity ring - should call RPC
# - Check browser Network tab - should see Supabase RPC calls, not local data
```

---

## Rollback Plan

If something breaks after these changes:

1. **Quick fix:** Temporarily restore mock fallback in useTechnicians
2. **Check Supabase:** Verify tables exist and have data
3. **Check RLS:** Ensure policies allow reads
4. **Check RPC:** Test functions directly in Supabase SQL editor

```sql
-- Quick test in Supabase
SELECT * FROM technicians;
SELECT * FROM check_technician_capacity('11111111-1111-1111-1111-111111111111');
```

---

## Anti-Patterns to Avoid
- ❌ Don't add mock fallbacks "just in case"
- ❌ Don't catch errors and return fake data silently
- ❌ Don't hardcode IDs that exist only in seed data
- ❌ Don't skip loading/error states in components
- ❌ Don't import from `__mocks__` in production code
