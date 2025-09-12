import { z } from 'zod'

// =====================================================
// VALIDATION SCHEMAS WITH GEORGIAN ERROR MESSAGES
// =====================================================

/**
 * Project creation validation schema
 */
export const projectFormSchema = z.object({
  title: z.string()
    .min(3, 'პროექტის სახელი მინიმუმ 3 სიმბოლო უნდა იყოს')
    .max(255, 'პროექტის სახელი მაქსიმუმ 255 სიმბოლო უნდა იყოს')
    .trim(),
  
  total_budget: z.number()
    .positive('ბიუჯეტი დადებითი რიცხვი უნდა იყოს')
    .multipleOf(0.01, 'მაქსიმუმ 2 ათწილადი ციფრი დასაშვებია')
    .max(999999999.99, 'ბიუჯეტი ძალიან დიდია'),
  
  payment_type: z.enum(['single', 'installment'], {
    message: 'აირჩიეთ გადახდის ტიპი'
  }),
  
  installments: z.array(
    z.object({
      amount: z.number()
        .positive('განვადების თანხა დადებითი უნდა იყოს')
        .multipleOf(0.01, 'მაქსიმუმ 2 ათწილადი ციფრი დასაშვებია'),
      
      due_date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'არასწორი თარიღის ფორმატი (YYYY-MM-DD)')
        .refine((date) => {
          const today = new Date()
          const dueDate = new Date(date)
          return dueDate >= today
        }, 'თარიღი მომავალში უნდა იყოს')
    })
  ).optional()
}).refine(
  (data) => {
    // If payment type is installment, installments are required
    if (data.payment_type === 'installment') {
      return data.installments && data.installments.length > 0
    }
    return true
  },
  {
    message: 'განვადებით გადახდისთვის მინიმუმ ერთი განვადება აუცილებელია',
    path: ['installments']
  }
).refine(
  (data) => {
    // If installments exist, their sum must equal total budget
    if (data.installments && data.installments.length > 0) {
      const installmentsSum = data.installments.reduce((sum, installment) => sum + installment.amount, 0)
      return Math.abs(installmentsSum - data.total_budget) < 0.01
    }
    return true
  },
  {
    message: 'განვადების ჯამი უნდა უდრიდეს მთლიან ბიუჯეტს',
    path: ['installments']
  }
).refine(
  (data) => {
    // Validate installments are in chronological order
    if (data.installments && data.installments.length > 1) {
      for (let i = 1; i < data.installments.length; i++) {
        if (new Date(data.installments[i].due_date) <= new Date(data.installments[i - 1].due_date)) {
          return false
        }
      }
    }
    return true
  },
  {
    message: 'განვადებების თარიღები ქრონოლოგიური თანმიმდევრობით უნდა იყოს',
    path: ['installments']
  }
)

/**
 * Project update validation schema
 */
export const projectUpdateSchema = z.object({
  title: z.string()
    .min(3, 'პროექტის სახელი მინიმუმ 3 სიმბოლო უნდა იყოს')
    .max(255, 'პროექტის სახელი მაქსიმუმ 255 სიმბოლო უნდა იყოს')
    .trim()
    .optional(),
  
  total_budget: z.number()
    .positive('ბიუჯეტი დადებითი რიცხვი უნდა იყოს')
    .multipleOf(0.01, 'მაქსიმუმ 2 ათწილადი ციფრი დასაშვებია')
    .max(999999999.99, 'ბიუჯეტი ძალიან დიდია')
    .optional(),
  
  payment_type: z.enum(['single', 'installment'], {
    message: 'აირჩიეთ გადახდის ტიპი'
  }).optional()
})

/**
 * Transaction creation validation schema
 */
