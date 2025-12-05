# PRP-25: IoT Sensor Integration

## Goal
Connect building sensors (water leak, temperature, smoke) to auto-generate work orders and alerts for predictive maintenance.

## Success Criteria
- [ ] Ingest sensor data via webhook/MQTT
- [ ] Define alert thresholds per sensor type
- [ ] Auto-create work order on alert
- [ ] Dashboard showing sensor status
- [ ] Historical sensor data charts
- [ ] Predictive alerts (trending toward failure)

---

## Context

**Sensor types:**
- Water leak detectors
- Temperature/humidity sensors
- Smoke/CO detectors
- HVAC performance monitors
- Door/window sensors
- Water heater monitors

**Alert → Action flow:**
1. Sensor reports anomaly
2. System checks threshold
3. If exceeded: create work order automatically
4. Notify coordinator
5. If critical: escalate to emergency

---

## Tasks

### Task 1: Sensors Table
Add to Supabase:
- sensors: id, unit_id, type, manufacturer, install_date, battery_level, last_reading_at, is_active
- sensor_readings: id, sensor_id, value, timestamp
- sensor_alerts: id, sensor_id, type, value, threshold, work_order_id, acknowledged_at

### Task 2: Sensor Ingestion Endpoint
- Webhook to receive sensor data
- Support multiple formats (JSON, Protobuf)
- Validate and store reading
- Check against thresholds
- Trigger alert if needed

### Task 3: Threshold Configuration
- Per sensor type defaults
- Override per sensor
- Multiple thresholds (warning, critical)
- Examples:
  - Water detected: any > 0 = critical
  - Temperature: < 55°F = warning, < 45°F = critical
  - Battery: < 20% = warning, < 5% = critical

### Task 4: Auto Work Order Creation
- On critical alert: create emergency WO
- Include: sensor type, location, reading value
- Tag as "sensor_triggered"
- Link sensor to work order

### Task 5: Sensor Dashboard
- Map view with sensor locations
- Color by status (green, yellow, red)
- Click for sensor details
- Filter by type, building, status
- Route: /sensors

### Task 6: Sensor Detail View
- Current reading
- Historical chart (24h, 7d, 30d)
- Alert history
- Linked work orders
- Battery status
- Edit thresholds

### Task 7: Predictive Alerts
- Analyze trends in readings
- "Temperature trending down, may hit threshold in 6 hours"
- Create preventive work order before failure
- Show predictions on dashboard

### Task 8: Sensor Health Report
- Battery levels across portfolio
- Offline sensors
- Alert frequency by building
- Sensor ROI (issues caught before damage)

---

## Files to Create
- src/pages/SensorDashboard.tsx
- src/components/sensors/SensorMap.tsx
- src/components/sensors/SensorDetail.tsx
- src/components/sensors/SensorChart.tsx
- src/components/sensors/ThresholdEditor.tsx
- src/components/sensors/PredictiveAlerts.tsx
- src/hooks/useSensors.ts
- src/services/sensorIngestion.ts
- API endpoint for webhook

---

## Anti-Patterns
- ❌ Don't create duplicate WOs for same ongoing alert
- ❌ Don't ignore offline sensors
- ❌ Don't set thresholds too sensitive (alert fatigue)
- ❌ Don't forget battery monitoring

---

## Phase: 3 (Future)
