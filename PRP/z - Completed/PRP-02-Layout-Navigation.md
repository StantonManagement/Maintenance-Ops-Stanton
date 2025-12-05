# PRP-02: Layout & Navigation Shell

## Goal
Implement the 3-column desktop layout with routing. This establishes the app structure that all views plug into.

## Success Criteria
- [ ] React Router configured with routes for all Phase 1 views
- [ ] 3-column layout: Sidebar (240px) | Main (flex) | Detail Panel (480px)
- [ ] Navigation sidebar with active state indicators
- [ ] Detail panel shows/hides based on selection
- [ ] Mobile detection redirects to mobile layout
- [ ] `npm run build` succeeds

---

## Context

**Dependencies to install:** `react-router-dom`

**Existing patterns:**
- Follow VISUAL_STYLE_GUIDE.md for colors/spacing
- Use existing Radix UI components where available

**Routes needed:**
- `/` → redirect to /work-orders
- `/work-orders` → Work Order list
- `/work-orders/:id` → Work Order with detail panel open
- `/messages` → Messages view
- `/approvals` → Approvals queue
- `/calendar` → Calendar (Phase 2 - show locked state)
- `/dispatch` → Dispatch (Phase 2 - show locked state)

---

## Tasks

### Task 1: Router Setup
MODIFY `src/App.tsx`
- Wrap app in BrowserRouter
- Define all routes
- Handle 404 with redirect to /work-orders

### Task 2: Main Layout Component
CREATE `src/components/layout/MainLayout.tsx`
- 3-column flexbox structure
- Sidebar fixed 240px
- Main content flex-grow
- Detail panel 480px (conditionally rendered)
- Use CSS variables from design system

### Task 3: Navigation Sidebar
CREATE `src/components/layout/NavigationSidebar.tsx`
- Logo/brand at top
- Primary nav items: Messages, Work Orders, Approvals
- Secondary nav items: Calendar (locked), Dispatch (locked), Analytics (locked)
- Active state using useLocation()
- Badge counts for Messages (unread) and Approvals (pending)
- Use hooks from PRP-01 for counts

### Task 4: Detail Panel Container
CREATE `src/components/layout/DetailPanel.tsx`
- Slide-in animation from right
- Close button
- Renders children (content varies by view)
- Backdrop on mobile

### Task 5: Phase Lock Overlay
CREATE `src/components/ui/PhaseLockOverlay.tsx`
- Purple overlay for Phase 2 items
- Gray overlay for Phase 3 items
- Lock icon + "Coming in Phase X" text
- Prevents clicks

### Task 6: Mobile Detection
CREATE `src/hooks/useIsMobile.ts`
- Detect screen width < 768px
- Return boolean
- Used by MainLayout to switch layouts

---

## Validation Checkpoints

1. `npm run build` succeeds
2. Navigate to `/work-orders` - shows 3-column layout
3. Click nav items - URL changes, active state updates
4. Calendar/Dispatch show lock overlay
5. Resize to mobile width - layout changes

---

## Files to Create
- src/components/layout/MainLayout.tsx
- src/components/layout/NavigationSidebar.tsx
- src/components/layout/DetailPanel.tsx
- src/components/ui/PhaseLockOverlay.tsx
- src/hooks/useIsMobile.ts

## Files to Modify
- src/App.tsx (add router)

---

## Anti-Patterns
- ❌ Don't use manual view switching (use router)
- ❌ Don't hardcode colors (use CSS variables)
- ❌ Don't forget mobile breakpoint handling
- ❌ Don't make detail panel push content (overlay instead)

---

## Next
PRP-03: Work Order List & Filtering
