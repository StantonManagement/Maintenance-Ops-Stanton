# PRP-30: Wire IoT Sensors to Work Orders

## Goal
Connect IoT Sensor alerts to automatically create emergency work orders.

## Current State
- UI exists: SensorDashboardPage, sensor cards, alert list
- Uses mock sensor data
- "Acknowledge" button works on mock
- "Configure Thresholds" shows coming soon
- Alerts don't create work orders

## Success Criteria
- [ ] Sensors table in Supabase with real schema
- [ ] Sensor readings stored with timestamps
- [ ] Alerts stored with threshold violations
- [ ] Critical alerts auto-create emergency work orders
- [ ] Acknowledge button persists to DB
- [ ] Work orders link back to triggering alert

---

## Tasks

### Task 1: Sensor Tables
Add to Supabase:
```sql
CREATE TABLE sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'temperature', 'humidity', 'water_leak', 'motion', 'smoke'
  unit_id UUID,
  property_id UUID,
  location_description TEXT, -- "Basement near water heater"
  thresholds JSONB DEFAULT '{}', -- {high: 80, low: 32, critical_high: 95}
  is_active BOOLEAN DEFAULT true,
  battery_level INTEGER,
  last_reading JSONB,
  last_reading_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID REFERENCES sensors(id),
  value NUMERIC NOT NULL,
  unit TEXT, -- 'F', '%', 'boolean'
  battery_level INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sensor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id UUID REFERENCES sensors(id),
  type TEXT NOT NULL, -- 'warning', 'critical'
  message TEXT NOT NULL,
  reading_value NUMERIC,
  threshold_violated TEXT, -- 'high', 'low', 'critical_high'
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  work_order_id UUID REFERENCES work_orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Task 2: Create useSensors Hook
CREATE `src/hooks/useSensors.ts`:
- fetchSensors(): get all sensors with last reading
- fetchAlerts(filter): get alerts, optionally unacknowledged only
- acknowledgeAlert(alertId, userId): mark acknowledged
- getSensorReadings(sensorId, timeRange): historical data

### Task 3: Sensor Webhook Endpoint
CREATE Supabase Edge Function `sensor-data`:
- POST /functions/v1/sensor-data
- Accepts: { device_id, value, battery_level }
- Process:
  1. Find sensor by device_id
  2. Store reading in sensor_readings
  3. Update sensor.last_reading
  4. Check thresholds
  5. If threshold violated: create alert
  6. If critical: create work order

### Task 4: Auto Work Order Creation
In webhook when critical threshold violated:
```typescript
// Create emergency work order
const workOrder = await supabase.from('work_orders').insert({
  description: `SENSOR ALERT: ${sensor.name} - ${alert.message}`,
  category: sensor.type === 'water_leak' ? 'plumbing' : 'maintenance',
  priority: 'emergency',
  source: 'iot_sensor',
  status: 'new',
  unit_id: sensor.unit_id,
  property_id: sensor.property_id
}).select().single();

// Link to alert
await supabase.from('sensor_alerts').update({
  work_order_id: workOrder.id
}).eq('id', alert.id);
```

### Task 5: Wire SensorDashboardPage
MODIFY sensor dashboard components:
- Replace mock data with useSensors() hook
- Acknowledge button calls acknowledgeAlert()
- Show real last reading times
- Link alerts to work orders (if exists)

### Task 6: Threshold Configuration Modal
CREATE `src/components/sensors/ThresholdConfigModal.tsx`:
- Edit thresholds per sensor
- Fields: high, low, critical_high, critical_low
- Save to sensor.thresholds JSONB

### Task 7: Seed Test Sensors
Create seed data:
- Temperature sensor (unit basement)
- Water leak sensor (water heater area)
- Humidity sensor (bathroom)

### Task 8: Test Webhook
Use curl or Postman:
```bash
curl -X POST https://[project].supabase.co/functions/v1/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"device_id": "TEMP-001", "value": 95, "battery_level": 80}'
```
Verify alert created and work order if critical.

---

## Validation Checkpoints
1. Sensors table has seed data
2. /sensors shows real sensor list
3. Webhook creates readings and alerts
4. Critical alert creates emergency WO
5. WO visible in /work-orders with source='iot_sensor'
6. Acknowledge persists to DB

---

## Files to Modify
- src/pages/SensorDashboardPage.tsx (or components)

## Files to Create
- src/hooks/useSensors.ts
- src/components/sensors/ThresholdConfigModal.tsx
- supabase/functions/sensor-data/index.ts
- Supabase migration for sensor tables
- Seed data SQL

---

## Anti-Patterns
- ❌ Don't create duplicate WOs for same ongoing alert
- ❌ Don't lose readings if threshold check fails
- ❌ Don't require immediate WO creation (queue if needed)
