import { useState, useEffect, useCallback } from 'react';
import { 
  TechnicianLocation, 
  ETAResult,
  getAllTechnicianLocations, 
  getTechnicianLocation,
  calculateETA,
  getLocationHistory
} from '../services/locationService';

export function useLocationTracking() {
  const [locations, setLocations] = useState<TechnicianLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllTechnicianLocations();
      setLocations(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  const getLocation = useCallback(async (technicianId: string) => {
    return getTechnicianLocation(technicianId);
  }, []);

  const getETA = useCallback(async (
    technicianId: string, 
    destinationLat: number, 
    destinationLng: number
  ): Promise<ETAResult | null> => {
    const location = await getTechnicianLocation(technicianId);
    if (!location) return null;
    
    return calculateETA(
      location.latitude, 
      location.longitude, 
      destinationLat, 
      destinationLng
    );
  }, []);

  const getHistory = useCallback(async (technicianId: string, date: Date) => {
    return getLocationHistory(technicianId, date);
  }, []);

  const workingTechnicians = locations.filter(l => l.is_working);
  const offlineTechnicians = locations.filter(l => !l.is_working);

  return {
    locations,
    workingTechnicians,
    offlineTechnicians,
    loading,
    error,
    refetch: fetchLocations,
    getLocation,
    getETA,
    getHistory
  };
}