export const transactionFormSchema = z.object({
  project_id: z.string()
    .uuid('არასწორი პროექტის ID'),
  
  installment_id: z.string()
    .uuid('არასწორი განვადების ID')
    .optional()
    .nullable(),
  
  amount: z.number()
    .positive('თანხა დადებითი უნდა იყოს')
    .multipleOf(0.01, 'მაქსიმუმ 2 ათწილადი ციფრი დასაშვებია')
    .max(999999999.99, 'თანხა ძალიან დიდია'),
  
  transaction_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'არასწორი თარიღის ფორმატი (YYYY-MM-DD)')
    .refine((date) => {
      const transactionDate = new Date(date)
      const today = new Date()
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(today.getFullYear() - 1)
      
      return transactionDate <= today && transactionDate >= oneYearAgo
    }, 'თარიღი უნდა იყოს წინა წლიდან დღემდე'),
  
  notes: z.string()
    .max(1000, 'შენიშვნა მაქსიმუმ 1000 სიმბოლო უნდა იყოს')
    .optional()
    .nullable()
})

/**
 * Installment creation validation schema
 */
export const installmentFormSchema = z.object({
  project_id: z.string()
    .uuid('არასწორი პროექტის ID'),
  
  installment_number: z.number()
    .int('განვადების ნომერი მთელი რიცხვი უნდა იყოს')
    .positive('განვადების ნომერი დადებითი უნდა იყოს'),
  
  amount: z.number()
    .positive('თანხა დადებითი უნდა იყოს')
    .multipleOf(0.01, 'მაქსიმუმ 2 ათწილადი ციფრი დასაშვებია')
    .max(999999999.99, 'თანხა ძალიან დიდია'),
  
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'არასწორი თარიღის ფორმატი (YYYY-MM-DD)')
    .refine((date) => {
      const today = new Date()
      const dueDate = new Date(date)
      return dueDate >= today
    }, 'თარიღი მომავალში უნდა იყოს')
})

/**
 * Installment update validation schema
 */
export const installmentUpdateSchema = z.object({
  amount: z.number()
    .positive('თანხა დადებითი უნდა იყოს')
    .multipleOf(0.01, 'მაქსიმუმ 2 ათწილადი ციფრი დასაშვებია')
    .max(999999999.99, 'თანხა ძალიან დიდია')
    .optional(),
  
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'არასწორი თარიღის ფორმატი (YYYY-MM-DD)')
    .refine((date) => {
      const today = new Date()
      const dueDate = new Date(date)
      return dueDate >= today
    }, 'თარიღი მომავალში უნდა იყოს')
    .optional(),
  
  is_paid: z.boolean()
    .optional()
})

// =====================================================
// FILTER VALIDATION SCHEMAS
// =====================================================

/**
 * Project filters validation schema
 */
export const projectFiltersSchema = z.object({
  payment_type: z.enum(['single', 'installment']).optional(),
  is_completed: z.boolean().optional(),
  min_budget: z.number().positive().optional(),
  max_budget: z.number().positive().optional(),
  search: z.string().max(255).optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'total_budget', 'payment_progress']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional()
}).refine(
  (data) => {
    if (data.min_budget && data.max_budget) {
      return data.min_budget <= data.max_budget
    }
    return true
  },
  {
    message: 'მინიმალური ბიუჯეტი მაქსიმალურზე მეტი ვერ იქნება',
    path: ['min_budget']
  }
)

/**
 * Transaction filters validation schema
 */
