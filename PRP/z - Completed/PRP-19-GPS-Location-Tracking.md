# PRP-19: GPS Location Tracking

## Goal
Track technician locations in real-time for dispatch optimization and ETA calculations.

## Success Criteria
- [ ] Technician locations update in real-time
- [ ] Map view in dispatch shows all tech positions
- [ ] ETA calculations based on current location
- [ ] Location history for audit
- [ ] Privacy controls (only during work hours)
- [ ] Battery-efficient tracking

---

## Context

**Privacy:** Only track during work hours, technician can see their own data

**Use cases:**
- Dispatch sees who's closest to emergency
- Auto-calculate drive time for scheduling
- "Technician is 15 minutes away" notifications
- Verify tech actually visited location

---

## Tasks

### Task 1: Location Table
Add to Supabase:
- technician_locations: id, technician_id, latitude, longitude, accuracy, timestamp, battery_level

### Task 2: Location Service (Mobile)
- Background location updates
- Configurable interval (5 min default)
- Battery optimization
- Only active during work hours
- Manual "I'm working" toggle

### Task 3: Location Sync
- Batch upload locations
- Handle offline (queue and sync)
- Deduplicate close timestamps
- Clean up old data (30 day retention)

### Task 4: Dispatch Map Integration
- Real-time markers for each tech
- Color by status
- Click marker for tech details
- Draw route from tech to work order location
- Show ETA

### Task 5: ETA Calculator
- Input: tech location, destination
- Use routing API (Google/Mapbox)
- Account for traffic
- Update tenant: "Technician arriving in ~15 min"

### Task 6: Location History View
- Coordinator can view tech's route for a day
- Useful for audit/disputes
- Privacy: only accessible to coordinator
- Route: /technicians/:id/location-history

### Task 7: Geofence Alerts
- Define geofence around each property
- Alert when tech enters/exits
- Auto check-in suggestion when entering
- Verify photos taken at location

---

## Files to Create
- src/services/locationService.ts
- src/hooks/useLocationTracking.ts
- src/components/dispatch/LiveMap.tsx
- src/components/dispatch/TechnicianMarker.tsx
- src/components/dispatch/ETACalculator.tsx
- src/pages/LocationHistoryPage.tsx
- src/mobile/hooks/useBackgroundLocation.ts

---

## Anti-Patterns
- ❌ Don't track 24/7 (work hours only)
- ❌ Don't drain battery (batch updates)
- ❌ Don't store indefinitely (30 day max)
- ❌ Don't expose location to tenants (only ETA)

---

## Phase: 2
