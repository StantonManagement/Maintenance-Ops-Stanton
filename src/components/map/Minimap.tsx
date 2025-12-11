import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { TechnicianPosition, PropertyLocation, GeofenceAlert } from '../../hooks/useMapData';
import { AlertTriangle, Maximize2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface MinimapProps {
  technicianPositions: TechnicianPosition[];
  properties: PropertyLocation[];
  alerts: GeofenceAlert[];
  onExpand?: () => void;
  className?: string;
}

export function Minimap({
  technicianPositions,
  properties,
  alerts,
  onExpand,
  className = '',
}: MinimapProps) {
  const alertTechIds = new Set(alerts.map(a => a.technicianId));

  // Default center (Hartford, CT)
  const defaultCenter: [number, number] = [41.7658, -72.6734];

  // Calculate center from all points
  const allLats = [...technicianPositions.map(t => t.latitude), ...properties.map(p => p.latitude)];
  const allLngs = [...technicianPositions.map(t => t.longitude), ...properties.map(p => p.longitude)];
  
  const center: [number, number] = allLats.length > 0
    ? [
        allLats.reduce((a, b) => a + b, 0) / allLats.length,
        allLngs.reduce((a, b) => a + b, 0) / allLngs.length,
      ]
    : defaultCenter;

  return (
    <div className={`relative ${className}`}>
      {/* Alert badge */}
      {alerts.length > 0 && (
        <div className="absolute top-2 left-2 z-[1000]">
          <Badge variant="destructive" className="gap-1 animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Expand button */}
      {onExpand && (
        <button
          onClick={onExpand}
          className="absolute top-2 right-2 z-[1000] p-1.5 bg-white rounded shadow-md hover:bg-gray-50 transition-colors"
          title="Expand map"
        >
          <Maximize2 className="h-4 w-4 text-gray-600" />
        </button>
      )}

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Property markers (green dots) */}
        {properties.map(property => (
          <CircleMarker
            key={property.id}
            center={[property.latitude, property.longitude]}
            radius={6}
            pathOptions={{
              color: '#059669',
              fillColor: '#10B981',
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -5]}>
              <span className="text-xs font-medium">{property.propertyName}</span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Technician markers (blue/red dots) */}
        {technicianPositions.map(tech => {
          const hasAlert = alertTechIds.has(tech.id);
          
          return (
            <CircleMarker
              key={tech.id}
              center={[tech.latitude, tech.longitude]}
              radius={hasAlert ? 8 : 6}
              pathOptions={{
                color: hasAlert ? '#DC2626' : '#2563EB',
                fillColor: hasAlert ? '#EF4444' : '#3B82F6',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -5]}>
                <div className="text-xs">
                  <span className="font-medium">{tech.name}</span>
                  {hasAlert && (
                    <span className="text-red-600 ml-1">⚠️</span>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 rounded px-2 py-1 text-[10px] flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Property</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Tech</span>
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Alert</span>
          </div>
        )}
      </div>
    </div>
  );
}
