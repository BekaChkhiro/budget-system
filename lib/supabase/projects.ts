import { createClient } from '@/lib/supabase/client'
import type {
  Project,
  ProjectWithStats,
  ProjectSummary,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilters,
  PaginatedResponse,
  DashboardStats,
} from '@/types'
import {
  withErrorHandling,
  handleSupabaseError,
  handleBusinessError,
  validateRequired,
  validatePositiveNumber,
  validateDate,
} from '@/lib/utils/error-handling'

// =====================================================
// PROJECT QUERIES
// =====================================================

/**
 * Get all projects with statistics from the project_summary view
 * @param filters - Optional filters for projects
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Paginated projects with statistics
 */
export async function getProjects(
  filters?: ProjectFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<ProjectWithStats>> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    let query = supabase
      .from('project_summary')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (filters?.payment_type) {
      query = query.eq('payment_type', filters.payment_type)
    }
    
    if (filters?.is_completed !== undefined) {
      query = query.eq('is_completed', filters.is_completed)
    }
    
    if (filters?.min_budget) {
      query = query.gte('total_budget', filters.min_budget)
    }
    
    if (filters?.max_budget) {
      query = query.lte('total_budget', filters.max_budget)
    }
    
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }
    
    // Apply sorting
    const sortBy = filters?.sort_by || 'created_at'
    const sortOrder = filters?.sort_order || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      handleSupabaseError(error, 'პროექტების ჩატვირთვა ვერ მოხერხდა')
    }
    
    const totalPages = Math.ceil((count || 0) / pageSize)
    
    return {
      data: data as ProjectWithStats[],
      pagination: {
        page,
        per_page: pageSize,
        total_count: count || 0,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1,
      },
    }
  }, 'პროექტების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get a single project by ID with complete information
 * @param id - Project ID
 * @returns Project with statistics and related data
 */
export async function getProjectById(id: string): Promise<ProjectWithStats> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])
    
    const supabase = createClient()
    
    // Get project with statistics
    const { data: project, error: projectError } = await supabase
      .from('project_summary')
      .select('*')
      .eq('id', id)
      .single()
    
    if (projectError) {
      if (projectError.code === 'PGRST116') {
        handleSupabaseError(projectError, 'პროექტი ვერ მოიძებნა')
      }
      handleSupabaseError(projectError, 'პროექტის ჩატვირთვა ვერ მოხერხდა')
    }
    
    let installments: any[] = []
    let transactions: any[] = []
    
    // Fetch installments if it's an installment project
    if (project.payment_type === 'installment') {
      const { data: installmentsData, error: installmentsError } = await supabase
        .from('installment_summary')
        .select('*')
        .eq('project_id', id)
        .order('installment_number')
      
      if (installmentsError) {
        console.warn('Error fetching installments:', installmentsError)
      } else {
        installments = installmentsData || []
      }
    }
    
    // Fetch recent transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*, installment:payment_installments(*)')
      .eq('project_id', id)
      .order('transaction_date', { ascending: false })
      .limit(10)
    
    if (transactionsError) {
      console.warn('Error fetching transactions:', transactionsError)
    } else {
      transactions = transactionsData || []
    }
    
    return {
      ...project,
      installments,
      transactions,
      transactions_count: transactions.length,
      last_transaction_date: transactions[0]?.transaction_date || null,
      overdue_installments_count: installments.filter(i => i.is_overdue).length,
    } as ProjectWithStats
  }, 'პროექტის ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Check if project exists by ID
 * @param id - Project ID
 * @returns Whether project exists
 */
export async function projectExists(id: string): Promise<boolean> {
  return withErrorHandling(async () => {
    const supabase = createClient()

    // Get current user to filter by user_id
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return false
    }

    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error)
    }

    return !!data
  }, 'პროექტის შემოწმება ვერ მოხერხდა')
}

// =====================================================
// PROJECT MUTATIONS
// =====================================================

