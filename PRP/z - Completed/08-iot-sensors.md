# PRP 08: IoT & Sensors

## Goal
Replace mock sensor data with real queries. Fix threshold configuration.

## Pre-Check
```bash
grep -r "mockSensor\|mockAlert\|generateMockReadings" src/
```

## Issues to Fix

### 1. Sensor Data - Heavy fallback to mocks
**Fix:**
- Query `sensors` table
- Return real sensor list with status
- Handle empty state gracefully (show "No sensors configured")

### 2. Readings Chart - Uses `generateMockReadings`
**Fix:**
- Query `sensor_readings` table
- Return time-series data for chart
- If no readings, show empty state not fake data

### 3. Threshold Config - Shows "Coming Soon"
**Fix:**
- Create threshold editor modal
- Save to `sensor_thresholds` table
- Fields: sensor_id, metric, min_value, max_value, alert_enabled

### 4. Alerts - Falls back to `mockAlerts`
**Fix:**
- Query `sensor_alerts` table
- Show real alerts or empty state

## Create/Modify Files

### 1. `src/services/sensorService.ts`
- `getSensors(propertyId?: string): Promise<Sensor[]>`
- `getSensorReadings(sensorId: string, hours: number): Promise<Reading[]>`
- `getSensorAlerts(propertyId?: string): Promise<Alert[]>`
- `updateSensorThreshold(sensorId: string, threshold: Threshold): Promise<void>`

### 2. `src/components/sensors/ThresholdConfigModal.tsx`
- Form: sensor select, metric select, min, max, alert toggle
- Save to database

### 3. Update components to remove mock fallbacks
- Show "No data" or "Configure sensors" instead of fake data
- Only show charts when real data exists

## Database Tables Needed
```sql
-- sensors
id, property_id, unit_id, sensor_type, location, status, last_reading_at

-- sensor_readings
id, sensor_id, metric, value, recorded_at

-- sensor_thresholds
id, sensor_id, metric, min_value, max_value, alert_enabled

-- sensor_alerts
id, sensor_id, alert_type, message, severity, triggered_at, resolved_at
```

## Validation
```bash
npm run build
# Manual: View sensors page with no sensors - shows empty state
# Manual: If sensors exist, shows real data
# Manual: Threshold config saves to database
```

## Note
IoT may be Phase 3 feature. If tables don't exist and creating them is out of scope, update UI to show "IoT integration coming in Phase 3" instead of fake data.
