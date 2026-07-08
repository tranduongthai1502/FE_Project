import axiosClient from '../../../app/api/axiosClient'

export type CreateTenantPayload = {
  companyName: string
  subscriptionPlan: string
  domain: string
  adminFullName: string
  adminEmail: string
}

export const adminApi = {
  async createTenant(payload: CreateTenantPayload) {
    const tenantSlug = payload.domain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const backendPayload = {
      companyName: payload.companyName.trim(),
      subscriptionPlan: payload.subscriptionPlan,
      domain: tenantSlug,
      tenantDomain: `${tenantSlug}.jobfusion.ai`,
      adminFullName: payload.adminFullName.trim(),
      adminEmail: payload.adminEmail.trim(),
      userRole: 'tenant_admin',
      type: 'TENANT_ADMIN',
    }
    return axiosClient.post('/api/tenants', backendPayload)
  }
}
