'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectFormSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, AlertCircle, CheckCircle, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { TeamMemberMultiSelect } from './team-member-multi-select'

interface ProjectFormProps {
  onSubmit: (data: any) => Promise<void>
  defaultValues?: any
  submitLabel?: string
  isSubmitting?: boolean
}

export function ProjectForm({ 
  onSubmit, 
  defaultValues, 
  submitLabel = 'შექმნა',
  isSubmitting = false
}: ProjectFormProps) {
  const [mounted, setMounted] = useState(false)

  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: '',
      total_budget: 0,
      payment_type: 'single',
      team_member_ids: [],
      installments: [],
      ...defaultValues
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'installments'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Watch form values for real-time updates
  const watchPaymentType = form.watch('payment_type')
  const watchInstallments = form.watch('installments')
  const totalBudget = form.watch('total_budget')

  // Calculate installments sum
  const installmentsSum = watchInstallments?.reduce((sum: number, inst: any) => 
    sum + (parseFloat(inst.amount) || 0), 0) || 0
  const difference = totalBudget - installmentsSum

  // Validation status
  const isValidBudget = watchPaymentType === 'single' || Math.abs(difference) < 0.01
  const hasInstallments = watchPaymentType === 'installment' && fields.length > 0

  // Debug logs
  useEffect(() => {
    console.log('=== Form State Debug ===')
    console.log('Payment Type:', watchPaymentType)
    console.log('Total Budget:', totalBudget)
    console.log('Installments:', watchInstallments)
    console.log('Installments Sum:', installmentsSum)
    console.log('Difference:', difference)
    console.log('Has Installments:', hasInstallments)
    console.log('Is Valid Budget:', isValidBudget)
    console.log('Fields count:', fields.length)
  }, [watchPaymentType, totalBudget, watchInstallments, installmentsSum, difference, hasInstallments, isValidBudget, fields.length])

  const handleSubmit = async (data: any) => {
    console.log('=== Form Submit Started ===')
    console.log('Form data:', data)
    console.log('Form errors:', form.formState.errors)
    console.log('Is valid:', form.formState.isValid)

    try {
      await onSubmit(data)
      console.log('=== Form Submit Success ===')
    } catch (error) {
      console.error('=== Form Submit Error ===')
      console.error('Form submission error:', error)
    }
  }

  if (!mounted) {
    return <div className="animate-pulse">Loading...</div>
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Project Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          პროექტის სახელი *
        </Label>
        <Input
          id="title"
          placeholder="მაგ: ახალი ვებსაიტი კომპანია X-სთვის"
          {...form.register('title')}
          className={cn(
            form.formState.errors.title && 'border-red-300 focus:border-red-500'
          )}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {form.formState.errors.title.message as string}
          </p>
        )}
      </div>

      {/* Total Budget */}
      <div className="space-y-2">
        <Label htmlFor="total_budget" className="text-sm font-medium">
          მთლიანი ბიუჯეტი (₾) *
        </Label>
        <Input
          id="total_budget"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...form.register('total_budget', { valueAsNumber: true })}
          className={cn(
            form.formState.errors.total_budget && 'border-red-300 focus:border-red-500'
          )}
        />
        {form.formState.errors.total_budget && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {form.formState.errors.total_budget.message as string}
          </p>
        )}
        {totalBudget > 0 && !form.formState.errors.total_budget && (
          <p className="text-sm text-muted-foreground">
            {formatCurrency(totalBudget)}
          </p>
        )}
      </div>

      {/* Team Members */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          გუნდის წევრები
        </Label>
        <Controller
          name="team_member_ids"
          control={form.control}
          render={({ field }) => (
            <TeamMemberMultiSelect
              value={field.value || []}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          აირჩიეთ გუნდის წევრები, რომლებიც იმუშავებენ ამ პროექტზე
        </p>
      </div>

      {/* Payment Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">გადახდის ტიპი *</Label>
        <RadioGroup
          value={form.watch('payment_type')}
          onValueChange={(value) => {
            form.setValue('payment_type', value as 'single' | 'installment')
            if (value === 'single') {
              form.setValue('installments', [])
            }
          }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="single" id="single" />
            <Label htmlFor="single" className="font-normal cursor-pointer">
              ერთჯერადი გადახდა
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="installment" id="installment" />
            <Label htmlFor="installment" className="font-normal cursor-pointer">
              განვადებით გადახდა
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Installments Section */}
      {watchPaymentType === 'installment' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">განვადების დეტალები</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  append({
                    amount: 0,
                    due_date: tomorrow.toISOString().split('T')[0]
                  })
                }}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-1" />
                დამატება
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  დააჭირეთ "დამატება" ღილაკს განვადების შესაქმნელად
                </p>
              </div>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                <div className="col-span-5">
                  <Label className="text-xs text-muted-foreground">
                    განვადება #{index + 1} - თანხა (₾)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...form.register(`installments.${index}.amount`, { valueAsNumber: true })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-5">
                  <Label className="text-xs text-muted-foreground">
                    გადახდის თარიღი
                  </Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...form.register(`installments.${index}.due_date`)}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Installments Summary */}
            {fields.length > 0 && (
              <div className={cn(
                "mt-4 p-4 rounded-lg border-l-4 space-y-2",
                isValidBudget ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
              )}>
                <div className="flex justify-between text-sm">
                  <span>განვადებების ჯამი:</span>
                  <span className="font-medium">{formatCurrency(installmentsSum)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>მთლიანი ბიუჯეტი:</span>
                  <span className="font-medium">{formatCurrency(totalBudget)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>სხვაობა:</span>
                  <span className={cn(
                    "flex items-center gap-1",
                    Math.abs(difference) < 0.01 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {Math.abs(difference) < 0.01 ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {formatCurrency(difference)}
                  </span>
                </div>
                {!isValidBudget && (
                  <p className="text-xs text-red-600 mt-2">
                    განვადებების ჯამი უნდა უდრიდეს მთლიან ბიუჯეტს
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || (watchPaymentType === 'installment' && (!hasInstallments || !isValidBudget))}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              მიმდინარეობს...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}