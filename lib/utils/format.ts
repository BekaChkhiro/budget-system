/**
 * Formatting utilities for the budget tracker application
 * Handles currency, dates, percentages, and Georgian language formatting
 */

/**
 * Format currency amount with Georgian Lari symbol
 * @param amount - Amount to format
 * @param includeDecimals - Whether to include decimal places
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, includeDecimals = true): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 ₾'
  }

  const formatted = new Intl.NumberFormat('ka-GE', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount)

  return `${formatted} ₾`
}

/**
 * Format currency amount in compact form (1K, 1M, etc.)
 * @param amount - Amount to format
 * @returns Compact formatted currency string
 */
export function formatCurrencyCompact(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 ₾'
  }

  const formatted = new Intl.NumberFormat('ka-GE', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(amount)

  return `${formatted} ₾`
}

/**
 * Format date in Georgian locale
 * @param date - Date string or Date object
 * @param includeTime - Whether to include time
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, includeTime = false): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }

  return new Intl.DateTimeFormat('ka-GE', options).format(dateObj)
}

/**
 * Format date in short format (DD/MM/YYYY)
 * @param date - Date string or Date object
 * @returns Short formatted date string
 */
export function formatDateShort(date: string | Date): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ka-GE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj)
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 days")
 * @param date - Date string or Date object
 * @returns Relative time string in Georgian
 */
export function formatRelativeTime(date: string | Date): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const now = new Date()
  const diffMs = dateObj.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'დღეს'
  if (diffDays === 1) return 'ხვალ'
  if (diffDays === -1) return 'გუშინ'
  if (diffDays > 0) return `${diffDays} დღეში`
  if (diffDays < 0) return `${Math.abs(diffDays)} დღის წინ`
  
  return formatDateShort(date)
}

/**
 * Format percentage with Georgian locale
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%'
  }

  return new Intl.NumberFormat('ka-GE', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Format number with Georgian locale
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals = 0): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0'
  }

  return new Intl.NumberFormat('ka-GE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Get status badge variant based on payment status
 * @param dueDate - Due date string
 * @param isPaid - Whether the payment is paid
 * @returns Badge variant
 */
export function getPaymentStatusVariant(dueDate: string, isPaid = false): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (isPaid) return 'secondary'
  
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'destructive' // Overdue
  if (diffDays <= 3) return 'outline' // Due soon
  return 'default' // Normal
}

/**
 * Get status text based on payment status
 * @param dueDate - Due date string
 * @param isPaid - Whether the payment is paid
 * @returns Status text in Georgian
 */
export function getPaymentStatusText(dueDate: string, isPaid = false): string {
  if (isPaid) return 'გადახდილი'
  
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'ვადაგადაცილებული'
  if (diffDays === 0) return 'დღეს'
  if (diffDays === 1) return 'ხვალ'
  if (diffDays <= 7) return `${diffDays} დღეში`
  
  return formatDateShort(dueDate)
}

/**
 * Get progress bar color class based on completion percentage
 * @param percentage - Completion percentage (0-100)
 * @returns Tailwind color class
 */
export function getProgressColorClass(percentage: number): string {
  if (percentage >= 100) return 'bg-green-500'
  if (percentage >= 75) return 'bg-blue-500'
  if (percentage >= 50) return 'bg-yellow-500'
  if (percentage >= 25) return 'bg-orange-500'
  return 'bg-gray-300'
}

/**
 * Calculate days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days difference
 */
export function differenceInDays(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  
  const diffTime = d1.getTime() - d2.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Georgian month names
 */
export const GEORGIAN_MONTHS = [
  'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
  'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
]

/**
 * Georgian day names
 */
export const GEORGIAN_DAYS = [
  'კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'
]

/**
 * Format month and year in Georgian
 * @param date - Date string or Date object
 * @returns Formatted month and year
 */
export function formatMonthYear(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return ''
  
  const month = GEORGIAN_MONTHS[dateObj.getMonth()]
  const year = dateObj.getFullYear()
  
  return `${month} ${year}`
}