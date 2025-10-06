import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamMemberAnalytics,
  getProjectTeamMembers,
  getTeamMemberProjects,
  searchTeamMembers,
  teamMemberExists,
  getActiveTeamMembers,
} from '@/lib/supabase/team-members'
import type {
  TeamMemberFilters,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  UseTeamMembersReturn,
  UseTeamMemberReturn,
} from '@/types'
import { toast } from 'sonner'

// =====================================================
// QUERY KEYS
// =====================================================

export const teamMemberKeys = {
  all: ['team-members'] as const,
  lists: () => [...teamMemberKeys.all, 'list'] as const,
  list: (filters: TeamMemberFilters, page: number, pageSize: number) =>
    [...teamMemberKeys.lists(), { filters, page, pageSize }] as const,
  details: () => [...teamMemberKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamMemberKeys.details(), id] as const,
  analytics: (id: string) => [...teamMemberKeys.detail(id), 'analytics'] as const,
  projects: (id: string) => [...teamMemberKeys.detail(id), 'projects'] as const,
  projectMembers: (projectId: string) => [...teamMemberKeys.all, 'project', projectId] as const,
  search: (query: string, limit?: number) => [...teamMemberKeys.all, 'search', query, limit] as const,
  active: () => [...teamMemberKeys.all, 'active'] as const,
  exists: (id: string) => [...teamMemberKeys.all, 'exists', id] as const,
}

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Hook for fetching team members with filters and pagination
 */
export function useTeamMembers(
  filters?: TeamMemberFilters,
  page = 1,
  pageSize = 20
): UseTeamMembersReturn {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: teamMemberKeys.list(filters || {}, page, pageSize),
    queryFn: () => getTeamMembers(filters, page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData,
  })

  const createMutation = useMutation({
    mutationFn: createTeamMember,
    onSuccess: (data) => {
      // Invalidate and refetch team members list
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.active() })

      // Add the new team member to existing queries
      queryClient.setQueryData(teamMemberKeys.detail(data.id), data)

      toast.success('გუნდის წევრი წარმატებით დაემატა')
    },
    onError: (error) => {
      toast.error(error.message || 'გუნდის წევრის დამატება ვერ მოხერხდა')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTeamMemberInput }) =>
      updateTeamMember(id, input),
    onSuccess: (data, { id }) => {
      // Update the team member in existing queries
      queryClient.setQueryData(teamMemberKeys.detail(id), data)

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.active() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.analytics(id) })

      toast.success('გუნდის წევრი წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message || 'გუნდის წევრის განახლება ვერ მოხერხდა')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: (_, id) => {
      // Remove from all queries
      queryClient.removeQueries({ queryKey: teamMemberKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.active() })

      toast.success('გუნდის წევრი წარმატებით წაიშალა')
    },
    onError: (error) => {
      toast.error(error.message || 'გუნდის წევრის წაშლა ვერ მოხერხდა')
    },
  })

  return {
    // Data
    teamMembers: query.data?.data || [],
    pagination: query.data?.pagination,

    // Status
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isLoaded: !query.isLoading && !query.isError,

    // Actions
    refetch: query.refetch,
    createTeamMember: createMutation.mutateAsync,
    updateTeamMember: updateMutation.mutateAsync,
    deleteTeamMember: deleteMutation.mutateAsync,

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
 * Hook for fetching a single team member with details
 */
export function useTeamMember(id: string): UseTeamMemberReturn {
  const queryClient = useQueryClient()

  const memberQuery = useQuery({
    queryKey: teamMemberKeys.detail(id),
    queryFn: () => getTeamMemberById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry if team member not found
      if (error.message?.includes('ვერ მოიძებნა')) {
        return false
      }
      return failureCount < 3
    },
  })

  const analyticsQuery = useQuery({
    queryKey: teamMemberKeys.analytics(id),
    queryFn: () => getTeamMemberAnalytics(id),
    enabled: !!id && !!memberQuery.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const projectsQuery = useQuery({
    queryKey: teamMemberKeys.projects(id),
    queryFn: () => getTeamMemberProjects(id),
    enabled: !!id && !!memberQuery.data,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTeamMemberInput) => updateTeamMember(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(teamMemberKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.active() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.analytics(id) })

      toast.success('გუნდის წევრი წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message || 'გუნდის წევრის განახლება ვერ მოხერხდა')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTeamMember(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: teamMemberKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.active() })

      toast.success('გუნდის წევრი წარმატებით წაიშალა')
    },
    onError: (error) => {
      toast.error(error.message || 'გუნდის წევრის წაშლა ვერ მოხერხდა')
    },
  })

  const projects = projectsQuery.data || []

  return {
    // Data
    teamMember: memberQuery.data || null,
    analytics: analyticsQuery.data,

    // Computed data
    projects,
    activeProjects: projects.filter(p => !p.is_completed),
    completedProjects: projects.filter(p => p.is_completed),

    // Status
    isLoading: memberQuery.isLoading,
    error: memberQuery.error?.message || null,
    exists: !memberQuery.isError,

    // Actions
    refetch: () => {
      memberQuery.refetch()
      analyticsQuery.refetch()
      projectsQuery.refetch()
    },
    updateTeamMember: updateMutation.mutateAsync,
    deleteTeamMember: deleteMutation.mutateAsync,
  }
}

/**
 * Hook for active team members (for selectors)
 */
export function useActiveTeamMembers() {
  return useQuery({
    queryKey: teamMemberKeys.active(),
    queryFn: getActiveTeamMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for team members assigned to a project
 */
export function useProjectTeamMembers(projectId: string) {
  return useQuery({
    queryKey: teamMemberKeys.projectMembers(projectId),
    queryFn: () => getProjectTeamMembers(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for team member search
 */
export function useTeamMemberSearch(query: string, limit = 10) {
  return useQuery({
    queryKey: teamMemberKeys.search(query, limit),
    queryFn: () => searchTeamMembers(query, limit),
    enabled: query.length > 1, // Only search if query is at least 2 characters
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook to check if team member exists
 */
export function useTeamMemberExists(id: string) {
  return useQuery({
    queryKey: teamMemberKeys.exists(id),
    queryFn: () => teamMemberExists(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Hook for creating team members
 */
export function useCreateTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTeamMember,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.active() })
      queryClient.setQueryData(teamMemberKeys.detail(data.id), data)

      toast.success('გუნდის წევრი წარმატებით დაემატა')
    },
    onError: (error) => {
      toast.error(error.message || 'გუნდის წევრის დამატება ვერ მოხერხდა')
    },
  })
}

/**
 * Hook for updating team members
 */
export function useUpdateTeamMember(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateTeamMemberInput) => updateTeamMember(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(teamMemberKeys.detail(id), data)
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.active() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.analytics(id) })

      toast.success('გუნდის წევრი წარმატებით განახლდა')
    },
    onError: (error) => {
      toast.error(error.message || 'გუნდის წევრის განახლება ვერ მოხერხდა')
    },
  })
}

/**
 * Hook for deleting team members
 */
export function useDeleteTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: teamMemberKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.active() })

      toast.success('გუნდის წევრი წარმატებით წაიშალა')
    },
    onError: (error) => {
      toast.error(error.message || 'გუნდის წევრის წაშლა ვერ მოხერხდა')
    },
  })
}
