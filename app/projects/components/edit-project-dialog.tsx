'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProjectForm } from './project-form'
import { updateProjectWithData } from '../actions'
import { toast } from 'sonner'
import type { ProjectWithStats } from '@/types'

interface EditProjectDialogProps {
  project: ProjectWithStats
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    
    try {
      const result = await updateProjectWithData(project.id, data)

      if (result.success) {
        toast.success('წარმატება', {
          description: result.message || 'პროექტი წარმატებით განახლდა'
        })
        onOpenChange(false)
      } else {
        toast.error('შეცდომა', {
          description: result.error || 'პროექტის განახლება ვერ მოხერხდა'
        })
        
        // Handle field-specific errors
        if (result.fieldErrors) {
          console.error('Field validation errors:', result.fieldErrors)
        }
      }
    } catch (error) {
      console.error('Dialog submission error:', error)
      toast.error('შეცდომა', {
        description: 'დაუგეგმავი შეცდომა მოხდა'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Convert project data to form format
  const defaultValues = {
    title: project.title,
    total_budget: project.total_budget,
    payment_type: project.payment_type,
    // Note: For existing projects, we don't allow editing installments
    // This would require more complex logic to handle existing installments
    installments: []
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>პროექტის რედაქტირება</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ProjectForm 
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
            submitLabel="განახლება"
            isSubmitting={isSubmitting}
          />
        </div>
        
        {/* Warning about installments */}
        {project.payment_type === 'installment' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>შენიშვნა:</strong> განვადების რედაქტირება ხელმისაწვდომი არ არის. 
              განვადებების შესაცვლელად გამოიყენეთ ცალკეული განვადებების მართვის გვერდი.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}