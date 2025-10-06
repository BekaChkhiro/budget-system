import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, BarChart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { Progress } from '@/components/ui/progress'

interface ProjectStatsProps {
  project: any
}

export function ProjectStats({ project }: ProjectStatsProps) {
  const stats = [
    {
      title: 'სულ ბიუჯეტი',
      value: formatCurrency(project.total_budget),
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      title: 'მიღებული',
      value: formatCurrency(project.total_received),
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'დარჩენილი',
      value: formatCurrency(project.remaining_amount),
      icon: TrendingDown,
      color: 'text-amber-600',
    },
    {
      title: 'პროგრესი',
      value: `${Math.round(project.payment_progress)}%`,
      icon: BarChart,
      color: 'text-purple-600',
    },
  ]

  return (
    <div className="space-y-4 mb-6">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">გადახდის პროგრესი</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={project.payment_progress} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>მიღებული: {formatCurrency(project.total_received)}</span>
              <span>სულ: {formatCurrency(project.total_budget)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
