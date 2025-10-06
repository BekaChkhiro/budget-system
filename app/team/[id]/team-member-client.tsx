'use client'

import { TeamMemberHeader } from './components/team-member-header'
import { TeamMemberStats } from './components/team-member-stats'
import { TeamMemberProjects } from './components/team-member-projects'
import { TeamMemberAnalytics } from './components/team-member-analytics'

interface TeamMemberClientProps {
  teamMemberId: string
  initialData: {
    name: string
    email: string
    role?: string | null
    phone?: string | null
    hourly_rate?: number | null
    bio?: string | null
    skills?: string[] | null
    avatar_url?: string | null
    is_active: boolean
  }
}

export function TeamMemberClient({ teamMemberId, initialData }: TeamMemberClientProps) {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <TeamMemberHeader
        teamMemberId={teamMemberId}
        initialData={initialData}
      />

      {/* Stats Overview */}
      <TeamMemberStats teamMemberId={teamMemberId} />

      {/* Analytics Charts */}
      <TeamMemberAnalytics teamMemberId={teamMemberId} />

      {/* Projects List */}
      <TeamMemberProjects teamMemberId={teamMemberId} />
    </div>
  )
}
