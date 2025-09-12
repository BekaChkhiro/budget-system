import { PostgrestError } from '@supabase/supabase-js'

// =====================================================
// API RESPONSE TYPES
// =====================================================

/**
 * Standard API response wrapper for consistent error handling
 */
export interface ApiResponse<T = unknown> {
  /** Response data (null if error occurred) */
  data: T | null
  /** Error information (null if successful) */
  error: ApiError | null
  /** Whether the operation was successful */
  success: boolean
  /** Optional response message */
  message?: string
  /** Response metadata */
  meta?: {
    /** Request timestamp */
    timestamp: string
    /** Request ID for debugging */
    request_id?: string
    /** API version */
    version?: string
  }
}

/**
 * Error object structure for API responses
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: string
  /** Human-readable error message */
  message: string
  /** Detailed error description */
  details?: string
  /** Field-specific validation errors */
  field_errors?: Record<string, string[]>
  /** HTTP status code */
  status_code?: number
  /** Error timestamp */
  timestamp?: string
  /** Request ID that caused the error */
  request_id?: string
}

/**
 * Supabase response wrapper with enhanced error handling
 */
export interface SupabaseResponse<T = unknown> {
  /** Response data */
  data: T | null
  /** Supabase error object */
  error: PostgrestError | null
  /** Additional metadata */
  count?: number | null
  /** Response status information */
  status: number
  /** Status text */
  statusText: string
}

// =====================================================
// FORM AND STATE MANAGEMENT TYPES
// =====================================================

/**
 * Generic form state for handling form submissions
 */
export interface FormState<T = unknown> {
  /** Current form data */
  data: T | null
  /** Whether form is being submitted */
  is_loading: boolean
  /** Whether form submission was successful */
  is_success: boolean
  /** Form errors */
  errors: Record<string, string> | null
  /** General form message */
  message: string | null
  /** Form submission timestamp */
  last_updated?: string
}

/**
 * Action result for server actions and form submissions
 */
export interface ActionResult<T = unknown> {
  /** Whether action was successful */
  success: boolean
  /** Action result data */
  data?: T
  /** Error information */
  error?: {
    /** Error message */
    message: string
    /** Field-specific errors */
    field_errors?: Record<string, string>
    /** Error code */
    code?: string
  }
  /** Additional metadata */
  meta?: {
    /** Action timestamp */
    timestamp: string
    /** Action type */
    action_type?: string
    /** Affected record ID */
    record_id?: string
  }
}

/**
 * Async operation state for data fetching and mutations
 */
export interface AsyncState<T = unknown> {
  /** Current data */
  data: T | null
  /** Loading state */
  is_loading: boolean
  /** Error state */
  error: string | null
  /** Whether initial load is complete */
  is_loaded: boolean
  /** Last fetch timestamp */
  last_fetched?: string
  /** Whether data is stale and needs refetch */
  is_stale: boolean
}

// =====================================================
// PAGINATION AND SORTING UTILITIES
// =====================================================

/**
 * Pagination metadata for paginated responses
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  current_page: number
  /** Items per page */
  per_page: number
  /** Total number of items */
  total_items: number
  /** Total number of pages */
  total_pages: number
  /** Whether there's a next page */
  has_next_page: boolean
  /** Whether there's a previous page */
  has_previous_page: boolean
  /** First item index on current page */
  from: number
  /** Last item index on current page */
  to: number
}

/**
 * Paginated data response
 */
export interface PaginatedData<T = unknown> {
  /** Array of items for current page */
  items: T[]
  /** Pagination metadata */
  pagination: PaginationMeta
}

/**
 * Sort configuration
 */
export interface SortConfig {
  /** Field to sort by */
  field: string
  /** Sort direction */
  direction: 'asc' | 'desc'
  /** Sort label for display */
  label?: string
}

/**
 * Filter configuration for UI components
 */
export interface FilterConfig<T = Record<string, unknown>> {
  /** Current filter values */
  values: T
  /** Available filter options */
  options: Record<keyof T, Array<{
    label: string
    value: unknown
    count?: number
  }>>
  /** Whether filters are active */
  is_active: boolean
  /** Number of active filters */
  active_count: number
}

// =====================================================
// QUERY AND MUTATION TYPES
// =====================================================

/**
 * Database query options
 */
