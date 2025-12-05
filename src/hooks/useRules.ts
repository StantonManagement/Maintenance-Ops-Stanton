import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export type RuleType = 'priority' | 'assignment' | 'capacity' | 'notification' | 'financial';
export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
export type LogicalOperator = 'AND' | 'OR';

export interface RuleCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string | number | string[];
}

export interface ConditionGroup {
  id: string;
  operator: LogicalOperator;
  conditions: RuleCondition[];
}

export interface RuleAction {
  type: 'set_priority' | 'assign_to' | 'notify' | 'escalate' | 'classify' | 'tag';
  value: string;
  params?: Record<string, string>;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  is_active: boolean;
  condition_groups: ConditionGroup[];
  actions: RuleAction[];
  fire_count: number;
  override_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  version: number;
  is_ab_test?: boolean;
  ab_variant?: 'A' | 'B';
  ab_traffic_split?: number;
}

export interface RuleVersion {
  id: string;
  rule_id: string;
  version: number;
  changes: string;
  created_at: string;
  created_by: string;
  condition_groups: ConditionGroup[];
  actions: RuleAction[];
}

// Available fields for conditions
export const ruleFields = [
  { value: 'priority', label: 'Priority', type: 'enum', options: ['emergency', 'high', 'normal', 'low'] },
  { value: 'category', label: 'Category', type: 'enum', options: ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'General', 'Safety'] },
  { value: 'description', label: 'Description', type: 'text' },
  { value: 'property_id', label: 'Property', type: 'enum', options: ['prop-001', 'prop-002', 'prop-003', 'prop-004'] },
  { value: 'tenant_type', label: 'Tenant Type', type: 'enum', options: ['section_8', 'market_rate', 'commercial'] },
  { value: 'age_days', label: 'Age (Days)', type: 'number' },
  { value: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
  { value: 'source', label: 'Source', type: 'enum', options: ['phone', 'email', 'portal', 'voice', 'walk-in'] },
];

// Mock rules data
const mockRules: Rule[] = [
  {
    id: 'rule-001',
    name: 'Emergency Water Leak Priority',
    description: 'Auto-escalate water leak issues to emergency priority',
    type: 'priority',
    is_active: true,
    condition_groups: [
      {
        id: 'cg-001',
        operator: 'AND',
        conditions: [
          { id: 'c-001', field: 'category', operator: 'equals', value: 'Plumbing' },
          { id: 'c-002', field: 'description', operator: 'contains', value: 'leak' }
        ]
      }
    ],
    actions: [
      { type: 'set_priority', value: 'emergency' },
      { type: 'notify', value: 'coordinator', params: { message: 'Water leak reported - auto-escalated' } }
    ],
    fire_count: 47,
    override_count: 3,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-11-01T00:00:00Z',
    created_by: 'Kristine Chen',
    version: 3
  },
  {
    id: 'rule-002',
    name: 'Section 8 Compliance Routing',
    description: 'Route Section 8 unit issues to certified technicians',
    type: 'assignment',
    is_active: true,
    condition_groups: [
      {
        id: 'cg-002',
        operator: 'AND',
        conditions: [
          { id: 'c-003', field: 'tenant_type', operator: 'equals', value: 'section_8' }
        ]
      }
    ],
    actions: [
      { type: 'tag', value: 'section_8_compliance' },
      { type: 'assign_to', value: 'certified_pool' }
    ],
    fire_count: 156,
    override_count: 12,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-10-15T00:00:00Z',
    created_by: 'Kristine Chen',
    version: 2
  },
  {
    id: 'rule-003',
    name: 'High Cost Approval Required',
    description: 'Flag work orders over $500 for manager approval',
    type: 'financial',
    is_active: true,
    condition_groups: [
      {
        id: 'cg-003',
        operator: 'AND',
        conditions: [
          { id: 'c-004', field: 'estimated_cost', operator: 'greater_than', value: 500 }
        ]
      }
    ],
    actions: [
      { type: 'tag', value: 'requires_approval' },
      { type: 'notify', value: 'manager', params: { message: 'High cost work order requires approval' } }
    ],
    fire_count: 89,
    override_count: 5,
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-09-20T00:00:00Z',
    created_by: 'Admin',
    version: 1
  },
  {
    id: 'rule-004',
    name: 'HVAC Emergency Hours',
    description: 'Escalate HVAC issues during extreme weather',
    type: 'priority',
    is_active: false,
    condition_groups: [
      {
        id: 'cg-004',
        operator: 'AND',
        conditions: [
          { id: 'c-005', field: 'category', operator: 'equals', value: 'HVAC' }
        ]
      }
    ],
    actions: [
      { type: 'set_priority', value: 'high' }
    ],
    fire_count: 23,
    override_count: 8,
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-08-01T00:00:00Z',
    created_by: 'Kristine Chen',
    version: 4
  },
  {
    id: 'rule-005',
    name: 'Aging Work Order Alert',
    description: 'Notify coordinator when work order exceeds 7 days',
    type: 'notification',
    is_active: true,
    condition_groups: [
      {
        id: 'cg-005',
        operator: 'AND',
        conditions: [
          { id: 'c-006', field: 'age_days', operator: 'greater_than', value: 7 }
        ]
      }
    ],
    actions: [
      { type: 'notify', value: 'coordinator', params: { message: 'Work order aging - needs attention' } },
      { type: 'tag', value: 'aging' }
    ],
    fire_count: 234,
    override_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-11-15T00:00:00Z',
    created_by: 'Admin',
    version: 2
  }
];

