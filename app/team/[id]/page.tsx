import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTeamMemberById } from '@/lib/supabase/team-members'
import { createClient } from '@/lib/supabase/server'
import { TeamMemberClient } from './team-member-client'

interface TeamMemberPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: TeamMemberPageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const supabase = await createClient()
    const teamMember = await getTeamMemberById(id, supabase)
    return {
      title: `${teamMember.name} - გუნდის წევრი`,
      description: teamMember.bio || `${teamMember.name}-ის პროფილი და პროექტები`,
    }
  } catch {
    return {
      title: 'გუნდის წევრი',
      description: 'გუნდის წევრის დეტალური ინფორმაცია',
    }
  }
}

export default async function TeamMemberPage({ params }: TeamMemberPageProps) {
  const { id } = await params
  const supabase = await createClient()
  let teamMember

  try {
    teamMember = await getTeamMemberById(id, supabase)
  } catch {
    notFound()
  }

  return (
    <TeamMemberClient
      teamMemberId={id}
      initialData={teamMember}
    />
  )
}

