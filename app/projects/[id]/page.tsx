import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/server'
import { ProjectHeader } from './components/project-header'
import { ProjectStats } from './components/project-stats'
import { ProjectTeamSection } from './components/project-team-section'

interface ProjectPageProps {
  params: {
    id: string
  }
}

async function getProject(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('ავტორიზაცია საჭიროა')

  // Get project with stats
  const { data: project, error } = await supabase
    .from('project_summary')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !project) return null

  // Get team members
  const { data: teamData } = await supabase
    .from('project_team_members')
    .select(`
      team_member_id,
      role_in_project,
      assigned_at,
      team_members (
        id,
        name,
        email,
        avatar_url,
        role,
        phone
      )
    `)
    .eq('project_id', id)

  const teamMembers = (teamData || [])
    .map((item: any) => ({
      ...item.team_members,
      role_in_project: item.role_in_project,
      assigned_at: item.assigned_at,
    }))
    .filter(Boolean)

  return {
    ...project,
    team_members: teamMembers,
  }
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params
  const project = await getProject(id)

  return {
    title: project ? `${project.title} - პროექტი` : 'პროექტი',
    description: project?.description || 'პროექტის დეტალური ინფორმაცია',
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Back Button */}
      <Link href="/projects">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          უკან პროექტებზე
        </Button>
      </Link>

      {/* Project Header */}
      <ProjectHeader project={project} />

      {/* Stats Cards */}
      <Suspense fallback={<StatsLoadingSkeleton />}>
        <ProjectStats project={project} />
      </Suspense>

      {/* Team Members Section */}
      <Suspense fallback={<TeamLoadingSkeleton />}>
        <ProjectTeamSection project={project} />
      </Suspense>
    </div>
  )
}

// Loading Skeletons
function StatsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  )
}

function TeamLoadingSkeleton() {
  return <Skeleton className="h-64 mt-6" />
}
