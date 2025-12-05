import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { TechnicianLocation, getLocationAge } from '../services/locationService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Battery, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Navigation
} from 'lucide-react';

export default function LocationHistoryPage() {
  const { id: technicianId } = useParams<{ id: string }>();
  const { getHistory } = useLocationTracking();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [history, setHistory] = useState<TechnicianLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!technicianId) return;
    
    setLoading(true);
    getHistory(technicianId, selectedDate).then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, [technicianId, selectedDate, getHistory]);

  const prevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'var(--text-tertiary)';
    if (level > 50) return 'var(--status-success-text)';
    if (level > 20) return 'var(--status-warning-text)';
    return 'var(--status-critical-text)';
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
            <Navigation size={24} style={{ color: 'var(--action-primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Location History
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Technician: {technicianId}
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevDay}>
            <ChevronLeft size={16} />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={nextDay}
            disabled={selectedDate.toDateString() === new Date().toDateString()}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--action-primary)' }} />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <MapPin size={32} style={{ color: 'var(--text-tertiary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No location data for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((location, index) => (
                    <div key={location.id} className="flex gap-3">
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: location.is_working 
                              ? 'var(--action-primary)' 
                              : 'var(--text-tertiary)' 
                          }}
                        />
                        {index < history.length - 1 && (
                          <div 
                            className="w-0.5 flex-1 min-h-[40px]"
                            style={{ backgroundColor: 'var(--border-default)' }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatTime(location.timestamp)}
                          </span>
                          <Badge variant={location.is_working ? 'default' : 'secondary'} className="text-xs">
                            {location.is_working ? 'Working' : 'Off Duty'}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </span>
                          <span className="flex items-center gap-2 mt-1">
                            <span>Accuracy: ±{Math.round(location.accuracy)}m</span>
                            {location.battery_level && (
                              <span className="flex items-center gap-1" style={{ color: getBatteryColor(location.battery_level) }}>
                                <Battery size={10} />
                                {location.battery_level}%
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Day Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {history.filter(h => h.is_working).length}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Location Updates
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {history.length > 0 
                        ? `${Math.round(history.filter(h => h.is_working).length / history.length * 100)}%`
                        : '0%'
                      }
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Active Time
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {history.length > 0 
                        ? formatTime(history[0].timestamp)
                        : '--'
                      }
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      First Check-in
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {history.length > 0 
                        ? formatTime(history[history.length - 1].timestamp)
                        : '--'
                      }
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Last Check-in
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Notice */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--status-info-bg)' }}
                  >
                    <Clock size={16} style={{ color: 'var(--status-info-text)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Privacy Notice
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Location data is only collected during work hours and retained for 30 days. 
                      Technicians can view their own location history at any time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
