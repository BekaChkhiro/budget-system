'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, Filter, SortAsc, SortDesc } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

export function ProjectFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Current filter values
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const paymentType = searchParams.get('payment_type') || ''
  const isCompleted = searchParams.get('is_completed') || ''
  const sortBy = searchParams.get('sort_by') || 'updated_at'
  const sortOrder = searchParams.get('sort_order') || 'desc'
  
  // Debounce search input
  const debouncedSearch = useDebounce(search, 300)
  
  // Update URL with new filters
  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    // Reset page when filters change
    params.delete('page')
    
    router.push(`/projects?${params.toString()}`)
  }, [router, searchParams])

  // Apply search when debounced value changes
  React.useEffect(() => {
    updateFilters({ search: debouncedSearch || null })
  }, [debouncedSearch, updateFilters])

  // Clear all filters
  const clearFilters = () => {
    setSearch('')
    router.push('/projects')
  }

  // Check if any filters are active
  const hasActiveFilters = search || paymentType || isCompleted || sortBy !== 'updated_at' || sortOrder !== 'desc'
  const activeFiltersCount = [search, paymentType, isCompleted].filter(Boolean).length

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Search and Actions Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="პროექტების ძიება..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="shrink-0"
            >
              <X className="mr-2 h-4 w-4" />
              გაწმენდა
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Payment Type Filter */}
          <Select
            value={paymentType}
            onValueChange={(value) => 
              updateFilters({ payment_type: value === 'all' ? null : value })
            }
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="გადახდის ტიპი" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა ტიპი</SelectItem>
              <SelectItem value="single">ერთჯერადი</SelectItem>
              <SelectItem value="installment">განვადება</SelectItem>
            </SelectContent>
          </Select>

          {/* Completion Status Filter */}
          <Select
            value={isCompleted}
            onValueChange={(value) => 
              updateFilters({ is_completed: value === 'all' ? null : value })
            }
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="სტატუსი" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა სტატუსი</SelectItem>
              <SelectItem value="false">მიმდინარე</SelectItem>
              <SelectItem value="true">დასრულებული</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split('-')
              updateFilters({ sort_by: field, sort_order: order })
            }}
          >
            <SelectTrigger className="sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at-desc">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  განახლების მიხედვით
                </div>
              </SelectItem>
              <SelectItem value="created_at-desc">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  შექმნის მიხედვით
                </div>
              </SelectItem>
              <SelectItem value="title-asc">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  სახელით (ა-ჰ)
                </div>
              </SelectItem>
              <SelectItem value="title-desc">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  სახელით (ჰ-ა)
                </div>
              </SelectItem>
              <SelectItem value="total_budget-desc">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  ბიუჯეტით (მაღლიდან)
                </div>
              </SelectItem>
              <SelectItem value="total_budget-asc">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  ბიუჯეტით (დაბლიდან)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">აქტიური ფილტრები:</span>
            </div>
            
            {search && (
              <Badge variant="secondary">
                ძიება: "{search}"
              </Badge>
            )}
            
            {paymentType && (
              <Badge variant="secondary">
                ტიპი: {paymentType === 'single' ? 'ერთჯერადი' : 'განვადება'}
              </Badge>
            )}
            
            {isCompleted && (
              <Badge variant="secondary">
                სტატუსი: {isCompleted === 'true' ? 'დასრულებული' : 'მიმდინარე'}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// Export React import at the end to avoid conflicts
import React from 'react'