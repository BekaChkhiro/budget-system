import { createClient } from '@/lib/supabase/client'
import type {
  Transaction,
  TransactionWithRelations,
  CreateTransactionInput,
  TransactionFilters,
  PaginatedResponse,
  Project,
  PaymentInstallment,
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
// TRANSACTION QUERIES
// =====================================================

/**
 * Get all transactions with filters, relations, and pagination
 * @param filters - Optional filters for transactions
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Paginated transactions with relations
 */
export async function getTransactions(
  filters?: TransactionFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<TransactionWithRelations>> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    let query = supabase
      .from('transactions')
      .select(`
        *,
        project:projects(*),
        installment:payment_installments(*)
      `, { count: 'exact' })
    
    // Apply filters
    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id)
    }
    
    if (filters?.installment_id) {
      query = query.eq('installment_id', filters.installment_id)
    }
    
    if (filters?.date_from) {
      query = query.gte('transaction_date', filters.date_from)
    }
    
    if (filters?.date_to) {
      query = query.lte('transaction_date', filters.date_to)
    }
    
    if (filters?.min_amount) {
      query = query.gte('amount', filters.min_amount)
    }
    
    if (filters?.max_amount) {
      query = query.lte('amount', filters.max_amount)
    }
    
    if (filters?.search) {
      query = query.ilike('notes', `%${filters.search}%`)
    }
    
    // Apply sorting
    const sortBy = filters?.sort_by || 'transaction_date'
    const sortOrder = filters?.sort_order || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      handleSupabaseError(error, 'ტრანზაქციების ჩატვირთვა ვერ მოხერხდა')
    }
    
    const totalPages = Math.ceil((count || 0) / pageSize)
    
    return {
      data: data as TransactionWithRelations[],
      pagination: {
        page,
        per_page: pageSize,
        total_count: count || 0,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1,
      },
    }
  }, 'ტრანზაქციების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get a single transaction by ID with relations
 * @param id - Transaction ID
 * @returns Transaction with relations
 */
export async function getTransactionById(id: string): Promise<TransactionWithRelations> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        project:projects(*),
        installment:payment_installments(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'ტრანზაქცია ვერ მოიძებნა')
      }
      handleSupabaseError(error, 'ტრანზაქციის ჩატვირთვა ვერ მოხერხდა')
    }
    
    return data as TransactionWithRelations
  }, 'ტრანზაქციის ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get transactions for a specific project
 * @param projectId - Project ID
 * @param limit - Maximum number of transactions to return
 * @returns Project transactions
 */
