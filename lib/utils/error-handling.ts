import { PostgrestError } from '@supabase/supabase-js'

// =====================================================
// CUSTOM ERROR CLASSES
// =====================================================

/**
 * Custom API error class with Georgian messages
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Validation error class for form validation
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

/**
 * Business logic error class
 */
export class BusinessLogicError extends ApiError {
  constructor(message: string, code?: string) {
    super(message, code, 422)
    this.name = 'BusinessLogicError'
  }
}

// =====================================================
// ERROR MAPPING
// =====================================================

/**
 * Maps Supabase error codes to Georgian error messages
 */
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  // Constraint violations
  '23505': 'ასეთი ჩანაწერი უკვე არსებობს',
  '23503': 'დაკავშირებული მონაცემები არსებობს და წაშლა შეუძლებელია',
  '23502': 'აუცილებელი ველი ცარიელია',
  '23514': 'მონაცემები არ აკმაყოფილებს მოთხოვნებს',
  
  // PostgREST errors
  'PGRST116': 'ჩანაწერი ვერ მოიძებნა',
  'PGRST301': 'უფლება არ გაქვთ',
  'PGRST204': 'ცარიელი შედეგი',
  'PGRST103': 'არასწორი პარამეტრები',
  
  // Network/connection errors
  'NETWORK_ERROR': 'ინტერნეტ კავშირის პრობლემა',
  'TIMEOUT_ERROR': 'მოთხოვნა დროში ამოიწურა',
  
  // Authentication errors
  'INVALID_CREDENTIALS': 'არასწორი მომხმარებლის მონაცემები',
  'TOKEN_EXPIRED': 'სესია ამოიწურა, გთხოვთ ხელახლა შეხვიდეთ',
  'INSUFFICIENT_PRIVILEGES': 'არასაკმარისი უფლებები',
} as const

/**
 * Business logic specific error messages
 */
const BUSINESS_ERROR_MESSAGES: Record<string, string> = {
  'INSUFFICIENT_FUNDS': 'თანხა აღემატება დარჩენილ ბალანსს',
  'INSTALLMENT_MISMATCH': 'განვადების ჯამი არ უდრის პროექტის ბიუჯეტს',
  'DUPLICATE_INSTALLMENT': 'ასეთი განვადება უკვე არსებობს',
  'INVALID_PAYMENT_TYPE': 'არასწორი გადახდის ტიპი',
  'PROJECT_ALREADY_COMPLETED': 'პროექტი უკვე დასრულებულია',
  'INSTALLMENT_ALREADY_PAID': 'განვადება უკვე გადახდილია',
  'INVALID_DATE_RANGE': 'არასწორი თარიღების შუალედი',
  'MAX_INSTALLMENTS_EXCEEDED': 'განვადებების მაქსიმალური რაოდენობა გადაჭარბებულია',
} as const

// =====================================================
// ERROR HANDLING FUNCTIONS
// =====================================================

/**
 * Handles Supabase PostgrestError and converts to Georgian message
 * @param error - Supabase error object
 * @param defaultMessage - Default error message if no mapping found
 * @returns Never (throws ApiError)
 */
export function handleSupabaseError(
  error: PostgrestError | Error | unknown,
  defaultMessage = 'დაფიქსირდა შეცდომა'
): never {
  console.error('Supabase error:', error)
  
  if (!error) {
    throw new ApiError(defaultMessage)
  }

  // Handle PostgrestError
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const postgrestError = error as PostgrestError
    const message = SUPABASE_ERROR_MESSAGES[postgrestError.code] || defaultMessage
    
    throw new ApiError(
      message,
      postgrestError.code,
      undefined,
      {
        hint: postgrestError.hint,
        details: postgrestError.details,
        message: postgrestError.message,
      }
    )
  }

  // Handle regular Error objects
  if (error instanceof Error) {
    throw new ApiError(error.message || defaultMessage)
  }

  // Handle unknown errors
  throw new ApiError(defaultMessage)
}

/**
 * Handles business logic errors with Georgian messages
 * @param code - Business error code
 * @param customMessage - Optional custom message
 */
export function handleBusinessError(
  code: keyof typeof BUSINESS_ERROR_MESSAGES,
  customMessage?: string
): never {
  const message = customMessage || BUSINESS_ERROR_MESSAGES[code] || 'ბიზნეს ლოგიკის შეცდომა'
  throw new BusinessLogicError(message, code)
}

