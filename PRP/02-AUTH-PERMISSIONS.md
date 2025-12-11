# PRP-02: Authentication & Authorization

## Problem Statement

The application currently has no reliable way to know who is using it or what they're allowed to do. Components might render an "Assign Technician" button even if the current user is a technician (who shouldn't be able to assign). Status change options might include "Complete" even when clicked by someone who isn't a coordinator.

**Current State:**
- May have basic Supabase Auth login
- No role-based access control in the UI
- No permission checks before actions
- Business rules about "only coordinators can mark complete" are not enforced
- Technicians might see admin controls

**Required State:**
- Users authenticate via Supabase Auth
- Users have roles within each portfolio (different roles in different portfolios possible)
- UI shows only what user is permitted to do
- Actions are validated against permissions before executing
- Business rules from config_rules.json are enforced

---

## Why This Must Come Before Data Layer

Without auth:
- Can't scope queries to user's portfolios (no user identity)
- Can't validate permissions before mutations (no role information)
- Can't attribute actions in audit log (no user to record)
- Can't show/hide UI based on role (no role to check)

---

## Role Definitions

Based on the system definition and config_rules.json, there are six distinct roles:

### Owner
**Who:** Alex (property owner)
**Access Level:** Full administrative control
**Can Do:**
- Everything managers and coordinators can do
- Add/remove users from portfolio
- Change portfolio settings
- View cross-portfolio analytics
- Access billing/subscription settings
- Delete portfolios
**Cannot Do:**
- Nothing restricted

### Manager  
**Who:** Dean
**Access Level:** Emergency authority and oversight
**Can Do:**
- Everything coordinators can do
- Override technician assignments (pull techs for emergencies)
- Cancel work orders
- Access performance analytics
- Emergency resource allocation
**Cannot Do:**
- Add/remove users (owner only)
- Portfolio settings (owner only)

### Coordinator
**Who:** Kristine (and future coordinator hires)
**Access Level:** Daily operations authority
**Can Do:**
- Assign work orders to technicians
- Mark work orders as complete (final approval)
- Approve/reject work in "Ready for Review" status
- Create and modify schedules
- Send communications to tenants
- View all work orders in portfolio
- Create work orders
- Approve vendor selections
**Cannot Do:**
- Emergency overrides (manager only)
- User management (owner only)

### Admin
**Who:** New hire for data entry
**Access Level:** Limited operational access
**Can Do:**
- Create work orders
- Upload documents/photos
- Update work order details (description, notes)
- View all work orders
- View technician schedules
**Cannot Do:**
- Assign technicians (coordinator only)
- Change status (except basic updates)
- Approve completions (coordinator only)
- Delete work orders

### Technician
**Who:** Ramon, Kishan, future hires
**Access Level:** Field work access
**Can Do:**
- View work orders assigned to them
- View their own schedule
- Update status to: ready_review, waiting_parts, waiting_access
- Add notes to assigned work orders
- Upload photos to assigned work orders
- Mark arrival (check-in)
**Cannot Do:**
- View unassigned work orders
- View other technicians' work
- Assign work orders
- Mark work as "complete" (only "ready_review")
- Cancel work orders
- Modify schedule

### Viewer
**Who:** External stakeholders, investors, auditors
**Access Level:** Read-only
**Can Do:**
- View work orders (all or filtered by permission)
- View analytics/reports
- Export data
**Cannot Do:**
- Any modifications
- Create anything

---

## Permission Matrix

Detailed breakdown of what each role can do with each entity:

### Work Orders

| Action | Owner | Manager | Coordinator | Admin | Technician | Viewer |
|--------|-------|---------|-------------|-------|------------|--------|
| View all | ✓ | ✓ | ✓ | ✓ | ✗ (own only) | ✓ |
| Create | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Edit details | ✓ | ✓ | ✓ | ✓ | ✗ (notes only) | ✗ |
| Assign technician | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Change status | ✓ | ✓ | ✓ | Limited | Limited | ✗ |
| Mark complete | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Cancel | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Status Transitions by Role

From config_rules.json, technicians can only transition to certain statuses:

**Technician can transition to:**
- ready_review (requires photos)
- waiting_parts
- waiting_access

**Technician CANNOT transition to:**
- completed (coordinator only)
- cancelled (coordinator+ only)
- assigned/scheduled (coordinator only)

### Schedules