export interface QueryOptions {
  /** Select specific columns */
  select?: string
  /** Filter conditions */
  where?: Record<string, unknown>
  /** Sort configuration */
  order?: Array<{
    column: string
    ascending?: boolean
    nullsFirst?: boolean
  }>
  /** Limit number of results */
  limit?: number
  /** Skip number of results */
  offset?: number
  /** Include related data */
  include?: string[]
}

/**
 * Mutation options for create/update operations
 */
export interface MutationOptions {
  /** Whether to return updated data */
  returning?: boolean
  /** Conflict resolution strategy */
  on_conflict?: 'ignore' | 'update' | 'error'
  /** Fields to update on conflict */
  update_fields?: string[]
  /** Whether to validate data before mutation */
  validate?: boolean
}

// =====================================================
// UTILITY TYPE HELPERS
// =====================================================

/**
 * Makes specified fields optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Makes specified fields required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Extracts the type of array elements
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never

/**
 * Creates a type with nullable fields
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null
}

/**
 * Removes null and undefined from type
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * Creates a deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Creates a type with all string values
 */
export type StringRecord<T extends Record<string, unknown>> = {
  [K in keyof T]: string
}

// =====================================================
// ERROR HANDLING UTILITIES
// =====================================================

/**
 * Error boundary error information
 */
export interface ErrorBoundaryError {
  /** Error message */
  message: string
  /** Error stack trace */
  stack?: string
  /** Component stack trace */
  component_stack?: string
  /** Additional error info */
  error_info?: {
    component_stack: string
  }
  /** Error timestamp */
  timestamp: string
  /** User ID (if authenticated) */
  user_id?: string
  /** Current URL */
  url?: string
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field path */
  field: string
  /** Error message */
  message: string
  /** Error code */
  code: string
  /** Expected value type */
  expected?: string
  /** Received value */
  received?: unknown
}

// =====================================================
// ENVIRONMENT AND CONFIGURATION TYPES
// =====================================================

/**
 * Application environment configuration
 */
export interface AppConfig {
  /** Application environment */
  environment: 'development' | 'staging' | 'production'
  /** Application name */
  app_name: string
  /** Application version */
  version: string
  /** API base URL */
  api_url: string
  /** Supabase configuration */
  supabase: {
    url: string
    anon_key: string
  }
  /** Feature flags */
  features: {
    /** Enable analytics tracking */
    analytics: boolean
    /** Enable debug mode */
    debug: boolean
    /** Enable experimental features */
    experimental: boolean
  }
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  /** UI theme preference */
  theme: 'light' | 'dark' | 'system'
  /** Language preference */
  language: 'en' | 'ka'
  /** Timezone */
  timezone: string
  /** Currency display preferences */
  currency: {
    /** Currency symbol */
    symbol: string
    /** Decimal places */
    decimals: number
    /** Position of symbol */
    symbol_position: 'before' | 'after'
  }
  /** Date format preference */
  date_format: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd'
  /** Notification preferences */
  notifications: {
    /** Email notifications enabled */
    email: boolean
    /** Push notifications enabled */
    push: boolean
    /** Reminder notifications enabled */
    reminders: boolean
  }
}

// =====================================================
// TYPE GUARDS AND VALIDATION HELPERS
// =====================================================

/**
 * Type guard to check if value is an ApiError
 */
export const isApiError = (value: unknown): value is ApiError => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as ApiError).code === 'string' &&
    typeof (value as ApiError).message === 'string'
  )
}

/**
 * Type guard to check if response is successful
 */
export const isSuccessResponse = <T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } => {
  return response.success && response.data !== null
}

/**
 * Type guard to check if response has error
 */
export const isErrorResponse = <T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: false; error: ApiError } => {
  return !response.success && response.error !== null
}

/**
 * Type guard to check if state is loading
 */
export const isLoadingState = <T>(
  state: AsyncState<T>
): state is AsyncState<T> & { is_loading: true } => {
  return state.is_loading
}

/**
 * Type guard to check if state has error
 */
export const isErrorState = <T>(
  state: AsyncState<T>
): state is AsyncState<T> & { error: string } => {
  return state.error !== null
}

/**
 * Type guard to check if state has data
 */
export const hasData = <T>(
  state: AsyncState<T>
): state is AsyncState<T> & { data: T } => {
  return state.data !== null
}