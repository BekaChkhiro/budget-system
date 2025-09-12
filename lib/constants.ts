import type { StatusBadgeConfig, DateRangePreset } from '@/types'

// =====================================================
// PAYMENT TYPE CONSTANTS
// =====================================================

/**
 * Payment type enumeration with Georgian labels
 */
export const PaymentType = {
  SINGLE: 'single',
  INSTALLMENT: 'installment',
} as const

export type PaymentTypeValue = typeof PaymentType[keyof typeof PaymentType]

/**
 * Payment type display labels in Georgian
 */
export const PAYMENT_TYPE_LABELS: Record<PaymentTypeValue, string> = {
  [PaymentType.SINGLE]: 'ერთიანი გადახდა',
  [PaymentType.INSTALLMENT]: 'განვადება',
} as const

/**
 * Payment type descriptions in Georgian
 */
export const PAYMENT_TYPE_DESCRIPTIONS: Record<PaymentTypeValue, string> = {
  [PaymentType.SINGLE]: 'პროექტის მთლიანი თანხის ერთბაშად გადახდა',
  [PaymentType.INSTALLMENT]: 'პროექტის თანხის რამდენიმე ნაწილად დაყოფა',
} as const

// =====================================================
// CURRENCY SETTINGS
// =====================================================

/**
 * Georgian Lari currency configuration
 */
export const CURRENCY = {
  /** Currency symbol */
  symbol: '₾',
  /** Currency code */
  code: 'GEL',
  /** Currency name in Georgian */
  name: 'ლარი',
  /** Currency name in English */
  name_en: 'Georgian Lari',
  /** Number of decimal places */
  decimals: 2,
  /** Symbol position */
  symbol_position: 'after' as const,
  /** Thousands separator */
  thousands_separator: ',',
  /** Decimal separator */
  decimal_separator: '.',
} as const

/**
 * Currency formatting options for Intl.NumberFormat
 */
export const CURRENCY_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: CURRENCY.code,
  currencyDisplay: 'symbol',
  minimumFractionDigits: CURRENCY.decimals,
  maximumFractionDigits: CURRENCY.decimals,
} as const

// =====================================================
// DATE AND TIME SETTINGS
// =====================================================

/**
 * Date formats for Georgian locale
 */
export const DATE_FORMATS = {
  /** Short date format (DD/MM/YYYY) */
  SHORT: 'dd/MM/yyyy',
  /** Medium date format (DD MMM YYYY) */
  MEDIUM: 'dd MMM yyyy',
  /** Long date format (DD MMMM YYYY) */
  LONG: 'dd MMMM yyyy',
  /** ISO date format (YYYY-MM-DD) */
  ISO: 'yyyy-MM-dd',
  /** Date with time (DD/MM/YYYY HH:mm) */
  WITH_TIME: 'dd/MM/yyyy HH:mm',
  /** Full date with time (DD MMMM YYYY, HH:mm) */
  FULL: 'dd MMMM yyyy, HH:mm',
} as const

/**
 * Georgian locale settings
 */
export const LOCALE_SETTINGS = {
  /** Primary locale code */
  primary: 'ka-GE',
  /** Fallback locale code */
  fallback: 'en-US',
  /** Timezone */
  timezone: 'Asia/Tbilisi',
  /** First day of week (Monday = 1) */
  first_day_of_week: 1,
} as const

/**
 * Date range presets for filtering (Georgian labels)
 */
export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: 'დღეს',
    value: 'today',
    range: {
      from: new Date(),
      to: new Date(),
    },
  },
  {
    label: 'გუშინ',
    value: 'yesterday',
    range: {
      from: new Date(Date.now() - 24 * 60 * 60 * 1000),
      to: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  },
  {
    label: 'ბოლო 7 დღე',
    value: 'last_7_days',
    range: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
  },
  {
    label: 'ბოლო 30 დღე',
    value: 'last_30_days',
    range: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
  },
  {
    label: 'ამ თვეში',
    value: 'this_month',
    range: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(),
    },
  },
  {
    label: 'წინა თვეში',
    value: 'last_month',
    range: {
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      to: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    },
  },
  {
    label: 'ამ წელს',
    value: 'this_year',
    range: {
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(),
    },
  },
]

// =====================================================
// PAGINATION SETTINGS
// =====================================================

/**
 * Default pagination configuration
 */
export const PAGINATION_DEFAULTS = {
  /** Default page size */
  page_size: 20,
  /** Maximum page size allowed */
  max_page_size: 100,
  /** Minimum page size allowed */
  min_page_size: 5,
  /** Page size options for UI */
  page_size_options: [10, 20, 50, 100],
  /** Default page number */
  default_page: 1,
} as const

