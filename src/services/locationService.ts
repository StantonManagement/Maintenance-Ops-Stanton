// Location tracking service for technicians

export interface TechnicianLocation {
  id: string;
  technician_id: string;
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  timestamp: string;
  battery_level?: number;
  is_working: boolean;
}

export interface ETAResult {
  distance_km: number;
  duration_minutes: number;
  traffic_delay_minutes: number;
  arrival_time: string;
}

// Mock technician locations (Hartford, CT area)
const mockLocations: Record<string, TechnicianLocation> = {
  'tech-1': {
    id: 'loc-001',
    technician_id: 'tech-1',
    latitude: 41.7658,
    longitude: -72.6734,
    accuracy: 10,
    timestamp: new Date().toISOString(),
    battery_level: 85,
    is_working: true
  },
  'tech-2': {
    id: 'loc-002',
    technician_id: 'tech-2',
    latitude: 41.7589,
    longitude: -72.6856,
    accuracy: 15,
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    battery_level: 62,
    is_working: true
  },
  'tech-3': {
    id: 'loc-003',
    technician_id: 'tech-3',
    latitude: 41.7712,
    longitude: -72.6543,
    accuracy: 8,
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    battery_level: 91,
    is_working: true
  },
  'tech-4': {
    id: 'loc-004',
    technician_id: 'tech-4',
    latitude: 41.7534,
    longitude: -72.6921,
    accuracy: 20,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    battery_level: 45,
    is_working: false
  }
};

// Property locations for ETA calculations
export const propertyLocations: Record<string, { lat: number; lng: number; address: string }> = {
  'prop-001': { lat: 41.7623, lng: -72.6789, address: '90 Park St' },
  'prop-002': { lat: 41.7701, lng: -72.6612, address: '101 Maple Ave' },
  'prop-003': { lat: 41.7545, lng: -72.6834, address: '222 Main St' },
  'prop-004': { lat: 41.7678, lng: -72.6567, address: '43 Frank St' },
};

export async function getTechnicianLocation(technicianId: string): Promise<TechnicianLocation | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockLocations[technicianId] || null;
}

export async function getAllTechnicianLocations(): Promise<TechnicianLocation[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return Object.values(mockLocations);
}

export async function calculateETA(
  fromLat: number, 
  fromLng: number, 
  toLat: number, 
  toLng: number
): Promise<ETAResult> {
  // Haversine formula for distance
  const R = 6371; // Earth's radius in km
  const dLat = (toLat - fromLat) * Math.PI / 180;
  const dLon = (toLng - fromLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  // Estimate driving time (assume 30 km/h average in urban area)
  const baseDuration = (distance / 30) * 60; // minutes
  
  // Add random traffic delay (0-10 minutes)
  const trafficDelay = Math.random() * 10;
  
  const totalDuration = baseDuration + trafficDelay;
  const arrivalTime = new Date(Date.now() + totalDuration * 60 * 1000);

  return {
    distance_km: Math.round(distance * 10) / 10,
    duration_minutes: Math.round(totalDuration),
    traffic_delay_minutes: Math.round(trafficDelay),
    arrival_time: arrivalTime.toISOString()
  };
}

export async function getLocationHistory(
  technicianId: string, 
  date: Date
): Promise<TechnicianLocation[]> {
  // Mock location history for a day
  const history: TechnicianLocation[] = [];
  const baseLocation = mockLocations[technicianId];
  
  if (!baseLocation) return [];

  // Generate hourly locations for the day
  for (let hour = 8; hour <= 17; hour++) {
    const timestamp = new Date(date);
    timestamp.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
    
    history.push({
      id: `hist-${technicianId}-${hour}`,
      technician_id: technicianId,
      latitude: baseLocation.latitude + (Math.random() - 0.5) * 0.02,
      longitude: baseLocation.longitude + (Math.random() - 0.5) * 0.02,
      accuracy: 10 + Math.random() * 20,
      timestamp: timestamp.toISOString(),
      battery_level: 100 - (hour - 8) * 5,
      is_working: hour >= 8 && hour <= 17
    });
  }

  return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function formatETA(minutes: number): string {
  if (minutes < 1) return 'Less than 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

export function getLocationAge(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
