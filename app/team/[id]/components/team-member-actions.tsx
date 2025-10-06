'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EditTeamMemberDialog } from '../../components/edit-team-member-dialog'
import { DeleteTeamMemberDialog } from '../../components/delete-team-member-dialog'
import type { TeamMemberWithStats } from '@/types'
import { useRouter } from 'next/navigation'

interface TeamMemberActionsProps {
  teamMember: TeamMemberWithStats
}

export function TeamMemberActions({ teamMember }: TeamMemberActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const router = useRouter()

  const handleDeleteSuccess = () => {
    setDeleteOpen(false)
    router.push('/team')
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setEditOpen(true)}>
        რედაქტირება
      </Button>
      <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
        წაშლა
      </Button>

      <EditTeamMemberDialog
        member={teamMember}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteTeamMemberDialog
        memberId={teamMember.id}
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) {
            // Check if still exists, if not redirect
            setTimeout(handleDeleteSuccess, 100)
          }
        }}
      />
    </div>
  )
}
