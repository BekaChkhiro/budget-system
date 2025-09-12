import { Suspense } from 'react'
import { TransactionForm } from './components/transaction-form'
import { TransactionsList } from './components/transactions-list'
import { TransactionStats } from './components/transaction-stats'
import { TransactionsListSkeleton } from './components/transactions-list-skeleton'

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ტრანზაქციები</h1>
        <p className="text-muted-foreground">
          გადახდების რეგისტრაცია და მართვა რეალურ დროში
        </p>
      </div>

      {/* Quick Stats */}
      <Suspense fallback={<div className="h-24 animate-pulse bg-muted rounded-lg" />}>
        <TransactionStats />
      </Suspense>

      {/* Main Content - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transaction Form - Left Side */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6">
            <TransactionForm />
          </div>
        </div>

        {/* Transactions List - Right Side */}
        <div className="lg:col-span-7 xl:col-span-8">
          <Suspense fallback={<TransactionsListSkeleton />}>
            <TransactionsList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}