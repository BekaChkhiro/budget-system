import { useQuery } from '@tanstack/react-query'
import {
  getDashboardData,
  getDashboardStats,
  getMonthlyPerformance,
  getProjectCompletionTrends,
  getFinancialSummary,
  getCashFlowProjection,
  getDashboardAlerts,
  refreshDashboardStats,
} from '@/lib/supabase/dashboard'
import type { UseDashboardReturn } from '@/types'
import { useState } from 'react'

// =====================================================
// QUERY KEYS
// =====================================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  monthlyPerformance: (months: number) => 
    [...dashboardKeys.all, 'monthlyPerformance', months] as const,
  completionTrends: (months: number) => 
    [...dashboardKeys.all, 'completionTrends', months] as const,
  financialSummary: (startDate: string, endDate: string) => 
    [...dashboardKeys.all, 'financialSummary', startDate, endDate] as const,
  cashFlowProjection: (days: number) => 
    [...dashboardKeys.all, 'cashFlowProjection', days] as const,
  alerts: () => [...dashboardKeys.all, 'alerts'] as const,
}

// =====================================================
// MAIN DASHBOARD HOOK
// =====================================================

/**
 * Main dashboard hook with comprehensive overview data
 */
export function useDashboard(): UseDashboardReturn {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const refreshInterval = 60 // seconds

  const query = useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: getDashboardData,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
    refetchIntervalInBackground: false,
  })

  return {
    // Data
    overview: query.data || null,
    stats: query.data?.stats || null,
    
    // Status
    isLoading: query.isLoading,
    error: query.error?.message || null,
    isLoaded: !query.isLoading && !query.isError,
    
    // Metadata
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toISOString() : null,
    refreshInterval,
    
    // Actions
    refetch: query.refetch,
    setAutoRefresh: (enabled: boolean) => {
      setAutoRefresh(enabled)
    },
  }
}

// =====================================================
// INDIVIDUAL DASHBOARD HOOKS
// =====================================================

/**
 * Hook for dashboard statistics only (faster, frequent updates)
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    refetchIntervalInBackground: false,
  })
}

/**
 * Hook for monthly performance data
 */
export function useMonthlyPerformance(months = 12) {
  return useQuery({
    queryKey: dashboardKeys.monthlyPerformance(months),
    queryFn: () => getMonthlyPerformance(months),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for project completion trends
 */
export function useProjectCompletionTrends(months = 6) {
  return useQuery({
    queryKey: dashboardKeys.completionTrends(months),
    queryFn: () => getProjectCompletionTrends(months),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for financial summary
 */
export function useFinancialSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: dashboardKeys.financialSummary(startDate, endDate),
    queryFn: () => getFinancialSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for cash flow projection
 */
export function useCashFlowProjection(days = 90) {
  return useQuery({
    queryKey: dashboardKeys.cashFlowProjection(days),
    queryFn: () => getCashFlowProjection(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for dashboard alerts
 */
export function useDashboardAlerts() {
  return useQuery({
    queryKey: dashboardKeys.alerts(),
    queryFn: getDashboardAlerts,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchIntervalInBackground: false,
  })
}

// =====================================================
// UTILITY HOOKS
// =====================================================

/**
 * Hook for refreshing dashboard stats with loading state
 */
export function useRefreshDashboardStats() {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'refresh'],
    queryFn: refreshDashboardStats,
    enabled: false, // Manual trigger only
    staleTime: 0, // Always fresh
    gcTime: 0, // Don't cache
  })
}

/**
 * Hook for real-time dashboard updates (WebSocket-like behavior)
 */
export function useRealtimeDashboard() {
  const [isEnabled, setIsEnabled] = useState(false)
  
  const query = useQuery({
    queryKey: [...dashboardKeys.overview(), 'realtime'],
    queryFn: getDashboardData,
    enabled: isEnabled,
    refetchInterval: isEnabled ? 10 * 1000 : false, // 10 seconds when enabled
    refetchIntervalInBackground: false,
  })

  return {
    data: query.data,
    isEnabled,
    setEnabled: setIsEnabled,
    lastUpdate: query.dataUpdatedAt,
  }
}

/**
 * Hook for dashboard performance metrics
 */
export function useDashboardPerformance() {
  const stats = useDashboardStats()
  const monthlyData = useMonthlyPerformance(3) // Last 3 months
  
  return useQuery({
    queryKey: [...dashboardKeys.all, 'performance'],
    queryFn: () => {
      if (!stats.data || !monthlyData.data) {
        return null
      }

      const currentMonth = monthlyData.data[monthlyData.data.length - 1]
      const previousMonth = monthlyData.data[monthlyData.data.length - 2]
      
      const monthlyGrowth = previousMonth 
        ? ((currentMonth?.amount || 0) - previousMonth.amount) / previousMonth.amount * 100
        : 0

      return {
        totalProjects: stats.data.total_projects_count,
        activeProjects: stats.data.active_projects_count,
        totalBudget: stats.data.total_budget_sum,
        totalReceived: stats.data.total_received_sum,
        completionRate: stats.data.total_budget_sum > 0 
          ? (stats.data.total_received_sum / stats.data.total_budget_sum) * 100 
          : 0,
        monthlyGrowth,
        overdueCount: stats.data.overdue_installments_count,
      }
    },
    enabled: !!stats.data && !!monthlyData.data,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for dashboard health status
 */
export function useDashboardHealth() {
  const stats = useDashboardStats()
  const alerts = useDashboardAlerts()
  
  return {
    isHealthy: (stats.data?.overdue_installments_count || 0) === 0 && 
               (alerts.data?.length || 0) === 0,
    overdueInstallments: stats.data?.overdue_installments_count || 0,
    alertsCount: alerts.data?.length || 0,
    lastCheck: stats.dataUpdatedAt || alerts.dataUpdatedAt,
  }
}

/**
 * Hook for dashboard export data
 */
export function useDashboardExport() {
  const overview = useDashboard()
  const monthlyPerformance = useMonthlyPerformance(12)
  const completionTrends = useProjectCompletionTrends(6)
  
  return {
    isReady: overview.isLoaded && 
             !monthlyPerformance.isLoading && 
             !completionTrends.isLoading,
    
    exportData: {
      overview: overview.overview,
      monthlyPerformance: monthlyPerformance.data,
      completionTrends: completionTrends.data,
      generatedAt: new Date().toISOString(),
    },
    
    generateReport: () => {
      // This could be extended to create PDF/CSV exports
      return JSON.stringify({
        overview: overview.overview,
        monthlyPerformance: monthlyPerformance.data,
        completionTrends: completionTrends.data,
        generatedAt: new Date().toISOString(),
      }, null, 2)
    },
  }
}