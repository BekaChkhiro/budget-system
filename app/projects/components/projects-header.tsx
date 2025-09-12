'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, Upload } from 'lucide-react'
import { CreateProjectDialog } from './create-project-dialog'

export function ProjectsHeader() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">პროექტები</h1>
          <p className="text-muted-foreground mt-1">
            მართეთ თქვენი პროექტები და მათი ბიუჯეტები
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export/Import buttons for future */}
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden sm:flex"
            disabled
          >
            <Download className="mr-2 h-4 w-4" />
            ექსპორტი
          </Button>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            ახალი პროექტი
          </Button>
        </div>
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  )
}