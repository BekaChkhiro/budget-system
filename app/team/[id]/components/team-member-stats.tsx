'use client'

import { Briefcase, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTeamMember } from '@/hooks/use-team-members'
import { formatCurrency } from '@/lib/utils/format'

interface TeamMemberStatsProps {
  teamMemberId: string
}

export function TeamMemberStats({ teamMemberId }: TeamMemberStatsProps) {
  const { teamMember, isLoading } = useTeamMember(teamMemberId)

  const stats = [
    {
      title: 'სულ პროექტები',
      value: teamMember?.total_projects || 0,
      icon: Briefcase,
      description: 'ყველა პროექტი',
    },
    {
      title: 'აქტიური პროექტები',
      value: teamMember?.active_projects || 0,
      icon: Clock,
      description: 'მიმდინარე პროექტები',
      color: 'text-blue-600',
    },
    {
      title: 'დასრულებული პროექტები',
      value: teamMember?.completed_projects || 0,
      icon: CheckCircle,
      description: 'წარმატებით დასრულებული',
      color: 'text-green-600',
    },
    {
      title: 'სულ შემოსავალი',
      value: formatCurrency(teamMember?.total_completed_budget || 0),
      icon: TrendingUp,
      description: 'დასრულებული პროექტებიდან',
      color: 'text-purple-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
