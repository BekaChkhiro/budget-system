'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const transactionSchema = z.object({
  amount: z.number().positive('თანხა უნდა იყოს დადებითი'),
  notes: z.string().min(1, 'აღწერა აუცილებელია'),
  project_id: z.string().min(1, 'პროექტის არჩევა აუცილებელია'),
  installment_id: z.string().optional(),
  transaction_date: z.date()
})

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

export async function createTransactionAction(
  formData: z.infer<typeof transactionSchema>
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Validate form data
    const validatedData = transactionSchema.parse(formData)

    // Get current user (you may need to implement user authentication)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'ავთენტიფიკაცია აუცილებელია'
      }
    }

    // Start a transaction to ensure data consistency
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert([{
        amount: validatedData.amount,
        notes: validatedData.notes,
        project_id: validatedData.project_id,
        installment_id: validatedData.installment_id || null,
        transaction_date: validatedData.transaction_date.toISOString(),
        created_at: new Date().toISOString()
      }])
      .select('*')
      .single()

    if (transactionError) {
      console.error('Transaction creation error:', transactionError)
      return {
        success: false,
        error: 'ტრანზაქციის შექმნა ვერ მოხერხდა'
      }
    }

    // Update installment is_paid status if installment is specified
    if (validatedData.installment_id) {
      // Check if this payment completes the installment
      const { data: installment, error: installmentError } = await supabase
        .from('payment_installments')
        .select('amount')
        .eq('id', validatedData.installment_id)
        .single()

      if (!installmentError && installment) {
        // Get total paid for this installment
        const { data: installmentTransactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('installment_id', validatedData.installment_id)

        if (!transactionsError && installmentTransactions) {
          const totalPaid = installmentTransactions.reduce((sum, t) => sum + t.amount, 0)
          
          // Mark installment as paid if total amount is reached
          if (totalPaid >= installment.amount) {
            await supabase
              .from('payment_installments')
              .update({ is_paid: true })
              .eq('id', validatedData.installment_id)
          }
        }
      }
    }

    // Revalidate relevant pages
    revalidatePath('/transactions')
    revalidatePath('/projects')
    revalidatePath('/')

    return {
      success: true,
      data: transaction
    }

  } catch (error) {
    console.error('Create transaction action error:', error)
    
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((e: any) => e.message).join(', ')
      return {
        success: false,
        error: `ვალიდაციის შეცდომა: ${errorMessages}`
      }
    }

    return {
      success: false,
      error: 'დაფიქსირდა უცნობი შეცდომა'
    }
  }
}

export async function deleteTransactionAction(
  transactionId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'ავთენტიფიკაცია აუცილებელია'
      }
    }

    // Get the transaction details before deletion for rollback calculations
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (fetchError || !transaction) {
      return {
        success: false,
        error: 'ტრანზაქცია ვერ მოიძებნა'
      }
    }

    // Delete the transaction
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)

    if (deleteError) {
      console.error('Transaction deletion error:', deleteError)
      return {
        success: false,
        error: 'ტრანზაქციის წაშლა ვერ მოხერხდა'
      }
    }

    // Update installment is_paid status if installment was specified
    if (transaction.installment_id) {
      // Recalculate total paid for this installment after deletion
      const { data: installmentTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('installment_id', transaction.installment_id)

      const { data: installment, error: installmentError } = await supabase
        .from('payment_installments')
        .select('amount')
        .eq('id', transaction.installment_id)
        .single()

      if (!transactionsError && !installmentError && installment && installmentTransactions) {
        const totalPaid = installmentTransactions.reduce((sum, t) => sum + t.amount, 0)
        
        // Update installment payment status
        await supabase
          .from('payment_installments')
          .update({ is_paid: totalPaid >= installment.amount })
          .eq('id', transaction.installment_id)
      }
    }

    // Revalidate relevant pages
    revalidatePath('/transactions')
    revalidatePath('/projects')
    revalidatePath('/')

    return {
      success: true
    }

  } catch (error) {
    console.error('Delete transaction action error:', error)
    return {
      success: false,
      error: 'დაფიქსირდა უცნობი შეცდომა'
    }
  }
}

export async function getTransactionStatsAction(): Promise<ActionResult<{
  totalPaid: number
  thisMonthPaid: number
  transactionCount: number
  averageTransaction: number
}>> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'ავთენტიფიკაცია აუცილებელია'
      }
    }

    // Get current month bounds
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get all transactions for the user
    const { data: allTransactions, error: allError } = await supabase
      .from('transactions')
      .select('amount, transaction_date')

    if (allError) {
      console.error('All transactions fetch error:', allError)
      return {
        success: false,
        error: 'სტატისტიკის მოძიება ვერ მოხერხდა'
      }
    }

    // Get this month's transactions
    const { data: monthTransactions, error: monthError } = await supabase
      .from('transactions')
      .select('amount')
      .gte('transaction_date', startOfMonth.toISOString())
      .lte('transaction_date', endOfMonth.toISOString())

    if (monthError) {
      console.error('Monthly transactions fetch error:', monthError)
      return {
        success: false,
        error: 'ყოველთვიური სტატისტიკის მოძიება ვერ მოხერხდა'
      }
    }

    // Calculate totals
    const totalPaid = allTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0
    const thisMonthPaid = monthTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0
    const transactionCount = allTransactions?.length || 0
    const averageTransaction = transactionCount > 0 ? totalPaid / transactionCount : 0

    return {
      success: true,
      data: {
        totalPaid,
        thisMonthPaid,
        transactionCount,
        averageTransaction
      }
    }

  } catch (error) {
    console.error('Get transaction stats action error:', error)
    return {
      success: false,
      error: 'დაფიქსირდა უცნობი შეცდომა'
    }
  }
}