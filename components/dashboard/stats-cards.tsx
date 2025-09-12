import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, DollarSign, FolderOpen, AlertTriangle } from 'lucide-react'
import type { DashboardStats } from '@/types'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  // Add null safety check
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const percentageReceived = stats.total_budget_sum > 0 
    ? (stats.total_received_sum / stats.total_budget_sum) * 100 
    : 0

  const cards = [
    {
      title: 'მთლიანი ბიუჯეტი',
      value: formatCurrency(stats.total_budget_sum),
      icon: DollarSign,
      description: 'ყველა პროექტის ჯამი',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'მიღებული თანხა',
      value: formatCurrency(stats.total_received_sum),
      icon: TrendingUp,
      description: `${percentageReceived.toFixed(1)}% ბიუჯეტიდან`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      progress: percentageReceived,
    },
    {
      title: 'დარჩენილი თანხა',
      value: formatCurrency(stats.total_remaining_sum),
      icon: TrendingDown,
      description: 'მისაღები თანხა',
      color: stats.total_remaining_sum > 0 ? 'text-amber-600' : 'text-gray-600',
      bgColor: stats.total_remaining_sum > 0 ? 'bg-amber-50' : 'bg-gray-50',
      iconBg: stats.total_remaining_sum > 0 ? 'bg-amber-100' : 'bg-gray-100',
    },
    {
      title: 'აქტიური პროექტები',
      value: stats.active_projects_count.toString(),
      icon: FolderOpen,
      description: `${stats.total_projects_count} მთლიანი პროექტი`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      badge: stats.overdue_installments_count > 0 
        ? {
            count: stats.overdue_installments_count,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
          } 
        : undefined,
    }
  ]
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden hover:shadow-md transition-shadow">
          <div className={`absolute inset-0 ${card.bgColor} opacity-30`} />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.iconBg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              {card.badge && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${card.badge.bgColor} ${card.badge.color} flex items-center gap-1`}>
                  <AlertTriangle className="h-3 w-3" />
                  {card.badge.count}
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
            
            {/* Progress Bar for Received Amount */}
            {card.progress !== undefined && (
              <div className="mt-3">
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(card.progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className="font-medium">{card.progress.toFixed(0)}%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}