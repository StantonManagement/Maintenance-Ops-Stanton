-- FIX OVERRIDES SCHEMA
-- Run this in Supabase SQL Editor
-- Fixes: "new row for relation work_order_actions violates check constraint"
-- Adds 'override' to the allowed action_types

-- 1. Drop the old constraint
ALTER TABLE work_order_actions DROP CONSTRAINT IF EXISTS work_order_actions_action_type_check;

-- 2. Add the new constraint with 'override' included
ALTER TABLE work_order_actions 
  ADD CONSTRAINT work_order_actions_action_type_check 
  CHECK (action_type IN ('assignment', 'status_change', 'note', 'photo', 'scheduling', 'approval', 'message', 'override'));

-- 3. Ensure action_data supports the override structure (JSONB is flexible, so no schema change needed there)
