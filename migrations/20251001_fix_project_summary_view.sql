-- Fix project_summary view to include user_id and correct field names
-- This migration fixes the view to match the TypeScript types

-- Drop dependent views first
DROP VIEW IF EXISTS dashboard_stats CASCADE;

-- Drop the existing view
DROP VIEW IF EXISTS project_summary CASCADE;

-- Recreate project_summary with correct fields
CREATE OR REPLACE VIEW project_summary AS
SELECT
  p.id,
  p.user_id,
  p.title,
  p.total_budget,
  p.payment_type,
  p.created_at,
  p.updated_at,
  COALESCE(SUM(t.amount), 0) as total_received,
  p.total_budget - COALESCE(SUM(t.amount), 0) as remaining_amount,
  CASE
    WHEN p.total_budget > 0 THEN (COALESCE(SUM(t.amount), 0) / p.total_budget * 100)
    ELSE 0
  END as payment_progress,
  CASE
    WHEN p.total_budget > 0 AND COALESCE(SUM(t.amount), 0) >= p.total_budget THEN true
    ELSE false
  END as is_completed,
  COUNT(DISTINCT pi.id) as total_installments,
  COUNT(DISTINCT CASE WHEN pi.is_paid THEN pi.id END) as paid_installments,
  COUNT(DISTINCT CASE WHEN pi.due_date < CURRENT_DATE AND NOT pi.is_paid THEN pi.id END) as overdue_installments_count,
  COUNT(DISTINCT t.id) as transactions_count,
  MAX(t.transaction_date) as last_transaction_date
FROM projects p
LEFT JOIN transactions t ON p.id = t.project_id
LEFT JOIN payment_installments pi ON p.id = pi.project_id
GROUP BY p.id, p.user_id, p.title, p.total_budget, p.payment_type, p.created_at, p.updated_at;

-- Grant permissions
GRANT SELECT ON project_summary TO authenticated;

-- Add RLS policy for the view
ALTER VIEW project_summary SET (security_invoker = true);

-- Add helpful comment
COMMENT ON VIEW project_summary IS 'Provides comprehensive project information with calculated statistics including received amounts, completion percentage, and installment counts. Includes user_id for RLS filtering.';

-- Recreate dashboard_stats view (was dropped with CASCADE)
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  -- Project counts
  (SELECT COUNT(*) FROM projects) as total_projects_count,
  (SELECT COUNT(*) FROM projects WHERE created_at >= NOW() - INTERVAL '30 days') as active_projects_count,

  -- Budget sums
  COALESCE((SELECT SUM(total_budget) FROM projects), 0) as total_budget_sum,
  COALESCE((SELECT SUM(amount) FROM transactions), 0) as total_received_sum,
  COALESCE((SELECT SUM(total_budget) FROM projects), 0) - COALESCE((SELECT SUM(amount) FROM transactions), 0) as total_remaining_sum,

  -- Overdue installments count
  (SELECT COUNT(*) FROM payment_installments WHERE due_date < CURRENT_DATE AND is_paid = false) as overdue_installments_count;

-- Grant permissions for dashboard_stats
GRANT SELECT ON dashboard_stats TO authenticated;

-- Add helpful comment
COMMENT ON VIEW dashboard_stats IS 'Provides comprehensive dashboard statistics including project counts, budget sums, and overdue installments';
