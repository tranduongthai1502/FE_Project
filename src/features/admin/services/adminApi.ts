import axiosClient from '../../../api/axiosClient'
import type {
  AdminListParams,
  CreatePlanPayload,
  CreateTenantPayload,
  PlanListRequest,
  SubscriptionPlan,
  Tenant,
  UpdatePlanPayload,
  TenantListRequest,
  UpdateTenantPayload,
} from '../types/admin.types'
import {
  getResponsePayload,
  getSubscriptionPlanList,
  getTenantList,
  normalizeTenantAdminUser,
  normalizeSubscriptionPlan,
  normalizeTenant,
} from '../utils/adminMappers'
import { buildPlanPayload, buildPlanUpdatePayload, buildTenantCreatePayload, buildTenantUpdatePayload } from '../utils/adminPayload'

export const ADMIN_LIST_PAGE_SIZE = 5

function buildListRequest(defaults: PlanListRequest, params?: AdminListParams): PlanListRequest {
  return {
    ...defaults,
    ...params,
    filters: params?.filters ?? defaults.filters,
  }
}

export const adminApi = {
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

    return getTenantList(response)
      .map(normalizeTenant)
      .filter((tenant): tenant is Tenant => Boolean(tenant))
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

    return getSubscriptionPlanList(response)
      .map(normalizeSubscriptionPlan)
      .filter((plan): plan is SubscriptionPlan => Boolean(plan))
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

  async getStaffList(page = 1, size = ADMIN_LIST_PAGE_SIZE, tenantId?: string) {
    const request = {
      sortField: 'fullName',
      filters: tenantId ? { tenantId } : {},
      sortBy: 'ASC',
      page,
      size,
    }

    console.log('[adminApi.getStaffList] request payload', request)
    return axiosClient.post('/api/user/staff/list', request)
  },

  async getUserById(id: string) {
    const response = await axiosClient.get(`/api/user/${encodeURIComponent(id)}`)
    const user = normalizeTenantAdminUser(getResponsePayload(response))

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
