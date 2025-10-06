-- Add user_id column to projects table and update RLS policies
-- This migration allows projects to be user-specific

-- Step 1: Add user_id column to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Step 3: Drop existing policies
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.projects;

-- Step 4: Create comprehensive RLS policies for projects

-- Allow users to view their own projects
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own projects
CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own projects
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own projects
CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Update policies for payment_installments
DROP POLICY IF EXISTS "Users can view installments for their projects" ON public.payment_installments;

CREATE POLICY "Users can view own installments"
  ON public.payment_installments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = payment_installments.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own installments"
  ON public.payment_installments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = payment_installments.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own installments"
  ON public.payment_installments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = payment_installments.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own installments"
  ON public.payment_installments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = payment_installments.project_id
    AND projects.user_id = auth.uid()
  ));

-- Step 6: Update policies for transactions
DROP POLICY IF EXISTS "Users can view transactions for their projects" ON public.transactions;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = transactions.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = transactions.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = transactions.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = transactions.project_id
    AND projects.user_id = auth.uid()
  ));

-- Step 7: Add comment
COMMENT ON COLUMN public.projects.user_id IS 'User who owns this project. Links to auth.users table.';
