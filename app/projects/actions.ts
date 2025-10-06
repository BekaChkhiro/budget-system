'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { updateProject, deleteProject } from '@/lib/supabase/projects'
import { assignTeamMembersToProject } from '@/lib/supabase/team-members'
import { projectFormSchema } from '@/lib/validations'

export async function createProjectAction(formData: FormData) {
  try {
    // Extract data from FormData or parse JSON
    const data = JSON.parse(formData.get('data') as string)
    console.log('Received project data:', JSON.stringify(data, null, 2))

    // Validate data
    const validated = projectFormSchema.parse(data)
    console.log('Validated project data:', JSON.stringify(validated, null, 2))

    // Get supabase server client
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'ავტორიზაცია საჭიროა'
      }
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: validated.title.trim(),
        total_budget: validated.total_budget,
        payment_type: validated.payment_type,
        user_id: user.id,
      })
      .select()
      .single()

    if (projectError) {
      console.error('Project creation error:', projectError)
      return {
        success: false,
        error: projectError.message || 'პროექტის შექმნა ვერ მოხერხდა'
      }
    }

    // Create installments if needed
    if (validated.payment_type === 'installment' && validated.installments) {
      const installmentsData = validated.installments.map((inst, index) => ({
        project_id: project.id,
        installment_number: index + 1,
        amount: inst.amount,
        due_date: inst.due_date,
      }))

      const { error: installmentsError } = await supabase
        .from('payment_installments')
        .insert(installmentsData)

      if (installmentsError) {
        // Rollback by deleting the project
        await supabase.from('projects').delete().eq('id', project.id)
        console.error('Installments creation error:', installmentsError)
        return {
          success: false,
          error: installmentsError.message || 'განვადების შექმნა ვერ მოხერხდა'
        }
      }
    }

    // Assign team members if provided
    if (validated.team_member_ids && validated.team_member_ids.length > 0) {
      try {
        await assignTeamMembersToProject(project.id, validated.team_member_ids, supabase)
      } catch (teamError) {
        console.error('Team members assignment error:', teamError)
        // Don't fail the whole operation, just log the error
      }
    }

    // Revalidate paths
    revalidatePath('/projects')
    revalidatePath('/team')
    revalidatePath('/')

    return {
      success: true,
      data: project,
      message: 'პროექტი წარმატებით შეიქმნა'
    }
  } catch (error: unknown) {
    console.error('Create project error:', error)

    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as { flatten: () => { fieldErrors: Record<string, string[]> }; issues: Array<{ message: string; path: string[] }> }
      console.error('Validation errors:', zodError.issues)
      return {
        success: false,
        error: 'ფორმის ვალიდაცია ვერ გაიარა',
        fieldErrors: zodError.flatten().fieldErrors,
        validationIssues: zodError.issues
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'პროექტის შექმნა ვერ მოხერხდა'
    }
  }
}

export async function updateProjectAction(id: string, formData: FormData) {
  try {
    const data = JSON.parse(formData.get('data') as string)
    
    // Validate data
    const validated = projectFormSchema.parse(data)

    // Update project
    await updateProject(id, {
      title: validated.title,
      total_budget: validated.total_budget,
      payment_type: validated.payment_type,
    })

    // Revalidate paths
    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    revalidatePath('/')
    
    return { 
      success: true,
      message: 'პროექტი წარმატებით განახლდა' 
    }
  } catch (error: any) {
    console.error('Update project error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'ფორმის ვალიდაცია ვერ გაიარა',
        fieldErrors: error.flatten().fieldErrors
      }
    }
    
    return {
      success: false,
      error: error.message || 'პროექტის განახლება ვერ მოხერხდა'
    }
  }
}

export async function deleteProjectAction(id: string) {
  try {
    // Get supabase server client
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'ავტორიზაცია საჭიროა'
      }
    }

    // Check if project exists and belongs to user
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!project) {
      return {
        success: false,
        error: 'პროექტი ვერ მოიძებნა'
      }
    }

    // Delete project (cascade will handle related data)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete project error:', error)
      return {
        success: false,
        error: error.message || 'პროექტის წაშლა ვერ მოხერხდა'
      }
    }

    // Revalidate paths
    revalidatePath('/projects')
    revalidatePath('/')

    return {
      success: true,
      message: 'პროექტი წარმატებით წაიშალა'
    }
  } catch (error: unknown) {
    console.error('Delete project error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'პროექტის წაშლა ვერ მოხერხდა'
    }
  }
}

// Alternative action for direct object input (for client components)
export async function createProjectWithData(data: any) {
  try {
    // Validate data
    const validated = projectFormSchema.parse(data)

    // Get supabase server client
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'ავტორიზაცია საჭიროა'
      }
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: validated.title.trim(),
        total_budget: validated.total_budget,
        payment_type: validated.payment_type,
        user_id: user.id,
      })
      .select()
      .single()

    if (projectError) {
      console.error('Project creation error:', projectError)
      return {
        success: false,
        error: projectError.message || 'პროექტის შექმნა ვერ მოხერხდა'
      }
    }

    // Create installments if needed
    if (validated.payment_type === 'installment' && validated.installments) {
      const installmentsData = validated.installments.map((inst, index) => ({
        project_id: project.id,
        installment_number: index + 1,
        amount: inst.amount,
        due_date: inst.due_date,
      }))

      const { error: installmentsError } = await supabase
        .from('payment_installments')
        .insert(installmentsData)

      if (installmentsError) {
        // Rollback by deleting the project
        await supabase.from('projects').delete().eq('id', project.id)
        console.error('Installments creation error:', installmentsError)
        return {
          success: false,
          error: installmentsError.message || 'განვადების შექმნა ვერ მოხერხდა'
        }
      }
    }

    // Assign team members if provided
    if (validated.team_member_ids && validated.team_member_ids.length > 0) {
      try {
        await assignTeamMembersToProject(project.id, validated.team_member_ids, supabase)
      } catch (teamError) {
        console.error('Team members assignment error:', teamError)
        // Don't fail the whole operation, just log the error
      }
    }

    // Revalidate paths
    revalidatePath('/projects')
    revalidatePath('/team')
    revalidatePath('/')

    return {
      success: true,
      data: project,
      message: 'პროექტი წარმატებით შეიქმნა'
    }
  } catch (error: any) {
    console.error('Create project error:', error)

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'ფორმის ვალიდაცია ვერ გაიარა',
        fieldErrors: error.flatten().fieldErrors
      }
    }

    return {
      success: false,
      error: error.message || 'პროექტის შექმნა ვერ მოხერხდა'
    }
  }
}

export async function updateProjectWithData(id: string, data: any) {
  try {
    const validated = projectFormSchema.parse(data)

    await updateProject(id, {
      title: validated.title,
      total_budget: validated.total_budget,
      payment_type: validated.payment_type,
    })

    // Update team members if provided
    if (validated.team_member_ids) {
      try {
        await assignTeamMembersToProject(id, validated.team_member_ids)
      } catch (teamError) {
        console.error('Team members assignment error:', teamError)
      }
    }

    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    revalidatePath('/team')
    revalidatePath('/')
    
    return { 
      success: true,
      message: 'პროექტი წარმატებით განახლდა' 
    }
  } catch (error: any) {
    console.error('Update project error:', error)
    
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'ფორმის ვალიდაცია ვერ გაიარა',
        fieldErrors: error.flatten().fieldErrors
      }
    }
    
    return {
      success: false,
      error: error.message || 'პროექტის განახლება ვერ მოხერხდა'
    }
  }
}