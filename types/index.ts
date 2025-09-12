import { Database } from './database.types'

// =====================================================
// BASE TYPES FROM SUPABASE
// =====================================================

export type Tables = Database['public']['Tables']
export type Views = Database['public']['Views']
export type Functions = Database['public']['Functions']

// Table row types
export type Project = Tables['projects']['Row']
export type PaymentInstallment = Tables['payment_installments']['Row']
export type Transaction = Tables['transactions']['Row']

// Insert types for creating new records
export type ProjectInsert = Tables['projects']['Insert']
export type PaymentInstallmentInsert = Tables['payment_installments']['Insert']
export type TransactionInsert = Tables['transactions']['Insert']

// Update types for modifying existing records
export type ProjectUpdate = Tables['projects']['Update']
export type PaymentInstallmentUpdate = Tables['payment_installments']['Update']
export type TransactionUpdate = Tables['transactions']['Update']

// View types
export type ProjectSummary = Views['project_summary']['Row']
export type InstallmentSummary = Views['installment_summary']['Row']
export type DashboardStats = Views['dashboard_stats']['Row']

// =====================================================
// ENHANCED TYPES WITH COMPUTED FIELDS
// =====================================================

/**
 * Project with comprehensive statistics and related data
 */
export interface ProjectWithStats extends Project {
  /** Total amount received for this project */
  total_received: number
  /** Remaining amount to be paid */
  remaining_amount: number
  /** Payment completion percentage (0-100) */
  payment_progress: number
  /** Whether the project is fully paid */
  is_completed: boolean
  /** Associated installments if payment_type is 'installment' */
  installments?: InstallmentWithStats[]
  /** Associated transactions for this project */
  transactions?: Transaction[]
  /** Total number of transactions */
  transactions_count: number
  /** Date of the last transaction */
  last_transaction_date?: string
  /** Number of overdue installments */
  overdue_installments_count: number
}

/**
 * Installment with payment status and computed fields
 */
export interface InstallmentWithStats extends PaymentInstallment {
  /** Amount already paid for this installment */
  paid_amount: number
  /** Remaining amount for this installment */
  remaining_amount: number
  /** Whether this installment is fully paid */
  is_fully_paid: boolean
  /** Whether this installment is overdue */
  is_overdue: boolean
  /** Days until due date (negative if overdue) */
  days_until_due: number
  /** Associated transactions for this installment */
  transactions?: Transaction[]
  /** Related project information */
  project?: Project
}

/**
 * Transaction with related project and installment information
 */
export interface TransactionWithRelations extends Transaction {
  /** Related project information */
  project?: Project
  /** Related installment information (if applicable) */
  installment?: PaymentInstallment
}

/**
 * Project with all related installments and transactions
 */
export interface ProjectWithRelations extends Project {
  /** All installments for this project */
  installments: PaymentInstallment[]
  /** All transactions for this project */
  transactions: Transaction[]
}

// =====================================================
// FORM INPUT TYPES
// =====================================================

/**
 * Input type for creating a new project
 */
export interface CreateProjectInput extends Record<string, unknown> {
  /** Project title (minimum 3 characters) */
  title: string
  /** Total project budget (must be positive) */
  total_budget: number
  /** Payment structure type */
  payment_type: 'single' | 'installment'
  /** Installments array (required if payment_type is 'installment') */
  installments?: Array<{
    /** Installment amount */
    amount: number
    /** Due date in YYYY-MM-DD format */
    due_date: string
  }>
}

/**
 * Input type for updating a project
 */
export interface UpdateProjectInput {
  /** Optional project title update */
  title?: string
  /** Optional budget update */
  total_budget?: number
  /** Optional payment type update */
  payment_type?: 'single' | 'installment'
}

/**
 * Input type for creating a new transaction
 */
export interface CreateTransactionInput extends Record<string, unknown> {
  /** Project ID this transaction belongs to */
  project_id: string
  /** Optional installment ID (for installment payments) */
  installment_id?: string
  /** Transaction amount (must be positive) */
  amount: number
  /** Transaction date (defaults to today) */
  transaction_date?: string
  /** Optional notes */
  notes?: string
}

/**
 * Input type for creating an installment
 */
export interface CreateInstallmentInput extends Record<string, unknown> {
  /** Project ID this installment belongs to */
  project_id: string
  /** Sequential installment number */
  installment_number: number
  /** Installment amount */
  amount: number
  /** Due date */
  due_date: string
}

// =====================================================
// DASHBOARD AND ANALYTICS TYPES
// =====================================================

/**
 * Dashboard overview data
 */
export interface DashboardOverview {
  /** Platform-wide statistics */
  stats: DashboardStats
  /** Recent projects with stats */
  recent_projects: ProjectWithStats[]
  /** Recent transactions */
  recent_transactions: TransactionWithRelations[]
  /** Upcoming installments */
  upcoming_installments: InstallmentWithStats[]
  /** Overdue installments */
  overdue_installments: InstallmentWithStats[]
}

/**
 * Project analytics data
 */
export interface ProjectAnalytics {
  /** Monthly payment trends */
  monthly_payments: Array<{
    month: string
    amount: number
    transactions_count: number
  }>
  /** Payment timeline */
  payment_timeline: Array<{
    date: string
    amount: number
    cumulative_amount: number
    notes?: string
  }>
  /** Payment distribution by installment (optional) */
  installment_distribution?: Array<{
    installment_number: number
    budgeted_amount: number
    paid_amount: number
    percentage_complete: number
  }>
}

