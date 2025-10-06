import { Suspense } from 'react'
import { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateTeamMemberDialog } from './components/create-team-member-dialog'
import { TeamMembersTable } from './components/team-members-table'
import { TeamMembersTableSkeleton } from './components/team-members-table-skeleton'

export const metadata: Metadata = {
  title: 'გუნდის წევრები',
  description: 'მართეთ თქვენი გუნდის წევრები და მათი პროექტები',
}

export default function TeamPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">გუნდის წევრები</h1>
          <p className="text-muted-foreground">
            მართეთ თქვენი გუნდის წევრები და მათი პროექტები
          </p>
        </div>

        <CreateTeamMemberDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            დამატება
          </Button>
        </CreateTeamMemberDialog>
      </div>

      <Suspense fallback={<TeamMembersTableSkeleton />}>
        <TeamMembersTable />
      </Suspense>
    </div>
  )
}
