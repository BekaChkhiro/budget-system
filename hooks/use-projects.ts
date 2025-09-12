import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getProjectAnalytics,
  getRecentProjects,
  searchProjects,
  projectExists,
} from '@/lib/supabase/projects'
import type {
  ProjectFilters,
  CreateProjectInput,
  UpdateProjectInput,
  UseProjectsReturn,
  UseProjectReturn,
} from '@/types'
import { toast } from 'sonner'

// =====================================================
// QUERY KEYS
// =====================================================

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectFilters, page: number, pageSize: number) => 
    [...projectKeys.lists(), { filters, page, pageSize }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  analytics: (id: string) => [...projectKeys.detail(id), 'analytics'] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
  recent: (limit?: number) => [...projectKeys.all, 'recent', limit] as const,
  search: (query: string, limit?: number) => [...projectKeys.all, 'search', query, limit] as const,
  exists: (id: string) => [...projectKeys.all, 'exists', id] as const,
}

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Hook for fetching projects with filters and pagination
 */
export function useProjects(
  filters?: ProjectFilters,
  page = 1,
  pageSize = 20
): UseProjectsReturn {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: projectKeys.list(filters || {}, page, pageSize),
    queryFn: () => getProjects(filters, page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData,
  })

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      // Add the new project to existing queries
      queryClient.setQueryData(projectKeys.detail(data.id), data)
      
      toast.success('პროექტი წარმატებით შეიქმნა')
    },
    onError: (error) => {
      toast.error(error.message || 'პროექტის შექმნა ვერ მოხერხდა')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) =>
      updateProject(id, input),
    onSuccess: (data, { id }) => {
      // Update the project in existing queries
      queryClient.setQueryData(projectKeys.detail(id), data)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      toast.success('პროექტი წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message || 'პროექტის განახლება ვერ მოხერხდა')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, id) => {
      // Remove from all queries
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      toast.success('პროექტი წარმატებით წაიშალა')
    },
    onError: (error) => {
      toast.error(error.message || 'პროექტის წაშლა ვერ მოხერხდა')
    },
  })

  return {
    // Data
    projects: query.data?.data || [],
    pagination: query.data?.pagination,
    
    // Status
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isLoaded: !query.isLoading && !query.isError,
    
    // Actions
    refetch: query.refetch,
    createProject: createMutation.mutateAsync,
    updateProject: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
    
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
 * Hook for fetching a single project with details
 */
export function useProject(id: string): UseProjectReturn {
  const queryClient = useQueryClient()

  const projectQuery = useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProjectById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry if project not found
      if (error.message?.includes('ვერ მოიძებნა')) {
        return false
      }
      return failureCount < 3
    },
  })

  const analyticsQuery = useQuery({
    queryKey: projectKeys.analytics(id),
    queryFn: () => getProjectAnalytics(id),
    enabled: !!id && !!projectQuery.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const updateMutation = useMutation({
    mutationFn: (input: UpdateProjectInput) => updateProject(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(projectKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      toast.success('პროექტი წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message || 'პროექტის განახლება ვერ მოხერხდა')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      toast.success('პროექტი წარმატებით წაიშალა')
    },
    onError: (error) => {
      toast.error(error.message || 'პროექტის წაშლა ვერ მოხერხდა')
    },
  })

  return {
    // Data
    project: projectQuery.data || null,
    analytics: analyticsQuery.data,
    
    // Computed data
    installments: projectQuery.data?.installments || [],
    transactions: projectQuery.data?.transactions || [],
    
    // Status
    isLoading: projectQuery.isLoading,
    error: projectQuery.error?.message || null,
    exists: !projectQuery.isError,
    
    // Actions
    refetch: () => {
      projectQuery.refetch()
      analyticsQuery.refetch()
    },
    updateProject: updateMutation.mutateAsync,
    deleteProject: deleteMutation.mutateAsync,
  }
}

/**
 * Hook for project statistics
 */
export function useProjectStats() {
  return useQuery({
    queryKey: projectKeys.stats(),
    queryFn: getProjectStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

/**
 * Hook for recent projects
 */
export function useRecentProjects(limit = 5) {
  return useQuery({
    queryKey: projectKeys.recent(limit),
    queryFn: () => getRecentProjects(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for project search
 */
export function useProjectSearch(query: string, limit = 10) {
  return useQuery({
    queryKey: projectKeys.search(query, limit),
    queryFn: () => searchProjects(query, limit),
    enabled: query.length > 2, // Only search if query is at least 3 characters
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to check if project exists
 */
export function useProjectExists(id: string) {
  return useQuery({
    queryKey: projectKeys.exists(id),
    queryFn: () => projectExists(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Hook for creating projects
 */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      queryClient.setQueryData(projectKeys.detail(data.id), data)
      
      toast.success('პროექტი წარმატებით შეიქმნა')
    },
    onError: (error) => {
      toast.error(error.message || 'პროექტის შექმნა ვერ მოხერხდა')
    },
  })
}

/**
 * Hook for updating projects
 */
export function useUpdateProject(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => updateProject(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(projectKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      toast.success('პროექტი წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message || 'პროექტის განახლება ვერ მოხერხდა')
    },
  })
}

/**
 * Hook for deleting projects
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.stats() })
      
      toast.success('პროექტი წარმატებით წაიშალა')
    },
    onError: (error) => {
      toast.error(error.message || 'პროექტის წაშლა ვერ მოხერხდა')
    },
  })
}