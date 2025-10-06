'use server'

import { revalidatePath } from 'next/cache'
import {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  assignTeamMembersToProject,
} from '@/lib/supabase/team-members'
import type {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  TeamMember,
} from '@/types'

/**
 * Server action to create a new team member
 */
export async function createTeamMemberAction(input: CreateTeamMemberInput): Promise<{
  success: boolean
  data?: TeamMember
  error?: string
}> {
  try {
    const teamMember = await createTeamMember(input)

    revalidatePath('/team')
    revalidatePath('/projects')

    return {
      success: true,
      data: teamMember,
    }
  } catch (error) {
    console.error('Error creating team member:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'გუნდის წევრის შექმნა ვერ მოხერხდა',
    }
  }
}

/**
 * Server action to update a team member
 */
export async function updateTeamMemberAction(
  id: string,
  input: UpdateTeamMemberInput
): Promise<{
  success: boolean
  data?: TeamMember
  error?: string
}> {
  try {
    const teamMember = await updateTeamMember(id, input)

    revalidatePath('/team')
    revalidatePath(`/team/${id}`)
    revalidatePath('/projects')

    return {
      success: true,
      data: teamMember,
    }
  } catch (error) {
    console.error('Error updating team member:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'გუნდის წევრის განახლება ვერ მოხერხდა',
    }
  }
}

/**
 * Server action to delete a team member
 */
export async function deleteTeamMemberAction(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await deleteTeamMember(id)

    revalidatePath('/team')
    revalidatePath('/projects')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error deleting team member:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'გუნდის წევრის წაშლა ვერ მოხერხდა',
    }
  }
}

/**
 * Server action to assign team members to a project
 */
export async function assignTeamMembersAction(
  projectId: string,
  teamMemberIds: string[]
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await assignTeamMembersToProject(projectId, teamMemberIds)

    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/team')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error assigning team members:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'გუნდის წევრების მინიჭება ვერ მოხერხდა',
    }
  }
}
