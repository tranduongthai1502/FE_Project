import axiosClient from '../../../app/api/axiosClient'

export type CreateTenantPayload = {
  companyName: string
  domain: string
  planId: string
  adminFullName: string
  adminEmail: string
}

export type SubscriptionPlan = {
  id: string
  name: string
  monthlyPrice: number
  maxStaffAccount: number
  staffAccountUnlimited: boolean
  maxActiveJobPosting: number
  activeJobPostingUnlimited: boolean
  status: string
  priceLabel?: string
}

export type Tenant = {
  id: string
  name: string
  subscriptionPlan: string
  expirationDate: string
  userQuotaUsed: number
  userQuotaLimit: number
  status: string
}

export type PlanListRequest = {
  sortField: string
  filters: string
  sortBy: 'ASC' | 'DESC'
  page: number
  size: number
}

export type TenantListRequest = PlanListRequest

export type CreatePlanFeature = {
  key: string
  status: string
}

export type CreatePlanPayload = {
  name: string
  description: string
  monthlyPrice: number
  maxStaffAccount: number
  staffAccountUnlimited: boolean
  maxActiveJobPosting: number
  activeJobPostingUnlimited: boolean
  features: CreatePlanFeature[]
}

function getSubscriptionPlanList(payload: any): any[] {
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

function getTenantList(payload: any): any[] {
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

function normalizeSubscriptionPlan(plan: any): SubscriptionPlan | null {
  const id = plan?.id || plan?.planId || plan?.uuid
  if (!id) return null

  const name = plan?.name || plan?.planName || plan?.title || 'Subscription Plan'
  const price = Number(plan?.monthlyPrice ?? plan?.price ?? plan?.amount ?? 0)
  const billingCycle = plan?.billingCycle || plan?.cycle || plan?.interval
  const priceLabel = Number.isFinite(price)
    ? `$${price.toFixed(2)}${billingCycle ? `/${billingCycle}` : ' / mo'}`
    : undefined

  return {
    id: String(id),
    name: String(name),
    monthlyPrice: Number.isFinite(price) ? price : 0,
    maxStaffAccount: Number(plan?.maxStaffAccount ?? plan?.maxStaffAccounts ?? 0),
    staffAccountUnlimited: Boolean(plan?.staffAccountUnlimited),
    maxActiveJobPosting: Number(plan?.maxActiveJobPosting ?? plan?.maxActiveJobPostings ?? 0),
    activeJobPostingUnlimited: Boolean(plan?.activeJobPostingUnlimited),
    status: String(plan?.status || (plan?.active === false ? 'Inactive' : 'Active')),
    priceLabel,
  }
}

function normalizeTenant(tenant: any): Tenant | null {
  const id = tenant?.id || tenant?.tenantId || tenant?.uuid || tenant?.domain
  if (!id) return null

  const plan = tenant?.plan || tenant?.subscriptionPlan || tenant?.subscription_plan || {}
  const quotaLimit = Number(
    tenant?.userQuotaLimit ??
    tenant?.maxStaffAccount ??
    tenant?.maxStaffAccounts ??
    plan?.maxStaffAccount ??
    plan?.maxStaffAccounts ??
    0
  )

  return {
    id: String(id),
    name: String(tenant?.companyName || tenant?.name || tenant?.fullName || tenant?.tenantName || 'Tenant'),
    subscriptionPlan: String(plan?.name || tenant?.planName || tenant?.subscriptionPlanName || tenant?.subscriptionPlan || '-'),
    expirationDate: String(tenant?.expirationDate || tenant?.expiredAt || tenant?.expiresAt || tenant?.endDate || '-'),
    userQuotaUsed: Number(tenant?.userQuotaUsed ?? tenant?.usedStaffAccount ?? tenant?.staffUsed ?? tenant?.userCount ?? 0),
    userQuotaLimit: Number.isFinite(quotaLimit) ? quotaLimit : 0,
    status: String(tenant?.status || (tenant?.active === false ? 'Inactive' : 'Active')),
  }
}

export const adminApi = {
  async getTenants() {
    const response = await axiosClient.post('/api/tenant/list', {
      "sortField": 'name',
      "filters": '',
      "sortBy": 'ASC',
      "page": 0,
      "size": 0,
    } satisfies TenantListRequest)

    return getTenantList(response)
      .map(normalizeTenant)
      .filter((tenant): tenant is Tenant => Boolean(tenant))
  },

  async getSubscriptionPlans() {
    const response = await axiosClient.post('/api/plan/list', {
      "sortField": 'name',
      "filters": '',
      "sortBy": 'ASC',
      "page": 0,
      "size": 0,
    } satisfies PlanListRequest)

    return getSubscriptionPlanList(response)
      .map(normalizeSubscriptionPlan)
      .filter((plan): plan is SubscriptionPlan => Boolean(plan))
  },

  async createTenant(payload: CreateTenantPayload) {
    const tenantSlug = payload.domain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const backendPayload = {
      "companyName": payload.companyName.trim(),
      "domain": tenantSlug,
      "planId": payload.planId,
      "adminFullName": payload.adminFullName.trim(),
      "adminEmail": payload.adminEmail.trim(),
    }
    return axiosClient.post('/api/tenant', backendPayload)
  },

  async createPlan(payload: CreatePlanPayload) {
    return axiosClient.post('/api/plan', {
      "name": payload.name.trim(),
      "description": payload.description.trim(),
      "monthlyPrice": payload.monthlyPrice,
      "maxStaffAccount": payload.maxStaffAccount,
      "staffAccountUnlimited": payload.staffAccountUnlimited,
      "maxActiveJobPosting": payload.maxActiveJobPosting,
      "activeJobPostingUnlimited": payload.activeJobPostingUnlimited,
      "features": payload.features,
    })
  }
}
