import type { SubscriptionPlan, Tenant, TenantAdminUser } from '@/features/tenant/domain/tenantApi.types'

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

export function getJobPostingList(payload: any): any[] {
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
  return []
}

export function normalizeJobPosting(job: any): JobPosting | null {
  const source = getJobPostingDetailSource(job)
  const id = source?.id || source?.jobId || source?.job_id || source?.uuid
  if (!id) return null

  return {
    id: String(id),
    title: String(source?.title || source?.jobTitle || source?.job_title || 'Untitled Job'),
    department: String(source?.department || source?.departmentName || source?.department_name || '-'),
    level: source?.level || source?.jobLevel || source?.job_level ? String(source?.level || source?.jobLevel || source?.job_level) : undefined,
    employmentType: String(source?.employmentType || source?.employment_type || source?.type || '-'),
    locationType: source?.locationType || source?.location_type ? String(source?.locationType || source?.location_type) : undefined,
    location: source?.location ? String(source.location) : undefined,
    applicationDeadline: source?.applicationDeadline || source?.application_deadline || source?.deadline
      ? String(source?.applicationDeadline || source?.application_deadline || source?.deadline)
      : undefined,
    description: source?.description ? String(source.description) : undefined,
    requirements: source?.requirements ? String(source.requirements) : undefined,
    benefits: source?.benefits ? String(source.benefits) : undefined,
    salaryMin: source?.salaryMin ?? source?.salary_min ? Number(source?.salaryMin ?? source?.salary_min) : undefined,
    salaryMax: source?.salaryMax ?? source?.salary_max ? Number(source?.salaryMax ?? source?.salary_max) : undefined,
    status: String(source?.status || source?.jobStatus || source?.job_status || 'DRAFT'),
    applicantCount: Number(source?.applicantCount ?? source?.applicantsCount ?? source?.noOfApplicants ?? source?.numberOfApplicants ?? source?.totalApplicants ?? 0) || 0,
    createdAt: source?.createdAt || source?.createdDate || source?.created_at ? String(source?.createdAt || source?.createdDate || source?.created_at) : undefined,
    updatedAt: source?.updatedAt || source?.updatedDate || source?.updated_at || source?.modifiedAt || source?.modified_at
      ? String(source?.updatedAt || source?.updatedDate || source?.updated_at || source?.modifiedAt || source?.modified_at)
      : undefined,
    publishedAt: source?.publishedAt || source?.publishedDate || source?.published_at || source?.openedAt || source?.opened_at
      ? String(source?.publishedAt || source?.publishedDate || source?.published_at || source?.openedAt || source?.opened_at)
      : undefined,
    openedAt: source?.openedAt || source?.opened_at || source?.openAt || source?.open_at
      ? String(source?.openedAt || source?.opened_at || source?.openAt || source?.open_at)
      : undefined,
    revisionHistory: getJobRevisionHistoryList(job, source)
      .map((item, index) => normalizeJobRevisionHistory(item, index))
      .filter((item): item is JobRevisionHistory => Boolean(item)),
  }
}

function getJobPostingDetailSource(job: any): any {
  if (!job || typeof job !== 'object') return job

  return (
    job.jobPosting ||
    job.jobPostingResponse ||
    job.jobPostingDetail ||
    job.jobPostingDto ||
    job.job_posting ||
    job.job_posting_response ||
    job.job_posting_detail ||
    job.job_posting_dto ||
    job.posting ||
    job.postingDetail ||
    job.posting_detail ||
    job.job ||
    job.jobDetail ||
    job.job_detail ||
    job.detail ||
    job.record ||
    job.item ||
    job.content ||
    job.data?.jobPosting ||
    job.data?.jobPostingResponse ||
    job.data?.jobPostingDetail ||
    job.data?.jobPostingDto ||
    job.data?.job_posting ||
    job.data?.job_posting_response ||
    job.data?.job_posting_detail ||
    job.data?.job_posting_dto ||
    job.data?.posting ||
    job.data?.postingDetail ||
    job.data?.posting_detail ||
    job.data?.job ||
    job.data?.jobDetail ||
    job.data?.job_detail ||
    job.data?.detail ||
    job.data?.record ||
    job.data?.item ||
    job
  )
}

