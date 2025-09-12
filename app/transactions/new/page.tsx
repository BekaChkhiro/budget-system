import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/app/transactions/components/transaction-form'

export const metadata = {
  title: 'ახალი გადახდა | ბიუჯეტის მართვა',
  description: 'ახალი გადახდის დამატება',
}

export default function NewTransactionPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/transactions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            უკან
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">ახალი გადახდა</h1>
          <p className="text-muted-foreground mt-1">
            დაამატე ახალი გადახდის ჩანაწერი
          </p>
        </div>
      </div>

      {/* Transaction Form */}
      <div className="max-w-2xl">
        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        }>
          <TransactionForm />
        </Suspense>
      </div>
    </div>
  )
}
