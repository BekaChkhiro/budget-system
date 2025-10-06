'use client'

import { ArrowLeft, Mail, Phone, Briefcase, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TeamMemberActions } from './team-member-actions'
import { useTeamMember } from '@/hooks/use-team-members'
import { formatCurrency } from '@/lib/utils/format'
import { Skeleton } from '@/components/ui/skeleton'

interface TeamMemberHeaderProps {
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

export function TeamMemberHeader({ teamMemberId, initialData }: TeamMemberHeaderProps) {
  const { teamMember } = useTeamMember(teamMemberId)

  const data = teamMember || initialData

  const initials = data.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div>
      <Link href="/team">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          უკან გუნდის გვერდზე
        </Button>
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={data.avatar_url || undefined} alt={data.name} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
              {!data.is_active && (
                <Badge variant="secondary">არააქტიური</Badge>
              )}
            </div>

            <div className="space-y-2 text-muted-foreground">
              {data.role && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>{data.role}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${data.email}`} className="hover:underline">
                  {data.email}
                </a>
              </div>

              {data.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${data.phone}`} className="hover:underline">
                    {data.phone}
                  </a>
                </div>
              )}

              {data.hourly_rate && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatCurrency(data.hourly_rate)}/საათი</span>
                </div>
              )}
            </div>

            {data.bio && (
              <p className="mt-4 text-sm max-w-2xl">{data.bio}</p>
            )}

            {data.skills && data.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {data.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <TeamMemberActions teamMember={data} />
      </div>
    </div>
  )
}
