import type { SubscriptionPlan, Tenant } from '../../domain/adminApi.types'
import { calculateAdminDashboardMetrics, isHighestPricedPlan as checkHighestPricedPlan } from '../../domain/superAdminMetrics'

export function useSuperAdminDashboardMetricsController({
  dashboardTenants,
  dashboardPlans,
  dashboardError,
}: {
  dashboardTenants: Tenant[]
  dashboardPlans: SubscriptionPlan[]
  dashboardError?: unknown
}) {
  const {
    activeTenantsCount,
    expiringTenantCount,
    monthlyRecurringRevenue,
    tenantPlanDisplayRows,
  } = calculateAdminDashboardMetrics(dashboardTenants, dashboardPlans)

  const isHighestPricedPlan = (planName: string) => checkHighestPricedPlan(planName, dashboardPlans)

  const maxTenantPlanCount = Math.max(1, ...tenantPlanDisplayRows.map(([, count]) => count))
  const platformStaffAccounts = dashboardTenants.reduce((total, tenant) => total + tenant.userQuotaUsed, 0)

  const recentTenants = dashboardTenants.length > 0 ? dashboardTenants.slice(0, 5) : [
    { id: 'velocity-ai', name: 'Velocity AI', subscriptionPlan: 'Enterprise', status: 'Active', createdAt: 'Jul 03, 2026' },
    { id: 'quantum-recruits', name: 'Quantro Recruits', subscriptionPlan: 'Pro Plan', status: 'Active', createdAt: 'Jun 29, 2026' },
    { id: 'greengrid-solar', name: 'GreenGrid Solar', subscriptionPlan: 'Growth', status: 'Active', createdAt: 'Jun 28, 2026' },
    { id: 'nexus-media', name: 'Nexus Media', subscriptionPlan: 'Enterprise', status: 'Active', createdAt: 'Jun 12, 2026' },
    { id: 'techflow', name: 'TechFlow', subscriptionPlan: 'Pro Plan', status: 'Inactive', createdAt: 'May 25, 2026' },
  ] as Array<Pick<Tenant, 'id' | 'name' | 'subscriptionPlan' | 'status'> & { createdAt: string }>

  const formatTenantCreatedAt = (tenant: typeof recentTenants[number]) => {
    const date = 'createdAt' in tenant ? tenant.createdAt : ''
    return date || 'Jul 03, 2026'
  }

  const getTenantPlanName = (tenant: { subscriptionPlan: string; subscriptionPlanId?: string }) => (
    tenant.subscriptionPlan || 'Basic'
  )

  const promptRows = [
    { name: 'JD Generator', updated: 'Updated 2 days ago', status: 'Optimal', action: 'Edit' },
    { name: 'DSS Analytics', updated: 'Updated 34 days ago', status: 'Stale Pipeline', action: 'Update Now' },
    { name: 'CV Parsing Engine', updated: 'Updated 6 days ago', status: 'Optimal', action: 'Edit' },
  ]

  const systemStatusNote = dashboardError
    ? 'System status unavailable'
    : 'System Healthy: Global AWS Load 14%'

  return {
    activeTenantsCount,
    expiringTenantCount,
    monthlyRecurringRevenue,
    tenantPlanDisplayRows,
    isHighestPricedPlan,
    maxTenantPlanCount,
    platformStaffAccounts,
    recentTenants,
    formatTenantCreatedAt,
    getTenantPlanName,
    promptRows,
    systemStatusNote,
  }
}
