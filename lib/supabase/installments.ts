import { createClient } from '@/lib/supabase/client'
import type {
  PaymentInstallment,
  InstallmentWithStats,
  CreateInstallmentInput,
  InstallmentFilters,
  PaginatedResponse,
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
// INSTALLMENT QUERIES
// =====================================================

/**
 * Get all installments with statistics, filters, and pagination
 * @param filters - Optional filters for installments
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Paginated installments with statistics
 */
export async function getInstallments(
  filters?: InstallmentFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<InstallmentWithStats>> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    let query = supabase
      .from('installment_summary')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id)
    }
    
    if (filters?.is_paid !== undefined) {
      query = query.eq('is_paid', filters.is_paid)
    }
    
    if (filters?.is_overdue !== undefined) {
      query = query.eq('is_overdue', filters.is_overdue)
    }
    
    if (filters?.due_date_from) {
      query = query.gte('due_date', filters.due_date_from)
    }
    
    if (filters?.due_date_to) {
      query = query.lte('due_date', filters.due_date_to)
    }
    
    // Apply sorting
    const sortBy = filters?.sort_by || 'due_date'
    const sortOrder = filters?.sort_order || 'asc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      handleSupabaseError(error, 'განვადებების ჩატვირთვა ვერ მოხერხდა')
    }
    
    const totalPages = Math.ceil((count || 0) / pageSize)
    
    return {
      data: data as InstallmentWithStats[],
      pagination: {
        page,
        per_page: pageSize,
        total_count: count || 0,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1,
      },
    }
  }, 'განვადებების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get installments for a specific project
 * @param projectId - Project ID
 * @returns Project installments with statistics
 */
export async function getProjectInstallments(projectId: string): Promise<InstallmentWithStats[]> {
  return withErrorHandling(async () => {
    validateRequired({ projectId }, ['projectId'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('installment_summary')
      .select('*')
      .eq('project_id', projectId)
      .order('installment_number')
    
    if (error) {
      handleSupabaseError(error, 'პროექტის განვადებების ჩატვირთვა ვერ მოხერხდა')
    }
    
    return (data as any[] || []).map((item: any) => ({
      ...item,
      project: item.project || { title: 'უცნობი პროექტი' }
    })) as InstallmentWithStats[]
  }, 'პროექტის განვადებების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get a single installment by ID with statistics
 * @param id - Installment ID
 * @returns Installment with statistics
 */
export async function getInstallmentById(id: string): Promise<InstallmentWithStats> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('installment_summary')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'განვადება ვერ მოიძებნა')
      }
      handleSupabaseError(error, 'განვადების ჩატვირთვა ვერ მოხერხდა')
    }
    
    return data as InstallmentWithStats
  }, 'განვადების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get upcoming installments (due in the next N days)
 * @param days - Number of days to look ahead (default: 7)
 * @param limit - Maximum number of installments to return
 * @returns Upcoming installments
 */
export async function getUpcomingInstallments(
  days = 7,
  limit = 10
): Promise<InstallmentWithStats[]> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)
    
    const { data, error } = await supabase
      .from('installment_summary')
      .select('*, project:projects(title)')
      .eq('is_paid', false)
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', futureDate.toISOString().split('T')[0])
      .order('due_date')
      .limit(limit)
    
    if (error) {
      handleSupabaseError(error, 'მომავალი განვადებების ჩატვირთვა ვერ მოხერხდა')
    }
    
    return (data as any[] || []).map((item: any) => ({
      ...item,
      project: item.project || { title: 'უცნობი პროექტი' }
    })) as InstallmentWithStats[]
  }, 'მომავალი განვადებების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get overdue installments
 * @param limit - Maximum number of installments to return
 * @returns Overdue installments
 */
export async function getOverdueInstallments(limit = 10): Promise<InstallmentWithStats[]> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('installment_summary')
      .select('*, project:projects(title)')
      .eq('is_overdue', true)
      .order('due_date')
      .limit(limit)
    
    if (error) {
      handleSupabaseError(error, 'ვადაგადაცილებული განვადებების ჩატვირთვა ვერ მოხერხდა')
    }
    
    return (data as any[] || []).map((item: any) => ({
      ...item,
      project: item.project || { title: 'უცნობი პროექტი' }
    })) as InstallmentWithStats[]
  }, 'ვადაგადაცილებული განვადებების ჩატვირთვა ვერ მოხერხდა')
}

// =====================================================
// INSTALLMENT MUTATIONS
// =====================================================

/**
 * Create a new installment for a project
 * @param input - Installment creation input
 * @returns Created installment
 */
