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
  getSubscriptionPlanList,
  getTenantList,
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

    return axiosClient.put(`/api/plan/${encodeURIComponent(planId)}`, buildPlanUpdatePayload(planId, payload))
  }
}
