-- Database Optimization Script for Budget Tracker
-- This script creates indexes, materialized views, and other database optimizations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_installments_project_id ON public.payment_installments(project_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON public.payment_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON public.payment_installments(status);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_project_date 
  ON public.transactions(project_id, transaction_date DESC);
  
CREATE INDEX IF NOT EXISTS idx_installments_project_number 
  ON public.payment_installments(project_id, installment_number);

-- Create partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_active_projects 
  ON public.projects(status) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_pending_installments 
  ON public.payment_installments(status, due_date) 
  WHERE status = 'pending';

-- Create materialized view for dashboard stats
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_dashboard_stats AS
SELECT 
  user_id,
  COUNT(DISTINCT p.id) as total_projects_count,
  COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects_count,
  COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_projects_count,
  COALESCE(SUM(p.total_budget), 0) as total_budget_sum,
  COALESCE(SUM(t.total_received), 0) as total_received_sum,
  COALESCE(SUM(p.total_budget), 0) - COALESCE(SUM(t.total_received), 0) as total_remaining_sum,
  COALESCE(SUM(pi.pending_amount), 0) as total_pending_amount,
  COALESCE(SUM(pi.overdue_amount), 0) as total_overdue_amount,
  NOW() as last_updated
FROM 
  public.users u
LEFT JOIN 
  public.projects p ON p.user_id = u.id
LEFT JOIN (
  SELECT 
    project_id, 
    SUM(amount) as total_received
  FROM 
    public.transactions
  WHERE 
    transaction_type = 'income'
  GROUP BY 
    project_id
) t ON p.id = t.project_id
LEFT JOIN (
  SELECT 
    project_id,
    SUM(amount) FILTER (WHERE status = 'pending') as pending_amount,
    SUM(amount) FILTER (WHERE status = 'overdue') as overdue_amount
  FROM 
    public.payment_installments
  GROUP BY 
    project_id
) pi ON p.id = pi.project_id
GROUP BY 
  user_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_user 
  ON mv_user_dashboard_stats(user_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_dashboard_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh materialized view when underlying data changes
DROP TRIGGER IF EXISTS refresh_dashboard_after_project ON public.projects;
CREATE TRIGGER refresh_dashboard_after_project
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH STATEMENT EXECUTE FUNCTION refresh_dashboard_stats();

DROP TRIGGER IF EXISTS refresh_dashboard_after_transaction ON public.transactions;
CREATE TRIGGER refresh_dashboard_after_transaction
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH STATEMENT EXECUTE FUNCTION refresh_dashboard_stats();

DROP TRIGGER IF EXISTS refresh_dashboard_after_installment ON public.payment_installments;
CREATE TRIGGER refresh_dashboard_after_installment
AFTER INSERT OR UPDATE OR DELETE ON public.payment_installments
FOR EACH STATEMENT EXECUTE FUNCTION refresh_dashboard_stats();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate project totals
CREATE OR REPLACE FUNCTION calculate_project_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update project total_received and remaining_amount when transactions change
  UPDATE public.projects p
  SET 
    total_received = COALESCE((
      SELECT SUM(amount) 
      FROM public.transactions t 
      WHERE t.project_id = COALESCE(NEW.project_id, OLD.project_id)
      AND t.transaction_type = 'income'
    ), 0),
    remaining_amount = total_budget - COALESCE((
      SELECT SUM(amount) 
      FROM public.transactions t 
      WHERE t.project_id = COALESCE(NEW.project_id, OLD.project_id)
      AND t.transaction_type = 'income'
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction changes
DROP TRIGGER IF EXISTS update_project_totals_after_transaction ON public.transactions;
CREATE TRIGGER update_project_totals_after_transaction
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION calculate_project_totals();

-- Create function to update project status based on payment installments
CREATE OR REPLACE FUNCTION update_project_status()
RETURNS TRIGGER AS $$
DECLARE
  project_status text;
  project_id_val uuid;
BEGIN
  -- Determine the project_id from the trigger
  project_id_val := COALESCE(NEW.project_id, OLD.project_id);
  
  -- Check if all installments are paid
  SELECT 
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.payment_installments WHERE project_id = project_id_val AND status != 'paid') 
      THEN 'completed' 
      ELSE 'active' 
    END
  INTO project_status;
  
  -- Update the project status
  UPDATE public.projects
  SET 
    status = project_status,
    updated_at = NOW()
  WHERE id = project_id_val;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment installment changes
DROP TRIGGER IF EXISTS update_project_status_after_installment ON public.payment_installments;
CREATE TRIGGER update_project_status_after_installment
AFTER INSERT OR UPDATE OR DELETE ON public.payment_installments
FOR EACH ROW EXECUTE FUNCTION update_project_status();

-- Create function to check for overdue installments
CREATE OR REPLACE FUNCTION check_overdue_installments()
RETURNS void AS $$
BEGIN
  -- Update status of overdue installments
  UPDATE public.payment_installments
  SET 
    status = 'overdue',
    updated_at = NOW()
  WHERE 
    status = 'pending' 
    AND due_date < CURRENT_DATE;
    
  -- Log the update
  INSERT INTO public.audit_log (action, table_name, record_id, user_id, details)
  SELECT 
    'AUTO_UPDATE', 
    'payment_installments', 
    id, 
    (SELECT user_id FROM public.projects WHERE id = project_id),
    jsonb_build_object('old_status', 'pending', 'new_status', 'overdue')
  FROM 
    public.payment_installments
  WHERE 
    status = 'overdue' 
    AND updated_at = NOW();
    
  -- Notify users about overdue payments (implementation depends on your notification system)
  -- This is a placeholder for the notification logic
  -- INSERT INTO notifications (user_id, type, message, metadata)
  -- SELECT 
  --   p.user_id,
  --   'payment_overdue',
  --   'You have overdue payments for project: ' || p.name,
  --   jsonb_build_object('project_id', p.id, 'installment_ids', array_agg(pi.id))
  -- FROM 
  --   public.payment_installments pi
  -- JOIN 
  --   public.projects p ON pi.project_id = p.id
  -- WHERE 
  --   pi.status = 'overdue' 
  --   AND pi.updated_at = NOW()
  -- GROUP BY 
  --   p.user_id, p.id, p.name;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.audit_log
  WHERE created_at < (NOW() - INTERVAL '90 days');
  
  -- Vacuum to reclaim space (run with caution in production)
  -- VACUUM ANALYZE public.audit_log;
END;
$$ LANGUAGE plpgsql;

-- Create a function to optimize the database
CREATE OR REPLACE FUNCTION optimize_database()
RETURNS void AS $$
BEGIN
  -- Refresh materialized views
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_dashboard_stats;
  
  -- Update statistics
  ANALYZE;
  
  -- Log the optimization
  INSERT INTO public.audit_log (action, table_name, details)
  VALUES ('SYSTEM', 'database', 'Database optimization completed');
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the optimization (requires pg_cron extension)
-- Uncomment and adjust if pg_cron is installed
-- SELECT cron.schedule('0 3 * * *', 'SELECT optimize_database()');
-- SELECT cron.schedule('0 4 * * *', 'SELECT cleanup_old_audit_logs()');
-- SELECT cron.schedule('0 9 * * *', 'SELECT check_overdue_installments()');

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Add comments to tables and columns for better documentation
COMMENT ON TABLE public.projects IS 'Stores project information including budget and status';
COMMENT ON COLUMN public.projects.total_budget IS 'Total budget allocated for the project';
COMMENT ON COLUMN public.projects.total_received IS 'Total amount received for the project';
COMMENT ON COLUMN public.projects.remaining_amount IS 'Remaining amount to be received for the project';

-- Create a view for financial reports
CREATE OR REPLACE VIEW public.financial_reports AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.status as project_status,
  p.total_budget,
  p.total_received,
  p.remaining_amount,
  p.start_date,
  p.end_date,
  COUNT(DISTINCT pi.id) as total_installments,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.status = 'paid') as paid_installments,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.status = 'pending') as pending_installments,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.status = 'overdue') as overdue_installments,
  COALESCE(SUM(pi.amount) FILTER (WHERE pi.status = 'paid'), 0) as total_paid,
  COALESCE(SUM(pi.amount) FILTER (WHERE pi.status = 'pending'), 0) as total_pending,
  COALESCE(SUM(pi.amount) FILTER (WHERE pi.status = 'overdue'), 0) as total_overdue