| Action | Owner | Manager | Coordinator | Admin | Technician | Viewer |
|--------|-------|---------|-------------|-------|------------|--------|
| View all | ✓ | ✓ | ✓ | ✓ | ✗ (own only) | ✓ |
| Create | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Modify | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Override (bump others) | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

### Technicians (Managing the team)

| Action | Owner | Manager | Coordinator | Admin | Technician | Viewer |
|--------|-------|---------|-------------|-------|------------|--------|
| View list | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add to portfolio | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Remove from portfolio | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Edit skills/certs | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| View workload | ✓ | ✓ | ✓ | ✓ | ✗ (own only) | ✗ |

---

## Data Model

### User Profile Table

Supabase Auth provides `auth.users`. We need an extended profile:

**profiles** (extends auth.users)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | FK to auth.users(id), PRIMARY KEY |
| email | TEXT | Cached from auth (for queries) |
| full_name | TEXT | Display name |
| phone | TEXT | For notifications |
| avatar_url | TEXT | Profile picture |
| preferences | JSONB | UI preferences (theme, default filters) |
| created_at | TIMESTAMPTZ | Profile creation |
| updated_at | TIMESTAMPTZ | Last modification |

### Portfolio-User-Role Mapping

From PRP-01, we have portfolio_users:

**portfolio_users**
| Column | Type | Description |
|--------|------|-------------|
| portfolio_id | UUID | FK to portfolios |
| user_id | UUID | FK to auth.users |
| role | TEXT | owner, manager, coordinator, admin, technician, viewer |
| permissions | TEXT[] | Additional granular permissions |
| created_at | TIMESTAMPTZ | When access was granted |
| granted_by | UUID | FK to auth.users |
| PRIMARY KEY | | (portfolio_id, user_id) |

**Role Values:**
```sql
ALTER TABLE portfolio_users ADD CONSTRAINT valid_role 
CHECK (role IN ('owner', 'manager', 'coordinator', 'admin', 'technician', 'viewer'));
```

### Linking Technicians to User Accounts

Technicians are both users (with login) and work resources:

**technicians**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users (nullable - not all techs may have logins initially) |
| name | TEXT | Display name |
| email | TEXT | Contact email |
| phone | TEXT | Contact phone |
| skills | TEXT[] | Plumbing, electrical, HVAC, etc. |
| certifications | JSONB | {type, number, expiration} |
| max_daily_orders | INT | Default 6 |
| active | BOOLEAN | Currently working? |
| created_at | TIMESTAMPTZ | |

When a technician has a user account, their `user_id` links to auth.users, and their portfolio access comes from portfolio_users with role='technician'.

---

## Authentication Flow

### Login Process

1. User navigates to app
2. App checks for existing session (Supabase stores in localStorage)
3. If no session → redirect to login page
4. User enters email/password (or OAuth)
5. Supabase Auth validates credentials
6. On success, JWT token stored in localStorage
7. App fetches user profile from profiles table
8. App fetches portfolio memberships from portfolio_users
9. If one portfolio → auto-select, redirect to dashboard
10. If multiple portfolios → show portfolio selector
11. Store active portfolio in context + localStorage

### Session Management

- **Token refresh:** Supabase handles automatically
- **Session expiry:** Configurable (default 1 week)
- **Logout:** Clear localStorage, redirect to login
- **Inactive timeout:** Optional - log out after 30 min inactivity

### Password Reset Flow

1. User clicks "Forgot Password"
2. Enter email
3. Supabase sends reset link
4. User clicks link, enters new password
5. Password updated, redirect to login

---

## Authorization Flow

### Before Every Protected Action

```
1. Get current user from auth context
   - If not logged in → redirect to login

2. Get active portfolio from portfolio context
   - If no portfolio selected → redirect to portfolio selector

3. Get user's role in active portfolio
   - Query portfolio_users where user_id and portfolio_id match
   - If no record → user has no access → show error

4. Check if role permits the action
   - canAssignTechnician(role) → true for owner, manager, coordinator
   - If not permitted → disable button OR show error on attempt

5. Validate business rules
   - isValidStatusTransition(currentStatus, newStatus, role)
   - If invalid → show specific error message

6. Execute action
   - Include user_id in audit trail
   - Record who did what
```

### UI-Level Permission Checks

Components should not render options the user can't use:

