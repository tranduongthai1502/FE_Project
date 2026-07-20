import type { CreatePlanFeature, SubscriptionPlan, Tenant, TenantAdminUser } from '../types/admin.types'

export function getResponsePayload(payload: any): any {
  const body = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  return body?.data && typeof body.data === 'object' ? body.data : body
}

export type PaginationMeta = {
  totalPages?: number
  totalElements?: number
  last?: boolean
  first?: boolean
}

export function getPaginationMeta(payload: any): PaginationMeta {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.page,
    payload?.data?.page,
    payload?.data?.data?.page,
    payload?.pagination,
    payload?.data?.pagination,
    payload?.data?.data?.pagination,
  ].filter(Boolean)

  for (const candidate of candidates) {
    const totalPages = Number(candidate.totalPages ?? candidate.total_pages ?? candidate.pageCount ?? candidate.totalPage)
    const totalElements = Number(candidate.totalElements ?? candidate.total_elements ?? candidate.totalItems ?? candidate.total)
    const last = typeof candidate.last === 'boolean' ? candidate.last : undefined
    const first = typeof candidate.first === 'boolean' ? candidate.first : undefined

    if (!Number.isNaN(totalPages) || !Number.isNaN(totalElements) || last !== undefined || first !== undefined) {
      return {
        totalPages: Number.isNaN(totalPages) ? undefined : totalPages,
        totalElements: Number.isNaN(totalElements) ? undefined : totalElements,
        last,
        first,
      }
    }
  }

  return {}
}

export function attachPaginationMeta<T>(items: T[], payload: any): T[] {
  return Object.assign(items, { __pagination: getPaginationMeta(payload) })
}

export function getListPageCount(items: unknown[], currentPage: number, pageSize: number) {
  const meta = (items as { __pagination?: PaginationMeta }).__pagination

  if (meta?.totalPages !== undefined) {
    return Math.max(1, meta.totalPages)
  }

  if (meta?.totalElements !== undefined) {
    return Math.max(1, Math.ceil(meta.totalElements / pageSize))
  }

  if (meta?.last === false) {
    return currentPage + 1
  }

  return Math.max(1, currentPage)
}

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

function isTruthyFlag(value: unknown) {
  if (typeof value === 'boolean') return value
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y'
}

function isUnlimitedValue(value: unknown) {
  return String(value ?? '').trim().toLowerCase() === 'unlimited'
}

