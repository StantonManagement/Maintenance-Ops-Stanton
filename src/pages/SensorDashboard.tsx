import { useState } from 'react';
import { useSensors, Sensor, SensorType, SensorStatus } from '../hooks/useSensors';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Activity, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  WifiOff,
  Droplets,
  Thermometer,
  Wind,
  Flame,
  Battery,
  Clock,
  Bell,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

export default function SensorDashboard() {
  const { 
    sensors, 
    alerts,
    activeSensors,
    criticalSensors,
    warningSensors,
    offlineSensors,
    unacknowledgedAlerts,
    loading, 
    refetch,
    acknowledgeAlert
  } = useSensors();
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [typeFilter, setTypeFilter] = useState<SensorType | 'all'>('all');

  const getSensorIcon = (type: SensorType) => {
    switch (type) {
      case 'water_leak': return <Droplets size={16} />;
      case 'temperature': return <Thermometer size={16} />;
      case 'humidity': return <Wind size={16} />;
      case 'smoke':
      case 'co': return <Flame size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getStatusColor = (status: SensorStatus) => {
    switch (status) {
      case 'normal': return 'var(--status-success-text)';
      case 'warning': return 'var(--status-warning-text)';
      case 'critical': return 'var(--status-critical-text)';
      case 'offline': return 'var(--text-tertiary)';
    }
  };

  const getStatusBadge = (status: SensorStatus) => {
    switch (status) {
      case 'normal':
        return <Badge className="text-xs bg-green-600"><CheckCircle size={12} className="mr-1" />Normal</Badge>;
      case 'warning':
        return <Badge className="text-xs bg-amber-500"><AlertTriangle size={12} className="mr-1" />Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="text-xs"><AlertTriangle size={12} className="mr-1" />Critical</Badge>;
      case 'offline':
        return <Badge variant="secondary" className="text-xs"><WifiOff size={12} className="mr-1" />Offline</Badge>;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'var(--status-success-text)';
    if (level > 20) return 'var(--status-warning-text)';
    return 'var(--status-critical-text)';
  };

  const formatLastReading = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const filteredSensors = sensors.filter(s => 
    typeFilter === 'all' || s.type === typeFilter
  );

  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId);
    toast.success('Alert acknowledged');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--action-primary-light)' }}
          >
            <Activity size={24} style={{ color: 'var(--action-primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              IoT Sensors
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {activeSensors.length} active • {criticalSensors.length} critical • {offlineSensors.length} offline
            </p>
          </div>
          {criticalSensors.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {criticalSensors.length} Critical
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="sensors" className="h-full flex flex-col">
            <div className="px-6 pt-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <TabsList>
                <TabsTrigger value="sensors">
                  <Activity size={14} className="mr-1" />
                  All Sensors ({sensors.length})
                </TabsTrigger>
                <TabsTrigger value="alerts">
                  <Bell size={14} className="mr-1" />
                  Alerts
                  {unacknowledgedAlerts.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                      {unacknowledgedAlerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="sensors" className="flex-1 overflow-y-auto p-6 mt-0">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="cursor-pointer" onClick={() => setTypeFilter('all')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Active</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {activeSensors.length}
                        </p>
                      </div>
                      <CheckCircle size={24} style={{ color: 'var(--status-success-text)' }} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer border-amber-200" onClick={() => setTypeFilter('all')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Warnings</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--status-warning-text)' }}>
                          {warningSensors.length}
                        </p>
                      </div>
                      <AlertTriangle size={24} style={{ color: 'var(--status-warning-text)' }} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer border-red-200" onClick={() => setTypeFilter('all')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Critical</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--status-critical-text)' }}>
                          {criticalSensors.length}
                        </p>
                      </div>
                      <AlertTriangle size={24} style={{ color: 'var(--status-critical-text)' }} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer" onClick={() => setTypeFilter('all')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Offline</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-tertiary)' }}>
                          {offlineSensors.length}
                        </p>
                      </div>
                      <WifiOff size={24} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1 p-1 rounded-lg mb-4" style={{ backgroundColor: 'var(--bg-secondary)', width: 'fit-content' }}>
                <Button
                  variant={typeFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('all')}
                  className="h-7 text-xs"
                >
                  All
                </Button>
                {(['water_leak', 'temperature', 'smoke'] as SensorType[]).map(type => (
                  <Button
                    key={type}
                    variant={typeFilter === type ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTypeFilter(type)}
                    className="h-7 text-xs capitalize"
                  >
                    {getSensorIcon(type)}
                    <span className="ml-1">{type.replace('_', ' ')}</span>
                  </Button>
                ))}
              </div>

              {/* Sensors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSensors.map(sensor => (
                  <Card 
                    key={sensor.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedSensor?.id === sensor.id ? 'ring-2' : ''}`}
                    style={{ borderColor: selectedSensor?.id === sensor.id ? 'var(--action-primary)' : undefined }}
                    onClick={() => setSelectedSensor(sensor)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                          >
                            <span style={{ color: getStatusColor(sensor.status) }}>
                              {getSensorIcon(sensor.type)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {sensor.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {sensor.unit_name} • {sensor.property_name}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(sensor.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <p style={{ color: 'var(--text-tertiary)' }}>Last Reading</p>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {sensor.type === 'temperature' ? `${sensor.last_value}°F` : 
                             sensor.type === 'water_leak' ? (sensor.last_value > 0 ? 'Detected' : 'Dry') :
                             sensor.last_value}
                          </p>
                        </div>
                        <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                          <p style={{ color: 'var(--text-tertiary)' }}>Updated</p>
                          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatLastReading(sensor.last_reading_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                        <span className="flex items-center gap-1 text-xs" style={{ color: getBatteryColor(sensor.battery_level) }}>
                          <Battery size={12} />
                          {sensor.battery_level}%
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {sensor.manufacturer}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="flex-1 overflow-y-auto p-6 mt-0">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <CheckCircle size={48} style={{ color: 'var(--status-success-text)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No active alerts</p>
                </div>
              ) : (
                <div className="space-y-3 max-w-3xl">
                  {alerts.map(alert => (
                    <Card 
                      key={alert.id}
                      className={`border-l-4 ${alert.acknowledged_at ? 'opacity-60' : ''}`}
                      style={{ 
                        borderLeftColor: alert.type === 'critical' 
                          ? 'var(--status-critical-border)' 
                          : 'var(--status-warning-border)'
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ 
                                backgroundColor: alert.type === 'critical' 
                                  ? 'var(--status-critical-bg)' 
                                  : 'var(--status-warning-bg)'
                              }}
                            >
                              <AlertTriangle 
                                size={16} 
                                style={{ 
                                  color: alert.type === 'critical' 
                                    ? 'var(--status-critical-text)' 
                                    : 'var(--status-warning-text)'
                                }} 
                              />
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {alert.message}
                              </p>
                              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {alert.sensor_name}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {formatLastReading(alert.created_at)}
                                </span>
                                {alert.work_order_id && (
                                  <Badge variant="outline" className="text-xs">
                                    WO: {alert.work_order_id}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {!alert.acknowledged_at && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sensor Detail Panel */}
        {selectedSensor && (
          <div className="w-[350px] border-l overflow-y-auto p-4" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-secondary)' }}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedSensor.name}</CardTitle>
                  {getStatusBadge(selectedSensor.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Location</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedSensor.unit_name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {selectedSensor.property_name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Current Value</p>
                      <p className="text-lg font-bold" style={{ color: getStatusColor(selectedSensor.status) }}>
                        {selectedSensor.type === 'temperature' ? `${selectedSensor.last_value}°F` : 
                         selectedSensor.type === 'water_leak' ? (selectedSensor.last_value > 0 ? 'WET' : 'DRY') :
                         selectedSensor.last_value}
                      </p>
                    </div>
                    <div className="p-2 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Battery</p>
                      <p className="text-lg font-bold" style={{ color: getBatteryColor(selectedSensor.battery_level) }}>
                        {selectedSensor.battery_level}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>24h Trend</p>
                    <div 
                      className="h-24 rounded flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-card)' }}
                    >
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        [Chart placeholder]
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Device Info</p>
                    <div className="mt-1 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>Manufacturer</span>
                        <span style={{ color: 'var(--text-primary)' }}>{selectedSensor.manufacturer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>Installed</span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {new Date(selectedSensor.install_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-secondary)' }}>Last Update</span>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {formatLastReading(selectedSensor.last_reading_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => toast.info('Threshold configuration coming soon')}
                  >
                    Configure Thresholds
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
