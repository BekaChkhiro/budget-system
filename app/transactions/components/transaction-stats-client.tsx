'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { useTransactions } from '@/hooks/use-transactions'

export function TransactionStatsClient() {
  const { stats, isLoading } = useTransactions()

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-8 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const {
    totalPaid,
    thisMonthPaid,
    transactionCount,
    averageTransaction
  } = stats

  const statCards = [
    {
      title: 'მთლიანი გადახდილი',
      value: formatCurrency(totalPaid),
      change: thisMonthPaid > 0 ? `+${formatCurrency(thisMonthPaid)} ამ თვეში` : null,
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'ამ თვის გადახდები',
      value: formatCurrency(thisMonthPaid),
      change: 'მიმდინარე თვეში',
      changeType: 'neutral' as const,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'ტრანზაქციების რაოდენობა',
      value: transactionCount.toString(),
      change: 'სულ ტრანზაქციები',
      changeType: 'neutral' as const,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'საშუალო გადახდა',
      value: formatCurrency(averageTransaction),
      change: 'გადახდის საშუალო',
      changeType: 'neutral' as const,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight mb-2">
                    {stat.value}
                  </h3>
                  {stat.change && (
                    <Badge
                      variant={stat.changeType === 'positive' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