export async function getProjectTransactions(
  projectId: string,
  limit = 50
): Promise<TransactionWithRelations[]> {
  return withErrorHandling(async () => {
    validateRequired({ projectId }, ['projectId'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        project:projects(*),
        installment:payment_installments(*)
      `)
      .eq('project_id', projectId)
      .order('transaction_date', { ascending: false })
      .limit(limit)
    
    if (error) {
      handleSupabaseError(error, 'პროექტის ტრანზაქციების ჩატვირთვა ვერ მოხერხდა')
    }
    
    return data as TransactionWithRelations[]
  }, 'პროექტის ტრანზაქციების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get transactions for a specific installment
 * @param installmentId - Installment ID
 * @returns Installment transactions
 */
export async function getInstallmentTransactions(
  installmentId: string
): Promise<Transaction[]> {
  return withErrorHandling(async () => {
    validateRequired({ installmentId }, ['installmentId'])
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('installment_id', installmentId)
      .order('transaction_date', { ascending: false })
    
    if (error) {
      handleSupabaseError(error, 'განვადების ტრანზაქციების ჩატვირთვა ვერ მოხერხდა')
    }
    
    return data as Transaction[]
  }, 'განვადების ტრანზაქციების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get recent transactions for dashboard
 * @param limit - Number of recent transactions to fetch
 * @returns Recent transactions with project info
 */
export async function getRecentTransactions(limit = 10): Promise<TransactionWithRelations[]> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        project:projects(id, title),
        installment:payment_installments(installment_number)
      `)
      .order('transaction_date', { ascending: false })
      .limit(limit)
    
    if (error) {
      handleSupabaseError(error, 'ბოლო ტრანზაქციების ჩატვირთვა ვერ მოხერხდა')
    }
    
    return data as TransactionWithRelations[]
  }, 'ბოლო ტრანზაქციების ჩატვირთვა ვერ მოხერხდა')
}

// =====================================================
// TRANSACTION MUTATIONS
// =====================================================

/**
 * Create a new transaction with validation and installment updates
 * @param input - Transaction creation input
 * @returns Created transaction
 */
export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  return withErrorHandling(async () => {
    // Validate required fields
    validateRequired(input, ['project_id', 'amount'])
    validatePositiveNumber(input.amount, 'თანხა')
    
    if (input.transaction_date) {
      validateDate(input.transaction_date, 'ტრანზაქციის თარიღი', true, false)
    }
    
    const supabase = createClient()
    
    // Check if project exists and get current status
    const { data: projectSummary, error: projectError } = await supabase
      .from('project_summary')
      .select('remaining_amount, is_completed, payment_type')
      .eq('id', input.project_id)
      .single()
    
    if (projectError) {
      if (projectError.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'პროექტი ვერ მოიძებნა')
      }
      handleSupabaseError(projectError)
    }
    
    // Check if project is already completed
    if (projectSummary.is_completed) {
      handleBusinessError('PROJECT_ALREADY_COMPLETED')
    }
    
    // Check if amount doesn't exceed remaining balance
    if (input.amount > projectSummary.remaining_amount) {
      handleBusinessError('INSUFFICIENT_FUNDS')
    }
    
    // If installment ID is provided, validate installment
    if (input.installment_id) {
      const { data: installmentSummary, error: installmentError } = await supabase
        .from('installment_summary')
        .select('remaining_amount, is_fully_paid, project_id')
        .eq('id', input.installment_id)
        .single()
      
      if (installmentError) {
        if (installmentError.code === 'PGRST116') {
          handleBusinessError('RESOURCE_NOT_FOUND', 'განვადება ვერ მოიძებნა')
        }
        handleSupabaseError(installmentError)
      }
      
      // Check if installment belongs to the project
      if (installmentSummary.project_id !== input.project_id) {
        handleBusinessError('INVALID_INPUT', 'განვადება არ ეკუთვნის ამ პროექტს')
      }
      
      // Check if installment amount doesn't exceed remaining
      if (input.amount > installmentSummary.remaining_amount) {
        handleBusinessError('INSUFFICIENT_FUNDS', 'თანხა აღემატება განვადების დარჩენილ ბალანსს')
      }
    } else if (projectSummary.payment_type === 'installment') {
      // For installment projects, suggest which installment to pay
      const { data: unpaidInstallments } = await supabase
        .from('installment_summary')
        .select('id, installment_number, remaining_amount')
        .eq('project_id', input.project_id)
        .eq('is_fully_paid', false)
        .order('installment_number')
        .limit(1)
      
      if (unpaidInstallments && unpaidInstallments.length > 0) {
        console.warn('Transaction created without installment for installment project')
      }
    }
    
    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        project_id: input.project_id,
        installment_id: input.installment_id || null,
        amount: input.amount,
        transaction_date: input.transaction_date || new Date().toISOString().split('T')[0],
        notes: input.notes?.trim() || null,
      })
      .select()
      .single()
    
    if (transactionError) {
      handleSupabaseError(transactionError, 'ტრანზაქციის შექმნა ვერ მოხერხდა')
    }
    
    // Update installment paid status if applicable
    if (input.installment_id) {
      await updateInstallmentPaidStatus(input.installment_id)
    }
    
    return transaction as Transaction
  }, 'ტრანზაქციის შექმნა ვერ მოხერხდა')
}

/**
 * Update an existing transaction
 * @param id - Transaction ID
 * @param input - Transaction update input
 * @returns Updated transaction
 */
