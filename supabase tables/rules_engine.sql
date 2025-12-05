-- Rules Engine Tables
-- Run this in Supabase SQL Editor to create the tables

-- Main business rules table
CREATE TABLE IF NOT EXISTS business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('work_order.created', 'work_order.updated', 'work_order.status_changed')),
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

-- Rule execution history for audit
CREATE TABLE IF NOT EXISTS rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES business_rules(id) ON DELETE CASCADE,
  work_order_id TEXT NOT NULL,
  trigger_event TEXT,
  conditions_matched BOOLEAN,
  actions_executed JSONB,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rule version history
CREATE TABLE IF NOT EXISTS rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES business_rules(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  name TEXT,
  conditions JSONB,
  actions JSONB,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_rules_active ON business_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_business_rules_trigger ON business_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_business_rules_priority ON business_rules(priority);
CREATE INDEX IF NOT EXISTS idx_rule_executions_rule ON rule_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_executions_work_order ON rule_executions(work_order_id);
CREATE INDEX IF NOT EXISTS idx_rule_executions_time ON rule_executions(created_at);
CREATE INDEX IF NOT EXISTS idx_rule_versions_rule ON rule_versions(rule_id);

-- Enable Row Level Security
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_versions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all for authenticated on business_rules" ON business_rules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read for anon on business_rules" ON business_rules
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all for authenticated on rule_executions" ON rule_executions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated on rule_versions" ON rule_versions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data for business rules
INSERT INTO business_rules (name, description, trigger_event, conditions, actions, priority, is_active) VALUES
(
  'Emergency Water Leak Detection',
  'Automatically escalate work orders mentioning water leaks to emergency priority',
  'work_order.created',
  '[{"field": "description", "operator": "contains", "value": "leak"}, {"field": "description", "operator": "contains", "value": "water"}]',
  '[{"type": "set_priority", "params": {"priority": "emergency"}}, {"type": "add_tag", "params": {"tag": "water-damage"}}]',
  10,
  true
),
(
  'HVAC Specialist Assignment',
  'Tag HVAC work orders for specialist routing',
  'work_order.created',
  '[{"field": "category", "operator": "equals", "value": "hvac"}]',
  '[{"type": "add_tag", "params": {"tag": "hvac-specialist"}}]',
  50,
  true
),
(
  'After Hours Emergency',
  'Flag emergency work orders created outside business hours',
  'work_order.created',
  '[{"field": "priority", "operator": "equals", "value": "emergency"}]',
  '[{"type": "send_notification", "params": {"channel": "sms", "message": "Emergency work order created"}}]',
  20,
  true
),
(
  'Tenant Portal Auto-Acknowledge',
  'Send confirmation when tenant portal request creates work order',
  'work_order.created',
  '[{"field": "source", "operator": "equals", "value": "tenant_portal"}]',
  '[{"type": "send_notification", "params": {"channel": "sms", "message": "Your maintenance request has been received"}}]',
  100,
  true
),
(
  'High Priority Escalation',
  'Notify supervisor when high priority work order is not assigned within 1 hour',
  'work_order.updated',
  '[{"field": "priority", "operator": "in", "value": ["emergency", "high"]}, {"field": "status", "operator": "equals", "value": "new"}]',
  '[{"type": "send_notification", "params": {"channel": "email", "message": "High priority work order needs attention"}}]',
  30,
  false
);

-- Function to log rule execution (called from application)
CREATE OR REPLACE FUNCTION log_rule_execution(
  p_rule_id UUID,
  p_work_order_id TEXT,
  p_trigger_event TEXT,
  p_matched BOOLEAN,
  p_actions JSONB DEFAULT NULL,
  p_execution_ms INTEGER DEFAULT NULL,
  p_error TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO rule_executions (
    rule_id, 
    work_order_id, 
    trigger_event, 
    conditions_matched, 
    actions_executed,
    execution_time_ms,
    error_message
  ) VALUES (
    p_rule_id,
    p_work_order_id,
    p_trigger_event,
    p_matched,
    p_actions,
    p_execution_ms,
    p_error
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to save rule version before update
CREATE OR REPLACE FUNCTION save_rule_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.version != NEW.version THEN
    INSERT INTO rule_versions (rule_id, version, name, conditions, actions, changed_by)
    VALUES (OLD.id, OLD.version, OLD.name, OLD.conditions, OLD.actions, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_save_rule_version
  BEFORE UPDATE ON business_rules
  FOR EACH ROW
  EXECUTE FUNCTION save_rule_version();
