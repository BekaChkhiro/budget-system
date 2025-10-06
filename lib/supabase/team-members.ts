import { createClient } from '@/lib/supabase/client'
import type {
  TeamMember,
  TeamMemberWithStats,
  TeamMemberWithAnalytics,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  TeamMemberFilters,
  PaginatedResponse,
  Project,
} from '@/types'
import {
  withErrorHandling,
  handleSupabaseError,
  handleBusinessError,
  validateRequired,
  validatePositiveNumber,
} from '@/lib/utils/error-handling'

// =====================================================
// TEAM MEMBER QUERIES
// =====================================================

/**
 * Get all team members with statistics
 * @param filters - Optional filters for team members
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Paginated team members with statistics
 */
export async function getTeamMembers(
  filters?: TeamMemberFilters,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<TeamMemberWithStats>> {
  return withErrorHandling(async () => {
    const supabase = createClient()

    let query = supabase
      .from('team_member_stats')
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,skills.cs.{${filters.search}}`)
    }

    if (filters?.project_id) {
      // Need to join with project_team_members for this filter
      query = query.in('id',
        supabase
          .from('project_team_members')
          .select('team_member_id')
          .eq('project_id', filters.project_id)
      )
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
      handleSupabaseError(error, 'გუნდის წევრების ჩატვირთვა ვერ მოხერხდა')
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    return {
      data: data as TeamMemberWithStats[],
      pagination: {
        page,
        per_page: pageSize,
        total_count: count || 0,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_previous: page > 1,
      },
    }
  }, 'გუნდის წევრების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get a single team member by ID with statistics
 * @param id - Team member ID
 * @returns Team member with statistics and related data
 */
export async function getTeamMemberById(id: string, supabaseClient?: any): Promise<TeamMemberWithStats> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])

    const supabase = supabaseClient || createClient()

    // Get team member with statistics
    const { data: teamMember, error: memberError } = await supabase
      .from('team_member_stats')
      .select('*')
      .eq('id', id)
      .single()

    if (memberError) {
      if (memberError.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'გუნდის წევრი ვერ მოიძებნა')
      }
      handleSupabaseError(memberError, 'გუნდის წევრის ჩატვირთვა ვერ მოხერხდა')
    }

    // Fetch projects this member is assigned to
    const { data: projectRelations, error: projectsError } = await supabase
      .from('project_team_members')
      .select('project_id, projects(*)')
      .eq('team_member_id', id)

    let projects: Project[] = []
    if (projectsError) {
      console.warn('Error fetching team member projects:', projectsError)
    } else {
      projects = (projectRelations || []).map((rel: any) => rel.projects).filter(Boolean)
    }

    return {
      ...teamMember,
      projects,
    } as TeamMemberWithStats
  }, 'გუნდის წევრის ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get team member analytics with time-based statistics
 * @param id - Team member ID
 * @returns Team member with analytics
 */
export async function getTeamMemberAnalytics(id: string, supabaseClient?: any): Promise<TeamMemberWithAnalytics> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])

    const supabase = supabaseClient || createClient()

    const { data, error } = await supabase
      .from('team_member_analytics')
      .select('*')
      .eq('team_member_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        handleBusinessError('RESOURCE_NOT_FOUND', 'გუნდის წევრის ანალიტიკა ვერ მოიძებნა')
      }
      handleSupabaseError(error, 'ანალიტიკის ჩატვირთვა ვერ მოხერხდა')
    }

    return data as TeamMemberWithAnalytics
  }, 'ანალიტიკის ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Check if team member exists by ID
 * @param id - Team member ID
 * @returns Whether team member exists
 */
export async function teamMemberExists(id: string): Promise<boolean> {
  return withErrorHandling(async () => {
    const supabase = createClient()

    // Get current user to filter by user_id
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return false
    }

    const { data, error } = await supabase
      .from('team_members')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error)
    }

    return !!data
  }, 'გუნდის წევრის შემოწმება ვერ მოხერხდა')
}

// =====================================================
// TEAM MEMBER MUTATIONS
// =====================================================

/**
 * Create a new team member
 * @param input - Team member creation input
 * @returns Created team member
 */
export async function createTeamMember(input: CreateTeamMemberInput): Promise<TeamMember> {
  return withErrorHandling(async () => {
    // Validate input
    validateRequired(input, ['name', 'email'])

    if (input.name.trim().length < 2) {
      handleBusinessError('INVALID_INPUT', 'სახელი მინიმუმ 2 სიმბოლო უნდა იყოს')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.email)) {
      handleBusinessError('INVALID_INPUT', 'არასწორი ელ-ფოსტის ფორმატი')
    }

    if (input.hourly_rate !== undefined && input.hourly_rate !== null) {
      validatePositiveNumber(input.hourly_rate, 'საათობრივი განაკვეთი')
    }

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('ავტორიზაცია საჭიროა')
    }

    // Create team member
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .insert({
        user_id: user.id,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        role: input.role?.trim() || null,
        hourly_rate: input.hourly_rate || null,
        avatar_url: input.avatar_url?.trim() || null,
        bio: input.bio?.trim() || null,
        skills: input.skills || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        handleBusinessError('DUPLICATE_ENTRY', 'ასეთი ელ-ფოსტით გუნდის წევრი უკვე არსებობს')
      }
      handleSupabaseError(error, 'გუნდის წევრის შექმნა ვერ მოხერხდა')
    }

    return teamMember as TeamMember
  }, 'გუნდის წევრის შექმნა ვერ მოხერხდა')
}

/**
 * Update an existing team member
 * @param id - Team member ID
 * @param input - Team member update input
 * @returns Updated team member
 */
export async function updateTeamMember(id: string, input: UpdateTeamMemberInput): Promise<TeamMember> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('ავტორიზაცია საჭიროა')
    }

    // Check if team member exists
    const exists = await teamMemberExists(id)
    if (!exists) {
      handleBusinessError('RESOURCE_NOT_FOUND', 'გუნდის წევრი ვერ მოიძებნა')
    }

    // Validate input if provided
    if (input.name !== undefined && input.name.trim().length < 2) {
      handleBusinessError('INVALID_INPUT', 'სახელი მინიმუმ 2 სიმბოლო უნდა იყოს')
    }

    if (input.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(input.email)) {
        handleBusinessError('INVALID_INPUT', 'არასწორი ელ-ფოსტის ფორმატი')
      }
    }

    if (input.hourly_rate !== undefined && input.hourly_rate !== null) {
      validatePositiveNumber(input.hourly_rate, 'საათობრივი განაკვეთი')
    }

    const updateData: Record<string, unknown> = {}

    if (input.name !== undefined) {
      updateData.name = input.name.trim()
    }

    if (input.email !== undefined) {
      updateData.email = input.email.trim().toLowerCase()
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone?.trim() || null
    }

    if (input.role !== undefined) {
      updateData.role = input.role?.trim() || null
    }

    if (input.hourly_rate !== undefined) {
      updateData.hourly_rate = input.hourly_rate || null
    }

    if (input.avatar_url !== undefined) {
      updateData.avatar_url = input.avatar_url?.trim() || null
    }

    if (input.bio !== undefined) {
      updateData.bio = input.bio?.trim() || null
    }

    if (input.skills !== undefined) {
      updateData.skills = input.skills || null
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active
    }

    const { data: teamMember, error } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        handleBusinessError('DUPLICATE_ENTRY', 'ასეთი ელ-ფოსტით გუნდის წევრი უკვე არსებობს')
      }
      handleSupabaseError(error, 'გუნდის წევრის განახლება ვერ მოხერხდა')
    }

    return teamMember as TeamMember
  }, 'გუნდის წევრის განახლება ვერ მოხერხდა')
}

/**
 * Delete a team member
 * @param id - Team member ID
 */
export async function deleteTeamMember(id: string): Promise<void> {
  return withErrorHandling(async () => {
    validateRequired({ id }, ['id'])

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('ავტორიზაცია საჭიროა')
    }

    // Check if team member exists
    const exists = await teamMemberExists(id)
    if (!exists) {
      handleBusinessError('RESOURCE_NOT_FOUND', 'გუნდის წევრი ვერ მოიძებნა')
    }

    // Delete team member (cascade will handle related data)
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      handleSupabaseError(error, 'გუნდის წევრის წაშლა ვერ მოხერხდა')
    }
  }, 'გუნდის წევრის წაშლა ვერ მოხერხდა')
}

// =====================================================
// PROJECT-TEAM MEMBER ASSOCIATIONS
// =====================================================

/**
 * Assign team members to a project
 * @param projectId - Project ID
 * @param teamMemberIds - Array of team member IDs to assign
 */
export async function assignTeamMembersToProject(
  projectId: string,
  teamMemberIds: string[],
  supabaseClient?: any
): Promise<void> {
  return withErrorHandling(async () => {
    validateRequired({ projectId }, ['projectId'])

    if (!teamMemberIds || teamMemberIds.length === 0) {
      return // Nothing to assign
    }

    const supabase = supabaseClient || createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('ავტორიზაცია საჭიროა')
    }

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      handleBusinessError('RESOURCE_NOT_FOUND', 'პროექტი ვერ მოიძებნა')
    }

    // Verify all team members belong to user
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('id')
      .in('id', teamMemberIds)
      .eq('user_id', user.id)

    if (membersError) {
      handleSupabaseError(membersError, 'გუნდის წევრების შემოწმება ვერ მოხერხდა')
    }

    if (!teamMembers || teamMembers.length !== teamMemberIds.length) {
      handleBusinessError('INVALID_INPUT', 'ზოგიერთი გუნდის წევრი ვერ მოიძებნა')
    }

    // Remove existing assignments
    await supabase
      .from('project_team_members')
      .delete()
      .eq('project_id', projectId)

    // Create new assignments
    const assignments = teamMemberIds.map(memberId => ({
      project_id: projectId,
      team_member_id: memberId,
    }))

    const { error: assignError } = await supabase
      .from('project_team_members')
      .insert(assignments)

    if (assignError) {
      handleSupabaseError(assignError, 'გუნდის წევრების მინიჭება ვერ მოხერხდა')
    }
  }, 'გუნდის წევრების მინიჭება ვერ მოხერხდა')
}

/**
 * Get team members assigned to a specific project
 * @param projectId - Project ID
 * @returns Team members assigned to the project
 */
export async function getProjectTeamMembers(projectId: string): Promise<TeamMemberWithStats[]> {
  return withErrorHandling(async () => {
    validateRequired({ projectId }, ['projectId'])

    const supabase = createClient()

    const { data, error } = await supabase
      .from('project_team_members')
      .select(`
        team_member_id,
        team_member_stats(*)
      `)
      .eq('project_id', projectId)

    if (error) {
      handleSupabaseError(error, 'პროექტის გუნდის წევრების ჩატვირთვა ვერ მოხერხდა')
    }

    // Extract team member stats from the nested structure
    const teamMembers = (data || [])
      .map((item: any) => item.team_member_stats)
      .filter(Boolean)

    return teamMembers as TeamMemberWithStats[]
  }, 'პროექტის გუნდის წევრების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Get projects assigned to a specific team member
 * @param teamMemberId - Team member ID
 * @returns Projects assigned to the team member
 */
export async function getTeamMemberProjects(teamMemberId: string, supabaseClient?: any): Promise<Project[]> {
  return withErrorHandling(async () => {
    validateRequired({ teamMemberId }, ['teamMemberId'])

    const supabase = supabaseClient || createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('ავტორიზაცია საჭიროა')
    }

    // First get the project IDs for this team member
    const { data: assignments, error: assignError } = await supabase
      .from('project_team_members')
      .select('project_id')
      .eq('team_member_id', teamMemberId)

    if (assignError) {
      handleSupabaseError(assignError, 'გუნდის წევრის პროექტების ჩატვირთვა ვერ მოხერხდა')
    }

    if (!assignments || assignments.length === 0) {
      return []
    }

    const projectIds = assignments.map((a: any) => a.project_id)

    // Now get project details from project_summary view
    const { data, error } = await supabase
      .from('project_summary')
      .select('*')
      .in('id', projectIds)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      handleSupabaseError(error, 'გუნდის წევრის პროექტების ჩატვირთვა ვერ მოხერხდა')
    }

    return (data || []) as Project[]
  }, 'გუნდის წევრის პროექტების ჩატვირთვა ვერ მოხერხდა')
}

/**
 * Search team members by name or email
 * @param query - Search query
 * @param limit - Maximum results to return
 * @returns Matching team members
 */
export async function searchTeamMembers(query: string, limit = 10): Promise<TeamMember[]> {
  return withErrorHandling(async () => {
    if (!query.trim()) {
      return []
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .or(`name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`)
      .eq('is_active', true)
      .order('name')
      .limit(limit)

    if (error) {
      handleSupabaseError(error, 'გუნდის წევრების ძიება ვერ მოხერხდა')
    }

    return data as TeamMember[]
  }, 'გუნდის წევრების ძიება ვერ მოხერხდა')
}

/**
 * Get all active team members (for selectors)
 * @returns Active team members
 */
export async function getActiveTeamMembers(): Promise<TeamMember[]> {
  return withErrorHandling(async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      handleSupabaseError(error, 'აქტიური გუნდის წევრების ჩატვირთვა ვერ მოხერხდა')
    }

    return data as TeamMember[]
  }, 'აქტიური გუნდის წევრების ჩატვირთვა ვერ მოხერხდა')
}