/**
 * Create a new project with optional installments
 * @param input - Project creation input
 * @returns Created project
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  return withErrorHandling(async () => {
    // Validate input
    validateRequired(input, ['title', 'total_budget', 'payment_type'])
    validatePositiveNumber(input.total_budget, 'ბიუჯეტი')
    
    if (input.title.length < 3) {
      handleBusinessError('INVALID_INPUT', 'პროექტის სახელი მინიმუმ 3 სიმბოლო უნდა იყოს')
    }
    
    if (input.payment_type === 'installment') {
      if (!input.installments || input.installments.length === 0) {
        handleBusinessError('INVALID_PAYMENT_TYPE', 'განვადებისთვის მინიმუმ ერთი განვადება აუცილებელია')
      }
      
      // Validate installments sum equals total budget
      const installmentsSum = input.installments.reduce((sum, inst) => sum + inst.amount, 0)
      if (Math.abs(installmentsSum - input.total_budget) > 0.01) {
        handleBusinessError('INSTALLMENT_MISMATCH')
      }
      
      // Validate installment dates are in chronological order
      for (let i = 1; i < input.installments.length; i++) {
        const prevDate = new Date(input.installments[i - 1].due_date)
        const currDate = new Date(input.installments[i].due_date)
        
        if (currDate <= prevDate) {
          handleBusinessError('INVALID_DATE_RANGE', 'განვადების თარიღები ქრონოლოგიური თანმიმდევრობით უნდა იყოს')
        }
      }
      
      // Validate all installment dates and amounts
      input.installments.forEach((installment, index) => {
        validatePositiveNumber(installment.amount, `განვადება ${index + 1}`)
        validateDate(installment.due_date, `განვადების თარიღი ${index + 1}`, false, true)
      })
    }
    
    const supabase = createClient()
    
    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: input.title.trim(),
        total_budget: input.total_budget,
        payment_type: input.payment_type,
      })
      .select()
      .single()
    
    if (projectError) {
      handleSupabaseError(projectError, 'პროექტის შექმნა ვერ მოხერხდა')
    }
    
    // Create installments if needed
    if (input.payment_type === 'installment' && input.installments) {
      const installmentsData = input.installments.map((inst, index) => ({
        project_id: project.id,
        installment_number: index + 1,
        amount: inst.amount,
        due_date: inst.due_date,
      }))
      
      const { error: installmentsError } = await supabase
        .from('payment_installments')
        .insert(installmentsData)
      
      if (installmentsError) {
        // Rollback by deleting the project
        await supabase.from('projects').delete().eq('id', project.id)
        handleSupabaseError(installmentsError, 'განვადების შექმნა ვერ მოხერხდა')
      }
    }
    
    return project as Project
  }, 'პროექტის შექმნა ვერ მოხერხდა')
}

/**
 * Update an existing project
 * @param id - Project ID
 * @param input - Project update input
 * @returns Updated project
 */
export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('ავტორიზაცია საჭიროა')
    }

    // Check if project exists
    const exists = await projectExists(id)
    if (!exists) {
      handleBusinessError('RESOURCE_NOT_FOUND', 'პროექტი ვერ მოიძებნა')
    }

    // Validate input if provided
    if (input.title !== undefined && input.title.length < 3) {
      handleBusinessError('INVALID_INPUT', 'პროექტის სახელი მინიმუმ 3 სიმბოლო უნდა იყოს')
    }

    if (input.total_budget !== undefined) {
      validatePositiveNumber(input.total_budget, 'ბიუჯეტი')
    }

    // Check if project has transactions before allowing budget change
    if (input.total_budget !== undefined) {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('project_id', id)
        .limit(1)

      if (transactions && transactions.length > 0) {
        handleBusinessError('PROJECT_HAS_TRANSACTIONS', 'ტრანზაქციების არსებობისას ბიუჯეტის შეცვლა შეუძლებელია')
      }
    }

    const updateData: Record<string, unknown> = {}

    if (input.title !== undefined) {
      updateData.title = input.title.trim()
    }

    if (input.total_budget !== undefined) {
      updateData.total_budget = input.total_budget
    }

    if (input.payment_type !== undefined) {
      updateData.payment_type = input.payment_type
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) {
      handleSupabaseError(error, 'პროექტის განახლება ვერ მოხერხდა')
    }
    
    return project as Project
  }, 'პროექტის განახლება ვერ მოხერხდა')
}

