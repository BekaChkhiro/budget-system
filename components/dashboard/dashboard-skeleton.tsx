import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const DashboardSkeleton = {
  /**
   * Stats Cards Loading Skeleton
   */
  StatsCards: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-50 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <Skeleton className="h-4 w-24" />
            <div className="p-2 rounded-lg bg-gray-100">
              <Skeleton className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32 mb-3" />
            {index === 1 && (
              <>
                <div className="h-2 bg-gray-200 rounded-full mb-2">
                  <Skeleton className="h-full w-3/4" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-6" />
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-3 w-6" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  ),

  /**
   * Generic Card Loading Skeleton
   */
  Card: ({ className }: { className?: string }) => (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ),

  /**
   * Projects Overview Loading Skeleton
   */
  ProjectsOverview: () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-18" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-2 bg-gray-100 rounded-full">
                    <Skeleton className="h-full w-2/3" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                
                <div className="flex justify-between pt-2 border-t">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Summary skeleton */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="text-center">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  ),

  /**
   * Recent Transactions Loading Skeleton
   */
  RecentTransactions: () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),

  /**
   * Upcoming Payments Loading Skeleton
   */
  UpcomingPayments: () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-8 w-12" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-3 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <Skeleton className="h-4 w-36 mb-2" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),

  /**
   * Full Dashboard Loading Skeleton
   */
  FullDashboard: () => (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-9 w-24 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      
      {/* Stats cards skeleton */}
      <DashboardSkeleton.StatsCards />
      
      {/* Main grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <DashboardSkeleton.RecentTransactions />
        </div>
        <div>
          <DashboardSkeleton.UpcomingPayments />
        </div>
      </div>
      
      {/* Projects overview skeleton */}
      <DashboardSkeleton.ProjectsOverview />
    </div>
  ),
}