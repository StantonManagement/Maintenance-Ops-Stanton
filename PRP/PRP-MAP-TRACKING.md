# PRP: Map & Location Tracking System

## Goal
Implement a "StarCraft-style" minimap and full dispatch map showing real-time technician locations, with geofencing alerts when technicians leave assigned buildings.

## Success Criteria
- [ ] Minimap shows all active technicians as colored dots
- [ ] Full map shows property locations and technician positions
- [ ] Geofence alert when tech moves >200m from assigned building
- [ ] Location updates in real-time (WebSocket or polling)
- [ ] Location history for audit trail

## Current State
- **Map View:** Placeholder div in dispatch page
- **Technician location:** `current_location JSONB` field exists in schema (from PRP-DATABASE-SCHEMA)
- **No map library installed**
- **No location update mechanism**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  MOBILE APP / TECH INTERFACE                            │
│  (Reports GPS every 60 seconds when "on shift")         │
└─────────────────────────┬───────────────────────────────┘
                          │ POST /api/location
                          ▼
┌─────────────────────────────────────────────────────────┐
│  SUPABASE                                               │
│  ├─ technician_locations (history table)                │
│  ├─ technicians.current_location (latest position)      │
│  └─ Realtime subscription → Dashboard                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  COORDINATOR DASHBOARD                                  │
│  ├─ Minimap (corner, 200x150px, always visible)         │
│  └─ Full Map (dispatch page, with controls)             │
└─────────────────────────────────────────────────────────┘
```

---

## Task 1: Database Schema for Location Tracking

Run in Supabase SQL Editor:

```sql
-- ============================================
-- PROPERTY COORDINATES (for geofencing)
-- ============================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS 
  latitude NUMERIC(10,7);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS 
  longitude NUMERIC(10,7);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS 
  geofence_radius_meters INTEGER DEFAULT 200;

-- Update seed properties with Newark, NJ coordinates
UPDATE properties SET 
  latitude = 40.7357,
  longitude = -74.1724,
  geofence_radius_meters = 150
WHERE property_code = 'S0021';

UPDATE properties SET 
  latitude = 40.7282,
  longitude = -74.1891,
  geofence_radius_meters = 200
WHERE property_code = 'S0045';

UPDATE properties SET 
  latitude = 40.7679,
  longitude = -74.2057,
  geofence_radius_meters = 150
WHERE property_code = 'S0089';

-- ============================================
-- TECHNICIAN LOCATION HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS technician_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES technicians(id) ON DELETE CASCADE,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  accuracy_meters NUMERIC(6,2),
  source TEXT DEFAULT 'gps' CHECK (source IN ('gps', 'network', 'manual')),
  -- Context at time of ping
  active_work_order_id TEXT,
  assigned_property_id UUID REFERENCES properties(id),
  -- Geofence status
  is_within_geofence BOOLEAN,
  distance_from_property_meters NUMERIC(8,2),
  -- Timestamps
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_tech_locations_tech_time 
  ON technician_locations(technician_id, recorded_at DESC);
CREATE INDEX idx_tech_locations_recent 
  ON technician_locations(recorded_at DESC);

-- Enable RLS
ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON technician_locations FOR ALL USING (true);

-- ============================================
-- UPDATE TECHNICIAN CURRENT LOCATION
-- Triggered when new location is inserted
-- ============================================
CREATE OR REPLACE FUNCTION update_technician_current_location()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE technicians
  SET current_location = jsonb_build_object(
    'latitude', NEW.latitude,
    'longitude', NEW.longitude,
    'accuracy', NEW.accuracy_meters,
    'recorded_at', NEW.recorded_at,
    'is_within_geofence', NEW.is_within_geofence
  ),
  updated_at = NOW()
  WHERE id = NEW.technician_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_current_location
  AFTER INSERT ON technician_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_technician_current_location();

-- ============================================
-- GEOFENCE CHECK FUNCTION
-- Called before inserting location to calculate distance
-- ============================================
CREATE OR REPLACE FUNCTION calculate_geofence_status()
RETURNS TRIGGER AS $$
DECLARE
  v_property_lat NUMERIC;
  v_property_lon NUMERIC;
  v_radius INTEGER;
  v_distance NUMERIC;
