-- IoT Sensors Tables
-- Run this in Supabase SQL Editor to create the tables

-- Main sensors table
CREATE TABLE IF NOT EXISTS sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('temperature', 'humidity', 'water_leak', 'motion', 'smoke', 'co2', 'pressure')),
  unit_id TEXT,
  property_id TEXT,
  location_description TEXT,
  thresholds JSONB DEFAULT '{"high": null, "low": null, "critical_high": null, "critical_low": null}',
  is_active BOOLEAN DEFAULT true,
  battery_level INTEGER,
  last_reading JSONB,
  last_reading_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor readings history
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  unit TEXT,
  battery_level INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor alerts
CREATE TABLE IF NOT EXISTS sensor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('warning', 'critical', 'info')),
  message TEXT NOT NULL,
  reading_value NUMERIC,
  threshold_violated TEXT CHECK (threshold_violated IN ('high', 'low', 'critical_high', 'critical_low', NULL)),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  work_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sensors_device_id ON sensors(device_id);
CREATE INDEX IF NOT EXISTS idx_sensors_property ON sensors(property_id);
CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor ON sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_time ON sensor_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_sensor ON sensor_alerts(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_unack ON sensor_alerts(acknowledged_at) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_work_order ON sensor_alerts(work_order_id);

-- Enable Row Level Security
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all for authenticated on sensors" ON sensors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon on sensors" ON sensors
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on sensor_readings" ON sensor_readings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert for anon on sensor_readings" ON sensor_readings
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow all for authenticated on sensor_alerts" ON sensor_alerts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data for sensors
INSERT INTO sensors (device_id, name, type, property_id, unit_id, location_description, thresholds, is_active, battery_level, last_reading, last_reading_at) VALUES
(
  'TEMP-001',
  'Basement Temperature',
  'temperature',
  'prop-001',
  NULL,
  'Basement near boiler room',
  '{"high": 80, "low": 45, "critical_high": 95, "critical_low": 32}',
  true,
  85,
  '{"value": 68, "unit": "F"}',
  NOW() - INTERVAL '5 minutes'
),
(
  'TEMP-002',
  'Unit 205 Thermostat',
  'temperature',
  'prop-001',
  'unit-205',
  'Living room wall',
  '{"high": 78, "low": 60, "critical_high": 85, "critical_low": 50}',
  true,
  92,
  '{"value": 72, "unit": "F"}',
  NOW() - INTERVAL '2 minutes'
),
(
  'LEAK-001',
  'Water Heater Leak Sensor',
  'water_leak',
  'prop-001',
  NULL,
  'Under water heater in utility room',
  '{"critical_high": 1}',
  true,
  78,
  '{"value": 0, "unit": "boolean"}',
  NOW() - INTERVAL '10 minutes'
),
(
  'HUMID-001',
  'Bathroom Humidity',
  'humidity',
  'prop-001',
  'unit-310',
  'Bathroom ceiling',
  '{"high": 70, "critical_high": 85}',
  true,
  65,
  '{"value": 55, "unit": "%"}',
  NOW() - INTERVAL '8 minutes'
),
(
  'SMOKE-001',
  'Hallway Smoke Detector',
  'smoke',
  'prop-002',
  NULL,
  'Third floor hallway',
  '{"critical_high": 1}',
  true,
  90,
  '{"value": 0, "unit": "boolean"}',
  NOW() - INTERVAL '1 minute'
);

-- Seed some alerts
INSERT INTO sensor_alerts (sensor_id, type, message, reading_value, threshold_violated, created_at) 
SELECT 
  id,
  'warning',
  'Temperature approaching high threshold',
  76,
  'high',
  NOW() - INTERVAL '2 hours'
FROM sensors WHERE device_id = 'TEMP-001';

INSERT INTO sensor_alerts (sensor_id, type, message, reading_value, threshold_violated, created_at)
SELECT 
  id,
  'warning',
  'Humidity elevated - check ventilation',
  72,
  'high',
  NOW() - INTERVAL '1 hour'
FROM sensors WHERE device_id = 'HUMID-001';
