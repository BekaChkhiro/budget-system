'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Edit,
  Trash2,
  MoreHorizontal,
  FolderOpen,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Users
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDateShort, getProgressColorClass } from '@/lib/utils/format'
import { EditProjectDialog } from './edit-project-dialog'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'
import { ProjectsPagination } from './projects-pagination'
import { useMediaQuery } from '@/hooks/use-media-query'
import type { ProjectWithStats, ProjectFilters, PaginatedResponse } from '@/types'

interface ProjectsTableProps {
  projects: ProjectWithStats[]
  pagination: PaginatedResponse<ProjectWithStats>['pagination']
  currentFilters: ProjectFilters
}

export function ProjectsTable({ projects, pagination, currentFilters }: ProjectsTableProps) {
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null)
  const [deletingProject, setDeletingProject] = useState<ProjectWithStats | null>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    // Mobile card view
    return (
      <div className="space-y-4 p-4">
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => setEditingProject(project)}
                  onDelete={() => setDeletingProject(project)}
                />
              ))}
            </div>
            <Suspense fallback={<div className="h-16 bg-white rounded-lg animate-pulse" />}>
              <ProjectsPagination pagination={pagination} />
            </Suspense>
          </>
        )}

        {editingProject && (
          <EditProjectDialog
            project={editingProject}
            open={!!editingProject}
            onOpenChange={(open) => !open && setEditingProject(null)}
          />
        )}

        {deletingProject && (
          <DeleteConfirmationDialog
            project={deletingProject}
            open={!!deletingProject}
            onOpenChange={(open) => !open && setDeletingProject(null)}
          />
        )}
      </div>
    )
  }

  // Desktop table view
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>პროექტი</TableHead>
              <TableHead>გუნდი</TableHead>
              <TableHead className="text-right">ბიუჯეტი</TableHead>
              <TableHead>ტიპი</TableHead>
              <TableHead className="text-right">მიღებული</TableHead>
              <TableHead className="text-right">დარჩენილი</TableHead>
              <TableHead>პროგრესი</TableHead>
              <TableHead>სტატუსი</TableHead>
              <TableHead className="text-right">მოქმედებები</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <ProjectTableRow
                  key={project.id}
                  project={project}
                  onEdit={() => setEditingProject(project)}
                  onDelete={() => setDeletingProject(project)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {projects.length > 0 && (
        <Suspense fallback={<div className="h-16 bg-white rounded-lg animate-pulse" />}>
          <ProjectsPagination pagination={pagination} />
        </Suspense>
      )}

      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
        />
      )}

      {deletingProject && (
        <DeleteConfirmationDialog
          project={deletingProject}
          open={!!deletingProject}
          onOpenChange={(open) => !open && setDeletingProject(null)}
        />
      )}
    </>
  )
}

// Desktop table row component
function ProjectTableRow({ 
  project, 
  onEdit, 
  onDelete 
}: { 
  project: ProjectWithStats
  onEdit: () => void
  onDelete: () => void 
}) {
  const progress = project.total_budget > 0 
    ? (project.total_received / project.total_budget) * 100 
    : 0

  const getStatusIcon = () => {
    if (project.is_completed) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (project.overdue_installments_count > 0) return <AlertCircle className="h-4 w-4 text-red-500" />
    return <Clock className="h-4 w-4 text-amber-500" />
  }

  const getStatusText = () => {
    if (project.is_completed) return 'დასრულებული'
    if (project.overdue_installments_count > 0) return 'ვადაგადაცილებული'
    return 'მიმდინარე'
  }

  const getStatusVariant = (): 'default' | 'destructive' | 'secondary' | 'outline' => {
    if (project.is_completed) return 'secondary'
    if (project.overdue_installments_count > 0) return 'destructive'
    return 'default'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="space-y-1">
          <Link
            href={`/projects/${project.id}`}
            className="font-medium hover:text-primary transition-colors"
          >
            {project.title}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDateShort(project.created_at)}</span>
            {project.transactions_count > 0 && (
              <>
                <span>•</span>
                <span>{project.transactions_count} ტრანზაქცია</span>
              </>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        {project.team_members && project.team_members.length > 0 ? (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
              {project.team_members.slice(0, 3).map((member: any) => (
                <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {project.team_members.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{project.team_members.length - 3}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            არ არის
          </span>
        )}
      </TableCell>

      <TableCell className="text-right font-medium">
        {formatCurrency(project.total_budget)}
      </TableCell>
      
      <TableCell>
        <Badge variant={project.payment_type === 'single' ? 'default' : 'secondary'}>
          {project.payment_type === 'single' ? 'ერთჯერადი' : 'განვადება'}
        </Badge>
      </TableCell>
      
      <TableCell className="text-right">
        <span className="font-medium text-green-600">
          {formatCurrency(project.total_received)}
        </span>
      </TableCell>
      
      <TableCell className="text-right">
        <span className="font-medium text-amber-600">
          {formatCurrency(project.remaining_amount)}
        </span>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColorClass(progress)}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground min-w-[32px]">
            {Math.round(progress)}%
          </span>
        </div>
      </TableCell>
      
      <TableCell>
        <Badge variant={getStatusVariant()} className="gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
      </TableCell>
      
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">მოქმედებები</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                ნახვა
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              რედაქტირება
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              წაშლა
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// Mobile card component
function ProjectCard({ 
  project, 
  onEdit, 
  onDelete 
}: { 
  project: ProjectWithStats
  onEdit: () => void
  onDelete: () => void 
}) {
  const progress = project.total_budget > 0 
    ? (project.total_received / project.total_budget) * 100 
    : 0

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link href={`/projects/${project.id}`}>
              <CardTitle className="text-lg hover:text-primary transition-colors truncate">
                {project.title}
              </CardTitle>
            </Link>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDateShort(project.created_at)}</span>
              {project.transactions_count > 0 && (
                <>
                  <span>•</span>
                  <span>{project.transactions_count} ტრანზაქცია</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={project.payment_type === 'single' ? 'default' : 'secondary'} className="text-xs">
              {project.payment_type === 'single' ? 'ერთჯერადი' : 'განვადება'}
            </Badge>
            {project.is_completed && <CheckCircle className="h-4 w-4 text-green-500" />}
            {project.overdue_installments_count > 0 && <AlertCircle className="h-4 w-4 text-red-500" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Budget Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              <span>ბიუჯეტი</span>
            </div>
            <p className="font-semibold">{formatCurrency(project.total_budget)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">მიღებული</p>
            <p className="font-semibold text-green-600">{formatCurrency(project.total_received)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">პროგრესი</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressColorClass(progress)}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Remaining Amount */}
        {project.remaining_amount > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">დარჩენილი: </span>
            <span className="font-medium text-amber-600">
              {formatCurrency(project.remaining_amount)}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/projects/${project.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              ნახვა
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            რედაქტირება
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50" 
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty state component
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">პროექტები არ მოიძებნა</h3>
      <p className="text-muted-foreground mb-4">
        დაიწყეთ ახალი პროექტის შექმნით ან შეცვალეთ ფილტრები
      </p>
    </div>
  )
}