export const transactionFiltersSchema = z.object({
  project_id: z.string().uuid().optional(),
  installment_id: z.string().uuid().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  min_amount: z.number().positive().optional(),
  max_amount: z.number().positive().optional(),
  search: z.string().max(255).optional(),
  sort_by: z.enum(['transaction_date', 'created_at', 'amount']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional()
}).refine(
  (data) => {
    if (data.date_from && data.date_to) {
      return new Date(data.date_from) <= new Date(data.date_to)
    }
    return true
  },
  {
    message: 'საწყისი თარიღი საბოლოო თარიღზე გვიან ვერ იქნება',
    path: ['date_from']
  }
).refine(
  (data) => {
    if (data.min_amount && data.max_amount) {
      return data.min_amount <= data.max_amount
    }
    return true
  },
  {
    message: 'მინიმალური თანხა მაქსიმალურზე მეტი ვერ იქნება',
    path: ['min_amount']
  }
)

/**
 * Installment filters validation schema
 */
export const installmentFiltersSchema = z.object({
  project_id: z.string().uuid().optional(),
  is_paid: z.boolean().optional(),
  is_overdue: z.boolean().optional(),
  due_date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  due_date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort_by: z.enum(['due_date', 'installment_number', 'amount']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional()
}).refine(
  (data) => {
    if (data.due_date_from && data.due_date_to) {
      return new Date(data.due_date_from) <= new Date(data.due_date_to)
    }
    return true
  },
  {
    message: 'საწყისი თარიღი საბოლოო თარიღზე გვიან ვერ იქნება',
    path: ['due_date_from']
  }
)

// =====================================================
// PAGINATION VALIDATION SCHEMA
// =====================================================

/**
 * Pagination parameters validation schema
 */
export const paginationSchema = z.object({
  page: z.number()
    .int('გვერდის ნომერი მთელი რიცხვი უნდა იყოს')
    .positive('გვერდის ნომერი დადებითი უნდა იყოს')
    .max(10000, 'გვერდის ნომერი ძალიან დიდია'),
  
  per_page: z.number()
    .int('ელემენტების რაოდენობა მთელი რიცხვი უნდა იყოს')
    .positive('ელემენტების რაოდენობა დადებითი უნდა იყოს')
    .min(1, 'მინიმუმ 1 ელემენტი უნდა იყოს')
    .max(100, 'მაქსიმუმ 100 ელემენტი შეიძლება')
})

// =====================================================
// BUSINESS LOGIC VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates that transaction amount doesn't exceed remaining installment amount
 */
export const validateTransactionAmount = (
  transactionAmount: number,
  installmentAmount: number,
  alreadyPaidAmount: number
) => {
  const remainingAmount = installmentAmount - alreadyPaidAmount
  return transactionAmount <= remainingAmount
}

/**
 * Validates that installment amounts sum equals project budget
 */
export const validateInstallmentsSum = (
  installments: Array<{ amount: number }>,
  projectBudget: number
) => {
  const sum = installments.reduce((total, installment) => total + installment.amount, 0)
  return Math.abs(sum - projectBudget) < 0.01
}

/**
 * Validates that due dates are in chronological order
 */
export const validateChronologicalOrder = (
  installments: Array<{ due_date: string }>
) => {
  for (let i = 1; i < installments.length; i++) {
    if (new Date(installments[i].due_date) <= new Date(installments[i - 1].due_date)) {
      return false
    }
  }
  return true
}

// =====================================================
// TYPE INFERENCE HELPERS
// =====================================================

// Infer types from schemas for TypeScript
export type ProjectFormData = z.infer<typeof projectFormSchema>
export type ProjectUpdateData = z.infer<typeof projectUpdateSchema>
export type TransactionFormData = z.infer<typeof transactionFormSchema>
export type InstallmentFormData = z.infer<typeof installmentFormSchema>
export type InstallmentUpdateData = z.infer<typeof installmentUpdateSchema>
export type ProjectFiltersData = z.infer<typeof projectFiltersSchema>
export type TransactionFiltersData = z.infer<typeof transactionFiltersSchema>
export type InstallmentFiltersData = z.infer<typeof installmentFiltersSchema>
export type PaginationData = z.infer<typeof paginationSchema>

// =====================================================
// VALIDATION ERROR UTILITIES
// =====================================================

/**
 * Formats Zod validation errors for display
 */
export const formatValidationErrors = (error: z.ZodError) => {
  return error.issues.reduce((acc: Record<string, string>, err) => {
    const path = err.path.join('.')
    acc[path] = err.message
    return acc
  }, {} as Record<string, string>)
}

/**
 * Gets the first validation error message
 */
export const getFirstValidationError = (error: z.ZodError): string => {
  return error.issues[0]?.message || 'უცნობი შეცდომა'
}

/**
 * Checks if validation error exists for a specific field
 */
export const hasValidationError = (error: z.ZodError | null, field: string): boolean => {
  if (!error) return false
  return error.issues.some(err => err.path.join('.') === field)
}

/**
 * Gets validation error message for a specific field
 */
export const getFieldError = (error: z.ZodError | null, field: string): string | undefined => {
  if (!error) return undefined
  const fieldError = error.issues.find(err => err.path.join('.') === field)
  return fieldError?.message
}