BEGIN
  -- Get assigned property coordinates
  IF NEW.assigned_property_id IS NOT NULL THEN
    SELECT latitude, longitude, geofence_radius_meters
    INTO v_property_lat, v_property_lon, v_radius
    FROM properties
    WHERE id = NEW.assigned_property_id;
    
    IF v_property_lat IS NOT NULL THEN
      -- Haversine formula for distance in meters
      v_distance := 6371000 * acos(
        cos(radians(NEW.latitude)) * cos(radians(v_property_lat)) *
        cos(radians(v_property_lon) - radians(NEW.longitude)) +
        sin(radians(NEW.latitude)) * sin(radians(v_property_lat))
      );
      
      NEW.distance_from_property_meters := v_distance;
      NEW.is_within_geofence := v_distance <= v_radius;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_geofence
  BEFORE INSERT ON technician_locations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_geofence_status();
```

---

## Task 2: Location Update RPC Function

```sql
-- ============================================
-- RECORD TECHNICIAN LOCATION
-- Called by mobile app / tech interface
-- ============================================
CREATE OR REPLACE FUNCTION record_technician_location(
  p_technician_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_accuracy_meters NUMERIC DEFAULT NULL,
  p_source TEXT DEFAULT 'gps'
)
RETURNS TABLE (
  success BOOLEAN,
  is_within_geofence BOOLEAN,
  distance_meters NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_active_wo TEXT;
  v_assigned_property UUID;
  v_new_location_id UUID;
  v_is_within BOOLEAN;
  v_distance NUMERIC;
BEGIN
  -- Find active work order for this technician
  SELECT wa.work_order_id, p.id
  INTO v_active_wo, v_assigned_property
  FROM work_order_assignments wa
  JOIN "AF_work_order_new" af ON wa.work_order_id = af."ServiceRequestId"
  JOIN properties p ON af."PropertyCode" = p.property_code
  WHERE wa.technician_id = p_technician_id
    AND wa.status = 'in_progress'
    AND wa.scheduled_date = CURRENT_DATE
  ORDER BY wa.scheduled_time_start
  LIMIT 1;
  
  -- Insert location (triggers will calculate geofence)
  INSERT INTO technician_locations (
    technician_id,
    latitude,
    longitude,
    accuracy_meters,
    source,
    active_work_order_id,
    assigned_property_id,
    recorded_at
  ) VALUES (
    p_technician_id,
    p_latitude,
    p_longitude,
    p_accuracy_meters,
    p_source,
    v_active_wo,
    v_assigned_property,
    NOW()
  )
  RETURNING id, is_within_geofence, distance_from_property_meters
  INTO v_new_location_id, v_is_within, v_distance;
  
  -- Return result
  RETURN QUERY SELECT
    TRUE,
    COALESCE(v_is_within, TRUE), -- Default to true if no assignment
    COALESCE(v_distance, 0::NUMERIC),
    CASE
      WHEN v_assigned_property IS NULL THEN 'No active assignment'
      WHEN v_is_within THEN 'Within geofence'
      ELSE 'ALERT: Outside geofence (' || ROUND(v_distance) || 'm from property)'
    END;
END;
$$;

-- ============================================
-- GET ALL TECHNICIAN LOCATIONS (for map)
-- ============================================
CREATE OR REPLACE FUNCTION get_technician_locations()
RETURNS TABLE (
  technician_id UUID,
  technician_name TEXT,
  technician_status TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  accuracy_meters NUMERIC,
  recorded_at TIMESTAMPTZ,
  is_within_geofence BOOLEAN,
  distance_meters NUMERIC,
  active_work_order TEXT,
  assigned_property_name TEXT,
  minutes_since_update INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.status,
    (t.current_location->>'latitude')::NUMERIC,
    (t.current_location->>'longitude')::NUMERIC,
    (t.current_location->>'accuracy')::NUMERIC,
    (t.current_location->>'recorded_at')::TIMESTAMPTZ,
    (t.current_location->>'is_within_geofence')::BOOLEAN,
    tl.distance_from_property_meters,
    tl.active_work_order_id,
    p.name,
    EXTRACT(EPOCH FROM (NOW() - (t.current_location->>'recorded_at')::TIMESTAMPTZ))::INTEGER / 60
  FROM technicians t
  LEFT JOIN LATERAL (
    SELECT * FROM technician_locations
    WHERE technician_id = t.id
    ORDER BY recorded_at DESC
    LIMIT 1
  ) tl ON true
  LEFT JOIN properties p ON tl.assigned_property_id = p.id
  WHERE t.status IN ('available', 'busy')
    AND t.current_location IS NOT NULL;
END;
$$;
```

---

## Task 3: Install Map Dependencies

```bash
# In your project directory
npm install leaflet react-leaflet @types/leaflet
```

---

## Task 4: Create Map Components

### 4.1 Map Container Styles

**File:** `src/styles/map.css`

```css
/* Leaflet container must have explicit height */
.map-container {
  height: 100%;
  width: 100%;
  min-height: 400px;
}

.minimap-container {
  height: 150px;
  width: 200px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Custom marker styles */
.tech-marker {
  background: #2563EB;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.tech-marker.outside-geofence {
  background: #DC2626;
  animation: pulse 1s infinite;
}

.tech-marker.stale {
  background: #9CA3AF;
  opacity: 0.6;
}

.property-marker {
  background: #059669;
  border: 2px solid white;
  border-radius: 4px;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
```

### 4.2 Technician Location Hook

**File:** `src/hooks/useTechnicianLocations.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface TechnicianLocation {
  technicianId: string;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recordedAt: Date;
  isWithinGeofence: boolean;
  distanceMeters: number | null;
  activeWorkOrder: string | null;
  assignedPropertyName: string | null;
  minutesSinceUpdate: number;
  isStale: boolean; // No update in 10+ minutes
}

export function useTechnicianLocations(pollInterval = 30000) {
  const [locations, setLocations] = useState<TechnicianLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_technician_locations');

      if (rpcError) throw new Error(rpcError.message);

      const transformed: TechnicianLocation[] = (data || []).map((loc: any) => ({
        technicianId: loc.technician_id,
        name: loc.technician_name,
        status: loc.technician_status,
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude),
        accuracy: loc.accuracy_meters ? parseFloat(loc.accuracy_meters) : null,
        recordedAt: new Date(loc.recorded_at),
        isWithinGeofence: loc.is_within_geofence ?? true,
        distanceMeters: loc.distance_meters ? parseFloat(loc.distance_meters) : null,
        activeWorkOrder: loc.active_work_order,
        assignedPropertyName: loc.assigned_property_name,
        minutesSinceUpdate: loc.minutes_since_update || 0,
        isStale: (loc.minutes_since_update || 0) > 10
      }));

      setLocations(transformed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Polling
  useEffect(() => {
    const interval = setInterval(fetchLocations, pollInterval);
    return () => clearInterval(interval);
  }, [fetchLocations, pollInterval]);

  // Real-time subscription for location updates
  useEffect(() => {
    const channel = supabase
      .channel('technician-locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'technician_locations'
        },
        () => {
          // Refetch on any new location
          fetchLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLocations]);

  const outsideGeofence = locations.filter(l => !l.isWithinGeofence);
  const staleLocations = locations.filter(l => l.isStale);

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations,
    alerts: {
      outsideGeofence,
      staleLocations,
      hasAlerts: outsideGeofence.length > 0 || staleLocations.length > 0
    }
  };
}
```

### 4.3 Property Locations Hook

**File:** `src/hooks/usePropertyLocations.ts`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PropertyLocation {
  id: string;
  propertyCode: string;
  name: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
}

export function usePropertyLocations() {
  const [properties, setProperties] = useState<PropertyLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('properties')
        .select('id, property_code, name, latitude, longitude, geofence_radius_meters')
        .not('latitude', 'is', null);

      if (data) {
        setProperties(data.map(p => ({
          id: p.id,
          propertyCode: p.property_code,
          name: p.name,
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          geofenceRadius: p.geofence_radius_meters || 200
        })));
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return { properties, loading };
}
```

### 4.4 Full Dispatch Map Component

**File:** `src/components/maps/DispatchMap.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTechnicianLocations } from '@/hooks/useTechnicianLocations';
import { usePropertyLocations } from '@/hooks/usePropertyLocations';
import 'leaflet/dist/leaflet.css';
import '@/styles/map.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom technician icon
const createTechIcon = (isWithinGeofence: boolean, isStale: boolean) => {
  const color = isStale ? '#9CA3AF' : isWithinGeofence ? '#2563EB' : '#DC2626';
  
  return L.divIcon({
    className: 'custom-tech-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${!isWithinGeofence && !isStale ? 'animation: pulse 1s infinite;' : ''}
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Property icon
const propertyIcon = L.divIcon({
  className: 'custom-property-marker',
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #059669;
      border: 2px solid white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Auto-fit bounds component
function FitBounds({ locations }: { locations: { latitude: number; longitude: number }[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map(l => [l.latitude, l.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  
  return null;
}

export function DispatchMap() {
  const { locations, alerts } = useTechnicianLocations();
  const { properties } = usePropertyLocations();
  
  // Default center (Newark, NJ)
  const defaultCenter: [number, number] = [40.7357, -74.1724];
  
  const allPoints = [
    ...locations.map(l => ({ latitude: l.latitude, longitude: l.longitude })),
    ...properties.map(p => ({ latitude: p.latitude, longitude: p.longitude }))
  ];

  return (
    <div className="relative h-full">
      {/* Alert banner */}
      {alerts.hasAlerts && (
        <div className="absolute top-2 left-2 right-2 z-[1000] bg-red-100 border border-red-300 rounded-lg p-2 text-sm">
          {alerts.outsideGeofence.length > 0 && (
            <div className="text-red-700">
              ⚠️ {alerts.outsideGeofence.map(t => t.name).join(', ')} outside assigned area
            </div>
          )}
          {alerts.staleLocations.length > 0 && (
            <div className="text-amber-700">
              ⏱️ {alerts.staleLocations.map(t => t.name).join(', ')} - no update in 10+ min
            </div>
          )}
        </div>
      )}
      
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="map-container"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds locations={allPoints} />
        
        {/* Property markers with geofence circles */}
        {properties.map(property => (
          <div key={property.id}>
            <Circle
              center={[property.latitude, property.longitude]}
              radius={property.geofenceRadius}
              pathOptions={{
                color: '#059669',
                fillColor: '#059669',
                fillOpacity: 0.1,
                weight: 1
              }}
            />
            <Marker
              position={[property.latitude, property.longitude]}
              icon={propertyIcon}
            >
              <Popup>
                <div className="font-medium">{property.name}</div>
                <div className="text-sm text-gray-500">{property.propertyCode}</div>
              </Popup>
            </Marker>
          </div>
        ))}
        
        {/* Technician markers */}
        {locations.map(tech => (
          <Marker
            key={tech.technicianId}
            position={[tech.latitude, tech.longitude]}
            icon={createTechIcon(tech.isWithinGeofence, tech.isStale)}
          >
            <Popup>
              <div className="font-medium">{tech.name}</div>
              <div className="text-sm">
                {tech.activeWorkOrder ? (
                  <span>Working on: {tech.activeWorkOrder}</span>
                ) : (
                  <span className="text-gray-500">No active work order</span>
                )}
              </div>
              {tech.assignedPropertyName && (
                <div className="text-sm">At: {tech.assignedPropertyName}</div>
              )}
              {!tech.isWithinGeofence && (
                <div className="text-sm text-red-600">
                  ⚠️ {Math.round(tech.distanceMeters || 0)}m from property
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                Updated {tech.minutesSinceUpdate} min ago
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
```

### 4.5 Minimap Component (StarCraft Style)

**File:** `src/components/maps/Minimap.tsx`

```typescript
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTechnicianLocations } from '@/hooks/useTechnicianLocations';
import { usePropertyLocations } from '@/hooks/usePropertyLocations';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface MinimapProps {
  className?: string;
  onExpand?: () => void;
}

export function Minimap({ className, onExpand }: MinimapProps) {
  const { locations, alerts } = useTechnicianLocations(60000); // Poll every 60s for minimap
  const { properties } = usePropertyLocations();
  
  // Center on Newark, NJ
  const center: [number, number] = [40.7357, -74.1724];

  return (
    <div 
      className={cn(
        "minimap-container relative cursor-pointer group",
        alerts.hasAlerts && "ring-2 ring-red-500",
        className
      )}
      onClick={onExpand}
    >
      {/* Alert indicator */}
      {alerts.hasAlerts && (
        <div className="absolute top-1 right-1 z-[1000]">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}
      
      {/* Expand hint on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-[999] flex items-center justify-center">
        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          Click to expand
        </span>
      </div>
      
      <MapContainer
        center={center}
        zoom={11}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
        />
        
        {/* Properties as small green dots */}
        {properties.map(p => (
          <CircleMarker
            key={p.id}
            center={[p.latitude, p.longitude]}
            radius={3}
            pathOptions={{ 
              color: '#059669', 
              fillColor: '#059669',
              fillOpacity: 1,
              weight: 1
            }}
          />
        ))}
        
        {/* Technicians as larger colored dots */}
        {locations.map(tech => (
          <CircleMarker
            key={tech.technicianId}
            center={[tech.latitude, tech.longitude]}
            radius={5}
            pathOptions={{
              color: 'white',
              weight: 2,
              fillColor: tech.isStale 
                ? '#9CA3AF' 
                : tech.isWithinGeofence 
                  ? '#2563EB' 
                  : '#DC2626',
              fillOpacity: 1
            }}
          />
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-1 left-1 z-[1000] bg-white/90 rounded px-1.5 py-0.5 text-[10px]">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-1" />
        {locations.filter(l => !l.isStale && l.isWithinGeofence).length}
        {alerts.outsideGeofence.length > 0 && (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-red-600 ml-2 mr-1" />
            {alerts.outsideGeofence.length}
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Task 5: Integrate Map into Dispatch Page

**File:** `src/pages/DispatchPage.tsx`

Add the map toggle and components:

```typescript
import { useState } from 'react';
import { DispatchMap } from '@/components/maps/DispatchMap';
import { Minimap } from '@/components/maps/Minimap';
import { Map, List } from 'lucide-react';

export function DispatchPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'map'>('calendar');
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">Dispatch</h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              "p-2 rounded",
              viewMode === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
            )}
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={cn(
              "p-2 rounded",
              viewMode === 'map' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
            )}
          >
            <Map className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 relative">
        {viewMode === 'calendar' ? (
          <div className="h-full">
            {/* Existing calendar/list view */}
            <CalendarView />
            
            {/* Minimap in corner */}
            <div className="absolute bottom-4 right-4 z-50">
              <Minimap onExpand={() => setViewMode('map')} />
            </div>
          </div>
        ) : (
          <DispatchMap />
        )}
      </div>
    </div>
  );
}
```

---

## Task 6: Simulate Location Updates (For Testing)

Since we don't have a mobile app yet, create a test function:

```sql
-- Insert test location data for technicians
INSERT INTO technician_locations (technician_id, latitude, longitude, accuracy_meters, source)
VALUES 
  -- Ramon at S0021 (within geofence)
  ('11111111-1111-1111-1111-111111111111', 40.7359, -74.1720, 10, 'gps'),
  -- Kishan outside S0045 (outside geofence - 500m away)
  ('22222222-2222-2222-2222-222222222222', 40.7320, -74.1950, 15, 'gps'),
  -- Carlos at S0089 (within geofence)
  ('33333333-3333-3333-3333-333333333333', 40.7681, -74.2055, 8, 'gps');
