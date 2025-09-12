-- =====================================================
-- BUDGET TRACKER DATABASE SCHEMA
-- Complete SQL migration script for Supabase
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MAIN TABLES
-- =====================================================

-- Projects table: Core project information
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL CHECK (LENGTH(title) >= 3),
    total_budget DECIMAL(12,2) NOT NULL CHECK (total_budget > 0),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('single', 'installment')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add table and column comments
COMMENT ON TABLE projects IS 'Core project information with budget and payment type';
COMMENT ON COLUMN projects.title IS 'Project name, minimum 3 characters required';
COMMENT ON COLUMN projects.total_budget IS 'Total project value in decimal format';
COMMENT ON COLUMN projects.payment_type IS 'Payment structure: single or installment';

-- Payment installments table: Breakdown of installment payments
CREATE TABLE payment_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL CHECK (installment_number > 0),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique installment numbers per project
    CONSTRAINT unique_project_installment UNIQUE (project_id, installment_number)
);

-- Add table and column comments
COMMENT ON TABLE payment_installments IS 'Individual installment breakdown for projects with installment payment type';
COMMENT ON COLUMN payment_installments.installment_number IS 'Sequential installment number (1, 2, 3...)';
COMMENT ON COLUMN payment_installments.amount IS 'Individual installment amount';
COMMENT ON COLUMN payment_installments.due_date IS 'Expected payment date for this installment';
COMMENT ON COLUMN payment_installments.is_paid IS 'Quick status flag for payment completion';

-- Transactions table: All payment records
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES payment_installments(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add table and column comments
COMMENT ON TABLE transactions IS 'All payment transactions linked to projects and optionally to specific installments';
COMMENT ON COLUMN transactions.installment_id IS 'Optional link to specific installment (NULL for single payments)';
COMMENT ON COLUMN transactions.amount IS 'Payment amount received';
COMMENT ON COLUMN transactions.transaction_date IS 'Date when payment was received';
COMMENT ON COLUMN transactions.notes IS 'Optional notes about the transaction';

-- =====================================================
-- HELPFUL VIEWS
-- =====================================================

-- Project summary view: Projects with calculated payment status
CREATE VIEW project_summary AS
SELECT 
    p.*,
    COALESCE(SUM(t.amount), 0) as total_received,
    (p.total_budget - COALESCE(SUM(t.amount), 0)) as remaining_amount,
    CASE 
        WHEN p.total_budget = 0 THEN 0
        ELSE ROUND((COALESCE(SUM(t.amount), 0) / p.total_budget * 100), 2)
    END as payment_progress,
    (COALESCE(SUM(t.amount), 0) >= p.total_budget) as is_completed
FROM projects p
LEFT JOIN transactions t ON p.id = t.project_id
GROUP BY p.id, p.title, p.total_budget, p.payment_type, p.created_at, p.updated_at;

COMMENT ON VIEW project_summary IS 'Projects with calculated payment status and progress';

-- Installment summary view: Installments with payment status
CREATE VIEW installment_summary AS
SELECT 
    pi.*,
    COALESCE(SUM(t.amount), 0) as paid_amount,
    (pi.amount - COALESCE(SUM(t.amount), 0)) as remaining_amount,
    (COALESCE(SUM(t.amount), 0) >= pi.amount) as is_fully_paid,
    (pi.due_date < CURRENT_DATE AND COALESCE(SUM(t.amount), 0) < pi.amount) as is_overdue,
    (pi.due_date - CURRENT_DATE) as days_until_due
FROM payment_installments pi
LEFT JOIN transactions t ON pi.id = t.installment_id
GROUP BY pi.id, pi.project_id, pi.installment_number, pi.amount, pi.due_date, pi.is_paid, pi.created_at;

COMMENT ON VIEW installment_summary IS 'Installments with detailed payment status and due date information';

-- Dashboard statistics view: Platform-wide metrics
CREATE VIEW dashboard_stats AS
SELECT 
    COUNT(*) as total_projects_count,
    COUNT(*) FILTER (WHERE ps.remaining_amount > 0) as active_projects_count,
    COALESCE(SUM(ps.total_budget), 0) as total_budget_sum,
    COALESCE(SUM(ps.total_received), 0) as total_received_sum,
    COALESCE(SUM(ps.remaining_amount), 0) as total_remaining_sum,
    COUNT(*) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM installment_summary is2 
            WHERE is2.project_id IN (SELECT id FROM projects) 
            AND is2.is_overdue = true
        )
    ) as overdue_installments_count
FROM project_summary ps;

COMMENT ON VIEW dashboard_stats IS 'Platform-wide statistics for dashboard display';

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =====================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to projects table
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes on foreign keys
CREATE INDEX idx_payment_installments_project_id ON payment_installments(project_id);
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_transactions_installment_id ON transactions(installment_id) WHERE installment_id IS NOT NULL;

-- Indexes on frequently queried columns
CREATE INDEX idx_payment_installments_due_date ON payment_installments(due_date);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_projects_payment_type ON projects(payment_type);

