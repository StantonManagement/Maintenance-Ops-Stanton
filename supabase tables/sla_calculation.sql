-- View to calculate SLA status for Work Orders
-- Run this in Supabase SQL Editor

CREATE OR REPLACE VIEW v_work_orders_with_sla AS
SELECT 
  wo.*,
  -- Calculate hours elapsed since creation
  EXTRACT(EPOCH FROM (NOW() - wo."CreatedAt")) / 3600 as hours_old,
  
  -- Determine SLA limit based on priority
  CASE 
    WHEN LOWER(wo."Priority") LIKE '%emergency%' THEN 2
    WHEN LOWER(wo."Priority") LIKE '%high%' THEN 24
    WHEN LOWER(wo."Priority") LIKE '%low%' THEN 168
    ELSE 72 -- Normal/Medium
  END as sla_limit_hours,
  
  -- Calculate hours remaining (can be negative if overdue)
  (CASE 
    WHEN LOWER(wo."Priority") LIKE '%emergency%' THEN 2
    WHEN LOWER(wo."Priority") LIKE '%high%' THEN 24
    WHEN LOWER(wo."Priority") LIKE '%low%' THEN 168
    ELSE 72
  END - (EXTRACT(EPOCH FROM (NOW() - wo."CreatedAt")) / 3600)) as hours_until_sla_breach,
  
  -- Determine status
  CASE 
    WHEN wo."Status" IN ('COMPLETED', 'Completed', 'DONE', 'CANCELLED') THEN 'completed'
    WHEN (EXTRACT(EPOCH FROM (NOW() - wo."CreatedAt")) / 3600) > (
      CASE 
        WHEN LOWER(wo."Priority") LIKE '%emergency%' THEN 2
        WHEN LOWER(wo."Priority") LIKE '%high%' THEN 24
        WHEN LOWER(wo."Priority") LIKE '%low%' THEN 168
        ELSE 72
      END
    ) THEN 'overdue'
    WHEN (EXTRACT(EPOCH FROM (NOW() - wo."CreatedAt")) / 3600) > (
      CASE 
        WHEN LOWER(wo."Priority") LIKE '%emergency%' THEN 2
        WHEN LOWER(wo."Priority") LIKE '%high%' THEN 24
        WHEN LOWER(wo."Priority") LIKE '%low%' THEN 168
        ELSE 72
      END * 0.75
    ) THEN 'warning'
    ELSE 'on_track'
  END as sla_status

FROM "AF_work_order_new" wo;

-- Grant access
GRANT SELECT ON v_work_orders_with_sla TO authenticated;
GRANT SELECT ON v_work_orders_with_sla TO service_role;