FROM 
  public.projects p
LEFT JOIN 
  public.payment_installments pi ON p.id = pi.project_id
GROUP BY 
  p.id;

-- Create a view for transaction history
CREATE OR REPLACE VIEW public.transaction_history AS
SELECT 
  t.id,
  t.project_id,
  p.name as project_name,
  t.transaction_date,
  t.amount,
  t.transaction_type,
  t.description,
  t.payment_method,
  t.reference_number,
  t.status,
  t.created_at,
  t.updated_at,
  u.id as user_id,
  u.email as user_email
FROM 
  public.transactions t
JOIN 
  public.projects p ON t.project_id = p.id
JOIN 
  public.users u ON t.user_id = u.id;

-- Create a view for upcoming payments
CREATE OR REPLACE VIEW public.upcoming_payments AS
SELECT 
  pi.id,
  pi.project_id,
  p.name as project_name,
  pi.installment_number,
  pi.amount,
  pi.due_date,
  pi.status,
  p.user_id,
  u.email as user_email,
  p.total_budget,
  p.total_received,
  p.remaining_amount,
  CASE 
    WHEN pi.status = 'overdue' THEN 'Overdue by ' || (CURRENT_DATE - pi.due_date)::text || ' days'
    WHEN pi.status = 'pending' AND pi.due_date <= (CURRENT_DATE + INTERVAL '7 days') 
      THEN 'Due in ' || (pi.due_date - CURRENT_DATE)::text || ' days'
    ELSE NULL
  END as payment_status
