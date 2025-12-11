import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface TechnicianPosition {
  id: string;
  name: string;
  status: string;
  skills: string[];
  latitude: number;
  longitude: number;
  accuracy?: number;
  batteryLevel?: number;
  recordedAt: string;
  minutesSinceUpdate: number;
}

export interface PropertyLocation {
  id: string;
  propertyCode: string;
  propertyName: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  address: string;
}

export interface GeofenceAlert {
  id: string;
  technicianId: string;
  technicianName?: string;
  propertyCode: string;
  alertType: 'left_geofence' | 'entered_geofence' | 'extended_absence';
  distanceFromProperty: number;
  triggeredAt: string;
  acknowledged: boolean;
}

// Mock data for when tables don't exist
const MOCK_TECHNICIAN_POSITIONS: TechnicianPosition[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mike Rodriguez',
    status: 'available',
    skills: ['plumbing', 'hvac'],
    latitude: 41.7662,
    longitude: -72.6738,
    batteryLevel: 85,
    recordedAt: new Date().toISOString(),
    minutesSinceUpdate: 2,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Sarah Chen',
    status: 'in-transit',
    skills: ['hvac', 'appliances'],
    latitude: 41.7595,
    longitude: -72.6820,
    batteryLevel: 62,
    recordedAt: new Date().toISOString(),
    minutesSinceUpdate: 5,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'James Wilson',
    status: 'busy',
    skills: ['electrical'],
    latitude: 41.7708,
    longitude: -72.6695,
    batteryLevel: 45,
    recordedAt: new Date().toISOString(),
    minutesSinceUpdate: 1,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Maria Lopez',
    status: 'available',
    skills: ['plumbing', 'general'],
    latitude: 41.7640,
    longitude: -72.6760,
    batteryLevel: 78,
    recordedAt: new Date().toISOString(),
    minutesSinceUpdate: 8,
  },
];

const MOCK_PROPERTIES: PropertyLocation[] = [
  {
    id: 'prop-1',
    propertyCode: 'S0021',
    propertyName: 'Stanton Heights',
    latitude: 41.7658,
    longitude: -72.6734,
    geofenceRadius: 200,
    address: '123 Main St, Hartford, CT',
  },
  {
    id: 'prop-2',
    propertyCode: 'S0045',
    propertyName: 'Riverside Commons',
    latitude: 41.7589,
    longitude: -72.6812,
    geofenceRadius: 200,
    address: '456 River Rd, Hartford, CT',
  },
  {
    id: 'prop-3',
    propertyCode: 'S0067',
    propertyName: 'Park View Apartments',
    latitude: 41.7712,
    longitude: -72.6689,
    geofenceRadius: 200,
    address: '789 Park Ave, Hartford, CT',
  },
];

const MOCK_ALERTS: GeofenceAlert[] = [
  {
    id: 'alert-1',
    technicianId: '33333333-3333-3333-3333-333333333333',
    technicianName: 'James Wilson',
    propertyCode: 'S0067',
    alertType: 'left_geofence',
    distanceFromProperty: 350,
    triggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
];

export function useMapData() {
  const [technicianPositions, setTechnicianPositions] = useState<TechnicianPosition[]>([]);
  const [properties, setProperties] = useState<PropertyLocation[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch technician positions
      const { data: posData, error: posError } = await supabase
        .from('v_technician_positions')
        .select('*');

      if (posError) {
        if (posError.code === '42P01' || posError.message.includes('does not exist')) {
          console.warn('Location tables not found, using mock data');
          setTechnicianPositions(MOCK_TECHNICIAN_POSITIONS);
          setProperties(MOCK_PROPERTIES);
          setAlerts(MOCK_ALERTS);
          return;
        }
        throw posError;
      }

      if (posData) {
        const transformed: TechnicianPosition[] = posData.map((p: any) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          skills: p.skills || [],
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          accuracy: p.accuracy ? parseFloat(p.accuracy) : undefined,
          batteryLevel: p.battery_level,
          recordedAt: p.recorded_at,
          minutesSinceUpdate: p.minutes_since_update || 0,
        }));
        setTechnicianPositions(transformed);
      }

      // Fetch properties
      const { data: propData, error: propError } = await supabase
        .from('property_coordinates')
        .select('*');

      if (!propError && propData) {
        const transformedProps: PropertyLocation[] = propData.map((p: any) => ({
          id: p.id,
          propertyCode: p.property_code,
          propertyName: p.property_name,
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          geofenceRadius: p.geofence_radius,
          address: p.address,
        }));
        setProperties(transformedProps);
      } else {
        setProperties(MOCK_PROPERTIES);
      }

      // Fetch unacknowledged alerts
      const { data: alertData, error: alertError } = await supabase
        .from('geofence_alerts')
        .select('*')
        .is('acknowledged_at', null)
        .order('triggered_at', { ascending: false });

      if (!alertError && alertData) {
        const transformedAlerts: GeofenceAlert[] = alertData.map((a: any) => ({
          id: a.id,
          technicianId: a.technician_id,
          propertyCode: a.property_code,
          alertType: a.alert_type,
          distanceFromProperty: parseFloat(a.distance_from_property),
          triggeredAt: a.triggered_at,
          acknowledged: false,
        }));
        setAlerts(transformedAlerts);
      } else {
        setAlerts(MOCK_ALERTS);
      }

    } catch (err) {
      console.error('Error fetching map data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Fallback to mock data
      setTechnicianPositions(MOCK_TECHNICIAN_POSITIONS);
      setProperties(MOCK_PROPERTIES);
      setAlerts(MOCK_ALERTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Set up real-time subscription for location updates
    const channel = supabase
      .channel('location-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'technician_locations' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchData]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('geofence_alerts')
        .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: 'Coordinator' })
        .eq('id', alertId);

      if (error) {
        // Fallback: just remove from local state
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        return true;
      }

      await fetchData();
      return true;
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      return true;
    }
  }, [fetchData]);

  // Calculate map center based on all positions
  const mapCenter = {
    lat: technicianPositions.length > 0
      ? technicianPositions.reduce((sum, t) => sum + t.latitude, 0) / technicianPositions.length
      : 41.7658,
    lng: technicianPositions.length > 0
      ? technicianPositions.reduce((sum, t) => sum + t.longitude, 0) / technicianPositions.length
      : -72.6734,
  };

  return {
    technicianPositions,
    properties,
    alerts,
    loading,
    error,
    refetch: fetchData,
    acknowledgeAlert,
    mapCenter,
    alertCount: alerts.length,
  };
}
