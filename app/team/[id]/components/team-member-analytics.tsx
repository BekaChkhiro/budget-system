'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTeamMember } from '@/hooks/use-team-members'
import { formatCurrency } from '@/lib/utils/format'
import { BarChart, TrendingUp, Calendar } from 'lucide-react'

interface TeamMemberAnalyticsProps {
  teamMemberId: string
}

export function TeamMemberAnalytics({ teamMemberId }: TeamMemberAnalyticsProps) {
  const { analytics, isLoading } = useTeamMember(teamMemberId)

  if (isLoading || !analytics) {
    return null
  }

  const timePeriods = [
    {
      label: 'ბოლო თვე',
      projects: analytics.completed_projects_last_month || 0,
      revenue: analytics.revenue_last_month || 0,
    },
    {
      label: 'ბოლო 3 თვე',
      projects: analytics.completed_projects_last_3_months || 0,
      revenue: analytics.revenue_last_3_months || 0,
    },
    {
      label: 'ბოლო 6 თვე',
      projects: analytics.completed_projects_last_6_months || 0,
      revenue: analytics.revenue_last_6_months || 0,
    },
    {
      label: 'ბოლო წელი',
      projects: analytics.completed_projects_last_year || 0,
      revenue: analytics.revenue_last_year || 0,
    },
  ]

  const totalStats = {
    projects: analytics.total_completed_projects || 0,
    revenue: analytics.total_revenue || 0,
  }

  // Calculate max revenue for bar scaling
  const maxRevenue = Math.max(...timePeriods.map(p => p.revenue), 1)

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-8">
      {/* Time Period Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>დროის ჭრილში ანალიტიკა</CardTitle>
          </div>
          <CardDescription>
            დასრულებული პროექტები და შემოსავალი პერიოდების მიხედვით
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {timePeriods.map((period, index) => {
            const barWidth = maxRevenue > 0 ? (period.revenue / maxRevenue) * 100 : 0

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{period.label}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {period.projects} პროექტი
                    </Badge>
                    <span className="font-semibold min-w-[100px] text-right">
                      {formatCurrency(period.revenue)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}

          {/* Total */}
          <div className="pt-4 mt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-bold">სულ</span>
              <div className="flex items-center gap-3">
                <Badge className="text-xs">
                  {totalStats.projects} პროექტი
                </Badge>
                <span className="font-bold text-lg min-w-[100px] text-right">
                  {formatCurrency(totalStats.revenue)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>პერფორმანსის მეტრიკები</CardTitle>
          </div>
          <CardDescription>
            შედარებითი მაჩვენებლები და ტენდენციები
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Average Revenue per Project */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">საშუალო შემოსავალი პროექტზე</span>
              <span className="font-bold">
                {totalStats.projects > 0
                  ? formatCurrency(totalStats.revenue / totalStats.projects)
                  : formatCurrency(0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              გამოთვლილია დასრულებული პროექტების მიხედვით
            </p>
          </div>

          {/* Recent Activity (Last 3 months) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">ბოლო 3 თვის აქტივობა</span>
              <Badge variant={timePeriods[1].projects > 0 ? 'default' : 'secondary'}>
                {timePeriods[1].projects > 0 ? 'აქტიური' : 'არააქტიური'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {timePeriods[1].projects > 0
                ? `${timePeriods[1].projects} პროექტი დასრულდა ბოლო 3 თვეში`
                : 'პროექტები არ დასრულებულა ბოლო 3 თვეში'}
            </p>
          </div>

          {/* Growth Trend */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">ზრდის ტენდენცია</span>
              <TrendingUp
                className={`h-5 w-5 ${
                  timePeriods[0].revenue > 0 ? 'text-green-600' : 'text-muted-foreground'
                }`}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              ბოლო თვის შემოსავალი: {formatCurrency(timePeriods[0].revenue)}
            </p>
          </div>

          {/* Completion Rate */}
          {totalStats.projects > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">წლიური შესრულების მაჩვენებელი</span>
                <span className="font-bold">
                  {Math.round(
                    ((timePeriods[3].projects || 0) / totalStats.projects) * 100
                  )}%
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      ((timePeriods[3].projects || 0) / totalStats.projects) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ბოლო წლის პროექტები სულ პროექტებთან მიმართებაში
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
