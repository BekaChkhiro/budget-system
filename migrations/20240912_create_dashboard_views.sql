-- Migration: Create Dashboard Views and Functions
-- Date: 2024-09-12
-- Description: Creates necessary views and functions for dashboard statistics

-- Create dashboard_stats view for comprehensive statistics
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

-- Create project_summary view for project overview
CREATE OR REPLACE VIEW project_summary AS
SELECT 
  p.id,
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
  END as completion_percentage,
  COUNT(pi.id) as total_installments,
  COUNT(CASE WHEN pi.is_paid THEN 1 END) as paid_installments,
  COUNT(CASE WHEN pi.due_date < CURRENT_DATE AND NOT pi.is_paid THEN 1 END) as overdue_installments
FROM projects p
LEFT JOIN transactions t ON p.id = t.project_id
LEFT JOIN payment_installments pi ON p.id = pi.project_id
GROUP BY p.id, p.title, p.total_budget, p.payment_type, p.created_at, p.updated_at;

-- Create installment_summary view for installment details
CREATE OR REPLACE VIEW installment_summary AS
SELECT 
  pi.id,
  pi.project_id,
  pi.amount,
  pi.due_date,
  pi.is_paid,
  pi.paid_at,
  pi.created_at,
  pi.updated_at,
  CASE WHEN pi.due_date < CURRENT_DATE AND NOT pi.is_paid THEN true ELSE false END as is_overdue,
  COALESCE(SUM(t.amount), 0) as paid_amount,
  pi.amount - COALESCE(SUM(t.amount), 0) as remaining_amount,
  ROW_NUMBER() OVER (PARTITION BY pi.project_id ORDER BY pi.due_date) as installment_number
FROM payment_installments pi
LEFT JOIN transactions t ON pi.id = t.installment_id
GROUP BY pi.id, pi.project_id, pi.amount, pi.due_date, pi.is_paid, pi.paid_at, pi.created_at, pi.updated_at;

-- Grant necessary permissions for the views
GRANT SELECT ON dashboard_stats TO authenticated;
GRANT SELECT ON project_summary TO authenticated;
GRANT SELECT ON installment_summary TO authenticated;

-- Create RLS policies for the views (if needed)
-- Note: Views inherit RLS from underlying tables, but we can add explicit policies if needed

-- Add helpful comments
COMMENT ON VIEW dashboard_stats IS 'Provides comprehensive dashboard statistics including project counts, budget sums, and overdue installments';
COMMENT ON VIEW project_summary IS 'Provides detailed project information with calculated fields for completion percentage and installment status';
COMMENT ON VIEW installment_summary IS 'Provides detailed installment information with overdue status and payment tracking';