```

---

## Validation Checklist

```
□ 1. Database ready
   - Properties have lat/lng coordinates
   - technician_locations table exists
   - RPC functions work
   
□ 2. Map renders
   - Open /dispatch
   - Click map toggle
   - See Newark, NJ area with property markers
   
□ 3. Technician locations show
   - Insert test locations (Task 6)
   - Refresh map
   - See blue dots for techs
   
□ 4. Geofencing works
   - Kishan shows as red dot (outside geofence)
   - Alert banner appears
   - Popup shows distance from property
   
□ 5. Minimap works
   - In calendar view, minimap appears bottom-right
   - Shows property dots (green) and tech dots (blue/red)
   - Click expands to full map
   - Red ring appears when alerts exist
   
□ 6. Real-time updates
   - Insert new location via SQL
   - Map updates within 30 seconds
```

---

## Future Enhancements (Not in This PRP)

- **Mobile app** to report GPS automatically
- **Breadcrumb trail** showing tech's route throughout day
- **ETA calculation** to next job based on current location
- **Traffic integration** for better time estimates
- **Offline support** for areas with poor connectivity

---

## Anti-Patterns to Avoid
- ❌ Don't poll more frequently than 30 seconds (battery drain for mobile)
- ❌ Don't store location history indefinitely (privacy + storage)
- ❌ Don't show exact addresses in shared views (privacy)
- ❌ Don't rely solely on GPS (network fallback needed)
- ❌ Don't block UI while fetching locations (async with loading state)
