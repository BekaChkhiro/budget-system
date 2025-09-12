import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectForm } from '@/app/projects/components/project-form'

export const metadata = {
  title: 'ახალი პროექტი | ბიუჯეტის მართვა',
  description: 'ახალი პროექტის შექმნა',
}

export default function NewProjectPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            უკან
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">ახალი პროექტი</h1>
          <p className="text-muted-foreground mt-1">
            შექმენით ახალი პროექტი ბიუჯეტის მართვისთვის
          </p>
        </div>
      </div>

      {/* Project Form */}
      <div className="max-w-2xl">
        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        }>
          <ProjectForm />
        </Suspense>
      </div>
    </div>
  )
}
