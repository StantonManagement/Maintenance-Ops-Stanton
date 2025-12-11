import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TechnicianPosition, PropertyLocation, GeofenceAlert } from '../../hooks/useMapData';
import { Battery, AlertTriangle, MapPin, User } from 'lucide-react';
import { Badge } from '../ui/badge';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createTechnicianIcon = (status: string, hasAlert: boolean) => {
  const color = hasAlert ? '#EF4444' : status === 'available' ? '#10B981' : status === 'in-transit' ? '#3B82F6' : '#6B7280';
  
  return L.divIcon({
    className: 'custom-tech-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      ${hasAlert ? `
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 14px;
          height: 14px;
          background: #EF4444;
          border: 2px solid white;
          border-radius: 50%;
          animation: pulse 1s infinite;
        "></div>
      ` : ''}
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const createPropertyIcon = () => {
  return L.divIcon({
    className: 'custom-property-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: #059669;
        border: 3px solid white;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

// Component to fit bounds
function FitBounds({ positions, properties }: { positions: TechnicianPosition[]; properties: PropertyLocation[] }) {
  const map = useMap();

  useEffect(() => {
    const allPoints = [
      ...positions.map(p => [p.latitude, p.longitude] as [number, number]),
      ...properties.map(p => [p.latitude, p.longitude] as [number, number]),
    ];

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions, properties]);

  return null;
}

interface DispatchMapProps {
  technicianPositions: TechnicianPosition[];
  properties: PropertyLocation[];
  alerts: GeofenceAlert[];
  onTechnicianClick?: (techId: string) => void;
  onPropertyClick?: (propertyCode: string) => void;
  showGeofences?: boolean;
  selectedTechId?: string;
  height?: string;
}

export function DispatchMap({
  technicianPositions,
  properties,
  alerts,
  onTechnicianClick,
  onPropertyClick,
  showGeofences = true,
  selectedTechId,
  height = '100%',
}: DispatchMapProps) {
  const alertTechIds = new Set(alerts.map(a => a.technicianId));

  // Default center (Hartford, CT)
  const defaultCenter: [number, number] = [41.7658, -72.6734];

  return (
    <div style={{ height, width: '100%' }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
      
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds positions={technicianPositions} properties={properties} />

        {/* Property markers with geofence circles */}
        {properties.map(property => (
          <div key={property.id}>
            {showGeofences && (
              <Circle
                center={[property.latitude, property.longitude]}
                radius={property.geofenceRadius}
                pathOptions={{
                  color: '#059669',
                  fillColor: '#059669',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5',
                }}
              />
            )}
            <Marker
              position={[property.latitude, property.longitude]}
              icon={createPropertyIcon()}
              eventHandlers={{
                click: () => onPropertyClick?.(property.propertyCode),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">{property.propertyName}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{property.propertyCode}</p>
                  <p className="text-xs text-gray-500">{property.address}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Geofence: {property.geofenceRadius}m radius
                  </p>
                </div>
              </Popup>
            </Marker>
          </div>
        ))}

        {/* Technician markers */}
        {technicianPositions.map(tech => {
          const hasAlert = alertTechIds.has(tech.id);
          const isSelected = tech.id === selectedTechId;

          return (
            <Marker
              key={tech.id}
              position={[tech.latitude, tech.longitude]}
              icon={createTechnicianIcon(tech.status, hasAlert)}
              eventHandlers={{
                click: () => onTechnicianClick?.(tech.id),
              }}
              opacity={isSelected ? 1 : 0.9}
            >
              <Popup>
                <div className="p-2 min-w-[220px]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{tech.name}</span>
                    </div>
                    <Badge
                      variant={tech.status === 'available' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {tech.status}
                    </Badge>
                  </div>

                  {hasAlert && (
                    <div className="flex items-center gap-1 text-red-600 text-xs mb-2 p-1 bg-red-50 rounded">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Outside geofence</span>
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Battery className="h-3 w-3" />
                      <span>Battery: {tech.batteryLevel || 'N/A'}%</span>
                      {tech.batteryLevel && tech.batteryLevel < 20 && (
                        <span className="text-red-500">(Low!)</span>
                      )}
                    </div>
                    <p>Skills: {tech.skills.join(', ')}</p>
                    <p className="text-gray-400">
                      Updated {Math.round(tech.minutesSinceUpdate)} min ago
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
