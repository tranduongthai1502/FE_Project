export type CreatePlanFeature = {
  key: string
  status: string
}

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

export type UserStatus = 'ACTIVE' | 'DISABLED'

export type StaffMember = {
  id: string
  email: string
  fullName: string
  status: UserStatus
  userRole: string
  employeeCode?: string
  phone?: string
  createdAt?: string
  activatedAt?: string
  lastLoginAt?: string
  lastLoginLocation?: string
  lastLoginIp?: string
}

export type StaffAccountLimit = {
  used?: number
  limit?: number
  unlimited?: boolean
}

export type StaffPayload = {
  email: string
  fullName: string
  role: string[]
  status: UserStatus
}

export type ActivityLog = {
  id: string
  eventType: string
  title: string
  description?: string
  ipAddress?: string
  createdAt?: string
}