**Wrong:**
```jsx
// Shows all options, fails when clicked
<DropdownMenu>
  <MenuItem onClick={assignTechnician}>Assign Technician</MenuItem>
  <MenuItem onClick={markComplete}>Mark Complete</MenuItem>
</DropdownMenu>
```

**Correct:**
```jsx
// Only shows options user can use
<DropdownMenu>
  {canAssign && <MenuItem onClick={assignTechnician}>Assign Technician</MenuItem>}
  {canComplete && <MenuItem onClick={markComplete}>Mark Complete</MenuItem>}
</DropdownMenu>
```

### API-Level Permission Checks

Even if UI is compromised, database should reject unauthorized actions:

**RLS Policy for work_orders UPDATE:**
```sql
CREATE POLICY "Role-based work order updates"
ON work_orders FOR UPDATE
USING (
  -- User must have access to this portfolio
  portfolio_id IN (
    SELECT portfolio_id FROM portfolio_users
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  -- For status changes, validate the specific transition
  -- This is better handled in application logic with a function
  true
);
```

For complex permission checks, use a database function:
```sql
CREATE FUNCTION can_update_work_order(
  work_order_id UUID,
  new_status TEXT,
  user_id UUID
) RETURNS BOOLEAN AS $$
  -- Check user's role in the work order's portfolio
  -- Validate status transition rules
  -- Return true/false
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Permission Checking Patterns

### Central Permission Service

Create a single source of truth for "can user do X":

```typescript
interface PermissionCheck {
  userId: string;
  portfolioId: string;
  role: UserRole;
}

// Work Order permissions
function canViewWorkOrder(check: PermissionCheck, workOrder: WorkOrder): boolean {
  // Everyone except technicians can view all
  if (check.role !== 'technician') return true;
  // Technicians can only view their assigned work
  return workOrder.assigned_to === check.userId;
}

function canAssignTechnician(check: PermissionCheck): boolean {
  return ['owner', 'manager', 'coordinator'].includes(check.role);
}

