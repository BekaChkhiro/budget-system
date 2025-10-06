import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProjectsTable } from './components/projects-table'
import { ProjectsHeader } from './components/projects-header'
import { ProjectFilters } from './components/project-filters'
import { ProjectsTableSkeleton } from './components/projects-table-skeleton'
import type { ProjectFilters as ProjectFiltersType, ProjectWithStats, PaginatedResponse } from '@/types'

export const metadata = {
  title: 'პროექტები | ბიუჯეტის მართვა',
  description: 'მართეთ თქვენი პროექტები და მათი ბიუჯეტები',
}

interface ProjectsPageProps {
  searchParams: Promise<{
    search?: string
    payment_type?: 'single' | 'installment'
    is_completed?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    page?: string
  }>
}

async function getProjectsServer(
  filters?: ProjectFiltersType,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<ProjectWithStats>> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('ავტორიზაცია საჭიროა')
  }

  let query = supabase
    .from('project_summary')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)

  // Apply filters
  if (filters?.payment_type) {
    query = query.eq('payment_type', filters.payment_type)
  }

  if (filters?.is_completed !== undefined) {
    query = query.eq('is_completed', filters.is_completed)
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
    throw new Error(error.message || 'პროექტების ჩატვირთვა ვერ მოხერხდა')
  }

  // Load team members for each project
  const projectsWithTeam = await Promise.all(
    (data || []).map(async (project) => {
      const { data: teamData } = await supabase
        .from('project_team_members')
        .select(`
          team_member_id,
          team_members (
            id,
            name,
            avatar_url,
            role
          )
        `)
        .eq('project_id', project.id)

      const teamMembers = (teamData || [])
        .map((item: any) => item.team_members)
        .filter(Boolean)

      return {
        ...project,
        team_members: teamMembers,
      }
    })
  )

  const totalPages = Math.ceil((count || 0) / pageSize)

  return {
    data: projectsWithTeam as ProjectWithStats[],
    pagination: {
      page,
      per_page: pageSize,
      total_count: count || 0,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_previous: page > 1,
    },
  }
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams

  const filters: ProjectFiltersType = {
    search: params.search,
    payment_type: params.payment_type,
    is_completed: params.is_completed === 'true' ? true :
                   params.is_completed === 'false' ? false : undefined,
    sort_by: params.sort_by as any,
    sort_order: params.sort_order,
  }

  const page = parseInt(params.page || '1', 10)
  const pageSize = 20

  let projects
  let error = null

  try {
    const result = await getProjectsServer(filters, page, pageSize)
    projects = result
  } catch (err) {
    console.error('Error fetching projects:', err)
    error = err instanceof Error ? err.message : 'პროექტების ჩატვირთვა ვერ მოხერხდა'
    projects = { data: [], pagination: { page: 1, per_page: pageSize, total_count: 0, total_pages: 1, has_next: false, has_previous: false } }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <ProjectsHeader />

      {/* Filters */}
      <Suspense fallback={<div className="h-40 bg-white rounded-lg shadow-sm border animate-pulse" />}>
        <ProjectFilters />
      </Suspense>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-destructive flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">შეცდომა</h3>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <Suspense fallback={<ProjectsTableSkeleton />}>
          <ProjectsTable 
            projects={projects.data} 
            pagination={projects.pagination}
            currentFilters={filters}
          />
        </Suspense>
      </div>
    </div>
  )
}

export const revalidate = 30 // Revalidate every 30 seconds