import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { getTransactionStatsAction } from '../actions'

export async function TransactionStats() {
  const result = await getTransactionStatsAction()
  
  if (!result.success || !result.data) {
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
  } = result.data

  const stats = [
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
      title: 'საშუალო გადახდა',
      value: formatCurrency(averageTransaction),
      change: 'ერთ ტრანზაქციაზე',
      changeType: 'neutral' as const,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'ტრანზაქციები',
      value: transactionCount.toString(),
      change: 'სულ ტრანზაქციები',
      changeType: 'neutral' as const,
      icon: TrendingDown,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </h3>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                
                {stat.change && (
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant={
                        stat.changeType === 'positive' 
                          ? 'default' 
                          : 'outline'
                      }
                      className={`text-xs ${
                        stat.changeType === 'positive'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : ''
                      }`}
                    >
                      {stat.change}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}