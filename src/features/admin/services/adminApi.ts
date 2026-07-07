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
      company_name: payload.companyName.trim(),
      subscription_plan: payload.subscriptionPlan,
      domain: tenantSlug,
      tenant_domain: `${tenantSlug}.jobfusion.ai`,
      admin_full_name: payload.adminFullName.trim(),
      admin_email: payload.adminEmail.trim(),
      user_role: 'tenant_admin',
      type: 'TENANT_ADMIN',
    }
    return axiosClient.post('/api/tenants', backendPayload)
  }
}