const mockVersions: RuleVersion[] = [
  {
    id: 'v-001',
    rule_id: 'rule-001',
    version: 3,
    changes: 'Added notification action',
    created_at: '2024-11-01T00:00:00Z',
    created_by: 'Kristine Chen',
    condition_groups: mockRules[0].condition_groups,
    actions: mockRules[0].actions
  },
  {
    id: 'v-002',
    rule_id: 'rule-001',
    version: 2,
    changes: 'Changed priority from high to emergency',
    created_at: '2024-08-15T00:00:00Z',
    created_by: 'Kristine Chen',
    condition_groups: mockRules[0].condition_groups,
    actions: [{ type: 'set_priority', value: 'high' }]
  },
  {
    id: 'v-003',
    rule_id: 'rule-001',
    version: 1,
    changes: 'Initial rule creation',
    created_at: '2024-01-15T00:00:00Z',
    created_by: 'Kristine Chen',
    condition_groups: mockRules[0].condition_groups,
    actions: [{ type: 'set_priority', value: 'high' }]
  }
];

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('business_rules')
        .select('*')
        .order('priority');

      if (fetchError) {
        console.warn('Supabase business_rules error, using mock data:', fetchError.message);
        setRules(mockRules);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No rules in DB, using mock data');
        setRules(mockRules);
        return;
      }

      // Map DB rules to our interface
      setRules(data.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        type: mapTriggerToType(r.trigger_event),
        is_active: r.is_active !== false,
        condition_groups: mapConditionsToGroups(r.conditions),
        actions: mapActionsFromDB(r.actions),
        fire_count: 0, // Would need to count from rule_executions
        override_count: 0,
        created_at: r.created_at,
        updated_at: r.updated_at,
        created_by: r.created_by || 'system',
        version: r.version || 1
      })));
    } catch (err) {
      console.warn('Failed to fetch rules:', err);
      setRules(mockRules);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper to map trigger event to rule type
  function mapTriggerToType(trigger: string): RuleType {
    if (trigger.includes('priority')) return 'priority';
    if (trigger.includes('assign')) return 'assignment';
    return 'priority';
  }

  // Helper to map flat conditions to condition groups
  function mapConditionsToGroups(conditions: any[]): ConditionGroup[] {
    if (!conditions || conditions.length === 0) return [];
    return [{
      id: 'cg-1',
      operator: 'AND',
      conditions: conditions.map((c, i) => ({
        id: `c-${i}`,
        field: c.field,
        operator: c.operator as ConditionOperator,
        value: c.value
      }))
    }];
  }

  // Helper to map actions from DB format
  function mapActionsFromDB(actions: any[]): RuleAction[] {
    if (!actions || actions.length === 0) return [];
    return actions.map(a => ({
      type: a.type as RuleAction['type'],
      value: a.params?.priority || a.params?.tag || a.params?.message || '',
      params: a.params
    }));
  }

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const createRule = useCallback(async (rule: Omit<Rule, 'id' | 'created_at' | 'updated_at' | 'fire_count' | 'override_count' | 'version'>) => {
    try {
      // Convert to DB format
      const conditions = rule.condition_groups.flatMap(g => 
        g.conditions.map(c => ({ field: c.field, operator: c.operator, value: c.value }))
      );
      const actions = rule.actions.map(a => ({ type: a.type, params: { [a.type.replace('set_', '')]: a.value, ...a.params } }));

      const { data, error } = await supabase
        .from('business_rules')
        .insert({
          name: rule.name,
          description: rule.description,
          trigger_event: 'work_order.created',
          conditions,
          actions,
          is_active: rule.is_active,
          created_by: rule.created_by
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create rule:', error.message);
        // Fallback to local
        const newRule: Rule = {
          ...rule,
          id: `rule-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          fire_count: 0,
          override_count: 0,
          version: 1
        };
        setRules(prev => [...prev, newRule]);
        return newRule;
      }

      const newRule: Rule = {
        ...rule,
        id: data.id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        fire_count: 0,
        override_count: 0,
        version: 1
      };
      setRules(prev => [...prev, newRule]);
      return newRule;
    } catch (err) {
      console.error('Error creating rule:', err);
      throw err;
    }
  }, []);

  const updateRule = useCallback(async (id: string, updates: Partial<Rule>) => {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
      if (updates.condition_groups) {
        dbUpdates.conditions = updates.condition_groups.flatMap(g => 
          g.conditions.map(c => ({ field: c.field, operator: c.operator, value: c.value }))
        );
      }
      if (updates.actions) {
        dbUpdates.actions = updates.actions.map(a => ({ type: a.type, params: { [a.type.replace('set_', '')]: a.value, ...a.params } }));
      }

      const { error } = await supabase
        .from('business_rules')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.warn('Failed to update rule in DB:', error.message);
      }

      setRules(prev => prev.map(r => 
        r.id === id 
          ? { ...r, ...updates, updated_at: new Date().toISOString(), version: r.version + 1 }
          : r
      ));
    } catch (err) {
      console.warn('Error updating rule:', err);
      setRules(prev => prev.map(r => 
        r.id === id 
          ? { ...r, ...updates, updated_at: new Date().toISOString(), version: r.version + 1 }
          : r
      ));
    }
  }, []);

  const toggleRule = useCallback(async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;

    try {
      const { error } = await supabase
        .from('business_rules')
        .update({ is_active: !rule.is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('Failed to toggle rule in DB:', error.message);
      }

      setRules(prev => prev.map(r => 
        r.id === id ? { ...r, is_active: !r.is_active, updated_at: new Date().toISOString() } : r
      ));
    } catch (err) {
      console.warn('Error toggling rule:', err);
      setRules(prev => prev.map(r => 
        r.id === id ? { ...r, is_active: !r.is_active, updated_at: new Date().toISOString() } : r
      ));
    }
  }, [rules]);

  const deleteRule = useCallback(async (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const getVersionHistory = useCallback(async (ruleId: string): Promise<RuleVersion[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockVersions.filter(v => v.rule_id === ruleId);
  }, []);

  const testRule = useCallback(async (rule: Rule, testData: Record<string, any>): Promise<{ matches: boolean; actions: RuleAction[] }> => {
    // Simple rule testing logic
    let matches = true;
    
    for (const group of rule.condition_groups) {
      const groupMatches = group.conditions.every(condition => {
        const fieldValue = testData[condition.field];
        if (fieldValue === undefined) return false;
        
        switch (condition.operator) {
          case 'equals':
            return fieldValue === condition.value;
          case 'not_equals':
            return fieldValue !== condition.value;
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
          case 'greater_than':
            return Number(fieldValue) > Number(condition.value);
          case 'less_than':
            return Number(fieldValue) < Number(condition.value);
          default:
            return false;
        }
      });
      
      if (group.operator === 'AND' && !groupMatches) {
        matches = false;
        break;
      }
    }
    
    return {
      matches,
      actions: matches ? rule.actions : []
    };
  }, []);

  const activeRules = rules.filter(r => r.is_active);
  const rulesByType = rules.reduce((acc, rule) => {
    if (!acc[rule.type]) acc[rule.type] = [];
    acc[rule.type].push(rule);
    return acc;
  }, {} as Record<RuleType, Rule[]>);

  return {
    rules,
    activeRules,
    rulesByType,
    loading,
    error,
    refetch: fetchRules,
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
    getVersionHistory,
    testRule
  };
}
