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

export type SuperAdminView = 'dashboard' | 'tenantManagement' | 'subscriptionPlans' | 'promptManagement' | 'settings'

export type RoleHomeView = 'dashboard' | 'settings'

export type TenantAdminView = RoleHomeView | 'staffManagement' | 'staffCreate' | 'staffEdit' | 'staffDetail' | 'staffActivityLog'

export type UserStatus = 'PENDING' | 'ACTIVE' | 'DISABLED'

export type StaffMember = {
  id: string
  email: string
  fullName: string
  status: UserStatus
  userRole: string
  employeeCode?: string
  phone?: string
  createdAt?: string
}

export type StaffPayload = {
  email: string
  fullName: string
  role: string[]
  status: UserStatus
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

export type CreatePlanFeature = {
  key: string
  status: string
}

export type CreatePlanPayload = {
  name: string
  description: string
  monthlyPrice: number
  maxStaffAccount: number | null
  staffAccountUnlimited: boolean
  maxActiveJobPosting: number | null
  activeJobPostingUnlimited: boolean
  features: CreatePlanFeature[]
}

export type UpdatePlanPayload = CreatePlanPayload & {
  status: string
}

export type SubscriptionPlan = {
  id: string
  name: string
  description: string
  monthlyPrice: number
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
  subscriptionPlanId?: string
  subscriptionPlan: string
  expirationDate: string
  userQuotaUsed: number
  userQuotaLimit: number
  status: string
  adminFullName?: string
  adminEmail?: string
}

export type PlanListRequest = {
  sortField: string
  filters: Record<string, unknown>
  sortBy: 'ASC' | 'DESC'
  page: number
  size: number
}

export type TenantListRequest = PlanListRequest
