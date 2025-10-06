'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTeamMember } from '@/hooks/use-team-members'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { CheckCircle, Clock, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TeamMemberProjectsProps {
  teamMemberId: string
}

export function TeamMemberProjects({ teamMemberId }: TeamMemberProjectsProps) {
  const { activeProjects, completedProjects, isLoading } = useTeamMember(teamMemberId)

  if (isLoading) {
    return null
  }

  const allProjects = [...activeProjects, ...completedProjects]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>პროექტები</CardTitle>
            <CardDescription>
              გუნდის წევრის მიმდინარე და დასრულებული პროექტები
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            სულ: {allProjects.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              <Clock className="mr-2 h-4 w-4" />
              აქტიური ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="mr-2 h-4 w-4" />
              დასრულებული ({completedProjects.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              ყველა ({allProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-6">
            {activeProjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>აქტიური პროექტები არ არის</p>
              </div>
            ) : (
              activeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedProjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>დასრულებული პროექტები არ არის</p>
              </div>
            ) : (
              completedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-6">
            {allProjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>პროექტები არ არის</p>
              </div>
            ) : (
              allProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function ProjectCard({ project }: { project: any }) {
  // Calculate progress percentage
  const totalBudget = project.total_budget || 0
  const totalReceived = project.total_received || 0
  const progress = totalBudget > 0 ? Math.round((totalReceived / totalBudget) * 100) : 0

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{project.title}</h3>
                {project.is_completed ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    დასრულებული
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    მიმდინარე
                  </Badge>
                )}
              </div>

              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {project.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>დაწყება: {formatDate(project.start_date)}</span>
                </div>

                {project.end_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>დასრულება: {formatDate(project.end_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right ml-4">
              <div className="text-sm text-muted-foreground mb-1">ბიუჯეტი</div>
              <div className="font-bold text-lg">{formatCurrency(totalBudget)}</div>
              <div className="text-sm text-muted-foreground mt-1">
                მიღებული: {formatCurrency(totalReceived)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">პროგრესი</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Payment Type Badge */}
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {project.payment_type === 'installment' ? 'განვადება' : 'ერთიანი გადახდა'}
            </Badge>
            {project.client && (
              <Badge variant="outline" className="text-xs">
                კლიენტი: {project.client}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
