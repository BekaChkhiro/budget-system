'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { teamMemberFormSchema, type TeamMemberFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import type { TeamMember } from '@/types'

interface TeamMemberFormProps {
  defaultValues?: Partial<TeamMember>
  onSubmit: (data: TeamMemberFormData) => Promise<void>
  submitLabel?: string
  isSubmitting?: boolean
}

export function TeamMemberForm({
  defaultValues,
  onSubmit,
  submitLabel = 'შენახვა',
  isSubmitting = false,
}: TeamMemberFormProps) {
  const [skillInput, setSkillInput] = useState('')

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      role: defaultValues?.role || '',
      hourly_rate: defaultValues?.hourly_rate || undefined,
      avatar_url: defaultValues?.avatar_url || '',
      bio: defaultValues?.bio || '',
      skills: defaultValues?.skills || [],
    },
  })

  const handleSubmit = async (data: TeamMemberFormData) => {
    await onSubmit(data)
  }

  const addSkill = () => {
    if (!skillInput.trim()) return

    const currentSkills = form.getValues('skills') || []
    if (!currentSkills.includes(skillInput.trim())) {
      form.setValue('skills', [...currentSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues('skills') || []
    form.setValue(
      'skills',
      currentSkills.filter(skill => skill !== skillToRemove)
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>სახელი *</FormLabel>
              <FormControl>
                <Input placeholder="მაგ: გიორგი მელაძე" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ელ-ფოსტა *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="მაგ: giorgi@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ტელეფონი</FormLabel>
              <FormControl>
                <Input
                  placeholder="მაგ: +995 555 123 456"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>როლი/პოზიცია</FormLabel>
              <FormControl>
                <Input
                  placeholder="მაგ: Frontend დეველოპერი"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hourly Rate */}
        <FormField
          control={form.control}
          name="hourly_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>საათობრივი განაკვეთი (₾)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="მაგ: 50.00"
                  {...field}
                  value={field.value || ''}
                  onChange={e =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormDescription>
                თუ გაქვთ საათობრივი ანაზღაურება
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Avatar URL */}
        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ავატარის URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                ფოტოს ბმული (არასავალდებულო)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ბიოგრაფია</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="მოკლე აღწერა წევრის შესახებ..."
                  className="resize-none min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                მაქსიმუმ 2000 სიმბოლო
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Skills */}
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>სკილები/უნარები</FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="მაგ: React, TypeScript"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSkill()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addSkill}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {field.value && field.value.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {field.value.map(skill => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <FormDescription>
                დააჭირეთ Enter-ს ან + ღილაკს სკილის დასამატებლად
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
