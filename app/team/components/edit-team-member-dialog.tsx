'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TeamMemberForm } from './team-member-form'
import { useUpdateTeamMember } from '@/hooks/use-team-members'
import type { TeamMemberFormData } from '@/lib/validations'
import type { TeamMemberWithStats } from '@/types'

interface EditTeamMemberDialogProps {
  member: TeamMemberWithStats
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTeamMemberDialog({
  member,
  open,
  onOpenChange,
}: EditTeamMemberDialogProps) {
  const updateMutation = useUpdateTeamMember(member.id)

  const handleSubmit = async (data: TeamMemberFormData) => {
    try {
      await updateMutation.mutateAsync(data)
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error updating team member:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>გუნდის წევრის რედაქტირება</DialogTitle>
          <DialogDescription>
            შეცვალეთ ინფორმაცია გუნდის წევრის შესახებ
          </DialogDescription>
        </DialogHeader>

        <TeamMemberForm
          defaultValues={member}
          onSubmit={handleSubmit}
          submitLabel="შენახვა"
          isSubmitting={updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
