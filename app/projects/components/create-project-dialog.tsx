'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProjectForm } from './project-form'
import { createProjectWithData } from '../actions'
import { toast } from 'sonner'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    
    try {
      const result = await createProjectWithData(data)

      if (result.success) {
        toast.success('წარმატება', {
          description: result.message || 'პროექტი წარმატებით შეიქმნა'
        })
        onOpenChange(false)
      } else {
        toast.error('შეცდომა', {
          description: result.error || 'პროექტის შექმნა ვერ მოხერხდა'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ახალი პროექტის შექმნა</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ProjectForm 
            onSubmit={handleSubmit}
            submitLabel="შექმნა"
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}