// =====================================================
// PAGINATION AND FILTER TYPES
// =====================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page: number
  /** Items per page */
  per_page: number
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  data: T[]
  /** Pagination metadata */
  pagination: {
    /** Current page number */
    page: number
    /** Items per page */
    per_page: number
    /** Total number of items */
    total_count: number
    /** Total number of pages */
    total_pages: number
    /** Whether there's a next page */
    has_next: boolean
    /** Whether there's a previous page */
    has_previous: boolean
  }
}

/**
 * Project filter options
 */
export interface ProjectFilters {
  /** Filter by payment type */
  payment_type?: 'single' | 'installment'
  /** Filter by completion status */
  is_completed?: boolean
  /** Filter by minimum budget */
  min_budget?: number
  /** Filter by maximum budget */
  max_budget?: number
  /** Search in project titles */
  search?: string
  /** Sort field */
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'total_budget' | 'payment_progress'
  /** Sort direction */
  sort_order?: 'asc' | 'desc'
}

/**
 * Transaction filter options
 */
export interface TransactionFilters {
  /** Filter by project ID */
  project_id?: string
  /** Filter by installment ID */
  installment_id?: string
  /** Filter by date range */
  date_from?: string
  /** Filter by date range */
  date_to?: string
  /** Filter by minimum amount */
  min_amount?: number
  /** Filter by maximum amount */
  max_amount?: number
  /** Search in notes */
  search?: string
  /** Sort field */
  sort_by?: 'transaction_date' | 'created_at' | 'amount'
  /** Sort direction */
  sort_order?: 'asc' | 'desc'
}

/**
 * Installment filter options
 */
export interface InstallmentFilters {
  /** Filter by project ID */
  project_id?: string
  /** Filter by payment status */
  is_paid?: boolean
  /** Filter by overdue status */
  is_overdue?: boolean
  /** Filter by due date range */
  due_date_from?: string
  /** Filter by due date range */
  due_date_to?: string
  /** Sort field */
  sort_by?: 'due_date' | 'installment_number' | 'amount'
  /** Sort direction */
  sort_order?: 'asc' | 'desc'
}

// =====================================================
// UTILITY TYPES FOR ENUMS AND CONSTANTS
// =====================================================

/**
 * Payment type enum values
 */
export const PaymentType = {
  SINGLE: 'single' as const,
  INSTALLMENT: 'installment' as const,
} as const

export type PaymentTypeValue = typeof PaymentType[keyof typeof PaymentType]

/**
 * Status badge configurations
 */
export interface StatusBadgeConfig {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

/**
 * Date range presets for filtering
 */
export interface DateRangePreset {
  label: string
  value: string
  range: {
    from: Date
    to: Date
  }
}

// =====================================================
// HOOK RETURN TYPES
// =====================================================

/**
 * Return type for useProjects hook
 */
export interface UseProjectsReturn {
  // Data
  projects: ProjectWithStats[]
  pagination?: PaginatedResponse<ProjectWithStats>['pagination']
  
  // Status
  isLoading: boolean
  error: string | null
  isLoaded: boolean
  
  // Actions
  refetch: () => void
  createProject: (input: CreateProjectInput) => Promise<Project>
  updateProject: (params: { id: string; input: UpdateProjectInput }) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  
  // Filter management
  filters: ProjectFilters
  setFilters: () => void
  clearFilters: () => void
}

/**
 * Return type for useProject hook
 */
export interface UseProjectReturn {
  // Data
  project: ProjectWithStats | null
  analytics?: ProjectAnalytics
  
  // Computed data
  installments: PaymentInstallment[]
  transactions: Transaction[]
  
  // Status
  isLoading: boolean
  error: string | null
  exists: boolean
  
  // Actions
  refetch: () => void
  updateProject: (input: UpdateProjectInput) => Promise<Project>
  deleteProject: () => Promise<void>
}

/**
 * Return type for useTransactions hook
 */
export interface UseTransactionsReturn {
  // Data
  transactions: TransactionWithRelations[]
  pagination?: PaginatedResponse<TransactionWithRelations>['pagination']
  
  // Status
  isLoading: boolean
  error: string | null
  isLoaded: boolean
  
  // Actions
  refetch: () => void
  createTransaction: (input: CreateTransactionInput) => Promise<Transaction>
  updateTransaction: (params: { id: string; input: Partial<CreateTransactionInput> }) => Promise<Transaction>
  deleteTransaction: (id: string) => Promise<void>
  
  // Filter management
  filters: TransactionFilters
  setFilters: () => void
  clearFilters: () => void
}

/**
 * Return type for useInstallments hook
 */
export interface UseInstallmentsReturn {
  // Data
  installments: InstallmentWithStats[]
  pagination?: PaginatedResponse<InstallmentWithStats>['pagination']
  
  // Status
  isLoading: boolean
  error: string | null
  isLoaded: boolean
  
  // Computed counts
  overdueCount: number
  upcomingCount: number
  
  // Actions
  refetch: () => void
  markAsPaid: (id: string) => Promise<PaymentInstallment>
  markAsUnpaid: (id: string) => Promise<PaymentInstallment>
  updateInstallment: (params: { id: string; input: Partial<CreateInstallmentInput> }) => Promise<PaymentInstallment>
  
  // Filter management
  filters: InstallmentFilters
  setFilters: () => void
  clearFilters: () => void
}

/**
 * Return type for useDashboard hook
 */
export interface UseDashboardReturn {
  // Data
  overview: DashboardOverview | null
  stats: DashboardStats | null
  
  // Status
  isLoading: boolean
  error: string | null
  isLoaded: boolean
  
  // Metadata
  lastUpdated: string | null
  refreshInterval: number
  
  // Actions
  refetch: () => void
  setAutoRefresh: (enabled: boolean) => void
}