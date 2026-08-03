export type CreateTenantPayload = {
  companyName: string
  domain: string
  industry: string
  region: string
  planId: string
  adminFullName: string
  adminEmail: string
}

export type CreateTenantForm = CreateTenantPayload

export type CreatePlanFeature = {
  key: string
  status: string
}

export type CreatePlanPayload = {
  name: string
  description: string
  billingCycle: string
  price: number
  maxStaffAccount: number | null
  staffAccountUnlimited: boolean
  maxActiveJobPosting: number | null
  activeJobPostingUnlimited: boolean
  status: string
  features: CreatePlanFeature[]
}

export type UpdatePlanPayload = CreatePlanPayload

export type SubscriptionPlan = {
  id: string
  name: string
  description: string
  monthlyPrice: number
  price?: number
  billingCycle?: string
  maxStaffAccount: number
  staffAccountUnlimited: boolean
  maxActiveJobPosting: number
  activeJobPostingUnlimited: boolean
  status: string
  createdAt: string
  features: CreatePlanFeature[]
  priceLabel?: string
}

export type Tenant = {
  id: string
  name: string
  domain?: string
  industry?: string
  region?: string
  createdAt?: string
  startDate?: string
  subscriptionPlanId?: string
  subscriptionPlanDetail?: SubscriptionPlan
  subscriptionPlan: string
  price?: number
  billingCycle?: string
  priceLabel?: string
  expirationDate: string
  userQuotaUsed: number
  userQuotaLimit: number
  userQuotaUnlimited?: boolean
  activeJobPostingUsed?: number
  activeJobPostingLimit?: number
  activeJobPostingUnlimited?: boolean
  efficiencyScore?: number
  status: string
  adminUserId?: string
  adminFullName?: string
  adminEmail?: string
}

export type TenantDashboardStats = {
  totalTenants?: number
  activeTenants?: number
  inactiveTenants?: number
  totalRevenue?: number
  averageUsage?: number
  churnRate?: number
}

export type PlanDashboardStats = {
  activePlans?: number
  activePlansTrend?: number
  totalPlans?: number
  topTierName?: string
  topTierSubscribers?: number
  topTierMaxStaffAccount?: number
  topTierStaffAccountUnlimited?: boolean
  monthlyActivePlanRevenue?: number
  monthlyRevenueTrendPercent?: number
  renewalRate?: number
  renewalRateTrendPercent?: number
}

export type TenantAdminUser = {
  id: string
  fullName: string
  email: string
  status?: string
  userRole?: string
  employeeCode?: string
  phone?: string
  createdAt?: string
  activatedAt?: string
  lastLoginAt?: string
  lastLoginLocation?: string
  lastLoginIp?: string
}

export type UpdateTenantPayload = {
  companyName: string
  domain: string
  industry: string
  region: string
  status: string
  planId: string
  adminFullName: string
  adminEmail: string
}