-- Composite indexes for common queries
CREATE INDEX idx_installments_project_overdue ON payment_installments(project_id, due_date, is_paid);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for authenticated users
-- Note: Adjust these policies based on your specific authentication strategy

CREATE POLICY "Enable all operations for authenticated users" ON projects
    FOR ALL USING (auth.role() = 'authenticated');
    
CREATE POLICY "Enable all operations for authenticated users" ON payment_installments
    FOR ALL USING (auth.role() = 'authenticated');
    
CREATE POLICY "Enable all operations for authenticated users" ON transactions
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get remaining balance for a project
CREATE OR REPLACE FUNCTION get_project_balance(project_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    balance DECIMAL(12,2);
BEGIN
    SELECT remaining_amount INTO balance
    FROM project_summary
    WHERE id = project_uuid;
    
    RETURN COALESCE(balance, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_project_balance(UUID) IS 'Returns the remaining balance for a specific project';

-- Function to check if installments sum equals project budget
CREATE OR REPLACE FUNCTION check_installment_sum(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    project_budget DECIMAL(12,2);
    installments_sum DECIMAL(12,2);
BEGIN
    -- Get project budget
    SELECT total_budget INTO project_budget
    FROM projects
    WHERE id = project_uuid;
    
    -- Get sum of installments
    SELECT COALESCE(SUM(amount), 0) INTO installments_sum
    FROM payment_installments
    WHERE project_id = project_uuid;
    
    -- Return true if they match
    RETURN (project_budget = installments_sum);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_installment_sum(UUID) IS 'Checks if the sum of installments equals the project budget';

-- Function to automatically update installment paid status
CREATE OR REPLACE FUNCTION update_installment_paid_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the is_paid status for the related installment
    IF NEW.installment_id IS NOT NULL THEN
        UPDATE payment_installments
        SET is_paid = (
            SELECT COALESCE(SUM(amount), 0) >= payment_installments.amount
            FROM transactions
            WHERE installment_id = NEW.installment_id
        )
        WHERE id = NEW.installment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update installment status when transactions are added
CREATE TRIGGER update_installment_status_trigger
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_installment_paid_status();

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample projects
INSERT INTO projects (title, total_budget, payment_type) VALUES
    ('Website Development Project', 5000.00, 'installment'),
    ('Logo Design', 500.00, 'single'),
    ('Mobile App Development', 12000.00, 'installment');

-- Get the project IDs for installments
DO $$
DECLARE
    website_id UUID;
    mobile_app_id UUID;
BEGIN
    -- Get project IDs
    SELECT id INTO website_id FROM projects WHERE title = 'Website Development Project';
    SELECT id INTO mobile_app_id FROM projects WHERE title = 'Mobile App Development';
    
    -- Insert installments for website project
    INSERT INTO payment_installments (project_id, installment_number, amount, due_date) VALUES
        (website_id, 1, 2000.00, CURRENT_DATE + INTERVAL '30 days'),
        (website_id, 2, 2000.00, CURRENT_DATE + INTERVAL '60 days'),
        (website_id, 3, 1000.00, CURRENT_DATE + INTERVAL '90 days');
    
    -- Insert installments for mobile app project
    INSERT INTO payment_installments (project_id, installment_number, amount, due_date) VALUES
        (mobile_app_id, 1, 4000.00, CURRENT_DATE + INTERVAL '15 days'),
        (mobile_app_id, 2, 4000.00, CURRENT_DATE + INTERVAL '45 days'),
        (mobile_app_id, 3, 4000.00, CURRENT_DATE + INTERVAL '75 days');
    
    -- Insert some sample transactions
    INSERT INTO transactions (project_id, installment_id, amount, transaction_date, notes) 
    SELECT 
        website_id,
        pi.id,
        1000.00,
        CURRENT_DATE - INTERVAL '5 days',
        'Partial payment for first installment'
    FROM payment_installments pi 
    WHERE pi.project_id = website_id AND pi.installment_number = 1;
    
    -- Full payment for logo design
    INSERT INTO transactions (project_id, amount, transaction_date, notes)
    SELECT id, 500.00, CURRENT_DATE, 'Full payment received'
    FROM projects WHERE title = 'Logo Design';
END $$;

-- =====================================================
-- VERIFICATION QUERIES (OPTIONAL)
-- =====================================================

-- These queries can be run to verify the schema is working correctly:

/*
-- Check project summaries
SELECT * FROM project_summary ORDER BY created_at;

-- Check installment summaries
SELECT * FROM installment_summary ORDER BY project_id, installment_number;

-- Check dashboard stats
SELECT * FROM dashboard_stats;

-- Test helper functions
SELECT get_project_balance(id) as balance FROM projects LIMIT 1;
SELECT check_installment_sum(id) as installments_match FROM projects WHERE payment_type = 'installment' LIMIT 1;
*/

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Budget Tracker schema created successfully!';
    RAISE NOTICE 'Tables created: projects, payment_installments, transactions';
    RAISE NOTICE 'Views created: project_summary, installment_summary, dashboard_stats';
    RAISE NOTICE 'Helper functions and triggers are active';
    RAISE NOTICE 'Sample data has been inserted for testing';
END $$;