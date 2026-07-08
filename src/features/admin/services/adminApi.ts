import axiosClient from '../../../app/api/axiosClient'

export type CreateTenantPayload = {
  companyName: string
  domain: string
  planId: string
  adminFullName: string
  adminEmail: string
}

export const adminApi = {
  async createTenant(payload: CreateTenantPayload) {
    const tenantSlug = payload.domain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const backendPayload = {
      companyName: payload.companyName.trim(),
      domain: tenantSlug,
      planId: payload.planId,
      adminFullName: payload.adminFullName.trim(),
      adminEmail: payload.adminEmail.trim(),
    }
    return axiosClient.post('/api/tenants', backendPayload)
  }
}
