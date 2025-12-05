import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'seasonal';
export type SeasonalTrigger = 'pre-winter' | 'pre-summer' | 'spring' | 'fall' | null;

export interface PreventiveSchedule {
  id: string;
  name: string;
  description: string;
  frequency_type: FrequencyType;
  frequency_value: number; // e.g., every 3 months = frequency_type: 'monthly', frequency_value: 3
  seasonal_trigger: SeasonalTrigger;
  property_ids: string[];
  unit_ids: string[];
  equipment_type?: string;
  is_active: boolean;
  last_generated?: string;
  next_due: string;
  created_at: string;
  category: 'hvac' | 'plumbing' | 'electrical' | 'safety' | 'compliance' | 'general';
  estimated_duration_hours: number;
  checklist_items: string[];
}

export interface ComplianceDeadline {
  id: string;
  type: 'section_8' | 'city_code' | 'fire_safety' | 'elevator';
  property_id: string;
  property_name: string;
  unit_id?: string;
  unit_name?: string;
  deadline: string;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed';
  last_inspection?: string;
  notes?: string;
}

// Mock data
const mockSchedules: PreventiveSchedule[] = [
  {
    id: 'pm-001',
    name: 'Boiler Maintenance - Pre-Winter',
    description: 'Annual boiler inspection and maintenance before heating season',
    frequency_type: 'annual',
    frequency_value: 1,
    seasonal_trigger: 'pre-winter',
    property_ids: ['prop-001', 'prop-002', 'prop-003'],
    unit_ids: [],
    equipment_type: 'Boiler',
    is_active: true,
    last_generated: '2024-10-15T00:00:00Z',
    next_due: '2025-10-01T00:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    category: 'hvac',
    estimated_duration_hours: 4,
    checklist_items: [
      'Check pilot light and ignition',
      'Inspect heat exchanger',
      'Test safety controls',
      'Check flue and venting',
      'Lubricate moving parts',
      'Test thermostat operation'
    ]
  },
  {
    id: 'pm-002',
    name: 'HVAC Filter Replacement',
    description: 'Replace HVAC filters in all units',
    frequency_type: 'quarterly',
    frequency_value: 3,
    seasonal_trigger: null,
    property_ids: ['prop-001', 'prop-002'],
    unit_ids: [],
    equipment_type: 'HVAC',
    is_active: true,
    last_generated: '2024-09-01T00:00:00Z',
    next_due: '2024-12-01T00:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    category: 'hvac',
    estimated_duration_hours: 0.5,
    checklist_items: [
      'Remove old filter',
      'Check filter housing for debris',
      'Install new filter (correct size)',
      'Note filter size on unit record'
    ]
  },
  {
    id: 'pm-003',
    name: 'Fire Extinguisher Inspection',
    description: 'Monthly fire extinguisher check and annual certification',
    frequency_type: 'monthly',
    frequency_value: 1,
    seasonal_trigger: null,
    property_ids: ['prop-001', 'prop-002', 'prop-003', 'prop-004'],
    unit_ids: [],
    equipment_type: 'Fire Extinguisher',
    is_active: true,
    last_generated: '2024-11-01T00:00:00Z',
    next_due: '2024-12-01T00:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    category: 'safety',
    estimated_duration_hours: 1,
    checklist_items: [
      'Check pressure gauge',
      'Verify seal is intact',
      'Check for physical damage',
      'Ensure clear access',
      'Initial and date tag'
    ]
  },
  {
    id: 'pm-004',
    name: 'Water Heater Flush',
    description: 'Annual water heater flush to remove sediment',
    frequency_type: 'annual',
    frequency_value: 1,
    seasonal_trigger: null,
    property_ids: [],
    unit_ids: ['unit-101', 'unit-102', 'unit-201', 'unit-202'],
    equipment_type: 'Water Heater',
    is_active: true,
    last_generated: '2024-03-15T00:00:00Z',
    next_due: '2025-03-15T00:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    category: 'plumbing',
    estimated_duration_hours: 1,
    checklist_items: [
      'Turn off power/gas',
      'Connect hose to drain valve',
      'Flush until water runs clear',
      'Check anode rod condition',
      'Restore power and test'
    ]
  },
  {
    id: 'pm-005',
    name: 'A/C Pre-Summer Check',
    description: 'Prepare air conditioning systems before summer',
    frequency_type: 'annual',
    frequency_value: 1,
    seasonal_trigger: 'pre-summer',
    property_ids: ['prop-001', 'prop-002'],
    unit_ids: [],
    equipment_type: 'Air Conditioner',
    is_active: true,
    last_generated: '2024-04-01T00:00:00Z',
    next_due: '2025-04-01T00:00:00Z',
    created_at: '2023-01-01T00:00:00Z',
    category: 'hvac',
    estimated_duration_hours: 2,
    checklist_items: [
      'Clean or replace filters',
      'Check refrigerant levels',
      'Clean condenser coils',
      'Test thermostat',
      'Check electrical connections',
      'Clear drain lines'
    ]
  }
];

