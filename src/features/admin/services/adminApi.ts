import axiosClient from '../../../api/axiosClient'
import type {
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

export const adminApi = {
  async getTenants() {
    const response = await axiosClient.post('/api/tenant/list', {
      "sortField": 'companyName',
      "filters": {},
      "sortBy": 'ASC',
      "page": 1,
      "size": 100,
    } satisfies TenantListRequest)

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

  async getSubscriptionPlans() {
    const response = await axiosClient.post('/api/plan/list', {
      "sortField": 'name',
      "filters": {},
      "sortBy": 'ASC',
      "page": 1,
      "size": 100,
    } satisfies PlanListRequest)

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
    return axiosClient.post('/api/tenant', buildTenantCreatePayload(payload))
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

  async getStaffList(page = 1, size = 100, tenantId?: string) {
    return axiosClient.post('/api/user/staff/list', {
      sortField: 'fullName',
      filters: tenantId ? { tenantId } : {},
      sortBy: 'ASC',
      page,
      size,
    })
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
