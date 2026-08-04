import type { PaginationMeta } from '@/core/utils/pagination'
import type { ActivityLog, StaffAccountLimit, StaffMember, SubscriptionPlan, Tenant, UserStatus } from '../domain/tenantApi.types'

export type TenantListParams<Filters extends object | null = Record<string, unknown> | null> = {
  sortField?: string
  filters?: Filters
  sortBy?: 'ASC' | 'DESC'
  page?: number
  size?: number
}

export type PaginatedTenantList<T> = T[] & {
  __pagination?: PaginationMeta
}

export type TenantStaffSavePayload = {
  email: string
  fullName: string
  role: string[]
  status?: UserStatus
  tenantId?: string
}

export type TenantActivityLogExport = {
  data: Blob
  headers?: Record<string, unknown>
}

export type TenantAdminRepository = {
  getStaffList: (params: TenantListParams<Record<string, unknown> | null>) => Promise<PaginatedTenantList<StaffMember>>
  getStaffAccountLimit: () => Promise<StaffAccountLimit>
  getTenantById: (id: string) => Promise<Tenant>
  getActivityLogs: (params?: TenantListParams<Record<string, unknown> | null>) => Promise<PaginatedTenantList<ActivityLog>>
  deleteStaffActivityLogs: (id: string) => Promise<void>
  exportStaffActivityLogs: (id: string) => Promise<TenantActivityLogExport>
  getUserById: (id: string) => Promise<StaffMember>
  createStaff: (payload: TenantStaffSavePayload) => Promise<void>
  updateStaff: (id: string, payload: TenantStaffSavePayload) => Promise<void>
  deleteStaff: (id: string) => Promise<void>
}

export type TenantWorkspaceSummary = {
  staffList: PaginatedTenantList<StaffMember>
  staffAccountLimit: StaffAccountLimit
  tenantDetail: Tenant | null
  tenantPlan: SubscriptionPlan | null
}
