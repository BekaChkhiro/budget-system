import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils/format'
import { CreditCard, ArrowRight, Plus } from 'lucide-react'
import type { TransactionWithRelations } from '@/types'

interface RecentTransactionsProps {
  transactions: TransactionWithRelations[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            ბოლო ტრანზაქციები
          </CardTitle>
          <Link href="/transactions">
            <Button variant="ghost" size="sm">
              ყველა ნახვა
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                ჯერ არ არის ტრანზაქციები
              </p>
              <Link href="/transactions/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  პირველი ტრანზაქციის დამატება
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="group flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Link 
                    href={`/transactions/${transaction.id}`} 
                    className="flex items-center gap-3 flex-1"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate text-sm">
                          {transaction.project?.title || 'უცნობი პროექტი'}
                        </p>
                        <p className="font-semibold text-green-600 ml-2">
                          +{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(transaction.transaction_date)}
                        </p>
                        {transaction.installment_id && (
                          <Badge variant="outline" className="text-xs">
                            განვადება
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
              
              {/* Summary footer */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    ჯამი ({transactions.length} ტრანზაქცია):
                  </span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      transactions.reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}