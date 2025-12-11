# P02-07: GPS Verification

## Goal
Verify tech location matches building on check-in/out. Flag discrepancies.

## Table

```sql
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS latitude DECIMAL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS longitude DECIMAL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS geofence_radius_feet INTEGER DEFAULT 300;

CREATE TABLE location_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id),
  technician_id UUID,
  verification_type TEXT, -- check_in, check_out, photo_upload
  expected_lat DECIMAL,
  expected_lng DECIMAL,
  actual_lat DECIMAL,
  actual_lng DECIMAL,
  distance_feet INTEGER,
  within_geofence BOOLEAN,
  verified BOOLEAN,
  override_reason TEXT,
  source TEXT, -- workyard, mobile_app, photo_metadata
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Files
- `src/hooks/useLocationVerification.ts`
- `src/components/location/LocationBadge.tsx`
- `src/components/location/LocationVerificationPanel.tsx`
- `src/components/location/LocationOverrideModal.tsx`

## Tasks
1. Create table, add columns to buildings
2. Hook: fetch verifications for WO, override mutation
3. Badge: green check if verified, red warning if not, shows distance
4. Panel: status banner, timeline of check-in/out events
5. Override modal: select reason from list, confirm

## Validation
- [ ] Badge shows verified/not verified state
- [ ] Panel shows distance from building
- [ ] Override requires reason selection
- [ ] Timeline shows all location events
