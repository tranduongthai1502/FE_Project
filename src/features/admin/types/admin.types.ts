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

export type RoleHomeView = 'dashboard' | 'jobs' | 'settings'

export type TenantAdminView = RoleHomeView | 'staffManagement' | 'staffCreate' | 'staffEdit' | 'staffDetail' | 'staffActivityLog'

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

export type JobPosting = {
  id: string
  title: string
  department: string
  level?: string
  employmentType: string
  locationType?: string
  location?: string
  applicationDeadline?: string
  description?: string
  requirements?: string
  benefits?: string
  salaryMin?: number
  salaryMax?: number
  status: string
  applicantCount: number
  createdAt?: string
}

export type JobPostingPayload = {
  title: string
  department: string
  level: string
  employmentType: string
  locationType: string
  location: string
  applicationDeadline: string
  description: string
  requirements: string
  benefits: string
  salaryMin: number
  salaryMax: number
  status: string
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
  createdAt?: string
  startDate?: string
  subscriptionPlanId?: string
  subscriptionPlanDetail?: SubscriptionPlan
  subscriptionPlan: string
  expirationDate: string
  userQuotaUsed: number
  userQuotaLimit: number
  activeJobPostingUsed?: number
  activeJobPostingLimit?: number
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

export type ListRequest<Filters extends object | null = Record<string, unknown>> = {
  sortField: string
  filters: Filters
  sortBy: 'ASC' | 'DESC'
  page: number
  size: number
}

export type PlanListRequest = ListRequest

export type TenantListRequest = PlanListRequest

export type JobListFilters = {
  search?: string
  title?: string
  department?: string
  level?: string
  employmentType?: string
  locationType?: string
  status?: string
}

export type JobListRequest = ListRequest<JobListFilters | null>

export type AdminListParams<Filters extends object | null = Record<string, unknown>> = Partial<ListRequest<Filters>>