export function normalizeSubscriptionPlan(plan: any, fallbackId?: string): SubscriptionPlan | null {
  const id = plan?.id || plan?.planId || plan?.uuid || fallbackId
  if (!id) return null

  const name = plan?.name || plan?.planName || plan?.title || 'Subscription Plan'
  const price = Number(plan?.monthlyPrice ?? plan?.monthly_price ?? plan?.price ?? plan?.amount ?? 0)
  const hasStaffLimitField =
    plan?.maxStaffAccount !== undefined ||
    plan?.maxStaffAccounts !== undefined ||
    plan?.max_staff_account !== undefined ||
    plan?.max_staff_accounts !== undefined
  const hasJobLimitField =
    plan?.maxActiveJobPosting !== undefined ||
    plan?.maxActiveJobPostings !== undefined ||
    plan?.max_active_job_posting !== undefined ||
    plan?.max_active_job_postings !== undefined
  const maxStaffAccountValue = plan?.maxStaffAccount ?? plan?.maxStaffAccounts ?? plan?.max_staff_account ?? plan?.max_staff_accounts ?? null
  const maxActiveJobPostingValue = plan?.maxActiveJobPosting ?? plan?.maxActiveJobPostings ?? plan?.max_active_job_posting ?? plan?.max_active_job_postings ?? null
  const maxStaffAccount = Number(maxStaffAccountValue)
  const maxActiveJobPosting = Number(maxActiveJobPostingValue)
  const billingCycle = plan?.billingCycle || plan?.cycle || plan?.interval
  const staffAccountUnlimited =
    isTruthyFlag(plan?.staffAccountUnlimited) ||
    isTruthyFlag(plan?.staff_account_unlimited) ||
    isTruthyFlag(plan?.maxStaffAccountUnlimited) ||
    isTruthyFlag(plan?.max_staff_account_unlimited) ||
    isUnlimitedValue(maxStaffAccountValue) ||
    (hasStaffLimitField && maxStaffAccountValue == null)
  const activeJobPostingUnlimited =
    isTruthyFlag(plan?.activeJobPostingUnlimited) ||
    isTruthyFlag(plan?.active_job_posting_unlimited) ||
    isTruthyFlag(plan?.maxActiveJobPostingUnlimited) ||
    isTruthyFlag(plan?.max_active_job_posting_unlimited) ||
    isUnlimitedValue(maxActiveJobPostingValue) ||
    (hasJobLimitField && maxActiveJobPostingValue == null)
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
    staffAccountUnlimited,
    maxActiveJobPosting: Number.isFinite(maxActiveJobPosting) ? maxActiveJobPosting : 0,
    activeJobPostingUnlimited,
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

  const plan = tenant?.plan || tenant?.subscriptionPlan || tenant?.subscription_plan || tenant?.subscriptionPlanDetail || tenant?.planDetail || tenant?.subscription?.plan || tenant?.subscription || tenant?.currentPlan || {}
  const planObject = typeof plan === 'object' && plan !== null ? plan : {}
  const planId =
    tenant?.planId ||
    tenant?.subscriptionPlanId ||
    tenant?.subscription_plan_id ||
    tenant?.subscription?.planId ||
    tenant?.subscription?.subscriptionPlanId ||
    tenant?.subscription?.plan?.id ||
    tenant?.subscription?.plan?.planId ||
    tenant?.currentPlanId ||
    tenant?.currentPlan?.id ||
    tenant?.currentPlan?.planId ||
    planObject?.id ||
    planObject?.planId ||
    (typeof plan === 'string' ? plan : '')
  const admin = tenant?.admin || tenant?.tenantAdmin || tenant?.adminUser || tenant?.user || tenant?.owner || {}
  const adminUserId =
    tenant?.adminUserId ||
    tenant?.tenantAdminId ||
    tenant?.tenantAdminUserId ||
    tenant?.adminId ||
    tenant?.userId ||
    admin?.id ||
    admin?.userId ||
    admin?.uuid
  const planSource = Object.keys(planObject).length > 0
    ? { ...planObject, id: planObject?.id || planObject?.planId || planId }
    : {
      id: planId,
      name: tenant?.planName || tenant?.subscriptionPlanName,
      monthlyPrice: tenant?.monthlyPrice ?? tenant?.planPrice,
      maxStaffAccount: tenant?.maxStaffAccount ?? tenant?.maxStaffAccounts,
      staffAccountUnlimited: tenant?.staffAccountUnlimited,
      maxActiveJobPosting: tenant?.maxActiveJobPosting ?? tenant?.maxActiveJobPostings,
      activeJobPostingUnlimited: tenant?.activeJobPostingUnlimited,
    }
  const nestedPlan = normalizeSubscriptionPlan(planSource, planId ? String(planId) : undefined)
  const quotaLimit = Number(
    tenant?.userQuotaLimit ??
    tenant?.maxUsers ??
    tenant?.maxStaffAccount ??
    tenant?.maxStaffAccounts ??
    planObject?.maxStaffAccount ??
    planObject?.maxStaffAccounts ??
    0
  )
  const activeJobPostingLimit = Number(
    tenant?.activeJobPostingLimit ??
    tenant?.maxActiveJobPosting ??
    tenant?.maxActiveJobPostings ??
    tenant?.jobPostingLimit ??
    tenant?.jobPostingsLimit ??
    planObject?.maxActiveJobPosting ??
    planObject?.maxActiveJobPostings ??
    0
  )
  const activeJobPostingUsed = Number(
    tenant?.activeJobPostingUsed ??
    tenant?.activeJobPostingsUsed ??
    tenant?.usedActiveJobPosting ??
    tenant?.usedActiveJobPostings ??
    tenant?.activeJobCount ??
    tenant?.activeJobs ??
    tenant?.jobCount ??
    0
  )
  const efficiencyScore = Number(
    tenant?.efficiencyScore ??
    tenant?.resourceEfficiencyScore ??
    tenant?.usageEfficiencyScore ??
    tenant?.efficiency
  )

  return {
    id: String(id),
    name: String(tenant?.companyName || tenant?.name || tenant?.fullName || tenant?.tenantName || 'Tenant'),
    domain: tenant?.domain ? String(tenant.domain) : undefined,
    industry: tenant?.industry ? String(tenant.industry) : undefined,
    region: tenant?.region ? String(tenant.region) : undefined,
    createdAt: tenant?.createdAt || tenant?.createdDate || tenant?.created_at || tenant?.activatedAt
      ? String(tenant?.createdAt || tenant?.createdDate || tenant?.created_at || tenant?.activatedAt)
      : undefined,
    startDate: tenant?.startDate || tenant?.startedAt || tenant?.subscriptionStartDate || tenant?.subscriptionStartedAt || tenant?.planStartDate
      ? String(tenant?.startDate || tenant?.startedAt || tenant?.subscriptionStartDate || tenant?.subscriptionStartedAt || tenant?.planStartDate)
      : undefined,
    subscriptionPlanId: planId
      ? String(planId)
      : undefined,
    subscriptionPlanDetail: nestedPlan || undefined,
    subscriptionPlan: String(planObject?.name || tenant?.planName || tenant?.subscriptionPlanName || (typeof plan === 'string' ? plan : '') || '-'),
    expirationDate: String(tenant?.expirationDate || tenant?.expiredAt || tenant?.expiresAt || tenant?.endDate || '-'),
    userQuotaUsed: Number(tenant?.userQuotaUsed ?? tenant?.activeUsers ?? tenant?.usedStaffAccount ?? tenant?.staffUsed ?? tenant?.userCount ?? 0),
    userQuotaLimit: Number.isFinite(quotaLimit) ? quotaLimit : 0,
    activeJobPostingUsed: Number.isFinite(activeJobPostingUsed) ? activeJobPostingUsed : undefined,
    activeJobPostingLimit: Number.isFinite(activeJobPostingLimit) ? activeJobPostingLimit : undefined,
    efficiencyScore: Number.isFinite(efficiencyScore) ? efficiencyScore : undefined,
    status: String(tenant?.status ?? tenant?.accountStatus ?? tenant?.tenantStatus ?? (tenant?.active === true ? 'Active' : 'Inactive')),
    adminUserId: adminUserId ? String(adminUserId) : undefined,
    adminFullName: tenant?.adminFullName || tenant?.adminName || tenant?.tenantAdminName || admin?.fullName || admin?.full_name || admin?.name
      ? String(tenant?.adminFullName || tenant?.adminName || tenant?.tenantAdminName || admin?.fullName || admin?.full_name || admin?.name)
      : undefined,
    adminEmail: tenant?.adminEmail || tenant?.tenantAdminEmail || admin?.email
      ? String(tenant?.adminEmail || tenant?.tenantAdminEmail || admin?.email)
      : undefined,
  }
}

export function normalizeTenantAdminUser(user: any): TenantAdminUser | null {
  const id = user?.id || user?.userId || user?.uuid
  if (!id) return null

  return {
    id: String(id),
    fullName: String(user?.fullName || user?.full_name || user?.name || user?.username || 'Tenant Admin'),
    email: String(user?.email || user?.username || ''),
    status: user?.status || user?.accountStatus ? String(user?.status || user?.accountStatus) : undefined,
    createdAt: user?.createdAt || user?.createdDate || user?.created_at || user?.activatedAt
      ? String(user?.createdAt || user?.createdDate || user?.created_at || user?.activatedAt)
      : undefined,
  }
}