function getJobRevisionHistoryList(...sources: any[]): any[] {
  const keys = [
    'revisionHistory',
    'revision_history',
    'revisionHistories',
    'revision_histories',
    'revisions',
    'jobRevisionHistory',
    'job_revision_history',
    'jobRevisionHistories',
    'job_revision_histories',
    'jobRevisions',
    'job_revisions',
    'jobPostingHistories',
    'job_posting_histories',
    'jobPostingHistory',
    'job_posting_history',
    'jobHistories',
    'job_histories',
    'jobHistory',
    'job_history',
    'revisionLogs',
    'revision_logs',
    'history',
    'histories',
    'logs',
    'auditLogs',
    'audit_logs',
    'auditTrail',
    'audit_trail',
    'activities',
    'activityLogs',
    'activity_logs',
  ]

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue
    for (const key of keys) {
      const candidate = source[key]
      if (Array.isArray(candidate)) return candidate
      if (Array.isArray(candidate?.content)) return candidate.content
      if (Array.isArray(candidate?.items)) return candidate.items
      if (Array.isArray(candidate?.records)) return candidate.records
      if (Array.isArray(candidate?.list)) return candidate.list
      if (Array.isArray(candidate?.data)) return candidate.data
      if (Array.isArray(candidate?.data?.content)) return candidate.data.content
      if (Array.isArray(candidate?.data?.items)) return candidate.data.items
      if (Array.isArray(candidate?.data?.records)) return candidate.data.records
      if (Array.isArray(candidate?.data?.list)) return candidate.data.list
    }
  }

  return []
}

function normalizeJobRevisionHistory(item: any, index: number): JobRevisionHistory | null {
  if (!item || typeof item !== 'object') return null

  const action = item?.action || item?.title || item?.eventName || item?.event_name || item?.eventType || item?.event_type
  if (!action) return null

  return {
    id: item?.id || item?.revisionId || item?.revision_id || item?.logId || item?.log_id
      ? String(item?.id || item?.revisionId || item?.revision_id || item?.logId || item?.log_id)
      : `${action}-${index}`,
    action: String(action),
    actorName: item?.actorName || item?.actor_name || item?.updatedBy || item?.updated_by || item?.createdBy || item?.created_by || item?.userName || item?.user_name
      ? String(item?.actorName || item?.actor_name || item?.updatedBy || item?.updated_by || item?.createdBy || item?.created_by || item?.userName || item?.user_name)
      : undefined,
    createdAt: item?.createdAt || item?.created_at || item?.timestamp || item?.eventTime || item?.event_time || item?.time
      ? String(item?.createdAt || item?.created_at || item?.timestamp || item?.eventTime || item?.event_time || item?.time)
      : undefined,
  }
}

function isTruthyFlag(value: unknown) {
  if (typeof value === 'boolean') return value
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y'
}

function isUnlimitedValue(value: unknown) {
  return String(value ?? '').trim().toLowerCase() === 'unlimited'
}

function formatBillingCycle(value: unknown) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return 'month'

  const normalizedLower = normalized.toLowerCase()
  if (normalizedLower === 'mo' || normalizedLower === 'monthly') return 'month'
  if (normalizedLower === 'yearly' || normalizedLower === 'year' || normalizedLower === 'yr') return 'year'
  if (
    normalizedLower === 'six_monthly' ||
    normalizedLower === '6_monthly' ||
    normalizedLower === 'six monthly' ||
    normalizedLower === '6 monthly' ||
    normalizedLower === 'six-monthly' ||
    normalizedLower === '6-monthly'
  ) return 'six month'

  return normalized
}

