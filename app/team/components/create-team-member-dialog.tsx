'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { TeamMemberForm } from './team-member-form'
import { useCreateTeamMember } from '@/hooks/use-team-members'
import type { TeamMemberFormData } from '@/lib/validations'

interface CreateTeamMemberDialogProps {
  children: React.ReactNode
}

export function CreateTeamMemberDialog({
  children,
}: CreateTeamMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateTeamMember()

  const handleSubmit = async (data: TeamMemberFormData) => {
    try {
      await createMutation.mutateAsync(data)
      setOpen(false)
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error creating team member:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>გუნდის ახალი წევრის დამატება</DialogTitle>
          <DialogDescription>
            შეავსეთ ინფორმაცია გუნდის წევრის შესახებ
          </DialogDescription>
        </DialogHeader>

        <TeamMemberForm
          onSubmit={handleSubmit}
          submitLabel="დამატება"
          isSubmitting={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