/**
 * Delete a project and all related data
 * @param id - Project ID
 */
export async function deleteProject(id: string): Promise<void> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('ავტორიზაცია საჭიროა')
    }

    // Check if project exists
    const exists = await projectExists(id)
    if (!exists) {
      handleBusinessError('RESOURCE_NOT_FOUND', 'პროექტი ვერ მოიძებნა')
    }

    // Delete project (cascade will handle related data)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) {
      handleSupabaseError(error, 'პროექტის წაშლა ვერ მოხერხდა')
    }
  }, 'პროექტის წაშლა ვერ მოხერხდა')
}

// =====================================================
// PROJECT STATISTICS
// =====================================================

/**
 * Get dashboard statistics
 * @returns Dashboard statistics
 */
export async function getProjectStats(): Promise<DashboardStats> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .single()
    
    if (error) {
      handleSupabaseError(error, 'სტატისტიკის ჩატვირთვა ვერ მოხერხდა')
    }
    
    return data as DashboardStats
  }, 'სტატისტიკის ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get project progress analytics
 * @param id - Project ID
 * @returns Project analytics data
 */
export async function getProjectAnalytics(id: string) {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])
    
    const supabase = createClient()
    
    // Get monthly payment trends (using available RPC function)
    const { data: monthlyData, error: monthlyError } = await supabase.rpc('get_project_balance', {
      project_uuid: id
    })
    
    if (monthlyError) {
      console.warn('Error fetching monthly data:', monthlyError)
    }
    
    // Get payment timeline
    const { data: timelineData, error: timelineError } = await supabase
      .from('transactions')
      .select('transaction_date, amount, notes')
      .eq('project_id', id)
      .order('transaction_date')
    
    if (timelineError) {
      console.warn('Error fetching timeline data:', timelineError)
    }
    
    // Calculate cumulative amounts for timeline
    let cumulativeAmount = 0
    const timeline = (timelineData || []).map(transaction => {
      cumulativeAmount += transaction.amount
      return {
        date: transaction.transaction_date,
        amount: transaction.amount,
        cumulative_amount: cumulativeAmount,
        notes: transaction.notes || undefined,
      }
    })
    
    // The RPC function returns a different format, so we need to adapt
    const monthlyPayments = Array.isArray(monthlyData) ? monthlyData : []
    
    return {
      monthly_payments: monthlyPayments.map((item: any) => ({
        month: item.month || '',
        amount: item.amount || 0,
        transactions_count: item.count || 0,
      })),
      payment_timeline: timeline,
    }
  }, 'ანალიტიკის ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get projects summary for dashboard
 * @param limit - Number of recent projects to fetch
 * @returns Recent projects with key metrics
 */
export async function getRecentProjects(limit = 5): Promise<ProjectWithStats[]> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('project_summary')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      handleSupabaseError(error, 'ბოლო პროექტების ჩატვირთვა ვერ მოხერხდა')
    }
    
    return data as ProjectWithStats[]
  }, 'ბოლო პროექტების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Search projects by title
 * @param query - Search query
 * @param limit - Maximum results to return
 * @returns Matching projects
 */
export async function searchProjects(query: string, limit = 10): Promise<Project[]> {
  return withErrorHandling(async () => {
    if (!query.trim()) {
      return []
    }
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .ilike('title', `%${query.trim()}%`)
      .order('updated_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      handleSupabaseError(error, 'პროექტების ძიება ვერ მოხერხდა')
    }
    
    return data as Project[]
  }, 'პროექტების ძიება ვერ მოხერხდა')
}