import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInstallments,
  getInstallmentById,
  getProjectInstallments,
  getUpcomingInstallments,
  getOverdueInstallments,
  createInstallment,
  updateInstallment,
  deleteInstallment,
  markInstallmentPaid,
  getInstallmentStats,
  validateProjectInstallments,
  installmentExists,
} from '@/lib/supabase/installments'
import type {
  InstallmentFilters,
  CreateInstallmentInput,
  UseInstallmentsReturn,
} from '@/types'
import { toast } from 'sonner'

// =====================================================
// QUERY KEYS
// =====================================================

export const installmentKeys = {
  all: ['installments'] as const,
  lists: () => [...installmentKeys.all, 'list'] as const,
  list: (filters: InstallmentFilters, page: number, pageSize: number) => 
    [...installmentKeys.lists(), { filters, page, pageSize }] as const,
  details: () => [...installmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...installmentKeys.details(), id] as const,
  byProject: (projectId: string) => [...installmentKeys.all, 'byProject', projectId] as const,
  upcoming: (days: number, limit: number) => 
    [...installmentKeys.all, 'upcoming', days, limit] as const,
  overdue: (limit: number) => [...installmentKeys.all, 'overdue', limit] as const,
  stats: () => [...installmentKeys.all, 'stats'] as const,
  validation: (projectId: string) => 
    [...installmentKeys.all, 'validation', projectId] as const,
  exists: (id: string) => [...installmentKeys.all, 'exists', id] as const,
}

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Hook for fetching installments with filters and pagination
 */
export function useInstallments(
  filters?: InstallmentFilters,
  page = 1,
  pageSize = 20
): UseInstallmentsReturn {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: installmentKeys.list(filters || {}, page, pageSize),
    queryFn: () => getInstallments(filters, page, pageSize),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData,
  })

  const markPaidMutation = useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      markInstallmentPaid(id, isPaid),
    onSuccess: (data, { id, isPaid }) => {
      // Update installment in cache
      queryClient.setQueryData(installmentKeys.detail(id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: installmentKeys.upcoming(7, 10) })
      queryClient.invalidateQueries({ queryKey: installmentKeys.overdue(10) })
      queryClient.invalidateQueries({ queryKey: installmentKeys.stats() })
      
      const message = isPaid ? 'განვადება გადახდილად მონიშნულია' : 'განვადება გადაუხდელად მონიშნულია'
      toast.success(message)
    },
    onError: (error) => {
      toast.error(error.message || 'სტატუსის განახლება ვერ მოხერხდა')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateInstallmentInput> }) =>
      updateInstallment(id, input),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(installmentKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: installmentKeys.byProject(data.project_id) })
      
      toast.success('განვადება წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message || 'განვადების განახლება ვერ მოხერხდა')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInstallment,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: installmentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: installmentKeys.stats() })
      
      toast.success('განვადება წარმატებით წაიშალა')
    },
    onError: (error) => {
      toast.error(error.message || 'განვადების წაშლა ვერ მოხერხდა')
    },
  })

  // Calculate counts for dashboard
  const installments = query.data?.data || []
  const overdueCount = installments.filter(i => i.is_overdue).length
  const upcomingCount = installments.filter(i => {
    const today = new Date()
    const dueDate = new Date(i.due_date)
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return !i.is_paid && daysDiff >= 0 && daysDiff <= 7
  }).length

  return {
    // Data
    installments,
    pagination: query.data?.pagination,
    
    // Status
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isLoaded: !query.isLoading && !query.isError,
    
    // Computed counts
    overdueCount,
    upcomingCount,
    
    // Actions
    refetch: query.refetch,
    markAsPaid: (id: string) => markPaidMutation.mutateAsync({ id, isPaid: true }),
    markAsUnpaid: (id: string) => markPaidMutation.mutateAsync({ id, isPaid: false }),
    updateInstallment: updateMutation.mutateAsync,
    
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
 * Hook for fetching a single installment
 */
export function useInstallment(id: string) {
  return useQuery({
    queryKey: installmentKeys.detail(id),
    queryFn: () => getInstallmentById(id),
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
 * Hook for fetching project installments
 */
export function useProjectInstallments(projectId: string) {
  return useQuery({
    queryKey: installmentKeys.byProject(projectId),
    queryFn: () => getProjectInstallments(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching upcoming installments
 */
export function useUpcomingInstallments(days = 7, limit = 10) {
  return useQuery({
    queryKey: installmentKeys.upcoming(days, limit),
    queryFn: () => getUpcomingInstallments(days, limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

/**
 * Hook for fetching overdue installments
 */
export function useOverdueInstallments(limit = 10) {
  return useQuery({
    queryKey: installmentKeys.overdue(limit),
    queryFn: () => getOverdueInstallments(limit),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

/**
 * Hook for installment statistics
 */
export function useInstallmentStats() {
  return useQuery({
    queryKey: installmentKeys.stats(),
    queryFn: getInstallmentStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

/**
 * Hook for project installment validation
 */
export function useProjectInstallmentValidation(projectId: string) {
  return useQuery({
    queryKey: installmentKeys.validation(projectId),
    queryFn: () => validateProjectInstallments(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to check if installment exists
 */
export function useInstallmentExists(id: string) {
  return useQuery({
    queryKey: installmentKeys.exists(id),
    queryFn: () => installmentExists(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Hook for creating installments
 */
export function useCreateInstallment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInstallment,
    onSuccess: (data) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: installmentKeys.byProject(data.project_id) 
      })
      
      // Invalidate project details
      queryClient.invalidateQueries({ 
        queryKey: ['projects', 'detail', data.project_id] 
      })
      
      // Add to cache
      queryClient.setQueryData(installmentKeys.detail(data.id), data)
      
      toast.success('განვადება წარმატებით შეიქმნა')
    },
    onError: (error) => {
      toast.error(error.message || 'განვადების შექმნა ვერ მოხერხდა')
    },
  })
}

/**
 * Hook for updating installments
 */
export function useUpdateInstallment(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Partial<CreateInstallmentInput>) => updateInstallment(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(installmentKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
      queryClient.invalidateQueries({ 
        queryKey: installmentKeys.byProject(data.project_id) 
      })
      
      toast.success('განვადება წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message || 'განვადების განახლება ვერ მოხერხდა')
    },
  })
}

/**
 * Hook for deleting installments
 */
export function useDeleteInstallment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteInstallment,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: installmentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: installmentKeys.stats() })
      
      toast.success('განვადება წარმატებით წაიშალა')
    },
    onError: (error) => {
      toast.error(error.message || 'განვადების წაშლა ვერ მოხერხდა')
    },
  })
}

/**
 * Hook for marking installments as paid/unpaid
 */
export function useMarkInstallmentPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      markInstallmentPaid(id, isPaid),
    onSuccess: (data, { id, isPaid }) => {
      queryClient.setQueryData(installmentKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: installmentKeys.upcoming(7, 10) })
      queryClient.invalidateQueries({ queryKey: installmentKeys.overdue(10) })
      queryClient.invalidateQueries({ queryKey: installmentKeys.stats() })
      
      const message = isPaid ? 'განვადება გადახდილად მონიშნულია' : 'განვადება გადაუხდელად მონიშნულია'
      toast.success(message)
    },
    onError: (error) => {
      toast.error(error.message || 'სტატუსის განახლება ვერ მოხერხდა')
    },
  })
}