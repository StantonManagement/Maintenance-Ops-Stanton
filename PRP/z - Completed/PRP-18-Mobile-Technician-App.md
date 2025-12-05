# PRP-18: Mobile Technician App

## Goal
Build mobile-optimized interface for technicians to view assignments, update status, upload photos, and communicate.

## Success Criteria
- [ ] Mobile-first responsive design
- [ ] Today's assignments in priority order
- [ ] One-tap status updates
- [ ] Camera integration for photos
- [ ] GPS check-in on arrival
- [ ] Quick messaging to coordinator
- [ ] Offline capability for basic functions

---

## Context

**User:** Field technicians (Ramon, Kishan)
**Device:** Smartphones (iOS/Android via browser)
**Key constraint:** Technicians CANNOT mark complete, only "Ready for Review"

**Core flows:**
- Morning: See today's work
- At job: Check in, take photos, update status
- After job: Mark ready for review, move to next

---

## Tasks

### Task 1: Mobile Layout Shell
- Bottom navigation: Today, All Jobs, Messages, Profile
- Pull-to-refresh
- Large touch targets (48px+)
- Works on 375px width screens

### Task 2: Today's Jobs View
- Cards for each assigned work order
- Sorted by scheduled time
- Shows: propertyAddress, unit, title, residentName, priority
- Swipe right to check in
- Tap for details

**IMPORTANT: Use correct WorkOrder property names:**
```typescript
import { WorkOrder } from '../types';  // NOT from component files!

// Use these properties:
workOrder.propertyAddress  // NOT location
workOrder.unit             // NOT unitNumber  
workOrder.residentName     // NOT tenant
workOrder.createdDate      // NOT timestamp
workOrder.priority         // 'emergency' | 'high' | 'normal' | 'low' (NOT 'medium')
```

### Task 3: Job Detail View
- Full work order info
- Tenant contact (tap to call)
- Navigation link (tap for directions)
- Status buttons: Check In, Start Work, Mark Ready
- Photo upload section
- Notes input

### Task 4: Photo Capture Component
- Use device camera directly
- Auto-compress before upload
- Tag as: Before, After, Cleanup, Other
- Show upload progress
- Retry failed uploads

### Task 5: GPS Check-In
- On "Check In" tap, capture GPS
- Verify within 100ft of property
- If not at location: warning, allow override with note
- Timestamp logged

### Task 6: Status Update Flow
- Check In → In Progress → Ready for Review
- Each transition requires confirmation
- "Ready for Review" requires photos uploaded
- Cannot skip to Ready without In Progress

### Task 7: Quick Message
- Floating button to message coordinator
- Pre-set messages: "Running late", "Need parts", "Access issue"
- Free-form text option
- Voice note option

### Task 8: Offline Mode
- Cache today's assignments
- Queue status updates when offline
- Queue photos for upload
- Sync when back online
- Show offline indicator

---

## Files to Create
- src/mobile/MobileApp.tsx
- src/mobile/pages/TodayJobs.tsx
- src/mobile/pages/JobDetail.tsx
- src/mobile/pages/MobileMessages.tsx
- src/mobile/components/PhotoCapture.tsx
- src/mobile/components/GPSCheckIn.tsx
- src/mobile/components/StatusButtons.tsx
- src/mobile/components/QuickMessage.tsx
- src/hooks/useOfflineSync.ts

---

## Anti-Patterns
- ❌ Don't allow "Complete" status (only Ready for Review)
- ❌ Don't require login every time (remember device)
- ❌ Don't upload full-res photos (compress)
- ❌ Don't block on poor connectivity
- ❌ Don't use `location`, `tenant`, `timestamp` in mock data - use `propertyAddress`, `residentName`, `createdDate`
- ❌ Don't use `priority: 'medium'` - valid values are `'emergency' | 'high' | 'normal' | 'low'`
- ❌ Don't import WorkOrder from component files - always `import { WorkOrder } from '../types'`

---

## Phase: 2
