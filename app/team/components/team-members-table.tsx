'use client'

import { useTeamMembers } from '@/hooks/use-team-members'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye, Mail, Phone } from 'lucide-react'
import { EditTeamMemberDialog } from './edit-team-member-dialog'
import { DeleteTeamMemberDialog } from './delete-team-member-dialog'
import { useState } from 'react'
import type { TeamMemberWithStats } from '@/types'
import { formatCurrency } from '@/lib/utils/format'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function TeamMembersTable() {
  const { teamMembers, isLoading, error } = useTeamMembers()
  const [editingMember, setEditingMember] = useState<TeamMemberWithStats | null>(null)
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)

  if (isLoading) {
    return <div className="text-center py-8">იტვირთება...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        შეცდომა: {error}
      </div>
    )
  }

  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">
          გუნდის წევრები არ არის დამატებული
        </p>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>წევრი</TableHead>
              <TableHead>როლი</TableHead>
              <TableHead>კონტაქტი</TableHead>
              <TableHead>სკილები</TableHead>
              <TableHead className="text-right">პროექტები</TableHead>
              <TableHead className="text-right">ბიუჯეტი</TableHead>
              <TableHead className="text-right">მოქმედებები</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map(member => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      {member.hourly_rate && (
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(member.hourly_rate)}/სთ
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {member.role ? (
                    <Badge variant="outline">{member.role}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {member.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">
                          {member.email}
                        </span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {member.skills && member.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{member.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {member.total_projects}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.active_projects} აქტიური
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {formatCurrency(member.total_completed_budget)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      დასრულებული
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <Link href={`/team/${member.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingMember(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingMemberId(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingMember && (
        <EditTeamMemberDialog
          member={editingMember}
          open={!!editingMember}
          onOpenChange={open => !open && setEditingMember(null)}
        />
      )}

      {deletingMemberId && (
        <DeleteTeamMemberDialog
          memberId={deletingMemberId}
          open={!!deletingMemberId}
          onOpenChange={open => !open && setDeletingMemberId(null)}
        />
      )}
    </>
  )
}
