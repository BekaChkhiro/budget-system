import { TransactionForm } from './components/transaction-form'
import { TransactionsList } from './components/transactions-list'
import { TransactionStatsClient } from './components/transaction-stats-client'

export default function TransactionsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ტრანზაქციები</h1>
        <p className="text-muted-foreground">
          გადახდების რეგისტრაცია და მართვა რეალურ დროში
        </p>
      </div>

      {/* Quick Stats */}
      <TransactionStatsClient />

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
          <TransactionsList />
        </div>
      </div>
    </div>
  )
}