export async function updateTransaction(
  id: string,
  input: Partial<CreateTransactionInput>
): Promise<Transaction> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])
    
    const supabase = createClient()
    
    // Get current transaction
    const { data: currentTransaction, error: getCurrentError } = await supabase
      .from('transactions')
      .select('*, project:projects(id), installment:payment_installments(id)')
      .eq('id', id)
      .single()
    
    if (getCurrentError) {
      if (getCurrentError.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'ტრანზაქცია ვერ მოიძებნა')
      }
      handleSupabaseError(getCurrentError)
    }
    
    const updateData: Record<string, unknown> = {}
    
    // Validate and prepare updates
    if (input.amount !== undefined) {
      validatePositiveNumber(input.amount, 'თანხა')
      
      // Check if new amount is valid for project/installment
      const amountDifference = input.amount - currentTransaction.amount
      
      if (amountDifference > 0) {
        // Increasing amount - check remaining balance
        const { data: projectSummary } = await supabase
          .from('project_summary')
          .select('remaining_amount')
          .eq('id', currentTransaction.project_id)
          .single()
        
        if (projectSummary && amountDifference > projectSummary.remaining_amount) {
          handleBusinessError('INSUFFICIENT_FUNDS')
        }
      }
      
      updateData.amount = input.amount
    }
    
    if (input.transaction_date !== undefined) {
      validateDate(input.transaction_date, 'ტრანზაქციის თარიღი', true, false)
      updateData.transaction_date = input.transaction_date
    }
    
    if (input.notes !== undefined) {
      updateData.notes = input.notes?.trim() || null
    }
    
    // Update transaction
    const { data: transaction, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      handleSupabaseError(updateError, 'ტრანზაქციის განახლება ვერ მოხერხდა')
    }
    
    // Update installment status if amount changed and installment exists
    if (input.amount !== undefined && currentTransaction.installment_id) {
      await updateInstallmentPaidStatus(currentTransaction.installment_id)
    }
    
    return transaction as Transaction
  }, 'ტრანზაქციის განახლება ვერ მოხერხდა')
}

/**
 * Delete a transaction and update installment status
 * @param id - Transaction ID
 */
export async function deleteTransaction(id: string): Promise<void> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])
    
    const supabase = createClient()
    
    // Get transaction info before deletion
    const { data: transaction, error: getError } = await supabase
      .from('transactions')
      .select('installment_id')
      .eq('id', id)
      .single()
    
    if (getError) {
      if (getError.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'ტრანზაქცია ვერ მოიძებნა')
      }
      handleSupabaseError(getError)
    }
    
    // Delete transaction
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    if (deleteError) {
      handleSupabaseError(deleteError, 'ტრანზაქციის წაშლა ვერ მოხერხდა')
    }
    
    // Update installment status if applicable
    if (transaction.installment_id) {
      await updateInstallmentPaidStatus(transaction.installment_id)
    }
  }, 'ტრანზაქციის წაშლა ვერ მოხერხდა')
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Update installment paid status based on transaction totals
 * @param installmentId - Installment ID
 * @private
 */
async function updateInstallmentPaidStatus(installmentId: string): Promise<void> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    // Get installment summary to check if fully paid
    const { data: installmentSummary, error: summaryError } = await supabase
      .from('installment_summary')
      .select('is_fully_paid')
      .eq('id', installmentId)
      .single()
    
    if (summaryError) {
      console.warn('Error checking installment status:', summaryError)
      return
    }
    
    // Update installment paid status
    const { error: updateError } = await supabase
      .from('payment_installments')
      .update({ is_paid: installmentSummary.is_fully_paid })
      .eq('id', installmentId)
    
    if (updateError) {
      console.warn('Error updating installment status:', updateError)
    }
  }, 'განვადების სტატუსის განახლება ვერ მოხერხდა')
}

/**
 * Get transaction statistics for a date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Transaction statistics
 */
export async function getTransactionStats(startDate: string, endDate: string) {
  return withErrorHandling(async () => {
    validateDate(startDate, 'საწყისი თარიღი')
    validateDate(endDate, 'საბოლოო თარიღი')
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, transaction_date')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
    
    if (error) {
      handleSupabaseError(error, 'სტატისტიკის ჩატვირთვა ვერ მოხერხდა')
    }
    
    const totalAmount = data.reduce((sum, t) => sum + t.amount, 0)
    const totalCount = data.length
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0
    
    // Group by date
    const dailyStats = data.reduce((acc, transaction) => {
      const date = transaction.transaction_date
      if (!acc[date]) {
        acc[date] = { amount: 0, count: 0 }
      }
      acc[date].amount += transaction.amount
      acc[date].count += 1
      return acc
    }, {} as Record<string, { amount: number; count: number }>)
    
    return {
      total_amount: totalAmount,
      total_count: totalCount,
      average_amount: averageAmount,
      daily_stats: dailyStats,
    }
  }, 'სტატისტიკის ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Check if transaction exists
 * @param id - Transaction ID
 * @returns Whether transaction exists
 */
export async function transactionExists(id: string): Promise<boolean> {
  return withErrorHandling(async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error)
    }
    
    return !!data
  }, 'ტრანზაქციის შემოწმება ვერ მოხერხდა')
}