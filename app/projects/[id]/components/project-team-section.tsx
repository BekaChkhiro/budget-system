import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

interface ProjectTeamSectionProps {
  project: any
}

export function ProjectTeamSection({ project }: ProjectTeamSectionProps) {
  const teamMembers = project.team_members || []

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (teamMembers.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>გუნდის წევრები</CardTitle>
          </div>
          <CardDescription>ამ პროექტზე მუშაობს</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>პროექტს არ აქვს მინიჭებული გუნდის წევრები</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>გუნდის წევრები</CardTitle>
        </div>
        <CardDescription>
          სულ {teamMembers.length} წევრი მუშაობს ამ პროექტზე
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member: any) => (
            <Link
              key={member.id}
              href={`/team/${member.id}`}
              className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{member.name}</p>
                  {member.role && (
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {member.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