/**
 * Generic wrapper for async operations with consistent error handling
 * @param fn - Async function to execute
 * @param errorMessage - Custom error message on failure
 * @returns Promise with result or throws ApiError
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    // Re-throw if already an ApiError
    if (error instanceof ApiError) {
      throw error
    }
    
    // Handle Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      handleSupabaseError(error, errorMessage)
    }
    
    // Handle other errors
    console.error('Unexpected error:', error)
    throw new ApiError(errorMessage || 'დაფიქსირდა შეცდომა')
  }
}

/**
 * Wrapper for operations that might have network timeouts
 * @param fn - Async function to execute
 * @param timeout - Timeout in milliseconds (default: 30000)
 * @param errorMessage - Custom timeout error message
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeout = 30000,
  errorMessage = 'მოთხოვნა დროში ამოიწურა'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new ApiError(errorMessage, 'TIMEOUT_ERROR')), timeout)
  })

  try {
    return await Promise.race([fn(), timeoutPromise])
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(errorMessage, 'TIMEOUT_ERROR')
  }
}

/**
 * Validates required fields and throws ValidationError if any are missing
 * @param data - Object to validate
 * @param requiredFields - Array of required field names
 * @param customMessages - Optional custom error messages for fields
 */
export function validateRequired(
  data: Record<string, unknown>,
  requiredFields: string[],
  customMessages?: Record<string, string>
): void {
  const fieldErrors: Record<string, string[]> = {}
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].toString().trim())) {
      const message = customMessages?.[field] || `${field} აუცილებელია`
      fieldErrors[field] = [message]
    }
  })
  
  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError('ვალიდაციის შეცდომა', fieldErrors)
  }
}

/**
 * Validates positive number values
 * @param value - Number to validate
 * @param fieldName - Field name for error message
 * @param min - Minimum allowed value (default: 0.01)
 */
export function validatePositiveNumber(
  value: unknown,
  fieldName: string,
  min = 0.01
): void {
  if (typeof value !== 'number' || isNaN(value) || value < min) {
    throw new ValidationError(`${fieldName} დადებითი რიცხვი უნდა იყოს`)
  }
}

/**
 * Validates date strings and ensures they're in valid range
 * @param date - Date string to validate
 * @param fieldName - Field name for error message
 * @param allowPast - Whether past dates are allowed (default: true)
 * @param allowFuture - Whether future dates are allowed (default: true)
 */
export function validateDate(
  date: unknown,
  fieldName: string,
  allowPast = true,
  allowFuture = true
): void {
  if (typeof date !== 'string') {
    throw new ValidationError(`${fieldName} თარიღის ფორმატში უნდა იყოს`)
  }

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    throw new ValidationError(`${fieldName} არასწორი თარიღის ფორმატია`)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const inputDate = new Date(date)
  inputDate.setHours(0, 0, 0, 0)

  if (!allowPast && inputDate < today) {
    throw new ValidationError(`${fieldName} მომავალში უნდა იყოს`)
  }

  if (!allowFuture && inputDate > today) {
    throw new ValidationError(`${fieldName} წარსულში ან დღეს უნდა იყოს`)
  }
}

// =====================================================
// ERROR FORMATTING UTILITIES
// =====================================================

/**
 * Formats error for client display
 * @param error - Error object
 * @returns Formatted error object for UI
 */
export function formatErrorForClient(error: unknown) {
  if (error instanceof ValidationError) {
    return {
      type: 'validation',
      message: error.message,
      fieldErrors: error.fieldErrors,
      code: error.code,
    }
  }

  if (error instanceof BusinessLogicError) {
    return {
      type: 'business',
      message: error.message,
      code: error.code,
    }
  }

  if (error instanceof ApiError) {
    return {
      type: 'api',
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  // Handle unknown errors
  console.error('Unknown error:', error)
  return {
    type: 'unknown',
    message: 'დაფიქსირდა შეცდომა',
    code: 'UNKNOWN_ERROR',
  }
}

/**
 * Checks if error is retryable (network issues, timeouts, etc.)
 * @param error - Error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'PGRST301', // Temporary auth issues
    ]
    return retryableCodes.includes(error.code || '')
  }
  
  return false
}

/**
 * Gets user-friendly error message from any error
 * @param error - Error object
 * @param fallback - Fallback message
 * @returns User-friendly error message in Georgian
 */
export function getErrorMessage(
  error: unknown, 
  fallback = 'დაფიქსირდა შეცდომა'
): string {
  if (error instanceof ApiError) {
    return error.message
  }
  
  if (error instanceof Error) {
    // Try to map common error messages
    const message = error.message.toLowerCase()
    if (message.includes('network')) {
      return 'ქსელის შეცდომა'
    }
    if (message.includes('timeout')) {
      return 'მოთხოვნა დროში ამოიწურა'
    }
    if (message.includes('unauthorized')) {
      return 'ავტორიზაციის შეცდომა'
    }
    
    return error.message
  }
  
  return fallback
}