function normalizeBillingCycleValue(value: unknown) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return 'MONTHLY'

  const normalizedLower = normalized.toLowerCase()
  if (normalizedLower === 'mo' || normalizedLower === 'month' || normalizedLower === 'monthly') return 'MONTHLY'
  if (normalizedLower === 'yearly' || normalizedLower === 'year' || normalizedLower === 'yr') return 'YEARLY'
  if (
    normalizedLower === 'six_monthly' ||
    normalizedLower === '6_monthly' ||
    normalizedLower === 'six monthly' ||
    normalizedLower === '6 monthly' ||
    normalizedLower === 'six-monthly' ||
    normalizedLower === '6-monthly' ||
    normalizedLower === 'six month' ||
    normalizedLower === '6 month'
  ) return 'SIX_MONTHLY'

  return normalized.toUpperCase()
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
  const rawBillingCycle = plan?.billingCycle || plan?.cycle || plan?.interval
  const billingCycle = normalizeBillingCycleValue(rawBillingCycle)
  const billingCycleLabel = formatBillingCycle(rawBillingCycle)
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
    ? `$${price.toFixed(2)} /${billingCycleLabel}`
    : undefined

  return {
    id: String(id),
    name: String(name),
    description: String(plan?.description || plan?.shortDescription || plan?.tagline || ''),
    monthlyPrice: Number.isFinite(price) ? price : 0,
    price: Number.isFinite(price) ? price : 0,
    billingCycle,
    maxStaffAccount: Number.isFinite(maxStaffAccount) ? maxStaffAccount : 0,
    staffAccountUnlimited,
    maxActiveJobPosting: Number.isFinite(maxActiveJobPosting) ? maxActiveJobPosting : 0,
    activeJobPostingUnlimited,
    status: String(plan?.status || (plan?.active === false ? 'Inactive' : 'Active')),
    createdAt: String(plan?.createdAt || plan?.createdDate || plan?.created_at || plan?.createAt || ''),
    features: featureList.map((feature: any) => ({
      key: String(feature?.key || feature?.code || feature?.name || feature?.featureKey || ''),
      status: String(feature?.status || (feature?.enabled === false ? 'INACTIVE' : 'ACTIVE')),
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
  const maxStaffValue = tenant?.maxStaff ?? tenant?.max_staff
  const maxUsersValue = tenant?.maxUsers ?? tenant?.max_users
  const hasMaxStaffField = tenant?.maxStaff !== undefined || tenant?.max_staff !== undefined
  const hasMaxUsersField = tenant?.maxUsers !== undefined || tenant?.max_users !== undefined
  const userQuotaUnlimited =
    isTruthyFlag(tenant?.userQuotaUnlimited) ||
    isTruthyFlag(tenant?.user_quota_unlimited) ||
    isTruthyFlag(tenant?.staffAccountUnlimited) ||
    isTruthyFlag(tenant?.staff_account_unlimited) ||
    isUnlimitedValue(maxStaffValue) ||
    isUnlimitedValue(maxUsersValue) ||
    (hasMaxStaffField && maxStaffValue == null) ||
    (hasMaxUsersField && maxUsersValue == null)
  const quotaLimit = Number(
    tenant?.userQuotaLimit ??
    tenant?.staffAccountLimit ??
    tenant?.staffAccountsLimit ??
    tenant?.userLimit ??
    tenant?.usersLimit ??
    maxStaffValue ??
    maxUsersValue ??
    tenant?.maxStaffAccount ??
    tenant?.maxStaffAccounts ??
    planObject?.maxStaffAccount ??
    planObject?.maxStaffAccounts ??
    0
  )
  const activeJobPostingLimit = Number(
    tenant?.activeJobPostingLimit ??
    tenant?.activeJobPostingsLimit ??
    tenant?.activeJobLimit ??
    tenant?.activeJobsLimit ??
    tenant?.maxActiveJobPosting ??
    tenant?.maxActiveJobPostings ??
    tenant?.jobPostingLimit ??
    tenant?.jobPostingsLimit ??
    planObject?.maxActiveJobPosting ??
    planObject?.maxActiveJobPostings ??
    0
  )
  const activeJobPostingUnlimited =
    isTruthyFlag(tenant?.activeJobPostingUnlimited) ||
    isTruthyFlag(tenant?.active_job_posting_unlimited) ||
    isTruthyFlag(tenant?.jobPostingUnlimited) ||
    isTruthyFlag(tenant?.job_posting_unlimited) ||
    isTruthyFlag(planObject?.activeJobPostingUnlimited) ||
    isTruthyFlag(planObject?.active_job_posting_unlimited) ||
    isUnlimitedValue(tenant?.activeJobPostingLimit) ||
    isUnlimitedValue(tenant?.activeJobPostingsLimit) ||
    isUnlimitedValue(tenant?.maxActiveJobPosting) ||
    isUnlimitedValue(tenant?.maxActiveJobPostings)
  const activeJobPostingUsed = Number(
    tenant?.activeJobPostingUsed ??
    tenant?.activeJobPostingsUsed ??
    tenant?.jobPostingUsed ??
    tenant?.jobPostingsUsed ??
    tenant?.usedActiveJobPosting ??
    tenant?.usedActiveJobPostings ??
    tenant?.activeJobPostingCount ??
    tenant?.activeJobPostingsCount ??
    tenant?.totalActiveJobPostings ??
    tenant?.activeJob ??
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
  const tenantPrice = Number(tenant?.price ?? tenant?.monthlyPrice ?? tenant?.monthly_price ?? tenant?.planPrice ?? tenant?.amount)
  const tenantBillingCycle = formatBillingCycle(tenant?.billingCycle || tenant?.cycle || tenant?.interval)
  const tenantPriceLabel = Number.isFinite(tenantPrice)
    ? `$${tenantPrice.toFixed(2)} /${tenantBillingCycle}`
    : undefined

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
    price: Number.isFinite(tenantPrice) ? tenantPrice : undefined,
    billingCycle: tenantBillingCycle,
    priceLabel: tenantPriceLabel,
    expirationDate: String(tenant?.expirationDate || tenant?.expiredAt || tenant?.expiresAt || tenant?.endDate || '-'),
    userQuotaUsed: Number(
      tenant?.userQuotaUsed ??
      tenant?.staffAccountUsed ??
      tenant?.staffAccountsUsed ??
      tenant?.usedStaffAccount ??
      tenant?.usedStaffAccounts ??
      tenant?.staffAccountCount ??
      tenant?.staffAccountsCount ??
      tenant?.totalStaffAccounts ??
      tenant?.activeUsers ??
      tenant?.usersUsed ??
      tenant?.usedUsers ??
      tenant?.staffUsed ??
      tenant?.userCount ??
      0
    ),
    userQuotaLimit: Number.isFinite(quotaLimit) ? quotaLimit : 0,
    userQuotaUnlimited,
    activeJobPostingUsed: Number.isFinite(activeJobPostingUsed) ? activeJobPostingUsed : undefined,
    activeJobPostingLimit: Number.isFinite(activeJobPostingLimit) ? activeJobPostingLimit : undefined,
    activeJobPostingUnlimited,
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
  const id = user?.id || user?.userId || user?.user_id || user?.uuid || user?.accountId || user?.account_id
  if (!id) return null

  return {
    id: String(id),
    fullName: String(user?.fullName || user?.full_name || user?.name || user?.username || user?.email || 'Tenant Admin'),
    email: String(user?.email || user?.emailAddress || user?.email_address || user?.corporateEmail || user?.corporate_email || user?.username || ''),
    status: user?.status || user?.accountStatus || user?.account_status || user?.userStatus || user?.user_status
      ? String(user?.status || user?.accountStatus || user?.account_status || user?.userStatus || user?.user_status)
      : undefined,
    userRole: user?.userRole || user?.user_role || user?.role || user?.roles || user?.authorities || user?.permissions
      ? String(Array.isArray(user?.roles)
        ? user.roles.join(', ')
        : Array.isArray(user?.authorities)
          ? user.authorities.join(', ')
          : Array.isArray(user?.permissions)
            ? user.permissions.join(', ')
            : (user?.userRole || user?.user_role || user?.role || user?.roles || user?.authorities || user?.permissions))
      : undefined,
    employeeCode: user?.employeeCode || user?.employee_code || user?.code
      ? String(user?.employeeCode || user?.employee_code || user?.code)
      : undefined,
    phone: user?.phone || user?.phoneNumber || user?.phone_number
      ? String(user?.phone || user?.phoneNumber || user?.phone_number)
      : undefined,
    createdAt: user?.createdAt || user?.createdDate || user?.created_at || user?.activatedAt
      ? String(user?.createdAt || user?.createdDate || user?.created_at || user?.activatedAt)
      : undefined,
    activatedAt: user?.activatedAt || user?.activatedDate || user?.activated_at
      ? String(user?.activatedAt || user?.activatedDate || user?.activated_at)
      : undefined,
    lastLoginAt: user?.lastLoginAt || user?.lastLogin || user?.last_login_at || user?.last_login
      ? String(user?.lastLoginAt || user?.lastLogin || user?.last_login_at || user?.last_login)
      : undefined,
    lastLoginLocation: user?.lastLoginLocation || user?.loginLocation || user?.last_login_location
      ? String(user?.lastLoginLocation || user?.loginLocation || user?.last_login_location)
      : undefined,
    lastLoginIp: user?.lastLoginIp || user?.loginIp || user?.ipAddress || user?.last_login_ip
      ? String(user?.lastLoginIp || user?.loginIp || user?.ipAddress || user?.last_login_ip)
      : undefined,
  }
}