export async function createInstallment(input: CreateInstallmentInput): Promise<PaymentInstallment> {
  return withErrorHandling(async () => {
    // Validate input
    validateRequired(input, ['project_id', 'installment_number', 'amount', 'due_date'])
    validatePositiveNumber(input.amount, 'განვადების თანხა')
    validateDate(input.due_date, 'განვადების თარიღი', false, true)
    
    if (input.installment_number < 1) {
      handleBusinessError('INVALID_INPUT', 'განვადების ნომერი დადებითი უნდა იყოს')
    }
    
    const supabase = createClient()
    
    // Check if project exists and is of installment type
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('payment_type, total_budget')
      .eq('id', input.project_id)
      .single()
    
    if (projectError) {
      if (projectError.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'პროექტი ვერ მოიძებნა')
      }
      handleSupabaseError(projectError)
    }
    
    if (project.payment_type !== 'installment') {
      handleBusinessError('INVALID_PAYMENT_TYPE', 'განვადება მხოლოდ განვადებით პროექტებისთვისაა შესაძლებელი')
    }
    
    // Check if installment number already exists for this project
    const { data: existingInstallment } = await supabase
      .from('payment_installments')
      .select('id')
      .eq('project_id', input.project_id)
      .eq('installment_number', input.installment_number)
      .single()
    
    if (existingInstallment) {
      handleBusinessError('DUPLICATE_INSTALLMENT', 'ასეთი ნომრის განვადება უკვე არსებობს')
    }
    
    // Check that total installments don't exceed project budget
    const { data: existingInstallments } = await supabase
      .from('payment_installments')
      .select('amount')
      .eq('project_id', input.project_id)
    
    const totalExistingAmount = (existingInstallments || []).reduce((sum, inst) => sum + inst.amount, 0)
    const newTotalAmount = totalExistingAmount + input.amount
    
    if (newTotalAmount > project.total_budget) {
      handleBusinessError('INSTALLMENT_MISMATCH', 'განვადებების ჯამი მთლიან ბიუჯეტს აღემატება')
    }
    
    // Create installment
    const { data: installment, error: createError } = await supabase
      .from('payment_installments')
      .insert({
        project_id: input.project_id,
        installment_number: input.installment_number,
        amount: input.amount,
        due_date: input.due_date,
      })
      .select()
      .single()
    
    if (createError) {
      handleSupabaseError(createError, 'განვადების შექმნა ვერ მოხერხდა')
    }
    
    return installment as PaymentInstallment
  }, 'განვადების შექმნა ვერ მოხერხდა')
}

/**
 * Update an existing installment
 * @param id - Installment ID
 * @param input - Installment update input
 * @returns Updated installment
 */
export async function updateInstallment(
  id: string,
  input: Partial<CreateInstallmentInput>
): Promise<PaymentInstallment> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])
    
    const supabase = createClient()
    
    // Get current installment
    const { data: currentInstallment, error: getCurrentError } = await supabase
      .from('payment_installments')
      .select('*, project:projects(total_budget)')
      .eq('id', id)
      .single()
    
    if (getCurrentError) {
      if (getCurrentError.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'განვადება ვერ მოიძებნა')
      }
      handleSupabaseError(getCurrentError)
    }
    
    // Check if installment has transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('installment_id', id)
      .limit(1)
    
    if (transactions && transactions.length > 0) {
      // If installment has transactions, only allow due date changes
      if (input.amount !== undefined || input.installment_number !== undefined) {
        handleBusinessError('INSTALLMENT_HAS_TRANSACTIONS', 'ტრანზაქციების არსებობისას განვადების თანხისა და ნომრის შეცვლა შეუძლებელია')
      }
    }
    
    const updateData: Record<string, unknown> = {}
    
    // Validate and prepare updates
    if (input.amount !== undefined) {
      validatePositiveNumber(input.amount, 'განვადების თანხა')
      
      // Check budget constraints
      const { data: otherInstallments } = await supabase
        .from('payment_installments')
        .select('amount')
        .eq('project_id', currentInstallment.project_id)
        .neq('id', id)
      
      const otherInstallmentsSum = (otherInstallments || []).reduce((sum, inst) => sum + inst.amount, 0)
      const newTotalAmount = otherInstallmentsSum + input.amount
      
      if (newTotalAmount > currentInstallment.project.total_budget) {
        handleBusinessError('INSTALLMENT_MISMATCH', 'განვადებების ჯამი მთლიან ბიუჯეტს აღემატება')
      }
      
      updateData.amount = input.amount
    }
    
    if (input.due_date !== undefined) {
      validateDate(input.due_date, 'განვადების თარიღი', false, true)
      updateData.due_date = input.due_date
    }
    
    if (input.installment_number !== undefined) {
      if (input.installment_number < 1) {
        handleBusinessError('INVALID_INPUT', 'განვადების ნომერი დადებითი უნდა იყოს')
      }
      
      // Check if new installment number already exists
      const { data: existingInstallment } = await supabase
        .from('payment_installments')
        .select('id')
        .eq('project_id', currentInstallment.project_id)
        .eq('installment_number', input.installment_number)
        .neq('id', id)
        .single()
      
      if (existingInstallment) {
        handleBusinessError('DUPLICATE_INSTALLMENT', 'ასეთი ნომრის განვადება უკვე არსებობს')
      }
      
      updateData.installment_number = input.installment_number
    }
    
    // Update installment
    const { data: installment, error: updateError } = await supabase
      .from('payment_installments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      handleSupabaseError(updateError, 'განვადების განახლება ვერ მოხერხდა')
    }
    
    return installment as PaymentInstallment
  }, 'განვადების განახლება ვერ მოხერხდა')
}

