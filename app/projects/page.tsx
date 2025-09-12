import { Suspense } from 'react'
import { getProjects } from '@/lib/supabase/projects'
import { ProjectsTable } from './components/projects-table'
import { ProjectsHeader } from './components/projects-header'
import { ProjectFilters } from './components/project-filters'
import { ProjectsTableSkeleton } from './components/projects-table-skeleton'
import type { ProjectFilters as ProjectFiltersType } from '@/types'

export const metadata = {
  title: 'პროექტები | ბიუჯეტის მართვა',
  description: 'მართეთ თქვენი პროექტები და მათი ბიუჯეტები',
}

interface ProjectsPageProps {
  searchParams: {
    search?: string
    payment_type?: 'single' | 'installment'
    is_completed?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    page?: string
  }
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const filters: ProjectFiltersType = {
    search: searchParams.search,
    payment_type: searchParams.payment_type,
    is_completed: searchParams.is_completed === 'true' ? true : 
                   searchParams.is_completed === 'false' ? false : undefined,
    sort_by: searchParams.sort_by as any,
    sort_order: searchParams.sort_order,
  }

  const page = parseInt(searchParams.page || '1', 10)
  const pageSize = 20

  let projects
  let error = null

  try {
    const result = await getProjects(filters, page, pageSize)
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
      <ProjectFilters />

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