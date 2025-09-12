import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, getProgressColorClass } from '@/lib/utils/format'
import { FolderOpen, ArrowRight, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type { ProjectWithStats } from '@/types'

interface ProjectsOverviewProps {
  projects: ProjectWithStats[]
}

export function ProjectsOverview({ projects }: ProjectsOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            პროექტების მიმოხილვა
          </CardTitle>
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              ყველა პროექტი
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              ჯერ არ არის პროექტები
            </p>
            <Link href="/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                პირველი პროექტის შექმნა
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const progress = project.total_budget > 0 
                ? (project.total_received / project.total_budget) * 100 
                : 0
              
              const isCompleted = project.is_completed
              const hasOverdue = project.overdue_installments_count > 0
              
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors flex-1 mr-2">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-1">
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {hasOverdue && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {project.payment_type === 'installment' && !isCompleted && (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Budget Information */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">მიღებული</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(project.total_received)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">ბიუჯეტი</span>
                          <span className="font-medium">
                            {formatCurrency(project.total_budget)}
                          </span>
                        </div>
                        {project.remaining_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">დარჩა</span>
                            <span className="font-medium text-amber-600">
                              {formatCurrency(project.remaining_amount)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ease-out ${getProgressColorClass(progress)}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">
                            {progress.toFixed(0)}% დასრულებული
                          </span>
                          <Badge 
                            variant={
                              isCompleted ? 'default' :
                              hasOverdue ? 'destructive' :
                              progress >= 75 ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {isCompleted ? 'დასრულებული' :
                             hasOverdue ? 'ვადაგადაცილებული' :
                             progress >= 75 ? 'თითქმის დასრულებული' :
                             progress >= 25 ? 'მიმდინარე' : 'დაწყებული'
                            }
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Payment Type & Stats */}
                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <span>
                            {project.payment_type === 'single' ? 'ერთჯერადი' : 'განვადებით'}
                          </span>
                          {project.transactions_count > 0 && (
                            <span>• {project.transactions_count} ტრანზაქცია</span>
                          )}
                        </div>
                        {hasOverdue && (
                          <span className="text-red-500 font-medium">
                            {project.overdue_installments_count} ვადაგადაცილებული
                          </span>
                        )}
                      </div>
                      
                      {/* Last Transaction Date */}
                      {project.last_transaction_date && (
                        <div className="text-xs text-muted-foreground">
                          ბოლო გადახდა: {new Date(project.last_transaction_date).toLocaleDateString('ka-GE')}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
        
        {/* Summary Statistics */}
        {projects.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {projects.length}
                </p>
                <p className="text-xs text-muted-foreground">პროექტები</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.is_completed).length}
                </p>
                <p className="text-xs text-muted-foreground">დასრულებული</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {projects.filter(p => p.overdue_installments_count > 0).length}
                </p>
                <p className="text-xs text-muted-foreground">ვადაგადაცილებული</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(projects.reduce((sum, p) => sum + p.total_budget, 0))}
                </p>
                <p className="text-xs text-muted-foreground">მთლიანი ღირებულება</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}