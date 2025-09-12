import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDashboardData } from '@/lib/supabase/dashboard'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { UpcomingPayments } from '@/components/dashboard/upcoming-payments'
import { ProjectsOverview } from '@/components/dashboard/projects-overview'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export const metadata = {
  title: 'მთავარი | ბიუჯეტის მართვა',
  description: 'თქვენი პროექტების ფინანსური მიმოხილვა',
}

export const revalidate = 60 // Revalidate every minute

export default async function DashboardPage() {
  let dashboardData
  
  try {
    dashboardData = await getDashboardData()
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Return error state or fallback data
    dashboardData = {
      stats: {
        total_projects_count: 0,
        active_projects_count: 0,
        total_budget_sum: 0,
        total_received_sum: 0,
        total_remaining_sum: 0,
        overdue_installments_count: 0,
      },
      recent_projects: [],
      recent_transactions: [],
      upcoming_installments: [],
      overdue_installments: [],
    }
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">მთავარი</h1>
          <p className="text-muted-foreground mt-1">
            თქვენი პროექტების ფინანსური მიმოხილვა
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              ახალი პროექტი
            </Button>
          </Link>
          <Link href="/transactions/new">
            <Button variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              ახალი გადახდა
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      <Suspense fallback={<DashboardSkeleton.StatsCards />}>
        <StatsCards stats={dashboardData.stats} />
      </Suspense>
      
      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Transactions */}
        <div className="md:col-span-2">
          <Suspense fallback={<DashboardSkeleton.Card className="h-96" />}>
            <RecentTransactions transactions={dashboardData.recent_transactions} />
          </Suspense>
        </div>
        
        {/* Upcoming Payments */}
        <div>
          <Suspense fallback={<DashboardSkeleton.Card className="h-96" />}>
            <UpcomingPayments installments={dashboardData.upcoming_installments} />
          </Suspense>
        </div>
      </div>
      
      {/* Projects Overview */}
      <Suspense fallback={<DashboardSkeleton.ProjectsOverview />}>
        <ProjectsOverview projects={dashboardData.recent_projects} />
      </Suspense>

      {/* Overdue Installments Alert */}
      {dashboardData.overdue_installments.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-destructive">
                ვადაგადაცილებული გადახდები
              </h3>
              <p className="text-sm text-destructive/80 mt-1">
                {dashboardData.overdue_installments.length} განვადების ვადა გადაცილებულია
              </p>
            </div>
            <Link href="/installments?filter=overdue">
              <Button variant="destructive" size="sm">
                ნახვა
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}