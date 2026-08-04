import axiosClient from '@/core/api/axiosClient'
import { API_LIST_PAGE_SIZE } from '@/core/api/apiConstants'
import type {
  AdminListParams,
  PlanListRequest,
  TenantListRequest,
} from '@/core/api/api.types'
import type {
  CreatePlanPayload,
  CreateTenantPayload,
  PlanDashboardStats,
  Prompt,
  SubscriptionPlan,
  Tenant,
  TenantDashboardStats,
  UpdatePlanPayload,
  UpdateTenantPayload,
} from '../domain/adminApi.types'
import { attachPaginationMeta } from '@/core/utils/pagination'
import {
  getResponsePayload,
  getUserDetailPayload,
} from '@/core/api/apiMappers'
import {
  getSubscriptionPlanList,
  getTenantList,
  normalizeSubscriptionPlan,
  normalizeTenant,
  normalizeTenantAdminUser,
} from './adminMappers'
import { buildPlanPayload, buildPlanUpdatePayload, buildTenantCreatePayload, buildTenantUpdatePayload } from '../application/adminPayload'

export const ADMIN_LIST_PAGE_SIZE = API_LIST_PAGE_SIZE

function buildListRequest(defaults: PlanListRequest, params?: AdminListParams): PlanListRequest {
  const page = params?.page ?? defaults.page

  return {
    ...defaults,
    ...params,
    page: Math.max(1, page),
    filters: params?.filters ?? defaults.filters,
  }
}

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

