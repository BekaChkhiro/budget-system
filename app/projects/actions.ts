'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createProject, updateProject, deleteProject } from '@/lib/supabase/projects'
import { projectFormSchema } from '@/lib/validations'
import type { CreateProjectInput } from '@/types'

export async function createProjectAction(formData: FormData) {
  try {
    // Extract data from FormData or parse JSON
    const data = JSON.parse(formData.get('data') as string)
    
    // Validate data
    const validated = projectFormSchema.parse(data)

    // Create project input
    const projectInput: CreateProjectInput = {
      title: validated.title,
      total_budget: validated.total_budget,
      payment_type: validated.payment_type,
      installments: validated.installments?.map((inst, index) => ({
        amount: inst.amount,
        due_date: inst.due_date
      }))
    }

    // Create project
    const project = await createProject(projectInput)

    // Revalidate paths
    revalidatePath('/projects')
    revalidatePath('/')
    
    return { 
      success: true, 
      data: project,
      message: 'პროექტი წარმატებით შეიქმნა' 
    }
  } catch (error: any) {
    console.error('Create project error:', error)
    
    // Handle validation errors
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
    await deleteProject(id)

    // Revalidate paths
    revalidatePath('/projects')
    revalidatePath('/')
    
    return { 
      success: true,
      message: 'პროექტი წარმატებით წაიშალა' 
    }
  } catch (error: any) {
    console.error('Delete project error:', error)
    return {
      success: false,
      error: error.message || 'პროექტის წაშლა ვერ მოხერხდა'
    }
  }
}

// Alternative action for direct object input (for client components)
export async function createProjectWithData(data: any) {
  try {
    // Validate data
    const validated = projectFormSchema.parse(data)

    // Create project input
    const projectInput: CreateProjectInput = {
      title: validated.title,
      total_budget: validated.total_budget,
      payment_type: validated.payment_type,
      installments: validated.installments?.map((inst, index) => ({
        amount: inst.amount,
        due_date: inst.due_date
      }))
    }

    // Create project
    const project = await createProject(projectInput)

    // Revalidate paths
    revalidatePath('/projects')
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