import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export type SensorType = 'water_leak' | 'temperature' | 'humidity' | 'smoke' | 'co' | 'hvac' | 'door' | 'water_heater';
export type SensorStatus = 'normal' | 'warning' | 'critical' | 'offline';

export interface Sensor {
  id: string;
  unit_id: string;
  unit_name: string;
  property_id: string;
  property_name: string;
  type: SensorType;
  name: string;
  manufacturer: string;
  install_date: string;
  battery_level: number;
  last_reading_at: string;
  last_value: number;
  status: SensorStatus;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  value: number;
  timestamp: string;
}

export interface SensorAlert {
  id: string;
  sensor_id: string;
  sensor_name: string;
  type: 'warning' | 'critical';
  value: number;
  threshold: number;
  message: string;
  work_order_id?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface SensorThreshold {
  sensor_type: SensorType;
  warning_value: number;
  critical_value: number;
  comparison: 'greater_than' | 'less_than' | 'equals';
  unit: string;
}

// Default thresholds
export const defaultThresholds: SensorThreshold[] = [
  { sensor_type: 'water_leak', warning_value: 0, critical_value: 0, comparison: 'greater_than', unit: 'detected' },
  { sensor_type: 'temperature', warning_value: 55, critical_value: 45, comparison: 'less_than', unit: '°F' },
  { sensor_type: 'humidity', warning_value: 70, critical_value: 85, comparison: 'greater_than', unit: '%' },
  { sensor_type: 'smoke', warning_value: 0, critical_value: 0, comparison: 'greater_than', unit: 'detected' },
  { sensor_type: 'co', warning_value: 35, critical_value: 100, comparison: 'greater_than', unit: 'ppm' },
];

// Mock sensors
const mockSensors: Sensor[] = [
  {
    id: 'sensor-001',
    unit_id: 'unit-101',
    unit_name: 'Unit 101',
    property_id: 'prop-001',
    property_name: '90 Park Street',
    type: 'water_leak',
    name: 'Kitchen Water Sensor',
    manufacturer: 'Honeywell',
    install_date: '2024-01-15',
    battery_level: 85,
    last_reading_at: new Date().toISOString(),
    last_value: 0,
    status: 'normal',
    is_active: true
  },
  {
    id: 'sensor-002',
    unit_id: 'unit-205',
    unit_name: 'Unit 205',
    property_id: 'prop-001',
    property_name: '90 Park Street',
    type: 'temperature',
    name: 'Living Room Thermostat',
    manufacturer: 'Nest',
    install_date: '2023-11-01',
    battery_level: 92,
    last_reading_at: new Date().toISOString(),
    last_value: 68,
    status: 'normal',
    is_active: true
  },
  {
    id: 'sensor-003',
    unit_id: 'unit-310',
    unit_name: 'Unit 310',
    property_id: 'prop-002',
    property_name: '101 Maple Avenue',
    type: 'temperature',
    name: 'Bedroom Sensor',
    manufacturer: 'Ecobee',
    install_date: '2024-02-20',
    battery_level: 45,
    last_reading_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    last_value: 52,
    status: 'warning',
    is_active: true
  },
  {
    id: 'sensor-004',
    unit_id: 'unit-102',
    unit_name: 'Unit 102',
    property_id: 'prop-001',
    property_name: '90 Park Street',
    type: 'water_leak',
    name: 'Bathroom Water Sensor',
    manufacturer: 'Honeywell',
    install_date: '2024-01-15',
    battery_level: 78,
    last_reading_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    last_value: 1,
    status: 'critical',
    is_active: true
  },
  {
    id: 'sensor-005',
    unit_id: 'unit-201',
    unit_name: 'Unit 201',
    property_id: 'prop-001',
    property_name: '90 Park Street',
    type: 'smoke',
    name: 'Hallway Smoke Detector',
    manufacturer: 'First Alert',
    install_date: '2023-06-01',
    battery_level: 15,
    last_reading_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    last_value: 0,
    status: 'warning',
    is_active: true
  },
  {
    id: 'sensor-006',
    unit_id: 'unit-401',
    unit_name: 'Unit 401',
    property_id: 'prop-003',
    property_name: '222 Main Street',
    type: 'hvac',
    name: 'HVAC Monitor',
    manufacturer: 'Carrier',
    install_date: '2024-03-10',
    battery_level: 0,
    last_reading_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_value: 0,
    status: 'offline',
    is_active: false
  }
];

const mockAlerts: SensorAlert[] = [
  {
    id: 'alert-001',
    sensor_id: 'sensor-004',
    sensor_name: 'Bathroom Water Sensor - Unit 102',
    type: 'critical',
    value: 1,
    threshold: 0,
    message: 'Water leak detected in bathroom',
    work_order_id: 'WO-AUTO-001',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'alert-002',
    sensor_id: 'sensor-003',
    sensor_name: 'Bedroom Sensor - Unit 310',
    type: 'warning',
    value: 52,
    threshold: 55,
    message: 'Temperature below warning threshold',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'alert-003',
    sensor_id: 'sensor-005',
    sensor_name: 'Hallway Smoke Detector - Unit 201',
    type: 'warning',
    value: 15,
    threshold: 20,
    message: 'Low battery warning',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

// Generate mock readings for charts
function generateMockReadings(sensorId: string, hours: number): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Date.now();
  const sensor = mockSensors.find(s => s.id === sensorId);
  const baseValue = sensor?.type === 'temperature' ? 68 : 0;
  
  for (let i = hours; i >= 0; i--) {
    readings.push({
      id: `reading-${sensorId}-${i}`,
      sensor_id: sensorId,
      value: baseValue + (Math.random() - 0.5) * 10,
      timestamp: new Date(now - i * 60 * 60 * 1000).toISOString()
    });
  }
  return readings;
}

export function useSensors() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSensors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch sensors
      const { data: sensorsData, error: sensorsError } = await supabase
        .from('sensors')
        .select('*')
        .order('name');

      if (sensorsError) {
        console.warn('Supabase sensors error, using mock data:', sensorsError.message);
        setSensors(mockSensors);
        setAlerts(mockAlerts);
        return;
      }

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('sensor_alerts')
        .select('*, sensors(name)')
        .order('created_at', { ascending: false });

      if (alertsError) {
        console.warn('Supabase sensor_alerts error:', alertsError.message);
      }

      if (!sensorsData || sensorsData.length === 0) {
        console.log('No sensors in DB, using mock data');
        setSensors(mockSensors);
        setAlerts(mockAlerts);
        return;
      }

      // Map DB sensors to our interface
      setSensors(sensorsData.map(s => {
        const lastReading = s.last_reading as { value?: number; unit?: string } | null;
        return {
          id: s.id,
          unit_id: s.unit_id || '',
          unit_name: s.unit_id ? `Unit ${s.unit_id.split('-')[1] || ''}` : '',
          property_id: s.property_id || '',
          property_name: s.property_id || '',
          type: s.type as SensorType,
          name: s.name,
          manufacturer: 'Unknown',
          install_date: s.created_at,
          battery_level: s.battery_level || 0,
          last_reading_at: s.last_reading_at || s.created_at,
          last_value: lastReading?.value || 0,
          status: determineStatus(s),
          is_active: s.is_active !== false
        };
      }));

      if (alertsData && alertsData.length > 0) {
        setAlerts(alertsData.map(a => ({
          id: a.id,
          sensor_id: a.sensor_id,
          sensor_name: a.sensors?.name || 'Unknown Sensor',
          type: a.type as 'warning' | 'critical',
          value: a.reading_value || 0,
          threshold: 0,
          message: a.message,
          work_order_id: a.work_order_id,
          acknowledged_at: a.acknowledged_at,
          created_at: a.created_at
        })));
      } else {
        setAlerts(mockAlerts);
      }
    } catch (err) {
      console.warn('Failed to fetch sensors:', err);
      setSensors(mockSensors);
      setAlerts(mockAlerts);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper to determine sensor status based on thresholds
  function determineStatus(sensor: any): SensorStatus {
    if (!sensor.is_active) return 'offline';
    
    const lastReading = sensor.last_reading as { value?: number } | null;
    if (!lastReading?.value) return 'normal';
    
    const thresholds = sensor.thresholds as { high?: number; low?: number; critical_high?: number; critical_low?: number } | null;
    if (!thresholds) return 'normal';

    const value = lastReading.value;
    if (thresholds.critical_high && value >= thresholds.critical_high) return 'critical';
    if (thresholds.critical_low && value <= thresholds.critical_low) return 'critical';
    if (thresholds.high && value >= thresholds.high) return 'warning';
    if (thresholds.low && value <= thresholds.low) return 'warning';
    
    return 'normal';
  }

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  const getSensorReadings = useCallback(async (sensorId: string, hours: number = 24): Promise<SensorReading[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockReadings(sensorId, hours);
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string, userId: string = 'coordinator') => {
    try {
      const { error } = await supabase
        .from('sensor_alerts')
        .update({ 
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId
        })
        .eq('id', alertId);

      if (error) {
        console.warn('Failed to acknowledge alert in DB:', error.message);
      }

      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, acknowledged_at: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.warn('Error acknowledging alert:', err);
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, acknowledged_at: new Date().toISOString() } : a
      ));
    }
  }, []);

  const getSensorsByStatus = useCallback((status: SensorStatus) => {
    return sensors.filter(s => s.status === status);
  }, [sensors]);

  const getSensorsByProperty = useCallback((propertyId: string) => {
    return sensors.filter(s => s.property_id === propertyId);
  }, [sensors]);

  const activeSensors = sensors.filter(s => s.is_active);
  const criticalSensors = sensors.filter(s => s.status === 'critical');
  const warningSensors = sensors.filter(s => s.status === 'warning');
  const offlineSensors = sensors.filter(s => s.status === 'offline');
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged_at);

  return {
    sensors,
    alerts,
    activeSensors,
    criticalSensors,
    warningSensors,
    offlineSensors,
    unacknowledgedAlerts,
    loading,
    error,
    refetch: fetchSensors,
    getSensorReadings,
    acknowledgeAlert,
    getSensorsByStatus,
    getSensorsByProperty
  };
}
