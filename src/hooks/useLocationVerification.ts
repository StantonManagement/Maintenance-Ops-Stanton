import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface LocationVerification {
  id: string;
  work_order_id: string;
  technician_id: string;
  verification_type: 'check_in' | 'check_out' | 'photo_upload';
  expected_lat?: number;
  expected_lng?: number;
  actual_lat?: number;
  actual_lng?: number;
  distance_feet?: number;
  within_geofence?: boolean;
  verified: boolean;
  override_reason?: string;
  source?: string;
  created_at: string;
}

export function useLocationVerification() {
  const [verifying, setVerifying] = useState(false);
  const [lastVerification, setLastVerification] = useState<LocationVerification | null>(null);

  const verifyLocation = useCallback(async (
    workOrderId: string, 
    technicianId: string, 
    type: 'check_in' | 'check_out' | 'photo_upload',
    currentLat: number,
    currentLng: number,
    propertyCode?: string // Optional if we need to fetch it
  ) => {
    setVerifying(true);
    try {
      let propLat = 0;
      let propLng = 0;
      let geofenceRadius = 300; // default feet
      let propCode = propertyCode;

      // 1. Get property location if not provided or valid
      if (!propLat || !propLng) {
         // Try to find property coordinates
         // First get WO to find property code if missing
         if (!propCode) {
            // This assumes we can get property code from WO. 
            // For now, we'll try to find it via property_coordinates using property name or just skip if we can't link.
            // In a real scenario, we'd query the WO table.
         }

         if (propCode) {
             const { data: propData } = await supabase
               .from('property_coordinates')
               .select('latitude, longitude, geofence_radius')
               .eq('property_code', propCode)
               .single();
             
             if (propData) {
                 propLat = propData.latitude;
                 propLng = propData.longitude;
                 geofenceRadius = propData.geofence_radius || 200; // meters usually in DB, but let's assume conversion
                 // DB schema said meters. 200m ~ 656ft.
                 // Let's convert geofenceRadius (meters) to feet for consistency with PRP
                 geofenceRadius = (propData.geofence_radius || 200) * 3.28084;
             }
         }
      }

      // 2. Calculate distance (Haversine)
      // If we don't have property coords, we can't verify automatically -> verified = false
      let distanceFeet = 0;
      let withinGeofence = false;
      let verified = false;

      if (propLat && propLng) {
        const R = 6371e3; // metres
        const φ1 = currentLat * Math.PI/180;
        const φ2 = propLat * Math.PI/180;
        const Δφ = (propLat-currentLat) * Math.PI/180;
        const Δλ = (propLng-currentLng) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const distanceMeters = R * c;
        distanceFeet = distanceMeters * 3.28084;
        
        withinGeofence = distanceFeet <= geofenceRadius;
        verified = withinGeofence;
      }

      // 3. Record verification
      const { data, error } = await supabase
        .from('location_verifications')
        .insert({
          work_order_id: workOrderId,
          technician_id: technicianId,
          verification_type: type,
          expected_lat: propLat || null,
          expected_lng: propLng || null,
          actual_lat: currentLat,
          actual_lng: currentLng,
          property_code: propCode,
          distance_feet: Math.round(distanceFeet),
          within_geofence: withinGeofence,
          verified: verified,
          source: 'web_app'
        })
        .select()
        .single();

      if (error) throw error;
      setLastVerification(data);
      return data;

    } catch (error) {
      console.error('Location verification failed:', error);
      throw error;
    } finally {
      setVerifying(false);
    }
  }, []);

  const overrideVerification = useCallback(async (verificationId: string, reason: string) => {
    const { data, error } = await supabase
      .from('location_verifications')
      .update({
        verified: true,
        override_reason: reason
      })
      .eq('id', verificationId)
      .select()
      .single();

    if (error) throw error;
    setLastVerification(data);
    return data;
  }, []);

  return {
    verifyLocation,
    overrideVerification,
    verifying,
    lastVerification
  };
}
