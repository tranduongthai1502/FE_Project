import { useSuperAdminDashboardData } from '../queryHooks/useAdminQueries'
import { getErrorMessage as getAdminErrorMessage } from '@/core/utils/errors/errorMessages'

export function useSuperAdminDashboardQueryController({ enabled }: { enabled: boolean }) {
  const dashboardQuery = useSuperAdminDashboardData({ enabled })
  const dashboardTenants = dashboardQuery.data?.tenants ?? []
  const dashboardPlans = dashboardQuery.data?.plans ?? []
  const isDashboardLoading = dashboardQuery.isLoading || dashboardQuery.isFetching
  const dashboardError = dashboardQuery.error

  const dashboardErrorMessage = dashboardError
    ? getAdminErrorMessage(dashboardError, 'Unable to load platform data. Please try again later.')
    : ''

  return {
    dashboardQuery,
    dashboardTenants,
    dashboardPlans,
    isDashboardLoading,
    dashboardError,
    dashboardErrorMessage,
  }
}
