import type { CreatePlanFeature, SubscriptionPlan, Tenant } from '../types/admin.types'

export function getSubscriptionPlanList(payload: any): any[] {
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

export function getTenantList(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.result)) return payload.result
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data?.content)) return payload.data.content
  if (Array.isArray(payload?.data?.items)) return payload.data.items
  if (Array.isArray(payload?.data?.records)) return payload.data.records
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  if (Array.isArray(payload?.data?.result)) return payload.data.result
  if (Array.isArray(payload?.data?.results)) return payload.data.results
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.data?.data?.content)) return payload.data.data.content
  if (Array.isArray(payload?.data?.data?.items)) return payload.data.data.items
  if (Array.isArray(payload?.data?.data?.records)) return payload.data.data.records
  if (Array.isArray(payload?.data?.data?.list)) return payload.data.data.list
  return []
}

export function normalizeSubscriptionPlan(plan: any): SubscriptionPlan | null {
  const id = plan?.id || plan?.planId || plan?.uuid
  if (!id) return null

  const name = plan?.name || plan?.planName || plan?.title || 'Subscription Plan'
  const price = Number(plan?.monthlyPrice ?? plan?.price ?? plan?.amount ?? 0)
  const maxStaffAccountValue = plan?.maxStaffAccount ?? plan?.maxStaffAccounts ?? 0
  const maxActiveJobPostingValue = plan?.maxActiveJobPosting ?? plan?.maxActiveJobPostings ?? 0
  const isUnlimitedValue = (value: unknown) => String(value).trim().toLowerCase() === 'unlimited'
  const maxStaffAccount = Number(maxStaffAccountValue)
  const maxActiveJobPosting = Number(maxActiveJobPostingValue)
  const billingCycle = plan?.billingCycle || plan?.cycle || plan?.interval
  const featureList = Array.isArray(plan?.features)
    ? plan.features
    : Array.isArray(plan?.planFeatures)
      ? plan.planFeatures
      : []
  const priceLabel = Number.isFinite(price)
    ? `$${price.toFixed(2)}${billingCycle ? `/${billingCycle}` : ' / mo'}`
    : undefined

  return {
    id: String(id),
    name: String(name),
    description: String(plan?.description || plan?.shortDescription || plan?.tagline || ''),
    monthlyPrice: Number.isFinite(price) ? price : 0,
    maxStaffAccount: Number.isFinite(maxStaffAccount) ? maxStaffAccount : 0,
    staffAccountUnlimited: Boolean(plan?.staffAccountUnlimited) || isUnlimitedValue(maxStaffAccountValue),
    maxActiveJobPosting: Number.isFinite(maxActiveJobPosting) ? maxActiveJobPosting : 0,
    activeJobPostingUnlimited: Boolean(plan?.activeJobPostingUnlimited) || isUnlimitedValue(maxActiveJobPostingValue),
    status: String(plan?.status || (plan?.active === false ? 'Inactive' : 'Active')),
    createdAt: String(plan?.createdAt || plan?.createdDate || plan?.created_at || plan?.createAt || ''),
    features: featureList.map((feature: any) => ({
      key: String(feature?.key || feature?.code || feature?.name || feature?.featureKey || ''),
      status: String(feature?.status || (feature?.enabled === false ? 'DISABLED' : 'ENABLED')),
    })).filter((feature: CreatePlanFeature) => feature.key),
    priceLabel,
  }
}

export function normalizeTenant(tenant: any): Tenant | null {
  const id = tenant?.id || tenant?.tenantId || tenant?.uuid || tenant?.domain
  if (!id) return null

  const plan = tenant?.plan || tenant?.subscriptionPlan || tenant?.subscription_plan || {}
  const quotaLimit = Number(
    tenant?.userQuotaLimit ??
    tenant?.maxUsers ??
    tenant?.maxStaffAccount ??
    tenant?.maxStaffAccounts ??
    plan?.maxStaffAccount ??
    plan?.maxStaffAccounts ??
    0
  )

  return {
    id: String(id),
    name: String(tenant?.companyName || tenant?.name || tenant?.fullName || tenant?.tenantName || 'Tenant'),
    domain: tenant?.domain ? String(tenant.domain) : undefined,
    industry: tenant?.industry ? String(tenant.industry) : undefined,
    region: tenant?.region ? String(tenant.region) : undefined,
    subscriptionPlanId: tenant?.planId || tenant?.subscriptionPlanId || plan?.id || plan?.planId
      ? String(tenant?.planId || tenant?.subscriptionPlanId || plan?.id || plan?.planId)
      : undefined,
    subscriptionPlan: String(plan?.name || tenant?.planName || tenant?.subscriptionPlanName || tenant?.subscriptionPlan || '-'),
    expirationDate: String(tenant?.expirationDate || tenant?.expiredAt || tenant?.expiresAt || tenant?.endDate || '-'),
    userQuotaUsed: Number(tenant?.userQuotaUsed ?? tenant?.activeUsers ?? tenant?.usedStaffAccount ?? tenant?.staffUsed ?? tenant?.userCount ?? 0),
    userQuotaLimit: Number.isFinite(quotaLimit) ? quotaLimit : 0,
    status: String(tenant?.status || (tenant?.active === false ? 'Inactive' : 'Active')),
    adminFullName: tenant?.adminFullName || tenant?.adminName || tenant?.tenantAdminName || tenant?.admin?.fullName || tenant?.admin?.name
      ? String(tenant?.adminFullName || tenant?.adminName || tenant?.tenantAdminName || tenant?.admin?.fullName || tenant?.admin?.name)
      : undefined,
    adminEmail: tenant?.adminEmail || tenant?.tenantAdminEmail || tenant?.admin?.email
      ? String(tenant?.adminEmail || tenant?.tenantAdminEmail || tenant?.admin?.email)
      : undefined,
  }
}
