// =====================================================
// CENTRAL HOOKS EXPORT FILE
// =====================================================

// Project hooks
export {
  useProjects,
  useProject,
  useProjectStats,
  useRecentProjects,
  useProjectSearch,
  useProjectExists,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  projectKeys,
} from './use-projects'

// Transaction hooks
export {
  useTransactions,
  useTransaction,
  useProjectTransactions,
  useInstallmentTransactions,
  useRecentTransactions,
  useTransactionStats,
  useTransactionExists,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  transactionKeys,
} from './use-transactions'

// Installment hooks
export {
  useInstallments,
  useInstallment,
  useProjectInstallments,
  useUpcomingInstallments,
  useOverdueInstallments,
  useInstallmentStats,
  useProjectInstallmentValidation,
  useInstallmentExists,
  useCreateInstallment,
  useUpdateInstallment,
  useDeleteInstallment,
  useMarkInstallmentPaid,
  installmentKeys,
} from './use-installments'

// Dashboard hooks
export {
  useDashboard,
  useDashboardStats,
  useMonthlyPerformance,
  useProjectCompletionTrends,
  useFinancialSummary,
  useCashFlowProjection,
  useDashboardAlerts,
  useRefreshDashboardStats,
  useRealtimeDashboard,
  useDashboardPerformance,
  useDashboardHealth,
  useDashboardExport,
  dashboardKeys,
} from './use-dashboard'

// =====================================================
// COMBINED HOOKS FOR COMPLEX OPERATIONS
// =====================================================

// Combined hooks will be implemented after individual hooks are working
// These would combine multiple data sources for complex UI components

// Example implementation (commented for now):
// export function useProjectOverview(projectId: string) { ... }
// export function useFinancialOverview() { ... }