const mockDeadlines: ComplianceDeadline[] = [
  {
    id: 'comp-001',
    type: 'section_8',
    property_id: 'prop-001',
    property_name: '90 Park St',
    unit_id: 'unit-205',
    unit_name: 'Unit 205',
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'due_soon',
    last_inspection: '2023-12-15T00:00:00Z'
  },
  {
    id: 'comp-002',
    type: 'section_8',
    property_id: 'prop-002',
    property_name: '101 Maple Ave',
    unit_id: 'unit-310',
    unit_name: 'Unit 310',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
    last_inspection: '2024-01-20T00:00:00Z'
  },
  {
    id: 'comp-003',
    type: 'fire_safety',
    property_id: 'prop-001',
    property_name: '90 Park St',
    deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'overdue',
    last_inspection: '2023-11-01T00:00:00Z',
    notes: 'Annual fire safety inspection overdue'
  },
  {
    id: 'comp-004',
    type: 'elevator',
    property_id: 'prop-003',
    property_name: '222 Main St',
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
    last_inspection: '2024-06-01T00:00:00Z'
  }
];

export function usePreventiveSchedules() {
  const [schedules, setSchedules] = useState<PreventiveSchedule[]>([]);
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('preventive_schedules')
        .select('*')
        .order('next_due');

      if (schedulesError) {
        console.warn('Supabase preventive_schedules error, using mock data:', schedulesError.message);
        setSchedules(mockSchedules);
        setDeadlines(mockDeadlines);
        return;
      }

      // Fetch deadlines
      const { data: deadlinesData, error: deadlinesError } = await supabase
        .from('compliance_deadlines')
        .select('*')
        .order('deadline');

      if (deadlinesError) {
        console.warn('Supabase compliance_deadlines error:', deadlinesError.message);
      }

      if (!schedulesData || schedulesData.length === 0) {
        console.log('No preventive schedules in DB, using mock data');
        setSchedules(mockSchedules);
        setDeadlines(mockDeadlines);
        return;
      }

      setSchedules(schedulesData.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        frequency_type: s.frequency_type,
        frequency_value: s.frequency_value || 1,
        seasonal_trigger: s.seasonal_trigger,
        property_ids: s.property_ids || [],
        unit_ids: s.unit_ids || [],
        equipment_type: s.equipment_type,
        is_active: s.is_active !== false,
        last_generated: s.last_generated,
        next_due: s.next_due,
        created_at: s.created_at,
        category: s.category || 'general',
        estimated_duration_hours: s.estimated_duration_hours || 1,
        checklist_items: s.checklist_items || []
      })));

      if (deadlinesData && deadlinesData.length > 0) {
        setDeadlines(deadlinesData.map(d => ({
          id: d.id,
          type: d.type,
          property_id: d.property_id,
          property_name: d.property_name || '',
          unit_id: d.unit_id,
          unit_name: d.unit_name,
          deadline: d.deadline,
          status: d.status,
          last_inspection: d.last_inspection,
          notes: d.notes
        })));
      } else {
        setDeadlines(mockDeadlines);
      }
    } catch (err) {
      console.warn('Failed to fetch preventive schedules:', err);
      setSchedules(mockSchedules);
      setDeadlines(mockDeadlines);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const createSchedule = useCallback(async (schedule: Omit<PreventiveSchedule, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('preventive_schedules')
        .insert({
          name: schedule.name,
          description: schedule.description,
          frequency_type: schedule.frequency_type,
          frequency_value: schedule.frequency_value,
          seasonal_trigger: schedule.seasonal_trigger,
          property_ids: schedule.property_ids,
          unit_ids: schedule.unit_ids,
          equipment_type: schedule.equipment_type,
          category: schedule.category,
          is_active: schedule.is_active,
          next_due: schedule.next_due,
          estimated_duration_hours: schedule.estimated_duration_hours,
          checklist_items: schedule.checklist_items
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create schedule:', error.message);
        const newSchedule: PreventiveSchedule = {
          ...schedule,
          id: `pm-${Date.now()}`,
          created_at: new Date().toISOString()
        };
        setSchedules(prev => [...prev, newSchedule]);
        return newSchedule;
      }

      const newSchedule: PreventiveSchedule = {
        ...schedule,
        id: data.id,
        created_at: data.created_at
      };
      setSchedules(prev => [...prev, newSchedule]);
      return newSchedule;
    } catch (err) {
      console.error('Error creating schedule:', err);
      throw err;
    }
  }, []);

  const updateSchedule = useCallback(async (id: string, updates: Partial<PreventiveSchedule>) => {
    try {
      const { error } = await supabase
        .from('preventive_schedules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('Failed to update schedule in DB:', error.message);
      }

      setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (err) {
      console.warn('Error updating schedule:', err);
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  }, []);

  const toggleSchedule = useCallback(async (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;

    try {
      const { error } = await supabase
        .from('preventive_schedules')
        .update({ is_active: !schedule.is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('Failed to toggle schedule in DB:', error.message);
      }

      setSchedules(prev => prev.map(s => 
        s.id === id ? { ...s, is_active: !s.is_active } : s
      ));
    } catch (err) {
      console.warn('Error toggling schedule:', err);
      setSchedules(prev => prev.map(s => 
        s.id === id ? { ...s, is_active: !s.is_active } : s
      ));
    }
  }, [schedules]);

  const generateWorkOrder = useCallback(async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return null;
    
    console.log('Generating work order for schedule:', schedule.name);
    
    // Calculate next_due
    const now = new Date();
    let nextDue = new Date(now);
    
    switch (schedule.frequency_type) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + schedule.frequency_value);
        break;
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + (7 * schedule.frequency_value));
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + schedule.frequency_value);
        break;
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case 'semi-annual':
        nextDue.setMonth(nextDue.getMonth() + 6);
        break;
      case 'annual':
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        break;
    }

    const workOrderId = `WO-PM-${Date.now()}`;

    try {
      // Create work order action to track this
      const { error: actionError } = await supabase
        .from('work_order_actions')
        .insert({
          work_order_id: workOrderId,
          action_type: 'note',
          action_data: {
            type: 'preventive_maintenance_generated',
            schedule_id: scheduleId,
            schedule_name: schedule.name,
            category: schedule.category,
            equipment_type: schedule.equipment_type,
            checklist_items: schedule.checklist_items,
            estimated_hours: schedule.estimated_duration_hours
          },
          created_by: 'preventive_system'
        });

      if (actionError) {
        console.warn('Failed to create work order action:', actionError.message);
      }

      // Link the work order to the schedule
      const { error: linkError } = await supabase
        .from('preventive_work_orders')
        .insert({
          schedule_id: scheduleId,
          work_order_id: workOrderId
        });

      if (linkError) {
        console.warn('Failed to link work order to schedule:', linkError.message);
      }

      // Update the schedule
      const { error: updateError } = await supabase
        .from('preventive_schedules')
        .update({ 
          last_generated: now.toISOString(), 
          next_due: nextDue.toISOString().split('T')[0],
          updated_at: now.toISOString()
        })
        .eq('id', scheduleId);

      if (updateError) {
        console.warn('Failed to update schedule:', updateError.message);
      }

      setSchedules(prev => prev.map(s => 
        s.id === scheduleId 
          ? { ...s, last_generated: now.toISOString(), next_due: nextDue.toISOString() }
          : s
      ));

      return { workOrderId };
    } catch (err) {
      console.error('Error generating work order:', err);
      // Still update local state
      setSchedules(prev => prev.map(s => 
        s.id === scheduleId 
          ? { ...s, last_generated: now.toISOString(), next_due: nextDue.toISOString() }
          : s
      ));
      return { workOrderId };
    }
  }, [schedules]);

  const activeSchedules = schedules.filter(s => s.is_active);
  const upcomingDeadlines = deadlines.filter(d => d.status !== 'completed');
  const overdueDeadlines = deadlines.filter(d => d.status === 'overdue');

  return {
    schedules,
    deadlines,
    activeSchedules,
    upcomingDeadlines,
    overdueDeadlines,
    loading,
    error,
    refetch: fetchSchedules,
    createSchedule,
    updateSchedule,
    toggleSchedule,
    generateWorkOrder
  };
}
