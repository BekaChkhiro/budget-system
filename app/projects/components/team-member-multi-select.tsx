'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useActiveTeamMembers } from '@/hooks/use-team-members'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TeamMemberMultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export function TeamMemberMultiSelect({
  value = [],
  onChange,
  disabled = false,
}: TeamMemberMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const { data: teamMembers, isLoading } = useActiveTeamMembers()

  const selectedMembers = teamMembers?.filter((member) =>
    value.includes(member.id)
  ) || []

  const handleSelect = (memberId: string) => {
    const newValue = value.includes(memberId)
      ? value.filter((id) => id !== memberId)
      : [...value, memberId]
    onChange(newValue)
  }

  const handleRemove = (memberId: string) => {
    onChange(value.filter((id) => id !== memberId))
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedMembers.length === 0
                ? 'აირჩიეთ გუნდის წევრები...'
                : `არჩეულია ${selectedMembers.length} წევრი`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="მოძებნეთ წევრი..." />
            <CommandEmpty>
              {isLoading ? 'იტვირთება...' : 'წევრი ვერ მოიძებნა'}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {teamMembers?.map((member) => {
                const isSelected = value.includes(member.id)
                const initials = getInitials(member.name)

                return (
                  <CommandItem
                    key={member.id}
                    value={member.name}
                    onSelect={() => handleSelect(member.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Check
                        className={cn(
                          'h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {member.name}
                        </span>
                        {member.role && (
                          <span className="text-xs text-muted-foreground">
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Members Display */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => {
            const initials = getInitials(member.name)
            return (
              <Badge
                key={member.id}
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemove(member.id)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
