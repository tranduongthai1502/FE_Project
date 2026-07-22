import axiosClient from '../../../api/axiosClient'
import type {
  AdminListParams,
  CreatePlanPayload,
  CreateTenantPayload,
  JobPosting,
  JobListRequest,
  JobListFilters,
  JobPostingPayload,
  PlanDashboardStats,
  PlanListRequest,
  SubscriptionPlan,
  Tenant,
  TenantDashboardStats,
  UpdatePlanPayload,
  TenantListRequest,
  UpdateTenantPayload,
} from '../types/admin.types'
import {
  getResponsePayload,
  attachPaginationMeta,
  getJobPostingList,
  getUserDetailPayload,
  getSubscriptionPlanList,
  getTenantList,
  normalizeJobPosting,
  normalizeTenantAdminUser,
  normalizeSubscriptionPlan,
  normalizeTenant,
} from '../utils/adminMappers'
import { buildPlanPayload, buildPlanUpdatePayload, buildTenantCreatePayload, buildTenantUpdatePayload } from '../utils/adminPayload'

export const ADMIN_LIST_PAGE_SIZE = 5

function buildListRequest(defaults: PlanListRequest, params?: AdminListParams): PlanListRequest {
  const page = params?.page ?? defaults.page

  return {
    ...defaults,
    ...params,
    page: Math.max(1, page),
    filters: params?.filters ?? defaults.filters,
  }
}

function buildJobListRequest(params?: AdminListParams<JobListFilters>): JobListRequest {
  const page = params?.page ?? 1
  const filters = params?.filters
  const hasFilters = Boolean(filters && Object.values(filters).some((value) => String(value ?? '').trim() !== ''))

  return {
    sortField: params?.sortField ?? 'createdAt',
    filters: hasFilters ? filters ?? null : null,
    sortBy: params?.sortBy ?? 'DESC',
    page: Math.max(1, page),
    size: params?.size ?? ADMIN_LIST_PAGE_SIZE,
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
      "sortField": 'companyName',
      "filters": {},
      "sortBy": 'ASC',
      "page": 1,
      "size": ADMIN_LIST_PAGE_SIZE,
    }, params) satisfies TenantListRequest

    console.log('[adminApi.getTenants] request payload', request)
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
      "sortField": 'name',
      "filters": {},
      "sortBy": 'ASC',
      "page": 1,
      "size": ADMIN_LIST_PAGE_SIZE,
    }, params) satisfies PlanListRequest

    console.log('[adminApi.getSubscriptionPlans] request payload', request)
    const response = await axiosClient.post('/api/plan/list', request)

    return attachPaginationMeta(getSubscriptionPlanList(response)
      .map((plan) => normalizeSubscriptionPlan(plan))
      .filter((plan): plan is SubscriptionPlan => Boolean(plan)), response)
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
    return normalizeTenant(getResponsePayload(response))
  },

  async updateTenant(tenantId: string, payload: UpdateTenantPayload) {
    return axiosClient.put(`/api/tenant/${encodeURIComponent(tenantId)}`, buildTenantUpdatePayload(payload))
  },

  async createPlan(payload: CreatePlanPayload) {
    return axiosClient.post('/api/plan', buildPlanPayload(payload))
  },

  async updatePlan(planId: string, payload: UpdatePlanPayload) {
    if (!planId.trim()) {
      throw new Error('Missing subscription plan id')
    }

    return axiosClient.put(`/api/plan/${encodeURIComponent(planId)}`, buildPlanUpdatePayload(payload))
  },

  async getStaffList(pageOrParams: number | AdminListParams = 1, size = ADMIN_LIST_PAGE_SIZE) {
    const params = typeof pageOrParams === 'number'
      ? { page: pageOrParams, size }
      : pageOrParams
    const request = buildListRequest({
      sortField: 'fullName',
      filters: {},
      sortBy: 'ASC',
      page: 1,
      size: ADMIN_LIST_PAGE_SIZE,
    }, params)

    console.log('[adminApi.getStaffList] request payload', request)
    return axiosClient.post('/api/user/staff/list', request)
  },

  async getJobPostings(params?: AdminListParams<JobListFilters>) {
    const request = buildJobListRequest(params)

    console.log('[adminApi.getJobPostings] request payload', request)
    const response = await axiosClient.post('/api/job-posting/list', request)

    return attachPaginationMeta(getJobPostingList(response)
      .map((job) => normalizeJobPosting(job))
      .filter((job): job is JobPosting => Boolean(job)), response)
  },

  async getJobPostingById(id: string) {
    const response = await axiosClient.get(`/api/job-posting/${encodeURIComponent(id)}`)
    const job = normalizeJobPosting(getResponsePayload(response))

    if (!job) {
      throw new Error('Job posting not found')
    }

    return job
  },

  async createJobPosting(payload: JobPostingPayload) {
    const response = await axiosClient.post('/api/job-posting', payload)
    return normalizeJobPosting(getResponsePayload(response))
  },

  async updateJobPosting(id: string, payload: JobPostingPayload) {
    const response = await axiosClient.put(`/api/job-posting/${encodeURIComponent(id)}`, payload)
    return normalizeJobPosting(getResponsePayload(response))
  },

  async deleteJobPosting(id: string) {
    return axiosClient.delete(`/api/job-posting/${encodeURIComponent(id)}`)
  },

  async getUserById(id: string) {
    const response = await axiosClient.get(`/api/user/${encodeURIComponent(id)}`)
    const user = normalizeTenantAdminUser(getUserDetailPayload(response))

    if (!user) {
      throw new Error('User detail not found')
    }

    return user
  },

  async createStaff(payload: { email: string; fullName: string; role: string[]; status?: string; tenantId?: string }) {
    return axiosClient.post('/api/user/staff', payload)
  },

  async updateStaff(id: string, payload: { email: string; fullName: string; role: string[]; status?: string; tenantId?: string }) {
    return axiosClient.put(`/api/user/staff/${encodeURIComponent(id)}`, payload)
  },

  async deleteStaff(id: string) {
    return axiosClient.delete(`/api/user/staff/${encodeURIComponent(id)}`)
  }
}
