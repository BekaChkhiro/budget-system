'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ArrowUpRight, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ka } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils/format'
import { useTransactions } from '@/hooks/use-transactions'

export function TransactionsList() {
  const { transactions, isLoading } = useTransactions()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ტრანზაქციების ისტორია</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ტრანზაქციების ისტორია</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              <Calendar className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              ტრანზაქციები არ მოიძებნა
            </h3>
            <p className="text-sm text-muted-foreground">
              დაამატეთ თქვენი პირველი ტრანზაქცია დასაწყებად
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ტრანზაქციების ისტორია</CardTitle>
          <Badge variant="secondary">{transactions.length} ტრანზაქცია</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {transaction.project?.title || 'უცნობი პროექტი'}
                  </p>
                </div>

                {transaction.notes && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>{transaction.notes}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(transaction.transaction_date), 'PPP', { locale: ka })}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}