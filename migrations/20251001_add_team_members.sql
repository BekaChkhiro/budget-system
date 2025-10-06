-- Migration: Add team members and project team associations
-- Date: 2025-10-01

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(100), -- e.g., "დეველოპერი", "დიზაინერი", "პროექტ მენეჯერი"
  hourly_rate DECIMAL(10, 2), -- საათობრივი განაკვეთი
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[], -- მასივი სკილებისთვის
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create project_team_members junction table (many-to-many)
CREATE TABLE IF NOT EXISTS project_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  role_in_project VARCHAR(100), -- როლი კონკრეტულ პროექტში
  UNIQUE(project_id, team_member_id) -- თითო წევრი მხოლოდ ერთხელ უნდა იყოს პროექტში
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team_member_id ON project_team_members(team_member_id);

-- Create view for team member statistics
CREATE OR REPLACE VIEW team_member_stats AS
SELECT
  tm.id,
  tm.user_id,
  tm.name,
  tm.email,
  tm.phone,
  tm.role,
  tm.hourly_rate,
  tm.avatar_url,
  tm.bio,
  tm.skills,
  tm.is_active,
  tm.created_at,
  tm.updated_at,
  COUNT(DISTINCT ptm.project_id) as total_projects,
  COUNT(DISTINCT CASE WHEN ps.is_completed = true THEN ps.id END) as completed_projects,
  COUNT(DISTINCT CASE WHEN ps.is_completed = false THEN ps.id END) as active_projects,
  COALESCE(SUM(CASE WHEN ps.is_completed = true THEN ps.total_budget END), 0) as total_completed_budget,
  COALESCE(SUM(CASE WHEN ps.is_completed = false THEN ps.total_budget END), 0) as total_active_budget
FROM team_members tm
LEFT JOIN project_team_members ptm ON tm.id = ptm.team_member_id
LEFT JOIN project_summary ps ON ptm.project_id = ps.id
GROUP BY tm.id;

-- Create view for team member analytics with time periods
CREATE OR REPLACE VIEW team_member_analytics AS
SELECT
  tm.id as team_member_id,
  tm.name,
  tm.role,
  -- Last month
  COUNT(DISTINCT CASE
    WHEN ps.is_completed = true
    AND ps.updated_at >= CURRENT_DATE - INTERVAL '1 month'
    THEN ps.id
  END) as completed_projects_last_month,
  COALESCE(SUM(CASE
    WHEN ps.is_completed = true
    AND ps.updated_at >= CURRENT_DATE - INTERVAL '1 month'
    THEN ps.total_budget
  END), 0) as revenue_last_month,

  -- Last 3 months
  COUNT(DISTINCT CASE
    WHEN ps.is_completed = true
    AND ps.updated_at >= CURRENT_DATE - INTERVAL '3 months'
    THEN ps.id
  END) as completed_projects_last_3_months,
  COALESCE(SUM(CASE
    WHEN ps.is_completed = true
    AND ps.updated_at >= CURRENT_DATE - INTERVAL '3 months'
    THEN ps.total_budget
  END), 0) as revenue_last_3_months,

  -- Last 6 months
  COUNT(DISTINCT CASE
    WHEN ps.is_completed = true
    AND ps.updated_at >= CURRENT_DATE - INTERVAL '6 months'
    THEN ps.id
  END) as completed_projects_last_6_months,
  COALESCE(SUM(CASE
    WHEN ps.is_completed = true
    AND ps.updated_at >= CURRENT_DATE - INTERVAL '6 months'
    THEN ps.total_budget
  END), 0) as revenue_last_6_months,

  -- Last year
  COUNT(DISTINCT CASE
    WHEN ps.is_completed = true
    AND ps.updated_at >= CURRENT_DATE - INTERVAL '1 year'
    THEN ps.id
  END) as completed_projects_last_year,
  COALESCE(SUM(CASE
    WHEN ps.is_completed = true
    AND ps.updated_at >= CURRENT_DATE - INTERVAL '1 year'
    THEN ps.total_budget
  END), 0) as revenue_last_year,

  -- All time
  COUNT(DISTINCT CASE WHEN ps.is_completed = true THEN ps.id END) as total_completed_projects,
  COALESCE(SUM(CASE WHEN ps.is_completed = true THEN ps.total_budget END), 0) as total_revenue
FROM team_members tm
LEFT JOIN project_team_members ptm ON tm.id = ptm.team_member_id
LEFT JOIN project_summary ps ON ptm.project_id = ps.id
GROUP BY tm.id, tm.name, tm.role;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_member_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_member_updated_at();

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members
CREATE POLICY "Users can view their own team members"
  ON team_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own team members"
  ON team_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own team members"
  ON team_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own team members"
  ON team_members FOR DELETE
  USING (user_id = auth.uid());

-- Create policies for project_team_members
CREATE POLICY "Users can view team members in their projects"
  ON project_team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_team_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add team members to their projects"
  ON project_team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_team_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update team members in their projects"
  ON project_team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_team_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove team members from their projects"
  ON project_team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_team_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON project_team_members TO authenticated;
GRANT SELECT ON team_member_stats TO authenticated;
GRANT SELECT ON team_member_analytics TO authenticated;
