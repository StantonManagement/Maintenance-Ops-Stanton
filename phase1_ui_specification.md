# Phase 1: UI Design Specification
*Foundation & Core Control Interface*

## Design Philosophy - Phase 1

**Function Over Form**: Every UI element serves the core goal of coordinator control
- Clear visual hierarchy emphasizing coordinator authority
- Obvious restrictions for technician actions
- Immediate visibility of approval requirements
- Simple, reliable interactions over complex features

## Core Color Scheme (Simplified)

### Status Colors
- **Coordinator Actions**: Blue-600 (#2563EB) 
- **Technician Actions**: Gray-400 (#9CA3AF) - visually de-emphasized
- **Approval Required**: Yellow-600 (#D97706)
- **Emergency/Override**: Red-600 (#DC2626)
- **Completed**: Green-600 (#059669)

### Visual Authority Indicators
- **Coordinator-Only Elements**: Bold blue borders and backgrounds
- **Technician-Restricted Elements**: Grayed out or hidden
- **Required Actions**: Yellow highlighting
- **System Status**: Clear green/red indicators

## Essential UI Components

### 1. Work Order Card (Primary Component)

#### Header Section
```
┌─────────────────────────────────────────────────┐
│ WO-20240820-001    [EMERGENCY]    [IN PROGRESS] │
│ Created: 2024-08-20 09:15 AM                    │
└─────────────────────────────────────────────────┘
```

#### Main Content
```
┌─────────────────────────────────────────────────┐
│ Leaky faucet in kitchen                         │
│ Building A · Unit 205                           │
│ Assigned to: Ramon                              │
│ Status: Ready for Review ⚠️ NEEDS APPROVAL      │
│ Photos: 2 uploaded ✓                           │
└─────────────────────────────────────────────────┘
```

#### Action Section (Role-Based)
**Coordinator View:**
```
┌─────────────────────────────────────────────────┐
│ [APPROVE COMPLETION] [ASSIGN TECHNICIAN] [EDIT]  │
└─────────────────────────────────────────────────┘
```

**Technician View:**
```
┌─────────────────────────────────────────────────┐
│ [MARK READY FOR REVIEW] [ADD PHOTOS] [ADD NOTES]│
│ Cannot mark complete - Coordinator approval req. │
└─────────────────────────────────────────────────┘
```

### 2. Coordinator Dashboard (Central Control)

#### Top Alert Bar
```
┌─────────────────────────────────────────────────┐
│ ⚠️ 3 Work Orders Awaiting Your Approval         │
│ 🚨 Dean Override: Ramon pulled for emergency     │
└─────────────────────────────────────────────────┘
```

#### Approval Queue (Priority Section)
```
┌─────────────────────────────────────────────────┐
│ APPROVAL QUEUE (3)                              │
│ ┌─ WO-001 │ Building A-205 │ Ramon │ [APPROVE] ─┐│
│ ┌─ WO-003 │ Building B-101 │ Kishan│ [APPROVE] ─┐│
│ ┌─ WO-007 │ Building C-304 │ Carlos│ [APPROVE] ─┐│
└─────────────────────────────────────────────────┘
```

#### Technician Status Overview
```
┌─────────────────────────────────────────────────┐
│ TECHNICIAN STATUS                               │
│ Ramon    │ 3/6 Orders │ Building A │ ⚠️Override  │
│ Kishan   │ 2/6 Orders │ Building B │ Available   │
│ Carlos   │ 1/6 Orders │ Building C │ Available   │
└─────────────────────────────────────────────────┘
```

### 3. Voice Input Interface (Simplified)

#### Voice Recording Panel
```
┌─────────────────────────────────────────────────┐
│ VOICE WORK ORDER CREATION                       │
│                                                 │
│         🎤 [RECORD VOICE NOTE]                  │
│                                                 │
│ OR                                              │
│                                                 │
│    📄 [PASTE TRANSCRIPT TEXT]                   │
│                                                 │
│ Processing confidence: 85% ✓                   │
│ Auto-create if >80% confident                  │
└─────────────────────────────────────────────────┘
```

#### Extracted Information Display
```
┌─────────────────────────────────────────────────┐
│ EXTRACTED INFORMATION                           │
│ Description: "Leaky faucet in kitchen"          │
│ Building: Building A                            │
│ Unit: 205                                       │
│ Priority: Standard                              │
│ Confidence: 85%                                 │
│                                                 │
│ [CREATE WORK ORDER] [EDIT DETAILS] [DISCARD]   │
└─────────────────────────────────────────────────┘
```

### 4. Status Update Form (Role-Restricted)

#### Technician View (Limited Options)
```
┌─────────────────────────────────────────────────┐
│ UPDATE WORK ORDER WO-20240820-001              │
│                                                 │
│ Current Status: In Progress                     │
│                                                 │
│ Available Actions:                              │
│ ○ Mark Ready for Review (Photos Required)       │
│ ○ Add Progress Notes                            │
│                                                 │
│ ❌ Cannot mark "Complete" - Coordinator Only    │
│                                                 │
│ Photos Required:                                │
│ Before: ✓ Uploaded    After: ⚠️ Required       │
│                                                 │
│ [UPLOAD PHOTOS] [ADD NOTES] [UPDATE STATUS]    │
└─────────────────────────────────────────────────┘
```

#### Coordinator View (Full Control)
```
┌─────────────────────────────────────────────────┐
│ APPROVE WORK ORDER WO-20240820-001             │
│                                                 │
│ Current Status: Ready for Review                │
│ Technician: Ramon                               │
│                                                 │
│ Quality Check:                                  │
│ Photos: 2 uploaded ✓    Location: Verified ✓   │
│ Work Quality: [Rate 1-5] ★★★★☆                 │
│                                                 │
│ Coordinator Decision:                           │
│ ○ Approve Completion                            │
│ ○ Request Rework                                │
│ ○ Assign Different Technician                  │
│                                                 │
│ [APPROVE] [REJECT & RETURN] [REASSIGN]         │
└─────────────────────────────────────────────────┘
```

## Page Layouts - Phase 1

### 1. Main Dashboard Layout
```
┌─ Header: Maintenance Coordination System ────────┐
│                                    [Kristine] │
├─ Alert Bar: Approval Queue & Overrides ──────────┤
│                                                 │
├─ Left Panel (8 cols) ──┬─ Right Panel (4 cols) ─┤
│ • Approval Queue       │ • Technician Status    │
│ • Recent Activity      │ • System Alerts        │
│ • Quick Actions        │ • Voice Input          │
└────────────────────────┴─────────────────────────┘
```

### 2. Work Order List View
```
┌─ Navigation ─────────────────────────────────────┐
│ Dashboard | Work Orders | Approval Queue | Voice │
├─ Filters & Search ──────────────────────────────┤
│ Status: [All▼] Priority: [All▼] Tech: [All▼]   │
├─ Work Order Cards ──────────────────────────────┤
│ ┌─ WO-001 │ Emergency │ Ready Review │ [APPROVE]┐│
│ ┌─ WO-002 │ Standard  │ In Progress  │ [VIEW]  ┐│
│ ┌─ WO-003 │ Low       │ New          │ [ASSIGN]┐│
└─────────────────────────────────────────────────┘
```

### 3. Work Order Detail View
```
┌─ Work Order WO-20240820-001 ────────────────────┐
│ Back to List                        [EDIT] │
├─ Header Info ───────────────────────────────────┤
│ Title, Building, Priority, Status              │
├─ Main Content (Left) ──┬─ Actions (Right) ─────┤
│ • Description          │ • Status Updates       │
│ • Photos (Before/After)│ • Assignment          │
│ • Progress Notes       │ • Approval Actions    │
│ • Communication Log    │ • Quality Control     │
└────────────────────────┴───────────────────────┘
```

## Interactive States & Visual Feedback

### Authority Indicators
- **Blue borders/backgrounds**: Coordinator-only actions
- **Gray/disabled**: Technician-restricted actions  
- **Yellow highlights**: Items requiring coordinator attention
- **Red badges**: Emergency overrides or critical issues

### Status Progression Visual
```
New → Assigned → In Progress → Ready Review → ✓ Completed
 │        │           │            │
 └─ Coordinator Only ─┘            │
                                   └─ Coordinator Approval Required
```

### Photo Requirements Visual
```
Before Photo: ✓ Uploaded     Location: ✓ Verified
After Photo:  ⚠️ Required     Quality:  ⏳ Pending Review
```

## Mobile Responsive (Basic)

### Phone Layout (Stacked)
- Single column layout
- Collapsible sections
- Touch-friendly buttons (44px minimum)
- Simplified navigation menu
- Essential information only

### Tablet Layout (Adaptive)
- Two-column layout where space allows
- Expanded touch targets
- Side navigation panel
- Full feature access maintained

## Accessibility - Phase 1

### Essential Accessibility
- **High contrast**: All text meets WCAG AA standards
- **Keyboard navigation**: Tab through all interactive elements
- **Screen reader**: Semantic HTML with proper labels
- **Clear focus indicators**: Visible focus states for all controls

### Visual Hierarchy
- **Font sizes**: H1 (24px), H2 (20px), Body (16px), Small (14px)
- **Font weights**: Bold for headings, medium for emphasis, regular for body
- **Spacing**: Consistent 4px grid system
- **Colors**: Meaningful color usage with text alternatives

## Performance Requirements - Phase 1

### Load Times
- **Initial page load**: <3 seconds
- **Navigation**: <1 second between pages
- **Photo upload**: <10 seconds per image
- **Status updates**: <2 seconds confirmation

### Responsiveness
- **User actions**: Immediate visual feedback
- **Form submissions**: Loading states and confirmation
- **Real-time updates**: Status changes within 30 seconds
- **Error handling**: Clear error messages with recovery options

This Phase 1 UI specification focuses on clear coordinator authority, reliable basic functionality, and immediate usability. All advanced features are intentionally deferred to later phases.