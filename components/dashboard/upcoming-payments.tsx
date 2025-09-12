import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateShort, differenceInDays, getPaymentStatusVariant, getPaymentStatusText } from '@/lib/utils/format'
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { InstallmentWithStats } from '@/types'

interface UpcomingPaymentsProps {
  installments: InstallmentWithStats[]
}

export function UpcomingPayments({ installments }: UpcomingPaymentsProps) {
  // Sort installments by due date
  const sortedInstallments = installments.sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            მოახლოებული გადახდები
          </CardTitle>
          {installments.length > 3 && (
            <Link href="/installments?filter=upcoming">
              <Button variant="ghost" size="sm">
                ყველა
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedInstallments.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                არ არის დაგეგმილი გადახდები
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ყველა განვადება გადახდილია
              </p>
            </div>
          ) : (
            sortedInstallments.slice(0, 5).map((installment) => {
              const daysUntilDue = differenceInDays(new Date(installment.due_date), new Date())
              const isOverdue = daysUntilDue < 0
              const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0
              
              return (
                <div 
                  key={installment.id} 
                  className={`p-3 rounded-lg border transition-colors hover:shadow-sm ${
                    isOverdue 
                      ? 'border-red-200 bg-red-50' 
                      : isDueSoon 
                        ? 'border-amber-200 bg-amber-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <Link href={`/projects/${installment.project_id}`}>
                        <p className="font-medium text-sm hover:text-primary transition-colors truncate">
                          {installment.project?.title || 'პროექტი'}
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <span>განვადება #{installment.installment_number}</span>
                        {installment.is_overdue && (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                      </p>
                    </div>
                    <Badge 
                      variant={getPaymentStatusVariant(installment.due_date, installment.is_paid)}
                      className={`ml-2 text-xs ${
                        isOverdue ? 'bg-red-100 text-red-700 border-red-200' :
                        isDueSoon ? 'bg-amber-100 text-amber-700 border-amber-200' : ''
                      }`}
                    >
                      {getPaymentStatusText(installment.due_date, installment.is_paid)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-semibold">
                          {formatCurrency(installment.amount)}
                        </p>
                        {installment.paid_amount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            გადახდილი: {formatCurrency(installment.paid_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateShort(installment.due_date)}
                      </p>
                      {isOverdue && (
                        <p className="text-xs text-red-600 mt-1">
                          {Math.abs(daysUntilDue)} დღით დაგვიანებული
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar for partial payments */}
                  {installment.paid_amount > 0 && installment.paid_amount < installment.amount && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ 
                            width: `${(installment.paid_amount / installment.amount) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>
                          {((installment.paid_amount / installment.amount) * 100).toFixed(0)}% გადახდილი
                        </span>
                        <span>
                          დარჩა: {formatCurrency(installment.amount - installment.paid_amount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        
        {/* Summary */}
        {sortedInstallments.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                სულ მოახლოებული:
              </span>
              <span className="font-semibold">
                {formatCurrency(
                  sortedInstallments.reduce((sum, installment) => 
                    sum + (installment.amount - installment.paid_amount), 0
                  )
                )}
              </span>
            </div>
            
            {sortedInstallments.some(i => i.is_overdue) && (
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-red-600">
                  ვადაგადაცილებული:
                </span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(
                    sortedInstallments
                      .filter(i => i.is_overdue)
                      .reduce((sum, installment) => 
                        sum + (installment.amount - installment.paid_amount), 0
                      )
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}