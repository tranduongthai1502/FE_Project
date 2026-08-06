import { useSuperAdminNavigationController } from './useSuperAdminNavigationController'
import { useSuperAdminDashboardQueryController } from './useSuperAdminDashboardQueryController'
import { useSuperAdminDashboardMetricsController } from './useSuperAdminDashboardMetricsController'

export function useSuperAdminDashboardController() {
  const nav = useSuperAdminNavigationController()
  const query = useSuperAdminDashboardQueryController({ enabled: nav.activeView === 'dashboard' })
  const metrics = useSuperAdminDashboardMetricsController({
    dashboardTenants: query.dashboardTenants,
    dashboardPlans: query.dashboardPlans,
    dashboardError: query.dashboardError,
  })

  return {
    ...nav,
    ...query,
    ...metrics,
  }
}
