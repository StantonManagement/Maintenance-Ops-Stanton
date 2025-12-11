-- Location Tracking Schema for Map Feature
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. TECHNICIAN LOCATIONS TABLE (Real-time positions)
-- ============================================
CREATE TABLE IF NOT EXISTS technician_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2), -- meters
  heading DECIMAL(5, 2), -- degrees
  speed DECIMAL(6, 2), -- m/s
  battery_level INTEGER, -- percentage
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(technician_id) -- Only keep latest position per tech
);

CREATE INDEX IF NOT EXISTS idx_tech_locations_tech ON technician_locations(technician_id);
CREATE INDEX IF NOT EXISTS idx_tech_locations_time ON technician_locations(recorded_at);

-- ============================================
-- 2. LOCATION HISTORY TABLE (Historical breadcrumbs)
-- ============================================
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_history_tech ON location_history(technician_id);
CREATE INDEX IF NOT EXISTS idx_location_history_time ON location_history(recorded_at);

-- ============================================
-- 3. PROPERTY COORDINATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS property_coordinates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_code TEXT NOT NULL UNIQUE,
  property_name TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geofence_radius INTEGER DEFAULT 200, -- meters
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_coords_code ON property_coordinates(property_code);

-- ============================================
-- 4. GEOFENCE ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS geofence_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  property_code TEXT,
  alert_type TEXT CHECK (alert_type IN ('left_geofence', 'entered_geofence', 'extended_absence')),
  distance_from_property DECIMAL(8, 2), -- meters
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_geofence_alerts_tech ON geofence_alerts(technician_id);
CREATE INDEX IF NOT EXISTS idx_geofence_alerts_unack ON geofence_alerts(acknowledged_at) WHERE acknowledged_at IS NULL;

-- ============================================
-- 5. RLS POLICIES
-- ============================================
ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_coordinates ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated on technician_locations" ON technician_locations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on technician_locations" ON technician_locations
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on location_history" ON location_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated on property_coordinates" ON property_coordinates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read for anon on property_coordinates" ON property_coordinates
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on geofence_alerts" ON geofence_alerts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 6. SEED DATA: PROPERTY COORDINATES (Hartford, CT area)
-- ============================================
INSERT INTO property_coordinates (property_code, property_name, latitude, longitude, address, geofence_radius) VALUES
  ('S0021', 'Stanton Heights', 41.7658, -72.6734, '123 Main St, Hartford, CT', 200),
  ('S0045', 'Riverside Commons', 41.7589, -72.6812, '456 River Rd, Hartford, CT', 200),
  ('S0067', 'Park View Apartments', 41.7712, -72.6689, '789 Park Ave, Hartford, CT', 200),
  ('S0089', 'Downtown Lofts', 41.7634, -72.6756, '321 Center St, Hartford, CT', 150)
ON CONFLICT (property_code) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- ============================================
-- 7. SEED DATA: TECHNICIAN LOCATIONS (Simulated)
-- ============================================
INSERT INTO technician_locations (technician_id, latitude, longitude, accuracy, battery_level) VALUES
  ('11111111-1111-1111-1111-111111111111', 41.7662, -72.6738, 10.5, 85),
  ('22222222-2222-2222-2222-222222222222', 41.7595, -72.6820, 8.2, 62),
  ('33333333-3333-3333-3333-333333333333', 41.7708, -72.6695, 15.0, 45),
  ('44444444-4444-4444-4444-444444444444', 41.7640, -72.6760, 12.3, 78)
ON CONFLICT (technician_id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  battery_level = EXCLUDED.battery_level,
  recorded_at = NOW();

-- ============================================
-- 8. FUNCTION: Update Technician Location
-- ============================================
CREATE OR REPLACE FUNCTION update_technician_location(
  p_technician_id UUID,
  p_latitude DECIMAL(10, 8),
  p_longitude DECIMAL(11, 8),
  p_accuracy DECIMAL(6, 2) DEFAULT NULL,
  p_battery INTEGER DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  geofence_alert BOOLEAN,
  alert_property TEXT,
  distance_meters DECIMAL(8, 2)
) AS $$
DECLARE
  v_property RECORD;
  v_distance DECIMAL(8, 2);
  v_alert_triggered BOOLEAN := false;
  v_alert_property TEXT := NULL;
BEGIN
  -- Update current location
  INSERT INTO technician_locations (technician_id, latitude, longitude, accuracy, battery_level)
  VALUES (p_technician_id, p_latitude, p_longitude, p_accuracy, p_battery)
  ON CONFLICT (technician_id) DO UPDATE SET
    latitude = p_latitude,
    longitude = p_longitude,
    accuracy = p_accuracy,
    battery_level = COALESCE(p_battery, technician_locations.battery_level),
    recorded_at = NOW();
  
  -- Add to history
  INSERT INTO location_history (technician_id, latitude, longitude, accuracy)
  VALUES (p_technician_id, p_latitude, p_longitude, p_accuracy);
  
  -- Check geofences (simplified distance calculation)
  FOR v_property IN SELECT * FROM property_coordinates LOOP
    -- Haversine approximation (simplified for small distances)
    v_distance := 111320 * SQRT(
      POWER(p_latitude - v_property.latitude, 2) +
      POWER(COS(RADIANS(p_latitude)) * (p_longitude - v_property.longitude), 2)
    );
    
    -- Check if outside geofence
    IF v_distance > v_property.geofence_radius THEN
      -- Check if tech was previously inside this geofence
      -- For now, just flag if they're far from any property they might be assigned to
      IF v_distance < 500 THEN -- Within 500m but outside geofence
        v_alert_triggered := true;
        v_alert_property := v_property.property_code;
        
        -- Record alert
        INSERT INTO geofence_alerts (technician_id, property_code, alert_type, distance_from_property)
        VALUES (p_technician_id, v_property.property_code, 'left_geofence', v_distance);
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT true, v_alert_triggered, v_alert_property, v_distance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. VIEW: Current Technician Positions with Details
-- ============================================
CREATE OR REPLACE VIEW v_technician_positions AS
SELECT 
  t.id,
  t.name,
  t.status,
  t.skills,
  tl.latitude,
  tl.longitude,
  tl.accuracy,
  tl.battery_level,
  tl.recorded_at,
  EXTRACT(EPOCH FROM (NOW() - tl.recorded_at)) / 60 as minutes_since_update
FROM technicians t
LEFT JOIN technician_locations tl ON t.id = tl.technician_id
ORDER BY t.name;