FROM 
  public.payment_installments pi
JOIN 
  public.projects p ON pi.project_id = p.id
JOIN 
  public.users u ON p.user_id = u.id
WHERE 
  pi.status IN ('pending', 'overdue')
ORDER BY 
  pi.due_date ASC;

-- Create a function to get project financial summary
CREATE OR REPLACE FUNCTION get_project_financial_summary(project_id_param uuid)
RETURNS TABLE(
  project_id uuid,
  project_name text,
  total_budget numeric,
  total_received numeric,
  remaining_amount numeric,
  total_installments bigint,
  paid_installments bigint,
  pending_installments bigint,
  overdue_installments bigint,
  total_paid numeric,
  total_pending numeric,
  total_overdue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    p.name as project_name,
    p.total_budget,
    p.total_received,
    p.remaining_amount,
    COUNT(DISTINCT pi.id) as total_installments,
    COUNT(DISTINCT pi.id) FILTER (WHERE pi.status = 'paid') as paid_installments,
    COUNT(DISTINCT pi.id) FILTER (WHERE pi.status = 'pending') as pending_installments,
    COUNT(DISTINCT pi.id) FILTER (WHERE pi.status = 'overdue') as overdue_installments,
    COALESCE(SUM(pi.amount) FILTER (WHERE pi.status = 'paid'), 0) as total_paid,
    COALESCE(SUM(pi.amount) FILTER (WHERE pi.status = 'pending'), 0) as total_pending,
    COALESCE(SUM(pi.amount) FILTER (WHERE pi.status = 'overdue'), 0) as total_overdue
  FROM 
    public.projects p
  LEFT JOIN 
    public.payment_installments pi ON p.id = pi.project_id
  WHERE 
    p.id = project_id_param
  GROUP BY 
    p.id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a function to get user dashboard statistics
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_id_param uuid)
RETURNS TABLE(
  total_projects bigint,
  active_projects bigint,
  completed_projects bigint,
  total_budget numeric,
  total_received numeric,
  total_remaining numeric,
  total_pending_amount numeric,
  total_overdue_amount numeric,
  recent_transactions json,
  upcoming_payments json
) AS $$
BEGIN
  -- Get basic stats
  RETURN QUERY
  SELECT 
    COALESCE((SELECT total_projects_count FROM mv_user_dashboard_stats WHERE user_id = user_id_param), 0)::bigint as total_projects,
    COALESCE((SELECT active_projects_count FROM mv_user_dashboard_stats WHERE user_id = user_id_param), 0)::bigint as active_projects,
    COALESCE((SELECT completed_projects_count FROM mv_user_dashboard_stats WHERE user_id = user_id_param), 0)::bigint as completed_projects,
    COALESCE((SELECT total_budget_sum FROM mv_user_dashboard_stats WHERE user_id = user_id_param), 0) as total_budget,
    COALESCE((SELECT total_received_sum FROM mv_user_dashboard_stats WHERE user_id = user_id_param), 0) as total_received,
    COALESCE((SELECT total_remaining_sum FROM mv_user_dashboard_stats WHERE user_id = user_id_param), 0) as total_remaining,
    COALESCE((SELECT total_pending_amount FROM mv_user_dashboard_stats WHERE user_id = user_id_param), 0) as total_pending_amount,
    COALESCE((SELECT total_overdue_amount FROM mv_user_dashboard_stats WHERE user_id = user_id_param), 0) as total_overdue_amount,
    
    -- Recent transactions as JSON
    (
      SELECT json_agg(
        json_build_object(
          'id', t.id,
          'project_id', t.project_id,
          'project_name', p.name,
          'transaction_date', t.transaction_date,
          'amount', t.amount,
          'transaction_type', t.transaction_type,
          'description', t.description,
          'status', t.status
        )
        ORDER BY t.transaction_date DESC
        LIMIT 5
      )
      FROM public.transactions t
      JOIN public.projects p ON t.project_id = p.id
      WHERE p.user_id = user_id_param
    ) as recent_transactions,
    
    -- Upcoming payments as JSON
    (
      SELECT json_agg(
        json_build_object(
          'id', pi.id,
          'project_id', pi.project_id,
          'project_name', p.name,
          'installment_number', pi.installment_number,
          'amount', pi.amount,
          'due_date', pi.due_date,
          'status', pi.status,
          'days_until_due', (pi.due_date - CURRENT_DATE)
        )
        WHERE pi.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
        AND pi.status IN ('pending', 'overdue')
        ORDER BY pi.due_date ASC
        LIMIT 5
      )
      FROM public.payment_installments pi
      JOIN public.projects p ON pi.project_id = p.id
      WHERE p.user_id = user_id_param
    ) as upcoming_payments;
END;
$$ LANGUAGE plpgsql STABLE;
