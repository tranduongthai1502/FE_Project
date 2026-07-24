import axiosClient from '../client/axiosClient'
import type {
  AdminListParams,
  CreatePlanPayload,
  CreateTenantPayload,
  PlanListRequest,
  SubscriptionPlan,
  Tenant,
  TenantListRequest,
  UpdatePlanPayload,
  UpdateTenantPayload,
} from '@/features/admin/types/admin.types'
import {
  attachPaginationMeta,
  getResponsePayload,
  getSubscriptionPlanList,
  getTenantList,
  getUserDetailPayload,
  normalizeSubscriptionPlan,
  normalizeTenant,
  normalizeTenantAdminUser,
} from '@/features/admin/utils/adminMappers'
import { normalizePlanDashboardStats, normalizeTenantDashboardStats } from './roleAdapters'
import { buildPlanPayload, buildPlanUpdatePayload, buildTenantCreatePayload, buildTenantUpdatePayload } from './rolePayload'
import { ADMIN_LIST_PAGE_SIZE, buildListRequest } from './roleRequests'

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

  async createTenant(payload: CreateTenantPayload) {
    const response = await axiosClient.post('/api/tenant', buildTenantCreatePayload(payload))
    return normalizeTenant(getResponsePayload(response))
  },

  async updateTenant(tenantId: string, payload: UpdateTenantPayload) {
    return axiosClient.put(`/api/tenant/${encodeURIComponent(tenantId)}`, buildTenantUpdatePayload(payload))
  },

  async getSubscriptionPlans(params?: AdminListParams) {
    const request = buildListRequest({
      sortField: 'name',
      filters: {},
      sortBy: 'ASC',
      page: 1,
      size: ADMIN_LIST_PAGE_SIZE,
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

  async createPlan(payload: CreatePlanPayload) {
    return axiosClient.post('/api/plan', buildPlanPayload(payload))
  },

  async updatePlan(planId: string, payload: UpdatePlanPayload) {
    if (!planId.trim()) {
      throw new Error('Missing subscription plan id')
    }

    return axiosClient.put(`/api/plan/${encodeURIComponent(planId)}`, buildPlanUpdatePayload(payload))
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
