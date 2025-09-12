import type {
  Project,
  Transaction,
  PaymentInstallment,
  ProjectWithStats,
  TransactionWithRelations,
  InstallmentWithStats,
  DashboardStats,
  DashboardOverview,
  ProjectAnalytics,
  ProjectFilters,
  TransactionFilters,
  InstallmentFilters,
  PaginatedResponse,
  CreateProjectInput,
  CreateTransactionInput,
  UpdateProjectInput,
} from './index'
import type { AsyncState, ActionResult } from './utils'

// =====================================================
// DATA FETCHING HOOK TYPES
// =====================================================

/**
 * Hook return type for projects data fetching
 */
export interface UseProjectsReturn {
  /** Array of projects with statistics */
  projects: ProjectWithStats[]
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Whether initial fetch is complete */
  isLoaded: boolean
  /** Refetch projects data */
  refetch: () => Promise<void>
  /** Create new project */
  createProject: (input: CreateProjectInput) => Promise<ActionResult<Project>>
  /** Update existing project */
  updateProject: (id: string, input: UpdateProjectInput) => Promise<ActionResult<Project>>
  /** Delete project */
  deleteProject: (id: string) => Promise<ActionResult<void>>
  /** Pagination information */
  pagination?: {
    currentPage: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  /** Applied filters */
  filters: ProjectFilters
  /** Update filters */
  setFilters: (filters: Partial<ProjectFilters>) => void
  /** Clear all filters */
  clearFilters: () => void
}

/**
 * Hook return type for single project data
 */
export interface UseProjectReturn {
  /** Project data with statistics */
  project: ProjectWithStats | null
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Whether project exists */
  exists: boolean
  /** Refetch project data */
  refetch: () => Promise<void>
  /** Update project */
  updateProject: (input: UpdateProjectInput) => Promise<ActionResult<Project>>
  /** Delete project */
  deleteProject: () => Promise<ActionResult<void>>
  /** Project installments */
  installments: InstallmentWithStats[]
  /** Project transactions */
  transactions: TransactionWithRelations[]
  /** Project analytics */
  analytics?: ProjectAnalytics
}

/**
 * Hook return type for transactions data fetching
 */
export interface UseTransactionsReturn {
  /** Array of transactions with relations */
  transactions: TransactionWithRelations[]
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Whether initial fetch is complete */
  isLoaded: boolean
  /** Refetch transactions data */
  refetch: () => Promise<void>
  /** Create new transaction */
  createTransaction: (input: CreateTransactionInput) => Promise<ActionResult<Transaction>>
  /** Update existing transaction */
  updateTransaction: (id: string, input: Partial<CreateTransactionInput>) => Promise<ActionResult<Transaction>>
  /** Delete transaction */
  deleteTransaction: (id: string) => Promise<ActionResult<void>>
  /** Pagination information */
  pagination?: {
    currentPage: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  /** Applied filters */
  filters: TransactionFilters
  /** Update filters */
  setFilters: (filters: Partial<TransactionFilters>) => void
  /** Clear all filters */
  clearFilters: () => void
}

/**
 * Hook return type for installments data fetching
 */
export interface UseInstallmentsReturn {
  /** Array of installments with statistics */
  installments: InstallmentWithStats[]
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Whether initial fetch is complete */
  isLoaded: boolean
  /** Refetch installments data */
  refetch: () => Promise<void>
  /** Mark installment as paid */
  markAsPaid: (id: string) => Promise<ActionResult<PaymentInstallment>>
  /** Mark installment as unpaid */
  markAsUnpaid: (id: string) => Promise<ActionResult<PaymentInstallment>>
  /** Update installment */
  updateInstallment: (id: string, input: Partial<PaymentInstallment>) => Promise<ActionResult<PaymentInstallment>>
  /** Overdue installments count */
  overdueCount: number
  /** Upcoming installments (due in next 7 days) */
  upcomingCount: number
  /** Applied filters */
  filters: InstallmentFilters
  /** Update filters */
  setFilters: (filters: Partial<InstallmentFilters>) => void
  /** Clear all filters */
  clearFilters: () => void
}

/**
 * Hook return type for dashboard data
 */
export interface UseDashboardReturn {
  /** Dashboard overview data */
  overview: DashboardOverview | null
  /** Dashboard statistics */
  stats: DashboardStats | null
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Whether initial fetch is complete */
  isLoaded: boolean
  /** Refetch dashboard data */
  refetch: () => Promise<void>
  /** Last updated timestamp */
  lastUpdated: string | null
  /** Auto-refresh interval (in seconds) */
  refreshInterval: number
  /** Enable/disable auto-refresh */
  setAutoRefresh: (enabled: boolean) => void
}

// =====================================================
// FORM HOOK TYPES
// =====================================================

/**
 * Hook return type for form handling
 */
export interface UseFormReturn<T> {
  /** Current form data */
  data: T
  /** Form errors */
  errors: Record<string, string>
  /** Whether form is being submitted */
  isSubmitting: boolean
  /** Whether form submission was successful */
  isSuccess: boolean
  /** Whether form has been modified */
  isDirty: boolean
  /** Whether form is valid */
  isValid: boolean
  /** Update form field */
  setField: (field: keyof T, value: T[keyof T]) => void
  /** Update multiple fields */
  setFields: (fields: Partial<T>) => void
  /** Set form errors */
  setErrors: (errors: Record<string, string>) => void
  /** Clear specific error */
  clearError: (field: string) => void
  /** Clear all errors */
  clearErrors: () => void
  /** Reset form to initial state */
  reset: () => void
  /** Validate form */
  validate: () => boolean
  /** Submit form */
  submit: (onSubmit: (data: T) => Promise<ActionResult>) => Promise<void>
}

/**
 * Hook return type for project form
 */
export interface UseProjectFormReturn extends UseFormReturn<CreateProjectInput> {
  /** Add new installment */
  addInstallment: () => void
  /** Remove installment by index */
  removeInstallment: (index: number) => void
  /** Update installment by index */
  updateInstallment: (index: number, installment: Partial<{ amount: number; due_date: string }>) => void
  /** Calculate total installments amount */
  totalInstallmentsAmount: number
  /** Whether installments sum matches budget */
  installmentsSumValid: boolean
  /** Suggested installment amount for equal distribution */
  suggestedInstallmentAmount: number
}

/**
 * Hook return type for transaction form
 */
export interface UseTransactionFormReturn extends UseFormReturn<CreateTransactionInput> {
  /** Available projects for selection */
  availableProjects: Project[]
  /** Available installments for selected project */
  availableInstallments: PaymentInstallment[]
  /** Selected project details */
  selectedProject: Project | null
  /** Selected installment details */
  selectedInstallment: PaymentInstallment | null
  /** Maximum allowed transaction amount */
  maxAmount: number | null
  /** Remaining amount for installment */
  remainingAmount: number | null
}

// =====================================================
// MUTATION HOOK TYPES
// =====================================================

/**
 * Hook return type for data mutations
 */
export interface UseMutationReturn<TInput, TOutput> {
  /** Mutation function */
  mutate: (input: TInput) => Promise<ActionResult<TOutput>>
  /** Async mutation function */
  mutateAsync: (input: TInput) => Promise<TOutput>
  /** Whether mutation is in progress */
  isLoading: boolean
  /** Mutation error */
  error: string | null
  /** Whether mutation was successful */
  isSuccess: boolean
  /** Mutation result data */
  data: TOutput | null
  /** Reset mutation state */
  reset: () => void
}

// =====================================================
// PAGINATION HOOK TYPES
// =====================================================

/**
 * Hook return type for pagination
 */
export interface UsePaginationReturn {
  /** Current page number (1-based) */
  currentPage: number
  /** Items per page */
  pageSize: number
  /** Total number of items */
  totalItems: number
  /** Total number of pages */
  totalPages: number
  /** Whether there's a next page */
  hasNextPage: boolean
  /** Whether there's a previous page */
  hasPreviousPage: boolean
  /** Go to specific page */
  goToPage: (page: number) => void
  /** Go to next page */
  nextPage: () => void
  /** Go to previous page */
  previousPage: () => void
  /** Go to first page */
  firstPage: () => void
  /** Go to last page */
  lastPage: () => void
  /** Change page size */
  setPageSize: (size: number) => void
  /** Get pages array for pagination UI */
  getPages: () => Array<number | '...'> 
}

// =====================================================
// SEARCH AND FILTER HOOK TYPES
// =====================================================

/**
 * Hook return type for search functionality
 */
export interface UseSearchReturn {
  /** Current search query */
  query: string
  /** Update search query */
  setQuery: (query: string) => void
  /** Clear search query */
  clearQuery: () => void
  /** Whether search is active */
  isSearching: boolean
  /** Search results */
  results: unknown[]
  /** Debounced search query */
  debouncedQuery: string
  /** Search suggestions */
  suggestions: string[]
}

/**
 * Hook return type for filtering functionality
 */
export interface UseFiltersReturn<T> {
  /** Current filter values */
  filters: T
  /** Update single filter */
  setFilter: (key: keyof T, value: T[keyof T]) => void
  /** Update multiple filters */
  setFilters: (filters: Partial<T>) => void
  /** Clear single filter */
  clearFilter: (key: keyof T) => void
  /** Clear all filters */
  clearAll: () => void
  /** Whether any filters are active */
  hasActiveFilters: boolean
  /** Number of active filters */
  activeFiltersCount: number
  /** Get filter values as URL params */
  toURLParams: () => URLSearchParams
  /** Set filters from URL params */
  fromURLParams: (params: URLSearchParams) => void
}

// =====================================================
// ASYNC OPERATION HOOK TYPES
// =====================================================

/**
 * Hook return type for async operations
 */
export interface UseAsyncReturn<T> {
  /** Execute async operation */
  execute: (...args: unknown[]) => Promise<T>
  /** Current state */
  state: AsyncState<T>
  /** Whether operation is loading */
  isLoading: boolean
  /** Operation error */
  error: string | null
  /** Operation result data */
  data: T | null
  /** Whether operation was successful */
  isSuccess: boolean
  /** Reset operation state */
  reset: () => void
}

// =====================================================
// LOCAL STORAGE HOOK TYPES
// =====================================================

/**
 * Hook return type for local storage
 */
export interface UseLocalStorageReturn<T> {
  /** Current stored value */
  value: T
  /** Update stored value */
  setValue: (value: T | ((prev: T) => T)) => void
  /** Remove stored value */
  removeValue: () => void
  /** Whether value exists in storage */
  hasValue: boolean
}

// =====================================================
// DEBOUNCE HOOK TYPES
// =====================================================

/**
 * Hook return type for debounced values
 */
export interface UseDebounceReturn<T> {
  /** Debounced value */
  debouncedValue: T
  /** Whether value is pending */
  isPending: boolean
  /** Cancel pending debounce */
  cancel: () => void
  /** Flush pending debounce immediately */
  flush: () => void
}

// =====================================================
// PERMISSION HOOK TYPES
// =====================================================

/**
 * Hook return type for permissions
 */
export interface UsePermissionsReturn {
  /** Check if user has permission */
  hasPermission: (permission: string) => boolean
  /** Check if user has any of the permissions */
  hasAnyPermission: (permissions: string[]) => boolean
  /** Check if user has all permissions */
  hasAllPermissions: (permissions: string[]) => boolean
  /** Current user permissions */
  permissions: string[]
  /** Whether permissions are loading */
  isLoading: boolean
}

// =====================================================
// THEME HOOK TYPES
// =====================================================

/**
 * Hook return type for theme management
 */
export interface UseThemeReturn {
  /** Current theme */
  theme: 'light' | 'dark' | 'system'
  /** Resolved theme (without 'system') */
  resolvedTheme: 'light' | 'dark'
  /** Set theme */
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  /** Toggle between light and dark */
  toggleTheme: () => void
}

// =====================================================
// MEDIA QUERY HOOK TYPES
// =====================================================

/**
 * Hook return type for media queries
 */
export interface UseMediaQueryReturn {
  /** Whether media query matches */
  matches: boolean
  /** Media query string */
  query: string
}

// =====================================================
// INTERSECTION OBSERVER HOOK TYPES
// =====================================================

/**
 * Hook return type for intersection observer
 */
export interface UseIntersectionObserverReturn {
  /** Whether element is intersecting */
  isIntersecting: boolean
  /** Intersection observer entry */
  entry: IntersectionObserverEntry | null
  /** Ref to attach to element */
  ref: (element: Element | null) => void
}