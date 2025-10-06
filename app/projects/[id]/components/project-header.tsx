'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import { useState } from 'react'
import { EditProjectDialog } from '../../components/edit-project-dialog'
import { DeleteConfirmationDialog } from '../../components/delete-confirmation-dialog'

interface ProjectHeaderProps {
  project: any
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span>შექმნილია: {formatDate(project.created_at)}</span>
            <Badge variant={project.payment_type === 'single' ? 'default' : 'secondary'}>
              {project.payment_type === 'single' ? 'ერთჯერადი გადახდა' : 'განვადებით'}
            </Badge>
            {project.is_completed && (
              <Badge className="bg-green-600">დასრულებული</Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1" />
            რედაქტირება
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            წაშლა
          </Button>
        </div>
      </div>

      {editOpen && (
        <EditProjectDialog
          project={project}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      {deleteOpen && (
        <DeleteConfirmationDialog
          project={project}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  )
}
