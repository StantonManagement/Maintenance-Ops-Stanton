-- Aggregates work order data by property for dashboard
-- This view consolidates property health metrics in real-time
CREATE OR REPLACE VIEW v_property_health_metrics AS
SELECT 
  p.id,
  p.code as propertyCode,
  p.name as propertyName,
  p.total_units as totalUnits,
  
  -- Work order counts
  COUNT(wo.id) FILTER (WHERE wo.status != 'completed' AND wo.status != 'cancelled') as openWorkOrders,
  COUNT(wo.id) FILTER (WHERE wo.priority = 'emergency' AND wo.status != 'completed' AND wo.status != 'cancelled') as emergencyCount,
  -- "Stuck" definition: Open for > 72 hours
  COUNT(wo.id) FILTER (WHERE wo.created_at < NOW() - INTERVAL '72 hours' AND wo.status != 'completed' AND wo.status != 'cancelled') as stuckCount,
  -- "Overdue" definition: Mock logic for now, or based on explicit due_date if exists
  COUNT(wo.id) FILTER (WHERE wo.status = 'overdue') as overdueCount,
  COUNT(wo.id) FILTER (WHERE wo.status = 'ready_review') as readyForReviewCount,
  
  -- Performance metrics
  -- Average resolution time in hours for completed work orders
  COALESCE(
    AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at))/3600) 
    FILTER (WHERE wo.status = 'completed'), 
    0
  ) as avgResolutionHours,
  
  -- Compliance placeholders (can join to inspections table later)
  NULL::timestamp as nextInspectionDate,
  NULL::text as inspectionType,
  NULL::int as daysUntilInspection,
  
  -- Revenue impact placeholders
  0 as monthlyMaintenanceCost,
  0 as estimatedLiabilityAtStake,
  
  NOW() as updated_at
FROM properties p
LEFT JOIN AF_work_order_new wo ON wo.property_code = p.code
GROUP BY p.id, p.code, p.name, p.total_units;

-- Grant access to authenticated users
GRANT SELECT ON v_property_health_metrics TO authenticated;
GRANT SELECT ON v_property_health_metrics TO service_role;
