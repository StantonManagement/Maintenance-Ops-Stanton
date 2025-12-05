# Maintenance Ops Center - Remediation PRPs

## Execution Order

Run these PRPs in sequence. Each depends on the previous one completing successfully.

---

## 1. PRP-DATABASE-SCHEMA.md
**What:** Creates all missing Supabase tables
**Where:** Run SQL in Supabase Dashboard → SQL Editor
**Time:** ~5 minutes
**Validates:** 
- Tables exist
- Seed data present
- `SELECT COUNT(*) FROM technicians;` returns 4

---

## 2. PRP-DATABASE-FUNCTIONS.md
**What:** Creates RPC functions for business logic enforcement
**Where:** Run SQL in Supabase Dashboard → SQL Editor
**Time:** ~5 minutes
**Validates:**
- `SELECT * FROM check_technician_capacity('11111111-1111-1111-1111-111111111111');`
- `SELECT * FROM v_todays_schedule;`

---

## 3. PRP-HOOK-CLEANUP.md
**What:** Updates React hooks to use real data, fixes navigation
**Where:** Windsurf/Cursor - modify files in `src/`
**Time:** ~30 minutes
**Validates:**
- `npm run build` succeeds
- No console errors about mock data
- All routes accessible via sidebar

---

## 4. PRP-USER-STORIES.md
**What:** Connects UI actions to database - the actual "make it work" PRP
**Where:** Windsurf/Cursor - modify files in `src/`
**Time:** ~45 minutes
**Validates:**
- Drag-drop assignment creates database record
- Capacity limit blocks 7th assignment
- "Mark Ready for Review" appears in approval queue
- Coordinator can complete, technician cannot
- Override logs to audit trail

**This is the critical one** - the previous PRPs set up infrastructure, this one makes the user flows actually work end-to-end.

---

## 5. PRP-MAP-TRACKING.md
**What:** StarCraft-style minimap + full dispatch map with geofencing
**Where:** 
- SQL in Supabase (property coordinates, location history table)
- Windsurf/Cursor (React Leaflet components)
**Time:** ~60 minutes
**Validates:**
- Minimap shows in corner of dispatch view
- Full map shows properties as green dots, techs as blue dots
- Red dot + alert when tech leaves geofence (>200m from building)
- Real-time updates via Supabase subscription

**Dependencies:** Requires `npm install leaflet react-leaflet @types/leaflet`

---

## Quick Verification After All PRPs

```bash
# In Supabase SQL Editor:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
# Should show: technicians, properties, units, tenants, equipment, work_order_assignments, etc.

# In browser dev tools console (after app loads):
# Should NOT see: "falling back to mock data"
# Should NOT see: "Technician not found"

# Navigation test:
# Click every sidebar item - none should 404
```

---

## Files Created

| File | Purpose |
|------|---------|
| `PRP-DATABASE-SCHEMA.md` | SQL for 11 tables + indexes + triggers |
| `PRP-DATABASE-FUNCTIONS.md` | SQL for RPC functions + views |
| `PRP-HOOK-CLEANUP.md` | TypeScript changes for hooks + navigation |
| `PRP-USER-STORIES.md` | End-to-end user flow integration |
| `PRP-MAP-TRACKING.md` | Minimap + full map with geofencing |

---

## If Things Break

**"relation does not exist" errors:**
→ Run PRP-DATABASE-SCHEMA first

**"function does not exist" errors:**
→ Run PRP-DATABASE-FUNCTIONS after schema

**"No technicians found" in console:**
→ Seed data wasn't inserted - check Task 3 in schema PRP

**RLS policy errors:**
→ Check Task 2 in schema PRP - policies may be missing

---

## What These PRPs Don't Cover

- AI Service integration (still mock - separate PRP needed)
- AppFolio sync verification (check separately)
- Photo upload storage (S3/Supabase Storage config needed)
- Production RLS policies (current ones are permissive for dev)
