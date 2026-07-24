import type { ActivityLog, PlanDashboardStats, TenantDashboardStats } from '@/features/admin/types/admin.types'
import { getResponsePayload } from '@/features/admin/utils/adminMappers'

function readNumberValue(payload: any, keys: string[]) {
  for (const key of keys) {
    const value = payload?.[key]
    const numberValue = Number(value)

    if (value !== undefined && value !== null && Number.isFinite(numberValue)) {
      return numberValue
    }
  }

  return undefined
}

function readStringValue(payload: any, keys: string[]) {
  for (const key of keys) {
    const value = payload?.[key]

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value)
    }
  }

  return undefined
}

function readBooleanValue(payload: any, keys: string[]) {
  for (const key of keys) {
    const value = payload?.[key]

    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true' || normalized === 'yes' || normalized === 'unlimited') return true
      if (normalized === 'false' || normalized === 'no') return false
    }
  }

  return undefined
}

export function normalizeTenantDashboardStats(payload: any): TenantDashboardStats {
  const data = getResponsePayload(payload)

  return {
    totalTenants: readNumberValue(data, ['totalTenants', 'totalTenant', 'total', 'tenantCount', 'total_tenants']),
    activeTenants: readNumberValue(data, ['activeTenants', 'activeTenant', 'active', 'activeTenantCount', 'active_tenants']),
    inactiveTenants: readNumberValue(data, ['inactiveTenants', 'inactiveTenant', 'inactive', 'inactiveTenantCount', 'inactive_tenants']),
    totalRevenue: readNumberValue(data, ['totalRevenue', 'revenue', 'monthlyRevenue', 'monthlyRecurringRevenue', 'total_revenue']),
    averageUsage: readNumberValue(data, ['averageUsage', 'averageUsagePercent', 'avgUsage', 'avgUsagePercent', 'average_usage']),
    churnRate: readNumberValue(data, ['churnRate', 'churnRatePercent', 'churn', 'churnPercent', 'churn_percent', 'churn_rate']),
  }
}

export function normalizePlanDashboardStats(payload: any): PlanDashboardStats {
  const data = getResponsePayload(payload)
  const topTier = data?.topTier || data?.topPlan || data?.highestPlan || data?.highestPricedPlan || {}

  return {
    activePlans: readNumberValue(data, ['activePlans', 'activePlan', 'activePlanCount', 'totalActivePlans', 'active_plans']),
    totalPlans: readNumberValue(data, ['totalPlans', 'totalPlan', 'planCount', 'total', 'total_plans']),
    topTierName: readStringValue(data, ['topTierName', 'topPlanName', 'highestPlanName', 'highestPricedPlanName']) || readStringValue(topTier, ['name', 'planName']),
    topTierMaxStaffAccount: readNumberValue(data, ['topTierMaxStaffAccount', 'topPlanMaxStaffAccount']) ?? readNumberValue(topTier, ['maxStaffAccount', 'maxStaffAccounts', 'max_staff_account']),
    topTierStaffAccountUnlimited: readBooleanValue(data, ['topTierStaffAccountUnlimited', 'topPlanStaffAccountUnlimited']) ?? readBooleanValue(topTier, ['staffAccountUnlimited', 'staff_account_unlimited']),
    monthlyActivePlanRevenue: readNumberValue(data, ['monthlyActivePlanRevenue', 'monthlyPlanRevenue', 'monthlyRevenue', 'activePlanRevenue', 'totalRevenue', 'revenue']),
    monthlyRevenueTrendPercent: readNumberValue(data, ['monthlyRevenueTrendPercent', 'monthlyRevenueGrowthPercent', 'revenueTrendPercent', 'revenueGrowthPercent']),
    renewalRate: readNumberValue(data, ['renewalRate', 'renewalRatePercent', 'retentionRate', 'retentionRatePercent']),
    renewalRateTrendPercent: readNumberValue(data, ['renewalRateTrendPercent', 'renewalTrendPercent', 'retentionRateTrendPercent']),
  }
}

export function getActivityLogList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data?.content)) return payload.data.content
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.records)) return payload.data.records
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  return []
}

export function normalizeActivityLog(log: any, index: number): ActivityLog | null {
  const title =
    readStringValue(log, ['title', 'message', 'description', 'action', 'activity', 'eventName', 'event_name']) ||
    readStringValue(log?.metadata, ['title', 'message', 'description', 'action']) ||
    readStringValue(log?.details, ['title', 'message', 'description', 'action']) ||
    'Activity logged'

  return {
    id: String(log?.id || log?.logId || log?.eventId || log?.uuid || `${title}-${index}`),
    eventType: String(log?.eventType || log?.event_type || log?.type || 'ACTION'),
    title,
    createdAt: log?.createdAt || log?.created_at || log?.createdDate || log?.timestamp || log?.eventTime || log?.time
      ? String(log?.createdAt || log?.created_at || log?.createdDate || log?.timestamp || log?.eventTime || log?.time)
      : undefined,
  }
}
