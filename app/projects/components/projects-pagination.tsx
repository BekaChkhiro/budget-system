'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PaginatedResponse, ProjectWithStats } from '@/types'

interface ProjectsPaginationProps {
  pagination: PaginatedResponse<ProjectWithStats>['pagination']
}

export function ProjectsPagination({ pagination }: ProjectsPaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/projects?${params.toString()}`)
  }

  const {
    page: currentPage,
    total_pages: totalPages,
    total_count: totalCount,
    per_page: perPage,
    has_next: hasNext,
    has_previous: hasPrevious
  } = pagination

  // Don't show pagination if there's only one page
  if (totalPages <= 1) return null

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const range = []
    
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      range.unshift('...')
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...')
    }

    range.unshift(1)
    if (totalPages !== 1) {
      range.push(totalPages)
    }

    return range
  }

  const visiblePages = getVisiblePages()

  // Calculate showing range
  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalCount)

  return (
    <div className="px-4 py-3 border-t bg-white">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Results Info */}
        <div className="text-sm text-muted-foreground">
          ნაჩვენებია <span className="font-medium">{startItem}</span> დან{' '}
          <span className="font-medium">{endItem}</span> მდე{' '}
          <span className="font-medium">{totalCount}</span>-იდან
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(1)}
            disabled={currentPage === 1}
            className="hidden sm:flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">წინა</span>
          </Button>

          {/* Page Numbers */}
          <div className="hidden md:flex items-center gap-1">
            {visiblePages.map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <Button variant="ghost" size="sm" disabled>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => navigateToPage(page as number)}
                    className={cn(
                      currentPage === page && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {page}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Current Page Indicator (Mobile) */}
          <div className="md:hidden px-3 py-1 text-sm">
            <span className="font-medium">{currentPage}</span>
            <span className="text-muted-foreground"> / {totalPages}</span>
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={!hasNext}
          >
            <span className="hidden sm:inline mr-1">შემდეგი</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="hidden sm:flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}