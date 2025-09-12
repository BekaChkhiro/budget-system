'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { deleteProjectAction } from '../actions'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/format'
import { AlertTriangle } from 'lucide-react'
import type { ProjectWithStats } from '@/types'

interface DeleteConfirmationDialogProps {
  project: ProjectWithStats
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteConfirmationDialog({ 
  project, 
  open, 
  onOpenChange 
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const result = await deleteProjectAction(project.id)

      if (result.success) {
        toast.success('წარმატება', {
          description: result.message || 'პროექტი წარმატებით წაიშალა'
        })
        onOpenChange(false)
      } else {
        toast.error('შეცდომა', {
          description: result.error || 'პროექტის წაშლა ვერ მოხერხდა'
        })
      }
    } catch (error) {
      console.error('Delete project error:', error)
      toast.error('შეცდომა', {
        description: 'დაუგეგმავი შეცდომა მოხდა'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const hasTransactions = project.transactions_count > 0
  const hasReceived = project.total_received > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            დარწმუნებული ხართ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                თქვენ აპირებთ პროექტის <strong>"{project.title}"</strong> წაშლას.
              </p>
              
              {/* Project details */}
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>ბიუჯეტი:</span>
                  <span className="font-medium">{formatCurrency(project.total_budget)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span>ტიპი:</span>
                  <Badge variant={project.payment_type === 'single' ? 'default' : 'secondary'} className="text-xs">
                    {project.payment_type === 'single' ? 'ერთჯერადი' : 'განვადება'}
                  </Badge>
                </div>
                
                {hasReceived && (
                  <div className="flex justify-between items-center text-sm">
                    <span>მიღებული:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(project.total_received)}
                    </span>
                  </div>
                )}
                
                {hasTransactions && (
                  <div className="flex justify-between items-center text-sm">
                    <span>ტრანზაქციები:</span>
                    <span className="font-medium">{project.transactions_count}</span>
                  </div>
                )}
              </div>

              {/* Warning messages */}
              <div className="space-y-2">
                <p className="text-sm text-red-600 font-medium">
                  ეს მოქმედება წაშლის:
                </p>
                <ul className="text-sm text-red-600 space-y-1 ml-4">
                  <li>• პროექტის ყველა მონაცემს</li>
                  {project.payment_type === 'installment' && (
                    <li>• ყველა განვადებას</li>
                  )}
                  {hasTransactions && (
                    <li>• ყველა ტრანზაქციას ({project.transactions_count})</li>
                  )}
                  <li>• ყველა დაკავშირებულ ისტორიას</li>
                </ul>
              </div>

              <p className="text-sm font-medium text-red-600">
                ეს მოქმედება არის საბოლოო და ვერ დაბრუნდება.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            გაუქმება
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                იშლება...
              </>
            ) : (
              'დიახ, წაშლა'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}