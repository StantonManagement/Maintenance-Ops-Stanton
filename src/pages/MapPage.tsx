import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, AlertTriangle, CheckCircle, ArrowLeft, Layers } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { useMapData } from '../hooks/useMapData';
import { DispatchMap } from '../components/map/DispatchMap';

export default function MapPage() {
  const navigate = useNavigate();
  const {
    technicianPositions,
    properties,
    alerts,
    loading,
    refetch,
    acknowledgeAlert,
    alertCount,
  } = useMapData();

  const [showGeofences, setShowGeofences] = useState(true);
  const [selectedTechId, setSelectedTechId] = useState<string | undefined>();

  const handleTechnicianClick = (techId: string) => {
    setSelectedTechId(techId === selectedTechId ? undefined : techId);
  };

  const handlePropertyClick = (propertyCode: string) => {
    // Could navigate to property details or filter work orders
    console.log('Property clicked:', propertyCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading map data...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/10">
      {/* Header */}
      <div className="h-14 border-b bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dispatch')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dispatch
          </Button>
          <div className="h-6 w-px bg-border" />
          <h2 className="font-semibold text-lg">Live Technician Map</h2>
          <Badge variant="secondary" className="gap-1">
            {technicianPositions.length} Technicians
          </Badge>
          {alertCount > 0 && (
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              {alertCount} Alert{alertCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Geofences</span>
            <Switch checked={showGeofences} onCheckedChange={setShowGeofences} />
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map */}
        <div className="flex-1 p-4">
          <DispatchMap
            technicianPositions={technicianPositions}
            properties={properties}
            alerts={alerts}
            onTechnicianClick={handleTechnicianClick}
            onPropertyClick={handlePropertyClick}
            showGeofences={showGeofences}
            selectedTechId={selectedTechId}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l bg-card p-4 overflow-y-auto">
          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Active Alerts
              </h3>
              <div className="space-y-2">
                {alerts.map(alert => {
                  const tech = technicianPositions.find(t => t.id === alert.technicianId);
                  return (
                    <Card key={alert.id} className="p-3 border-red-200 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{tech?.name || 'Unknown'}</p>
                          <p className="text-xs text-red-600">
                            {Math.round(alert.distanceFromProperty)}m from {alert.propertyCode}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.triggeredAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="h-7 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ack
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technicians List */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Technicians</h3>
            <div className="space-y-2">
              {technicianPositions.map(tech => {
                const hasAlert = alerts.some(a => a.technicianId === tech.id);
                const isSelected = tech.id === selectedTechId;

                return (
                  <Card
                    key={tech.id}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    } ${hasAlert ? 'border-red-300 bg-red-50' : ''}`}
                    onClick={() => handleTechnicianClick(tech.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{tech.name}</p>
                          {hasAlert && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tech.status} · {Math.round(tech.minutesSinceUpdate)}m ago
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={tech.status === 'available' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {tech.status}
                        </Badge>
                        {tech.batteryLevel && (
                          <p className={`text-xs mt-1 ${tech.batteryLevel < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                            🔋 {tech.batteryLevel}%
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Properties List */}
          <div className="mt-6">
            <h3 className="font-semibold text-sm mb-3">Properties</h3>
            <div className="space-y-2">
              {properties.map(property => (
                <Card
                  key={property.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handlePropertyClick(property.propertyCode)}
                >
                  <p className="font-medium text-sm">{property.propertyName}</p>
                  <p className="text-xs text-muted-foreground">{property.propertyCode}</p>
                  <p className="text-xs text-gray-500 mt-1">{property.address}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