// =====================================================
// STATUS BADGE CONFIGURATIONS
// =====================================================

/**
 * Project completion status badges
 */
export const PROJECT_STATUS_BADGES: Record<string, StatusBadgeConfig> = {
  completed: {
    label: 'დასრულებული',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  in_progress: {
    label: 'მიმდინარე',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  pending: {
    label: 'მოლოდინში',
    variant: 'outline',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  overdue: {
    label: 'გადაცილებული',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
} as const

/**
 * Payment status badges
 */
export const PAYMENT_STATUS_BADGES: Record<string, StatusBadgeConfig> = {
  paid: {
    label: 'გადახდილი',
    variant: 'default',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  partial: {
    label: 'ნაწილობრივ',
    variant: 'secondary',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  unpaid: {
    label: 'გადაუხდელი',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
  overdue: {
    label: 'გადაცილებული',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
} as const

// =====================================================
// FORM VALIDATION LIMITS
// =====================================================

/**
 * Field length limits for forms
 */
export const FIELD_LIMITS = {
  /** Project title limits */
  project_title: {
    min: 3,
    max: 255,
  },
  /** Budget amount limits */
  budget_amount: {
    min: 0.01,
    max: 999_999_999.99,
  },
  /** Transaction notes limits */
  transaction_notes: {
    max: 1000,
  },
  /** Installment limits */
  installments: {
    min_count: 1,
    max_count: 50,
  },
  /** Date limits */
  date_range: {
    /** Maximum days in past for transactions */
    max_past_days: 365,
    /** Maximum days in future for due dates */
    max_future_days: 365 * 5, // 5 years
  },
} as const

// =====================================================
// API CONFIGURATION
// =====================================================

/**
 * API request configuration
 */
export const API_CONFIG = {
  /** Request timeout in milliseconds */
  timeout: 30000,
  /** Maximum retry attempts */
  max_retries: 3,
  /** Retry delay in milliseconds */
  retry_delay: 1000,
  /** Request headers */
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
} as const

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  /** Default cache duration in milliseconds */
  default_ttl: 5 * 60 * 1000, // 5 minutes
  /** Dashboard data cache duration */
  dashboard_ttl: 2 * 60 * 1000, // 2 minutes
  /** Project data cache duration */
  projects_ttl: 10 * 60 * 1000, // 10 minutes
  /** Static data cache duration */
  static_ttl: 60 * 60 * 1000, // 1 hour
} as const

// =====================================================
// UI CONFIGURATION
// =====================================================

/**
 * Animation and transition settings
 */
export const ANIMATION_CONFIG = {
  /** Default transition duration in milliseconds */
  default_duration: 200,
  /** Page transition duration */
  page_transition: 300,
  /** Modal transition duration */
  modal_transition: 150,
  /** Toast duration */
  toast_duration: 4000,
  /** Loading spinner delay */
  loading_delay: 500,
} as const

/**
 * Breakpoints for responsive design (matching Tailwind CSS)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

/**
 * Theme colors matching design system
 */
export const THEME_COLORS = {
  primary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    900: '#7f1d1d',
  },
} as const

// =====================================================
// ANALYTICS AND TRACKING
// =====================================================

/**
 * Analytics event names
 */
export const ANALYTICS_EVENTS = {
  // Project events
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',
  PROJECT_COMPLETED: 'project_completed',
  
  // Transaction events
  TRANSACTION_CREATED: 'transaction_created',
  TRANSACTION_UPDATED: 'transaction_updated',
  TRANSACTION_DELETED: 'transaction_deleted',
  
  // Installment events
  INSTALLMENT_PAID: 'installment_paid',
  INSTALLMENT_OVERDUE: 'installment_overdue',
  
  // UI events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  EXPORT_GENERATED: 'export_generated',
  FILTER_APPLIED: 'filter_applied',
  SEARCH_PERFORMED: 'search_performed',
} as const

// =====================================================
// ERROR CODES
// =====================================================

/**
 * Application-specific error codes
 */
export const ERROR_CODES = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  
  // Business logic errors
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INSTALLMENT_MISMATCH: 'INSTALLMENT_MISMATCH',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
} as const

// =====================================================
// FEATURE FLAGS
// =====================================================

/**
 * Feature flags for controlling application features
 */
export const FEATURE_FLAGS = {
  /** Enable advanced analytics */
  ADVANCED_ANALYTICS: false,
  /** Enable export functionality */
  EXPORT_ENABLED: true,
  /** Enable real-time updates */
  REALTIME_UPDATES: false,
  /** Enable experimental features */
  EXPERIMENTAL_FEATURES: false,
  /** Enable debugging tools */
  DEBUG_TOOLS: process.env.NODE_ENV === 'development',
} as const