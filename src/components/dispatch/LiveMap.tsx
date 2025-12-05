import { useState, useEffect } from 'react';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { TechnicianLocation, propertyLocations, formatETA, getLocationAge } from '../../services/locationService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Battery, 
  RefreshCw,
  User,
  Building,
  Zap
} from 'lucide-react';

interface LiveMapProps {
  onSelectTechnician?: (technicianId: string) => void;
  selectedTechnicianId?: string;
}

// Mock technician names (matches useTechnicians IDs)
const technicianNames: Record<string, string> = {
  'tech-1': 'Ramon M.',
  'tech-2': 'Sarah L.',
  'tech-3': 'Miguel R.',
  'tech-4': 'David K.'
};

export function LiveMap({ onSelectTechnician, selectedTechnicianId }: LiveMapProps) {
  const { locations, loading, refetch, workingTechnicians } = useLocationTracking();
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);

  // Since we can't use actual maps without API keys, we'll create a visual representation
  const mapBounds = {
    minLat: 41.75,
    maxLat: 41.78,
    minLng: -72.70,
    maxLng: -72.65
  };

  const latToY = (lat: number) => {
    return ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
  };

  const lngToX = (lng: number) => {
    return ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'var(--text-tertiary)';
    if (level > 50) return 'var(--status-success-text)';
    if (level > 20) return 'var(--status-warning-text)';
    return 'var(--status-critical-text)';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin size={18} style={{ color: 'var(--action-primary)' }} />
            Live Technician Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Zap size={12} className="mr-1" style={{ color: 'var(--status-success-text)' }} />
              {workingTechnicians.length} Active
            </Badge>
            <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2">
        {/* Map Container */}
        <div 
          className="relative w-full h-full min-h-[300px] rounded-lg overflow-hidden"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            backgroundImage: `
              linear-gradient(var(--border-default) 1px, transparent 1px),
              linear-gradient(90deg, var(--border-default) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        >
          {/* Property Markers */}
          {Object.entries(propertyLocations).map(([id, prop]) => (
            <div
              key={id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${lngToX(prop.lng)}%`,
                top: `${latToY(prop.lat)}%`,
                zIndex: 1
              }}
            >
              <div 
                className="p-1.5 rounded-lg shadow-sm"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
              >
                <Building size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>
            </div>
          ))}

          {/* Technician Markers */}
          {locations.map(location => {
            const isSelected = selectedTechnicianId === location.technician_id;
            const isHovered = hoveredTech === location.technician_id;
            const name = technicianNames[location.technician_id] || location.technician_id;
            
            return (
              <div
                key={location.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all"
                style={{
                  left: `${lngToX(location.longitude)}%`,
                  top: `${latToY(location.latitude)}%`,
                  zIndex: isSelected || isHovered ? 10 : 2
                }}
                onClick={() => onSelectTechnician?.(location.technician_id)}
                onMouseEnter={() => setHoveredTech(location.technician_id)}
                onMouseLeave={() => setHoveredTech(null)}
              >
                {/* Marker */}
                <div 
                  className={`relative p-2 rounded-full shadow-lg transition-transform ${isSelected || isHovered ? 'scale-125' : ''}`}
                  style={{ 
                    backgroundColor: location.is_working ? 'var(--action-primary)' : 'var(--text-tertiary)',
                    border: isSelected ? '3px solid var(--status-warning-text)' : 'none'
                  }}
                >
                  <User size={16} style={{ color: 'white' }} />
                  
                  {/* Pulse animation for working techs */}
                  {location.is_working && (
                    <span 
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ backgroundColor: 'var(--action-primary)', opacity: 0.3 }}
                    />
                  )}
                </div>

                {/* Info Popup */}
                {(isSelected || isHovered) && (
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 p-2 rounded-lg shadow-lg whitespace-nowrap"
                    style={{ 
                      backgroundColor: 'var(--bg-card)', 
                      border: '1px solid var(--border-default)',
                      minWidth: '150px'
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {getLocationAge(location.timestamp)}
                      </span>
                      {location.battery_level && (
                        <span className="flex items-center gap-1" style={{ color: getBatteryColor(location.battery_level) }}>
                          <Battery size={10} />
                          {location.battery_level}%
                        </span>
                      )}
                    </div>
                    <Badge 
                      variant={location.is_working ? 'default' : 'secondary'} 
                      className="mt-1 text-xs"
                    >
                      {location.is_working ? 'Working' : 'Off Duty'}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}

          {/* Legend */}
          <div 
            className="absolute bottom-2 left-2 p-2 rounded-lg text-xs"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--action-primary)' }} />
                Active
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--text-tertiary)' }} />
                Off Duty
              </span>
              <span className="flex items-center gap-1">
                <Building size={12} style={{ color: 'var(--text-secondary)' }} />
                Property
              </span>
            </div>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--action-primary)' }} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
