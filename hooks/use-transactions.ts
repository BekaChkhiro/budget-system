import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getProjectTransactions,
  getInstallmentTransactions,
  getRecentTransactions,
  getTransactionStats,
  transactionExists,
} from '@/lib/supabase/transactions'
import type {
  TransactionFilters,
  CreateTransactionInput,
  UseTransactionsReturn,
} from '@/types'
import { toast } from 'sonner'

// =====================================================
// QUERY KEYS
// =====================================================

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionFilters, page: number, pageSize: number) => 
    [...transactionKeys.lists(), { filters, page, pageSize }] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  byProject: (projectId: string, limit?: number) => 
    [...transactionKeys.all, 'byProject', projectId, limit] as const,
  byInstallment: (installmentId: string) => 
    [...transactionKeys.all, 'byInstallment', installmentId] as const,
  recent: (limit?: number) => [...transactionKeys.all, 'recent', limit] as const,
  stats: (startDate: string, endDate: string) => 
    [...transactionKeys.all, 'stats', startDate, endDate] as const,
  exists: (id: string) => [...transactionKeys.all, 'exists', id] as const,
}

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Hook for fetching transactions with filters and pagination
 */
export function useTransactions(
  filters?: TransactionFilters,
  page = 1,
  pageSize = 20
): UseTransactionsReturn {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: transactionKeys.list(filters || {}, page, pageSize),
    queryFn: () => getTransactions(filters, page, pageSize),
    staleTime: 30 * 1000, // 30 seconds - განახლება უფრო ხშირად
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 1000, // ავტომატური განახლება 30 წამში ერთხელ
    placeholderData: (previousData) => previousData,
  })

  // სტატისტიკის მონაცემები
  const statsQuery = useQuery({
    queryKey: [...transactionKeys.all, 'overview-stats'],
    queryFn: async () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      return getTransactionStats(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      )
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: (data) => {
      // Invalidate transactions list
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      
      // Invalidate related project and installment queries
      queryClient.invalidateQueries({ 
        queryKey: transactionKeys.byProject(data.project_id) 
      })
      
      if (data.installment_id) {
        queryClient.invalidateQueries({ 
          queryKey: transactionKeys.byInstallment(data.installment_id) 
        })
      }
      
      // Invalidate project details to update stats
      queryClient.invalidateQueries({ 
        queryKey: ['projects', 'detail', data.project_id] 
      })
      
      // Add new transaction to cache
      queryClient.setQueryData(transactionKeys.detail(data.id), data)
      
      toast.success('ტრანზაქცია წარმატებით შეიქმნა')
    },
    onError: (error) => {
      toast.error(error.message || 'ტრანზაქციის შექმნა ვერ მოხერხდა')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateTransactionInput> }) =>
      updateTransaction(id, input),
    onSuccess: (data, { id }) => {
      // Update transaction in cache
      queryClient.setQueryData(transactionKeys.detail(id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: transactionKeys.byProject(data.project_id) 
      })
      
      if (data.installment_id) {
        queryClient.invalidateQueries({ 
          queryKey: transactionKeys.byInstallment(data.installment_id) 
        })
      }
      
      toast.success('ტრანზაქცია წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message || 'ტრანზაქციის განახლება ვერ მოხერხდა')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: transactionKeys.detail(id) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transactionKeys.recent() })
      
      toast.success('ტრანზაქცია წარმატებით წაიშალა')
    },
    onError: (error) => {
      toast.error(error.message || 'ტრანზაქციის წაშლა ვერ მოხერხდა')
    },
  })

  return {
    // Data
    transactions: query.data?.data || [],
    pagination: query.data?.pagination,
    stats: statsQuery.data,

    // Status
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isLoaded: !query.isLoading && !query.isError,

    // Actions
    refetch: query.refetch,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,

    // Filter management
    filters: filters || {},
    setFilters: () => {
      // This would be implemented in the component using URL search params
    },
    clearFilters: () => {
      // This would be implemented in the component
    },
  }
}

/**
 * Hook for fetching a single transaction
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => getTransactionById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error.message?.includes('ვერ მოიძებნა')) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook for fetching project transactions
 */
export function useProjectTransactions(projectId: string, limit = 50) {
  return useQuery({
    queryKey: transactionKeys.byProject(projectId, limit),
    queryFn: () => getProjectTransactions(projectId, limit),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching installment transactions
 */
export function useInstallmentTransactions(installmentId: string) {
  return useQuery({
    queryKey: transactionKeys.byInstallment(installmentId),
    queryFn: () => getInstallmentTransactions(installmentId),
    enabled: !!installmentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching recent transactions
 */
export function useRecentTransactions(limit = 10) {
  return useQuery({
    queryKey: transactionKeys.recent(limit),
    queryFn: () => getRecentTransactions(limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

/**
 * Hook for transaction statistics
 */
export function useTransactionStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: transactionKeys.stats(startDate, endDate),
    queryFn: () => getTransactionStats(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to check if transaction exists
 */
export function useTransactionExists(id: string) {
  return useQuery({
    queryKey: transactionKeys.exists(id),
    queryFn: () => transactionExists(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Hook for creating transactions
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transactionKeys.recent() })
      
      // Invalidate project-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['projects', 'detail', data.project_id] 
      })
      
      if (data.installment_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['installments', 'detail', data.installment_id] 
        })
      }
      
      toast.success('ტრანზაქცია წარმატებით შეიქმნა')
    },
    onError: (error) => {
      toast.error(error.message || 'ტრანზაქციის შექმნა ვერ მოხერხდა')
    },
  })
}

/**
 * Hook for updating transactions
 */
export function useUpdateTransaction(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Partial<CreateTransactionInput>) => updateTransaction(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(transactionKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      
      // Invalidate project-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['projects', 'detail', data.project_id] 
      })
      
      toast.success('ტრანზაქცია წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message || 'ტრანზაქციის განახლება ვერ მოხერხდა')
    },
  })
}

/**
 * Hook for deleting transactions
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: transactionKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transactionKeys.recent() })
      
      toast.success('ტრანზაქცია წარმატებით წაიშალა')
    },
    onError: (error) => {
      toast.error(error.message || 'ტრანზაქციის წაშლა ვერ მოხერხდა')
    },
  })
}