/**
 * Delete an installment
 * @param id - Installment ID
 */
export async function deleteInstallment(id: string): Promise<void> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])
    
    const supabase = createClient()
    
    // Check if installment exists
    const { data: installment, error: getError } = await supabase
      .from('payment_installments')
      .select('id')
      .eq('id', id)
      .single()
    
    if (getError) {
      if (getError.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'განვადება ვერ მოიძებნა')
      }
      handleSupabaseError(getError)
    }
    
    // Check if installment has transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('installment_id', id)
      .limit(1)
    
    if (transactions && transactions.length > 0) {
      handleBusinessError('INSTALLMENT_HAS_TRANSACTIONS', 'ტრანზაქციების არსებობისას განვადების წაშლა შეუძლებელია')
    }
    
    // Delete installment
    const { error: deleteError } = await supabase
      .from('payment_installments')
      .delete()
      .eq('id', id)
    
    if (deleteError) {
      handleSupabaseError(deleteError, 'განვადების წაშლა ვერ მოხერხდა')
    }
  }, 'განვადების წაშლა ვერ მოხერხდა')
}

/**
 * Mark an installment as paid or unpaid
 * @param id - Installment ID
 * @param isPaid - Whether to mark as paid or unpaid
 * @returns Updated installment
 */
export async function markInstallmentPaid(id: string, isPaid: boolean): Promise<PaymentInstallment> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])
    
    const supabase = createClient()
    
    // Check if installment exists
    const { data: installment, error: getError } = await supabase
      .from('payment_installments')
      .select('is_paid')
      .eq('id', id)
      .single()
    
    if (getError) {
      if (getError.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'განვადება ვერ მოიძებნა')
      }
      handleSupabaseError(getError)
    }
    
    if (installment.is_paid === isPaid) {
      // Already in desired state
      return installment as PaymentInstallment
    }
    
    // Update paid status
    const { data: updatedInstallment, error: updateError } = await supabase
      .from('payment_installments')
      .update({ is_paid: isPaid })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      handleSupabaseError(updateError, 'განვადების სტატუსის განახლება ვერ მოხერხდა')
    }
    
    return updatedInstallment as PaymentInstallment
  }, 'განვადების სტატუსის განახლება ვერ მოხერხდა')
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if installment exists
 * @param id - Installment ID
 * @returns Whether installment exists
 */
export async function installmentExists(id: string): Promise<boolean> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('payment_installments')
      .select('id')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error)
    }
    
    return !!data
  }, 'განვადების შემოწმება ვერ მოხერხდა')
}

/**
 * Get installment statistics for dashboard
 * @returns Installment statistics
 */
export async function getInstallmentStats() {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    // Get counts for different installment statuses
    const { data: allInstallments, error } = await supabase
      .from('installment_summary')
      .select('is_paid, is_overdue, is_fully_paid')
    
    if (error) {
      handleSupabaseError(error, 'განვადების სტატისტიკის ჩატვირთვა ვერ მოხერხდა')
    }
    
    const stats = {
      total_count: allInstallments.length,
      paid_count: allInstallments.filter(i => i.is_paid).length,
      unpaid_count: allInstallments.filter(i => !i.is_paid).length,
      overdue_count: allInstallments.filter(i => i.is_overdue).length,
      fully_paid_count: allInstallments.filter(i => i.is_fully_paid).length,
    }
    
    return stats
  }, 'განვადების სტატისტიკის ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Validate installments for a project (check sum equals budget)
 * @param projectId - Project ID
 * @returns Validation result
 */
export async function validateProjectInstallments(projectId: string): Promise<{
  isValid: boolean
  totalInstallments: number
  projectBudget: number
  difference: number
}> {
  return withErrorHandling(async () => {
    validateRequired({ projectId }, ['projectId'])
    
    const supabase = createClient()
    
    // Get project budget
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('total_budget')
      .eq('id', projectId)
      .single()
    
    if (projectError) {
      handleSupabaseError(projectError)
    }
    
    // Get installments sum
    const { data: installments, error: installmentsError } = await supabase
      .from('payment_installments')
      .select('amount')
      .eq('project_id', projectId)
    
    if (installmentsError) {
      handleSupabaseError(installmentsError)
    }
    
    const totalInstallments = (installments || []).reduce((sum, inst) => sum + inst.amount, 0)
    const difference = Math.abs(project.total_budget - totalInstallments)
    const isValid = difference < 0.01 // Allow for floating point precision
    
    return {
      isValid,
      totalInstallments,
      projectBudget: project.total_budget,
      difference,
    }
  }, 'განვადების ვალიდაცია ვერ მოხერხდა')
}