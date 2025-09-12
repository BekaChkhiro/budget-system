'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, AlertTriangle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format'
import { createTransactionAction } from '../actions'
import { useToast } from '@/hooks/use-toast'
import { Project, PaymentInstallment } from '@/types'
import { useProjects } from '@/hooks/use-projects'

const transactionSchema = z.object({
  amount: z.number().positive('თანხა უნდა იყოს დადებითი'),
  notes: z.string().min(1, 'აღწერა აუცილებელია'),
  project_id: z.string().min(1, 'პროექტის არჩევა აუცილებელია'),
  installment_id: z.string().optional(),
  transaction_date: z.date()
})

type TransactionFormData = z.infer<typeof transactionSchema>

export function TransactionForm() {
  const { toast } = useToast()
  const { projects, isLoading: projectsLoading } = useProjects()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [availableInstallments, setAvailableInstallments] = useState<PaymentInstallment[]>([])
  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null)
  const [validationWarnings, setValidationWarnings] = useState<{
    budgetExceeded?: boolean
    installmentExceeded?: boolean
    remainingBudget?: number
    remainingInstallment?: number
  }>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingSubmission, setPendingSubmission] = useState<TransactionFormData | null>(null)

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      notes: '',
      project_id: '',
      installment_id: '',
      transaction_date: new Date()
    }
  })

  const watchedProjectId = form.watch('project_id')
  const watchedAmount = form.watch('amount')
  const watchedInstallmentId = form.watch('installment_id')

  // Update selected project and available installments
  useEffect(() => {
    if (watchedProjectId && projects) {
      const project = projects.find(p => p.id === watchedProjectId)
      setSelectedProject(project || null)
      
      // For now, we'll assume the project doesn't have installments loaded
      // This would need to be fetched from the database in a real implementation
      setAvailableInstallments([])
    } else {
      setSelectedProject(null)
      setAvailableInstallments([])
      setSelectedInstallment(null)
    }
  }, [watchedProjectId, projects])

  // Update selected installment
  useEffect(() => {
    if (watchedInstallmentId && availableInstallments.length > 0) {
      const installment = availableInstallments.find(inst => inst.id === watchedInstallmentId)
      setSelectedInstallment(installment || null)
    } else {
      setSelectedInstallment(null)
    }
  }, [watchedInstallmentId, availableInstallments])

  // Real-time validation against budgets
  useEffect(() => {
    if (!selectedProject || !watchedAmount) {
      setValidationWarnings({})
      return
    }

    const warnings: typeof validationWarnings = {}
    
    // For now, we'll calculate total received from transactions
    // In a real app, this would come from a database view or calculated field
    const projectReceived = 0 // This should be calculated from existing transactions
    const newProjectTotal = projectReceived + watchedAmount
    const remainingBudget = selectedProject.total_budget - newProjectTotal
    
    if (newProjectTotal > selectedProject.total_budget) {
      warnings.budgetExceeded = true
      warnings.remainingBudget = remainingBudget
    }

    // Check installment budget if selected
    if (selectedInstallment) {
      // For now, we'll calculate total paid from transactions
      const installmentReceived = 0 // This should be calculated from existing transactions
      const newInstallmentTotal = installmentReceived + watchedAmount
      const remainingInstallment = selectedInstallment.amount - newInstallmentTotal
      
      if (newInstallmentTotal > selectedInstallment.amount) {
        warnings.installmentExceeded = true
        warnings.remainingInstallment = remainingInstallment
      }
    }

    setValidationWarnings(warnings)
  }, [selectedProject, selectedInstallment, watchedAmount])

  const onSubmit = (data: TransactionFormData) => {
    // Check for validation warnings
    if (validationWarnings.budgetExceeded || validationWarnings.installmentExceeded) {
      setPendingSubmission(data)
      setShowConfirmDialog(true)
      return
    }

    // Direct submission without warnings
    handleSubmit(data)
  }

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      const result = await createTransactionAction(data)
      
      if (result.success) {
        toast({
          title: "წარმატება!",
          description: "ტრანზაქცია წარმატებით დაემატა",
        })
        form.reset()
        setShowConfirmDialog(false)
        setPendingSubmission(null)
      } else {
        toast({
          title: "შეცდომა",
          description: result.error || "ტრანზაქციის დამატება ვერ მოხერხდა",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "შეცდომა",
        description: "დაფიქსირდა უცნობი შეცდომა",
        variant: "destructive",
      })
    }
  }

  const handleConfirmedSubmit = () => {
    if (pendingSubmission) {
      handleSubmit(pendingSubmission)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>ახალი ტრანზაქცია</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project">პროექტი *</Label>
              <Select
                value={form.watch('project_id')}
                onValueChange={(value) => form.setValue('project_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="აირჩიეთ პროექტი" />
                </SelectTrigger>
                <SelectContent>
                  {projectsLoading ? (
                    <SelectItem value="" disabled>
                      იტვირთება...
                    </SelectItem>
                  ) : projects?.length ? (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{project.title}</span>
                          <Badge variant="outline" className="ml-2">
                            {formatCurrency(project.total_budget)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      პროექტები არ მოიძებნა
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.project_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.project_id.message}
                </p>
              )}
            </div>

            {/* Installment Selection */}
            {selectedProject?.payment_type === 'installment' && availableInstallments.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="installment">ვადა</Label>
                <Select
                  value={form.watch('installment_id')}
                  onValueChange={(value) => form.setValue('installment_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="აირჩიეთ ვადა (არასავალდებულო)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInstallments.map((installment) => {
                      const remaining = installment.amount // For now, assume full amount remaining
                      return (
                        <SelectItem key={installment.id} value={installment.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              ვადა {installment.installment_number}
                              {installment.due_date && ` - ${format(new Date(installment.due_date), 'dd MMM', { locale: ka })}`}
                            </span>
                            <Badge variant={remaining > 0 ? "secondary" : "outline"} className="ml-2">
                              {formatCurrency(remaining)}
                            </Badge>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">თანხა *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            {/* Real-time Validation Warnings */}
            {Object.keys(validationWarnings).length > 0 && (
              <div className="space-y-2">
                {validationWarnings.budgetExceeded && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      ბიუჯეტს გადააჭარბებს {formatCurrency(Math.abs(validationWarnings.remainingBudget!))} -ით
                    </span>
                  </div>
                )}
                {validationWarnings.installmentExceeded && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">
                      ვადას გადააჭარბებს {formatCurrency(Math.abs(validationWarnings.remainingInstallment!))} -ით
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Project Budget Info */}
            {selectedProject && (
              <div className="p-3 rounded-md bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ბიუჯეტი:</span>
                  <span className="font-medium">{formatCurrency(selectedProject.total_budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>მიღებული:</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>დარჩენილი:</span>
                  <span className={cn(
                    (selectedProject.total_budget - 0) < 0 && "text-destructive"
                  )}>
                    {formatCurrency(selectedProject.total_budget - 0)}
                  </span>
                </div>
              </div>
            )}

            {/* Selected Installment Info */}
            {selectedInstallment && (
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ვადის თანხა:</span>
                  <span className="font-medium">{formatCurrency(selectedInstallment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>გადახდილი:</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>დარჩენილი:</span>
                  <span className={cn(
                    (selectedInstallment.amount - 0) < 0 && "text-destructive"
                  )}>
                    {formatCurrency(selectedInstallment.amount - 0)}
                  </span>
                </div>
                {selectedInstallment.due_date && (
                  <div className="flex justify-between text-sm">
                    <span>თარიღი:</span>
                    <span>{format(new Date(selectedInstallment.due_date), 'dd MMMM yyyy', { locale: ka })}</span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">აღწერა *</Label>
              <Textarea
                id="notes"
                placeholder="ტრანზაქციის აღწერა"
                {...form.register('notes')}
              />
              {form.formState.errors.notes && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.notes.message}
                </p>
              )}
            </div>

            {/* Transaction Date */}
            <div className="space-y-2">
              <Label>თარიღი *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch('transaction_date') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('transaction_date') ? (
                      format(form.watch('transaction_date'), 'dd MMMM yyyy', { locale: ka })
                    ) : (
                      <span>აირჩიეთ თარიღი</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('transaction_date')}
                    onSelect={(date) => form.setValue('transaction_date', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'მიმდინარეობს...' : 'ტრანზაქციის დამატება'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Budget Overages */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ბიუჯეტის გადაჭარბება
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                ეს ტრანზაქცია გადააჭარბებს დადგენილ ბიუჯეტს:
              </p>
              <ul className="space-y-1 ml-4">
                {validationWarnings.budgetExceeded && (
                  <li>• პროექტის ბიუჯეტს გადააჭარბებს {formatCurrency(Math.abs(validationWarnings.remainingBudget!))} -ით</li>
                )}
                {validationWarnings.installmentExceeded && (
                  <li>• ვადის ბიუჯეტს გადააჭარბებს {formatCurrency(Math.abs(validationWarnings.remainingInstallment!))} -ით</li>
                )}
              </ul>
              <p className="text-sm text-muted-foreground">
                გსურთ მაინც განაგრძოთ?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              გაუქმება
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit}>
              დასტური და დამატება
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}