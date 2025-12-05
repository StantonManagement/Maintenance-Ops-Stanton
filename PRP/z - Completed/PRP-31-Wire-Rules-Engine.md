# PRP-31: Wire Rules Engine to Fire on Work Orders

## Goal
Make rules actually evaluate and execute actions when work orders are created/updated.

## Current State
- UI exists: RulesEnginePage, rule list, test panel
- Rules stored (mock or real)
- Toggle active works on UI
- "New Rule" / "Edit" show coming soon
- Rules don't actually fire on work orders

## Success Criteria
- [ ] Rules table in Supabase
- [ ] Rules evaluate on work_order insert/update
- [ ] Matching rules execute their actions
- [ ] Actions: set priority, set category, assign technician, send notification
- [ ] Rule execution logged for audit
- [ ] Edit modal works

---

## Tasks

### Task 1: Rules Tables
Add to Supabase:
```sql
CREATE TABLE business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL, -- 'work_order.created', 'work_order.updated'
  conditions JSONB NOT NULL, -- [{field, operator, value}]
  actions JSONB NOT NULL, -- [{type, params}]
  priority INTEGER DEFAULT 100, -- Lower = runs first
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

CREATE TABLE rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES business_rules(id),
  work_order_id UUID REFERENCES work_orders(id),
  trigger_event TEXT,
  conditions_matched BOOLEAN,
  actions_executed JSONB,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES business_rules(id),
  version INTEGER,
  conditions JSONB,
  actions JSONB,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Task 2: Rule Evaluation Function
CREATE Supabase Edge Function or Database Function:
```sql
CREATE OR REPLACE FUNCTION evaluate_rules(
  p_work_order_id UUID,
  p_trigger_event TEXT
) RETURNS JSONB AS $$
DECLARE
  v_rule RECORD;
  v_work_order RECORD;
  v_matched BOOLEAN;
  v_results JSONB := '[]'::JSONB;
BEGIN
  -- Get work order
  SELECT * INTO v_work_order FROM work_orders WHERE id = p_work_order_id;
  
  -- Loop through active rules for this trigger
  FOR v_rule IN 
    SELECT * FROM business_rules 
    WHERE is_active = true 
    AND trigger_event = p_trigger_event
    ORDER BY priority ASC
  LOOP
    -- Evaluate conditions
    v_matched := evaluate_conditions(v_rule.conditions, v_work_order);
    
    IF v_matched THEN
      -- Execute actions
      PERFORM execute_rule_actions(v_rule.id, p_work_order_id, v_rule.actions);
    END IF;
    
    -- Log execution
    INSERT INTO rule_executions (rule_id, work_order_id, trigger_event, conditions_matched)
    VALUES (v_rule.id, p_work_order_id, p_trigger_event, v_matched);
    
  END LOOP;
  
  RETURN v_results;
END;
$$ LANGUAGE plpgsql;
```

### Task 3: Condition Evaluator
Implement condition matching logic:
- Operators: equals, not_equals, contains, greater_than, less_than, in, not_in
- Fields: description, category, priority, property_id, tenant_phone, source
- Example condition:
```json
{"field": "description", "operator": "contains", "value": "leak"}
```

### Task 4: Action Executor
Implement action execution:
```typescript
// Action types
type Action = 
  | { type: 'set_priority', params: { priority: string } }
  | { type: 'set_category', params: { category: string } }
  | { type: 'assign_technician', params: { technician_id: string } }
  | { type: 'send_notification', params: { channel: string, message: string } }
  | { type: 'add_tag', params: { tag: string } }

// Execute based on type
switch(action.type) {
  case 'set_priority':
    await supabase.from('work_orders')
      .update({ priority: action.params.priority })
      .eq('id', workOrderId);
    break;
  // ... other actions
}
```

### Task 5: Trigger on Work Order Changes
Option A - Database Trigger:
```sql
CREATE OR REPLACE FUNCTION trigger_rule_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM evaluate_rules(NEW.id, 'work_order.created');
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM evaluate_rules(NEW.id, 'work_order.updated');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_order_rules_trigger
AFTER INSERT OR UPDATE ON work_orders
FOR EACH ROW EXECUTE FUNCTION trigger_rule_evaluation();
```

Option B - Application Level:
Call evaluate_rules() from useWorkOrders hook after create/update.

### Task 6: Create useRules Hook
CREATE/MODIFY `src/hooks/useRules.ts`:
- fetchRules(): get all rules
- createRule(data): insert new rule
- updateRule(id, data): update rule, increment version
- deleteRule(id): soft delete (is_active = false)
- testRule(ruleId, testData): simulate without executing
- getExecutionHistory(ruleId): get rule_executions

### Task 7: Rule Editor Modal
CREATE `src/components/rules/RuleEditorModal.tsx`:
- Form sections: Basic Info, Conditions Builder, Actions Builder
- Condition builder: Add/remove conditions, pick field/operator/value
- Action builder: Add/remove actions, pick type and params
- Preview JSON
- Test with sample data before save

### Task 8: Wire RulesEnginePage
MODIFY `src/pages/RulesEnginePage.tsx`:
- "New Rule" opens RuleEditorModal in create mode
- "Edit" opens RuleEditorModal with existing rule
- Show execution count from rule_executions
- Show last execution time

### Task 9: Seed Test Rules
```sql
INSERT INTO business_rules (name, trigger_event, conditions, actions, priority) VALUES
('Emergency Water Leak', 'work_order.created', 
 '[{"field": "description", "operator": "contains", "value": "leak"}]',
 '[{"type": "set_priority", "params": {"priority": "emergency"}}]',
 10),
('Auto-assign HVAC', 'work_order.created',
 '[{"field": "category", "operator": "equals", "value": "hvac"}]',
 '[{"type": "add_tag", "params": {"tag": "hvac-specialist"}}]',
 50);
```

---

## Validation Checkpoints
1. Rules table has seed data
2. Creating WO with "leak" in description → priority becomes emergency
3. Rule execution logged in rule_executions
4. Edit modal opens with existing rule data
5. New rule saves to DB
6. Test panel shows rule would match

---

## Files to Modify
- src/pages/RulesEnginePage.tsx
- src/hooks/useRules.ts (if exists)

## Files to Create
- src/components/rules/RuleEditorModal.tsx
- src/components/rules/ConditionBuilder.tsx
- src/components/rules/ActionBuilder.tsx
- Supabase migrations for rules tables
- Supabase function for rule evaluation

---

## Anti-Patterns
- ❌ Don't execute rules synchronously in transaction (can timeout)
- ❌ Don't modify rule without incrementing version
- ❌ Don't skip logging execution (need audit trail)
- ❌ Don't allow circular rule triggers