function canChangeStatus(
  check: PermissionCheck, 
  currentStatus: string, 
  newStatus: string
): { allowed: boolean; reason?: string } {
  // Check role-based restrictions
  if (check.role === 'technician') {
    const allowedForTech = ['ready_review', 'waiting_parts', 'waiting_access'];
    if (!allowedForTech.includes(newStatus)) {
      return { 
        allowed: false, 
        reason: `Technicians cannot set status to ${newStatus}` 
      };
    }
  }
  
  // Check transition validity
  const validTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  if (!validTransitions.includes(newStatus)) {
    return {
      allowed: false,
      reason: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }
  
  return { allowed: true };
}

function canMarkComplete(check: PermissionCheck): boolean {
  // Only coordinators and above can mark complete
  return ['owner', 'manager', 'coordinator'].includes(check.role);
}

function canCancelWorkOrder(check: PermissionCheck): boolean {
  return ['owner', 'manager', 'coordinator'].includes(check.role);
}

function canDeleteWorkOrder(check: PermissionCheck): boolean {
  // Only owners can delete
  return check.role === 'owner';
}
```

### Technician-Specific Rules

Technicians have the most restricted access:

**What they can see:**
- Work orders assigned to them
- Their own schedule
- Their own performance metrics
- Building/unit info for their assigned work

**What they cannot see:**
- Unassigned work orders
- Other technicians' work orders
- Other technicians' schedules (except for visibility like "Ramon is busy")
- Financial information
- Tenant payment status

**Filtering for technicians:**
```typescript
function getWorkOrdersForUser(userId: string, role: string, portfolioId: string) {
  const query = supabase
    .from('work_orders')
    .select('*')
    .eq('portfolio_id', portfolioId);
  
  if (role === 'technician') {
    // Technicians only see their assigned work
    query.eq('assigned_to', userId);
  }
  
  return query;
}
```

---

## Handling Edge Cases

### User Has Multiple Roles in Same Portfolio
- Shouldn't happen - one user_id + portfolio_id = one role
- If needed for testing: use highest privilege role
- Better: create separate test accounts

### User Role Changes Mid-Session
- Admin demotes coordinator to admin role
- User's next action should use new role
- On next query, fetch fresh role from database
- Don't cache role for too long (max 5 minutes)

### User Removed from Portfolio Mid-Session
- Admin removes user from portfolio_users
- User's next query returns nothing (RLS blocks)
- Handle gracefully: "You no longer have access to this portfolio"
- Clear active portfolio, redirect to portfolio selector

### Technician Without User Account
- Some technicians may not have logins (just managed by coordinator)
- technicians.user_id is NULL
- Can still be assigned work
- Cannot access the application themselves
- Coordinator manages their work on their behalf

### New User With No Portfolio Access
- User creates account or is invited
- No entries in portfolio_users yet
- Show: "Waiting for portfolio access. Contact your administrator."
- Or: Show portfolio creation wizard if they should be an owner

---

## Audit Trail Attribution

Every action must record who did it:

**audit_log additions:**
```sql
-- User information
user_id UUID REFERENCES auth.users(id),
user_email TEXT,  -- Denormalized for quick display
user_role TEXT,   -- Role at time of action

-- Context
portfolio_id UUID,
session_id TEXT,  -- Group related actions
ip_address TEXT,
user_agent TEXT,
```

**Recording actions:**
```typescript
async function recordAuditEvent(
  action: string,
  entityType: string,
  entityId: string,
  oldValue: any,
  newValue: any
) {
  const user = await getCurrentUser();
  const portfolio = getActivePortfolio();
  const role = await getUserRole(user.id, portfolio.id);
  
  await supabase.from('audit_log').insert({
    user_id: user.id,
    user_email: user.email,
    user_role: role,
    portfolio_id: portfolio.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
    created_at: new Date().toISOString()
  });
}
```

---

## UI Components Needed

### Auth Context Provider
Wraps app, provides:
- Current user object
- Login/logout functions
- Loading state during auth check
- Redirect to login if unauthenticated

### Role Context Provider
Wraps authenticated app, provides:
- User's role in active portfolio
- Permission check functions
- Quick access to "can I do X?" checks

### Login Page
- Email/password form
- "Forgot password" link
- OAuth options (if configured)
- Error messages for invalid credentials

### Protected Route Component
- Checks if user is authenticated
- Redirects to login if not
- Shows loading while checking
- Optionally checks role: `<ProtectedRoute requiredRole="coordinator">`

### Permission Gate Component
- Wraps UI elements that require specific permission
- Shows children if permitted
- Shows nothing (or fallback) if not
- Example: `<PermissionGate permission="assign_technician">{button}</PermissionGate>`

---

## Validation Criteria

### Authentication
- [ ] Unauthenticated user cannot access protected pages
- [ ] Login with valid credentials → redirects to app
- [ ] Login with invalid credentials → shows error
- [ ] Logout → clears session, redirects to login
- [ ] Refresh page → session persists (stays logged in)
- [ ] Session expiry → prompted to log in again

### Authorization
- [ ] Coordinator sees "Assign Technician" button
- [ ] Technician does NOT see "Assign Technician" button
- [ ] Technician trying to access /admin → redirected or error
- [ ] Coordinator can change status to "complete"
- [ ] Technician can change status to "ready_review"
- [ ] Technician CANNOT change status to "complete" (even via API)
- [ ] Audit log shows correct user for every action

### Role Changes
- [ ] Admin changes user's role from coordinator to admin
- [ ] User's next action reflects new (reduced) permissions
- [ ] User removed from portfolio → cannot access portfolio data

---

## Dependencies

**Requires Before Starting:**
- PRP-01 complete (portfolio_users table exists)
- Supabase Auth enabled
- profiles table created

**Blocks Until Complete:**
- PRP-03 (Data Layer) - needs user context for queries
- PRP-05 (Interactions) - needs permission checks for buttons

---

## Implementation Checklist

### Database
- [ ] Create profiles table
- [ ] Add trigger to create profile on auth.users insert
- [ ] Add role constraint to portfolio_users
- [ ] Create RLS policies that check role
- [ ] Create permission-check functions

### Frontend
- [ ] Create AuthContext provider
- [ ] Create RoleContext provider
- [ ] Create login page
- [ ] Create ProtectedRoute component
- [ ] Create PermissionGate component
- [ ] Create permission check hooks (useCanAssign, useCanComplete, etc.)
- [ ] Update all components to use permission checks
- [ ] Hide/disable controls based on role

### Testing
- [ ] Login/logout flow
- [ ] Permission checks for each role
- [ ] RLS policies block unauthorized access
- [ ] Audit trail shows correct user
- [ ] Role changes take effect
