import { useState } from 'react';
import { usePreventiveSchedules, PreventiveSchedule, ComplianceDeadline } from '../hooks/usePreventiveSchedules';
import { CreateScheduleModal } from '../components/preventive/CreateScheduleModal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  RefreshCw, 
  Plus, 
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Thermometer,
  Shield,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function PreventiveMaintenancePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { 
    schedules, 
    activeSchedules, 
    upcomingDeadlines,
    overdueDeadlines,
    loading, 
    refetch, 
    toggleSchedule,
    generateWorkOrder 
  } = usePreventiveSchedules();

  const getCategoryIcon = (category: PreventiveSchedule['category']) => {
    switch (category) {
      case 'hvac': return <Thermometer size={16} />;
      case 'plumbing': return <Wrench size={16} />;
      case 'safety': return <Shield size={16} />;
      case 'compliance': return <FileCheck size={16} />;
      default: return <Wrench size={16} />;
    }
  };

  const getCategoryColor = (category: PreventiveSchedule['category']) => {
    switch (category) {
      case 'hvac': return 'var(--status-info-text)';
      case 'plumbing': return 'var(--action-primary)';
      case 'safety': return 'var(--status-critical-text)';
      case 'compliance': return 'var(--status-warning-text)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusBadge = (status: ComplianceDeadline['status']) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive" className="text-xs"><AlertTriangle size={12} className="mr-1" />Overdue</Badge>;
      case 'due_soon':
        return <Badge className="text-xs bg-amber-500"><Clock size={12} className="mr-1" />Due Soon</Badge>;
      case 'upcoming':
        return <Badge variant="secondary" className="text-xs"><Calendar size={12} className="mr-1" />Upcoming</Badge>;
      case 'completed':
        return <Badge className="text-xs bg-green-600"><CheckCircle size={12} className="mr-1" />Completed</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days`;
  };

  const handleGenerateWorkOrder = async (scheduleId: string, scheduleName: string) => {
    const result = await generateWorkOrder(scheduleId);
    if (result) {
      toast.success(`Work order ${result.workOrderId} created for "${scheduleName}"`);
    }
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
            <Calendar size={24} style={{ color: 'var(--action-primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Preventive Maintenance
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {activeSchedules.length} active schedules • {overdueDeadlines.length} overdue
            </p>
          </div>
          {overdueDeadlines.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {overdueDeadlines.length} Overdue
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={14} className="mr-1" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="schedules" className="h-full flex flex-col">
          <div className="px-6 pt-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <TabsList>
              <TabsTrigger value="schedules">
                <Wrench size={14} className="mr-1" />
                Schedules ({schedules.length})
              </TabsTrigger>
              <TabsTrigger value="compliance">
                <FileCheck size={14} className="mr-1" />
                Compliance
                {overdueDeadlines.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                    {overdueDeadlines.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar size={14} className="mr-1" />
                Calendar View
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="flex-1 overflow-y-auto p-6 mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            ) : (
              <div className="grid gap-4 max-w-4xl">
                {schedules.map(schedule => (
                  <Card key={schedule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                          >
                            <span style={{ color: getCategoryColor(schedule.category) }}>
                              {getCategoryIcon(schedule.category)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {schedule.name}
                              </h3>
                              {!schedule.is_active && (
                                <Badge variant="secondary" className="text-xs">Paused</Badge>
                              )}
                              {schedule.seasonal_trigger && (
                                <Badge variant="outline" className="text-xs">
                                  {schedule.seasonal_trigger === 'pre-winter' ? '❄️ Pre-Winter' : '☀️ Pre-Summer'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {schedule.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {schedule.frequency_type === 'quarterly' ? 'Every 3 months' :
                                 schedule.frequency_type === 'semi-annual' ? 'Every 6 months' :
                                 schedule.frequency_type === 'annual' ? 'Annually' :
                                 `Every ${schedule.frequency_value} ${schedule.frequency_type}`}
                              </span>
                              <span>•</span>
                              <span>{schedule.estimated_duration_hours}h estimated</span>
                              <span>•</span>
                              <span>{schedule.property_ids.length} properties</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Next Due</p>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {formatDate(schedule.next_due)}
                            </p>
                            <p className="text-xs" style={{ 
                              color: new Date(schedule.next_due) < new Date() 
                                ? 'var(--status-critical-text)' 
                                : 'var(--text-secondary)' 
                            }}>
                              {getDaysUntil(schedule.next_due)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleSchedule(schedule.id)}
                            >
                              {schedule.is_active ? <Pause size={14} /> : <Play size={14} />}
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleGenerateWorkOrder(schedule.id, schedule.name)}
                              disabled={!schedule.is_active}
                            >
                              Generate WO
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Checklist Preview */}
                      {schedule.checklist_items.length > 0 && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Checklist ({schedule.checklist_items.length} items)
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {schedule.checklist_items.slice(0, 3).map((item, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {item.length > 30 ? item.substring(0, 30) + '...' : item}
                              </Badge>
                            ))}
                            {schedule.checklist_items.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{schedule.checklist_items.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="flex-1 overflow-y-auto p-6 mt-0">
            <div className="grid gap-4 max-w-4xl">
              {/* Overdue Section */}
              {overdueDeadlines.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--status-critical-text)' }}>
                    <AlertTriangle size={16} />
                    Overdue ({overdueDeadlines.length})
                  </h3>
                  {overdueDeadlines.map(deadline => (
                    <Card key={deadline.id} className="mb-2 border-l-4" style={{ borderLeftColor: 'var(--status-critical-border)' }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {deadline.property_name}
                                {deadline.unit_name && ` - ${deadline.unit_name}`}
                              </span>
                              {getStatusBadge(deadline.status)}
                            </div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {deadline.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Inspection
                            </p>
                            {deadline.notes && (
                              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                {deadline.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium" style={{ color: 'var(--status-critical-text)' }}>
                              {getDaysUntil(deadline.deadline)}
                            </p>
                            <Button size="sm" className="mt-2">Schedule Now</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Upcoming Section */}
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Upcoming Deadlines
                </h3>
                {upcomingDeadlines.filter(d => d.status !== 'overdue').map(deadline => (
                  <Card key={deadline.id} className="mb-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {deadline.property_name}
                              {deadline.unit_name && ` - ${deadline.unit_name}`}
                            </span>
                            {getStatusBadge(deadline.status)}
                          </div>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {deadline.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Inspection
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(deadline.deadline)}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {getDaysUntil(deadline.deadline)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="flex-1 overflow-y-auto p-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upcoming Preventive Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...schedules]
                    .sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime())
                    .slice(0, 10)
                    .map(schedule => (
                      <div 
                        key={schedule.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span style={{ color: getCategoryColor(schedule.category) }}>
                            {getCategoryIcon(schedule.category)}
                          </span>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {schedule.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {schedule.property_ids.length} properties
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(schedule.next_due)}
                          </p>
                          <p className="text-xs" style={{ 
                            color: new Date(schedule.next_due) < new Date() 
                              ? 'var(--status-critical-text)' 
                              : 'var(--text-secondary)' 
                          }}>
                            {getDaysUntil(schedule.next_due)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateScheduleModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