function normalizeTenantDashboardStats(payload: any): TenantDashboardStats {
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

function normalizePlanDashboardStats(payload: any): PlanDashboardStats {
  const data = getResponsePayload(payload)
  const topTier = data?.topTier || data?.topPlan || data?.highestPlan || data?.highestPricedPlan || {}

  return {
    activePlans: readNumberValue(data, ['activePlans', 'activePlan', 'activePlanCount', 'totalActivePlans', 'active_plans']),
    activePlansTrend: readNumberValue(data, ['activePlansTrend', 'activePlanTrend', 'activePlansTrendPercent', 'active_plans_trend']),
    totalPlans: readNumberValue(data, ['totalPlans', 'totalPlan', 'planCount', 'total', 'total_plans']),
    topTierName: readStringValue(data, ['topTierPlanName', 'topTierName', 'topPlanName', 'highestPlanName', 'highestPricedPlanName']) || readStringValue(topTier, ['name', 'planName']),
    topTierSubscribers: readNumberValue(data, ['topTierSubscribers', 'topTierSubscriberCount', 'topPlanSubscribers', 'top_plan_subscribers']) ?? readNumberValue(topTier, ['subscribers', 'subscriberCount']),
    topTierMaxStaffAccount: readNumberValue(data, ['topTierMaxStaffAccount', 'topPlanMaxStaffAccount']) ?? readNumberValue(topTier, ['maxStaffAccount', 'maxStaffAccounts', 'max_staff_account']),
    topTierStaffAccountUnlimited: readBooleanValue(data, ['topTierStaffAccountUnlimited', 'topPlanStaffAccountUnlimited']) ?? readBooleanValue(topTier, ['staffAccountUnlimited', 'staff_account_unlimited']),
    monthlyActivePlanRevenue: readNumberValue(data, ['monthlyActivePlanRevenue', 'monthlyPlanRevenue', 'monthlyRevenue', 'activePlanRevenue', 'totalRevenue', 'revenue']),
    monthlyRevenueTrendPercent: readNumberValue(data, ['monthlyActivePlanRevenueTrend', 'monthlyRevenueTrendPercent', 'monthlyRevenueGrowthPercent', 'revenueTrendPercent', 'revenueGrowthPercent']),
    renewalRate: readNumberValue(data, ['renewalRate', 'renewalRatePercent', 'retentionRate', 'retentionRatePercent']),
    renewalRateTrendPercent: readNumberValue(data, ['renewalRateTrend', 'renewalRateTrendPercent', 'renewalTrendPercent', 'retentionRateTrendPercent']),
  }
}

export const adminApi = {
  async getTenantDashboardStats() {
    const response = await axiosClient.get('/api/dashboard/stats/tenant')
    return normalizeTenantDashboardStats(response)
  },

  async getPlanDashboardStats() {
    const response = await axiosClient.get('/api/dashboard/stats/plan')
    return normalizePlanDashboardStats(response)
  },

  async getTenants(params?: AdminListParams) {
    const request = buildListRequest({
      sortField: 'companyName',
      filters: {},
      sortBy: 'ASC',
      page: 1,
      size: ADMIN_LIST_PAGE_SIZE,
    }, params) satisfies TenantListRequest

    const response = await axiosClient.post('/api/tenant/list', request)

    return attachPaginationMeta(getTenantList(response)
      .map(normalizeTenant)
      .filter((tenant): tenant is Tenant => Boolean(tenant)), response)
  },

  async getTenantById(id: string) {
    const response = await axiosClient.get(`/api/tenant/${encodeURIComponent(id)}`)
    const tenant = normalizeTenant(getResponsePayload(response))

    if (!tenant) {
      throw new Error('Tenant detail not found')
    }

    return tenant
  },

  async getSubscriptionPlans(params?: AdminListParams) {
    const request = buildListRequest({
      sortField: 'name',
      filters: {},
      sortBy: 'ASC',
      page: 1,
      size: ADMIN_LIST_PAGE_SIZE,
    }, params) satisfies PlanListRequest

    const response = await axiosClient.post('/api/plan/list', request)

    return attachPaginationMeta(getSubscriptionPlanList(response)
      .map((plan) => normalizeSubscriptionPlan(plan))
      .filter((plan): plan is SubscriptionPlan => Boolean(plan)), response)
  },

  async getSubscriptionPlanById(id: string) {
    return this.getPlanById(id)
  },

  async getPlanById(id: string) {
    const response = await axiosClient.get(`/api/plan/${encodeURIComponent(id)}`)
    const plan = normalizeSubscriptionPlan(getResponsePayload(response))

    if (!plan) {
      throw new Error('Subscription plan detail not found')
    }

    return plan
  },

  async createTenant(payload: CreateTenantPayload) {
    const response = await axiosClient.post('/api/tenant', buildTenantCreatePayload(payload))
    const normalized = normalizeTenant(getResponsePayload(response))
    if (!normalized) throw new Error('Failed to create tenant')
    return normalized
  },

  async updateTenant(tenantId: string, payload: UpdateTenantPayload) {
    const response = await axiosClient.put(`/api/tenant/${encodeURIComponent(tenantId)}`, buildTenantUpdatePayload(payload))
    const normalized = normalizeTenant(getResponsePayload(response))
    if (!normalized) throw new Error('Failed to update tenant')
    return normalized
  },

  async deleteTenant(tenantId: string) {
    await axiosClient.delete(`/api/tenant/${encodeURIComponent(tenantId)}`)
  },

  async createPlan(payload: CreatePlanPayload) {
    const response = await axiosClient.post('/api/plan', buildPlanPayload(payload))
    const normalized = normalizeSubscriptionPlan(getResponsePayload(response))
    if (!normalized) throw new Error('Failed to create subscription plan')
    return normalized
  },

  async createSubscriptionPlan(payload: CreatePlanPayload) {
    return this.createPlan(payload)
  },

  async updatePlan(planId: string, payload: UpdatePlanPayload) {
    if (!planId.trim()) {
      throw new Error('Missing subscription plan id')
    }

    const response = await axiosClient.put(`/api/plan/${encodeURIComponent(planId)}`, buildPlanUpdatePayload(payload))
    const normalized = normalizeSubscriptionPlan(getResponsePayload(response))
    if (!normalized) throw new Error('Failed to update subscription plan')
    return normalized
  },

  async updateSubscriptionPlan(planId: string, payload: UpdatePlanPayload) {
    return this.updatePlan(planId, payload)
  },

  async deletePlan(planId: string) {
    await axiosClient.delete(`/api/plan/${encodeURIComponent(planId)}`)
  },

  async deleteSubscriptionPlan(planId: string) {
    return this.deletePlan(planId)
  },

  async getPrompts() {
    const response = await axiosClient.get('/api/prompts')
    const payload = getResponsePayload(response)
    return Array.isArray(payload) ? (payload as Prompt[]) : []
  },

  async updatePrompt(id: string, content: string) {
    const response = await axiosClient.put(`/api/prompts/${encodeURIComponent(id)}`, { content })
    return getResponsePayload(response) as Prompt
  },

  async getUserById(id: string) {
    const response = await axiosClient.get(`/api/user/${encodeURIComponent(id)}`)
    const user = normalizeTenantAdminUser(getUserDetailPayload(response))

    if (!user) {
      throw new Error('User detail not found')
    }

    return user
  },
}
