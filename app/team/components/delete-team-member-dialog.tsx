'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteTeamMember } from '@/hooks/use-team-members'
import { Loader2 } from 'lucide-react'

interface DeleteTeamMemberDialogProps {
  memberId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteTeamMemberDialog({
  memberId,
  open,
  onOpenChange,
}: DeleteTeamMemberDialogProps) {
  const deleteMutation = useDeleteTeamMember()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(memberId)
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error deleting team member:', error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
          <AlertDialogDescription>
            ეს მოქმედება შეუქცევადია. გუნდის წევრი და მისი ყველა მონაცემი სამუდამოდ
            წაიშლება.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>გაუქმება</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            წაშლა
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
