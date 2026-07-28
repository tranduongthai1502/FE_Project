import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildNavigation } from '@/components/common/navigation'
import { tenantNav } from './tenantNavigation'
import type { TenantAdminView } from '@/app/routes/route.types'
import type { ActivityLog, StaffMember, UserStatus, Tenant, SubscriptionPlan } from '@/services/api/api.types'
import { getInitialTenantAdminView, getTenantAdminStaffIdFromUrl, getTenantAdminViewPath } from '@/app/routes/tenantAdminRouteHelpers'
import { AccountSettingsPanel } from '@/components/common/AccountSettingsPanel'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { SearchInput } from '@/components/common/SearchInput'
import { DashboardShell } from '@/components/common/DashboardShell'
import { MetricCard } from '@/components/common/MetricCard'
import { TENANT_ADMIN_LIST_PAGE_SIZE, tenantAdminApi } from '../services/tenantAdminApi'
import { ConfirmActionModal } from '@/components/common/ConfirmActionModal'
import { getErrorMessage as getAdminErrorMessage, inactiveUserActionMessage, isInactiveUserActionError } from '@/services/error/errorMessages'
import { isStoredCurrentUserInactive } from '@/features/auth/utils/authAccess'
import { shouldToastHttpError } from '@/utils/httpStatusManager'
import { getCompactPageItems, getListPageCount, getListTotalElements, getPaginationMeta } from '@/utils/pagination'
import { normalizeTenantAdminUser } from '@/services/api/apiMappers'
import { getStoredRequirePasswordChange } from '@/services/api/authStorage'
import {
  FIELD_LENGTH_LIMITS,
  getBackendErrorMessage,
  getErrorCode,
  getErrorRawMessage,
  validateStaffEmail,
  validationErrorMessages,
} from '@/services/api/axiosErrorHandler'

const inactiveTenantActionMessage = 'You do not have permission to perform this action.'
const passwordChangeRequiredMessage = 'Please change your password before using Tenant Admin features.'
const selectedTenantStaffStorageKey = 'jobfusion_selected_tenant_staff'
const ACTIVITY_LOG_PAGE_SIZE = 5

type StaffAccountLimit = {
  used?: number
  limit?: number
  unlimited?: boolean
}

type TenantWorkspaceData = {
  staffList: StaffMember[]
  staffPageCount: number
  staffAccountLimit: StaffAccountLimit
  tenantDetail: Tenant | null
  tenantPlan: SubscriptionPlan | null
}

type StaffFormFieldErrors = Partial<Record<'fullName' | 'email' | 'role', string>>

const tenantWorkspaceRequestCache = new Map<string, Promise<TenantWorkspaceData>>()

type StaffListFilterValues = {
  search?: string
  fullName?: string
  email?: string
  phone?: string
  employeeCode?: string
  jobTitle?: string
  userRole?: string
  status?: UserStatus
}

function buildStaffListFilters(values: StaffListFilterValues = {}) {
  const filters: Record<string, unknown> = {}
  const search = values.search?.trim()
  const fullName = values.fullName?.trim()
  const email = values.email?.trim()
  const phone = values.phone?.trim()
  const employeeCode = values.employeeCode?.trim()
  const jobTitle = values.jobTitle?.trim()
  const userRole = values.userRole?.trim()

  if (search) filters.search = search
  if (fullName) filters.fullName = fullName
  if (email) filters.email = email
  if (phone) filters.phone = phone
  if (employeeCode) filters.employeeCode = employeeCode
  if (jobTitle) filters.jobTitle = jobTitle
  if (userRole) filters.userRole = userRole
  if (values.status) filters.status = values.status

  return filters
}

function getStoredTenantId() {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return ''

  try {
    const user = JSON.parse(rawUser)
    const tenant =
      user?.tenant ||
      user?.tenantInfo ||
      user?.company ||
      user?.workspace ||
      {}
    const tenantId =
      user?.tenantId ||
      user?.tenant_id ||
      user?.companyId ||
      user?.company_id ||
      user?.workspaceId ||
      user?.workspace_id ||
      tenant?.id ||
      tenant?.tenantId ||
      tenant?.uuid

    return tenantId ? String(tenantId) : ''
  } catch {
    return ''
  }
}

function isInactiveTenantStatus(status?: string) {
  const normalized = String(status || '').trim().toLowerCase()

  return (
    normalized === 'inactive' ||
    normalized === 'in_active' ||
    normalized === 'not_active' ||
    normalized === 'not active' ||
    normalized === 'disabled' ||
    normalized === 'deactivated' ||
    normalized === 'suspended'
  )
}

function getStoredSelectedStaff() {
  const rawStaff = window.sessionStorage.getItem(selectedTenantStaffStorageKey)
  if (!rawStaff) return null

  try {
    const staff = JSON.parse(rawStaff) as Partial<StaffMember>
    const status = normalizeUserStatus(staff.status)

    if (!staff.id || !staff.fullName || !staff.email || !status) {
      clearSelectedStaff()
      return null
    }

    return {
      ...staff,
      id: String(staff.id),
      email: String(staff.email),
      fullName: String(staff.fullName),
      status,
      userRole: String(staff.userRole || ''),
    } as StaffMember
  } catch {
    clearSelectedStaff()
    return null
  }
}

function saveSelectedStaff(staff: StaffMember) {
  window.sessionStorage.setItem(selectedTenantStaffStorageKey, JSON.stringify(staff))
}

function clearSelectedStaff() {
  window.sessionStorage.removeItem(selectedTenantStaffStorageKey)
}

function normalizeUserStatus(value?: string): UserStatus | null {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'ACTIVATED' || normalized === 'ENABLED') return 'ACTIVE'
  if (
    normalized === 'DISABLED' ||
    normalized === 'INACTIVE' ||
    normalized === 'IN_ACTIVE' ||
    normalized === 'NOT_ACTIVE' ||
    normalized === 'NOT ACTIVE' ||
    normalized === 'DEACTIVATED' ||
    normalized === 'SUSPENDED' ||
    normalized === 'PENDING' ||
    normalized === 'INVITED' ||
    normalized === 'WAITING_ACTIVATION'
  ) return 'DISABLED'
  return null
}

function getStaffListItems(payload: any): any[] {
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

function readFiniteNumber(payload: any, keys: string[]) {
  for (const key of keys) {
    const value = payload?.[key]
    const numberValue = Number(value)

    if (value !== undefined && value !== null && Number.isFinite(numberValue)) {
      return numberValue
    }
  }

  return undefined
}

function readBooleanFlag(payload: any, keys: string[]) {
  for (const key of keys) {
    const value = payload?.[key]

    if (typeof value === 'boolean') return value

    const normalized = String(value ?? '').trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true
    if (['false', '0', 'no', 'n'].includes(normalized)) return false
  }

  return undefined
}

function getStaffAccountLimitPayload(payload: any): any {
  const body = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  return body?.data && typeof body.data === 'object' ? body.data : body
}

function normalizeStaffAccountLimit(payload: any): StaffAccountLimit {
  const data = getStaffAccountLimitPayload(payload)
  const maxStaffValue = data?.maxStaff ?? data?.max_staff
  const hasMaxStaffField = data?.maxStaff !== undefined || data?.max_staff !== undefined
  const used = readFiniteNumber(data, [
    'used',
    'current',
    'count',
    'total',
    'staffAccountCount',
    'staffAccounts',
    'userQuotaUsed',
    'user_quota_used',
    'usedStaffAccount',
    'usedStaffAccounts',
  ])
  const limit = readFiniteNumber(data, [
    'limit',
    'max',
    'quota',
    'maxStaff',
    'max_staff',
    'staffLimit',
    'staffAccountLimit',
    'maxStaffAccount',
    'maxStaffAccounts',
    'userQuotaLimit',
    'user_quota_limit',
  ])
  const unlimited = readBooleanFlag(data, [
    'unlimited',
    'staffAccountUnlimited',
    'staff_account_unlimited',
    'isUnlimited',
    'is_unlimited',
  ]) ?? ((hasMaxStaffField && maxStaffValue == null) || (limit !== undefined && limit <= 0))

  return { used, limit, unlimited }
}

function normalizeStaffMember(user: any): StaffMember | null {
  const normalized = normalizeTenantAdminUser(user)
  const status = normalizeUserStatus(normalized?.status)

  if (!normalized || !status) return null

  return {
    id: normalized.id,
    email: normalized.email,
    fullName: normalized.fullName,
    status,
    userRole: normalized.userRole || '',
    employeeCode: normalized.employeeCode,
    phone: normalized.phone,
    createdAt: normalized.createdAt,
    activatedAt: normalized.activatedAt,
    lastLoginAt: normalized.lastLoginAt,
    lastLoginLocation: normalized.lastLoginLocation,
    lastLoginIp: normalized.lastLoginIp,
  }
}

function getTenantWorkspaceRequestKey(tenantId: string, staffPage: number, staffListFilters: Record<string, unknown>, shouldLoadTenantDetail: boolean) {
  return JSON.stringify({
    tenantId,
    staffPage,
    staffListFilters,
    shouldLoadTenantDetail,
  })
}

function loadTenantWorkspaceData(tenantId: string, staffPage: number, staffListFilters: Record<string, unknown>) {
  const shouldLoadTenantDetail = Boolean(tenantId)
  const requestKey = getTenantWorkspaceRequestKey(tenantId, staffPage, staffListFilters, shouldLoadTenantDetail)
  const cachedRequest = tenantWorkspaceRequestCache.get(requestKey)

  if (cachedRequest) {
    return cachedRequest
  }

  const request = Promise.all([
    tenantAdminApi.getStaffList({
      sortField: 'createdAt',
      filters: staffListFilters,
      sortBy: 'DESC',
      page: staffPage,
      size: TENANT_ADMIN_LIST_PAGE_SIZE,
    }),
    tenantAdminApi.getStaffAccountLimit(),
    shouldLoadTenantDetail ? tenantAdminApi.getTenantById(tenantId) : Promise.resolve(null),
  ])
    .then(([staffResponse, staffLimitResponse, tenant]) => {
      const payload = staffResponse?.data || staffResponse
      const staffList = getStaffListItems(payload)
        .map((staff) => normalizeStaffMember(staff))
        .filter((staff): staff is StaffMember => Boolean(staff))
      const listWithPagination = Object.assign([...staffList], { __pagination: getPaginationMeta(staffResponse) })

      return {
        staffList: listWithPagination,
        staffPageCount: getListPageCount(listWithPagination, staffPage, TENANT_ADMIN_LIST_PAGE_SIZE),
        staffAccountLimit: normalizeStaffAccountLimit(staffLimitResponse),
        tenantDetail: tenant,
        tenantPlan: tenant?.subscriptionPlanDetail || null,
      }
    })
    .finally(() => {
      tenantWorkspaceRequestCache.delete(requestKey)
    })

  tenantWorkspaceRequestCache.set(requestKey, request)
  return request
}

function formatDashboardDate(value?: string) {
  if (!value || value === '-') return '-'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(parsed))
}

function formatActivityDateTime(value?: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isSameDay = (left: Date, right: Date) => (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
  const dateLabel = isSameDay(date, today)
    ? 'TODAY'
    : isSameDay(date, yesterday)
      ? 'YESTERDAY'
      : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
  const timeLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return `${dateLabel} • ${timeLabel}`
}

function getStaffFormFieldErrors(error: unknown, message: string): StaffFormFieldErrors {
  const rawErrorText = [
    getErrorCode(error),
    getBackendErrorMessage(error),
    getErrorRawMessage(error),
    message,
  ].join(' ').toLowerCase()

  if (rawErrorText.includes('email')) {
    return { email: validationErrorMessages.emailAlreadyRegistered }
  }

  if (rawErrorText.includes('full') || rawErrorText.includes('name') || rawErrorText.includes('duplicate')) {
    return { fullName: validationErrorMessages.duplicateStaffFullName }
  }

  if (rawErrorText.includes('role')) {
    return { role: validationErrorMessages.accountRoleRequired }
  }

  return {}
}

function hasDuplicateStaffFullName(staffList: StaffMember[], fullName: string, ignoredStaffId?: string) {
  const normalizedFullName = fullName.trim().toLowerCase()
  if (!normalizedFullName) return false

  return staffList.some((staff) => (
    staff.id !== ignoredStaffId &&
    staff.fullName.trim().toLowerCase() === normalizedFullName
  ))
}

function getActivityIconType(eventType: string | undefined, index: number) {
  const normalized = String(eventType || '').trim().toLowerCase()
  if (normalized.includes('auth') || normalized.includes('login') || normalized.includes('password')) return 'login'
  if (normalized.includes('assign') || normalized.includes('user') || normalized.includes('staff') || normalized.includes('account')) return 'account'
  if (normalized.includes('setting') || normalized.includes('config') || normalized.includes('action')) return 'action'
  return ['action', 'account', 'login'][index % 3]
}

function ActivityLogIcon({ eventType, index }: { eventType?: string; index: number }) {
  const iconType = getActivityIconType(eventType, index)

  if (iconType === 'login') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6 12V10.6667H10.6667V1.33333H6V0H10.6667C11.0333 0 11.3472 0.130556 11.6083 0.391667C11.8694 0.652778 12 0.966667 12 1.33333V10.6667C12 11.0333 11.8694 11.3472 11.6083 11.6083C11.3472 11.8694 11.0333 12 10.6667 12H6ZM4.66667 9.33333L3.75 8.36667L5.45 6.66667H0V5.33333H5.45L3.75 3.63333L4.66667 2.66667L8 6L4.66667 9.33333Z" fill="#565E74" />
      </svg>
    )
  }

  if (iconType === 'account') {
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M8.33333 5.3C8.65556 4.94444 8.90278 4.53889 9.075 4.08333C9.24722 3.62778 9.33333 3.15556 9.33333 2.66667C9.33333 2.17778 9.24722 1.70556 9.075 1.25C8.90278 0.794444 8.65556 0.388889 8.33333 0.0333333C9 0.122222 9.55556 0.416667 10 0.916667C10.4444 1.41667 10.6667 2 10.6667 2.66667C10.6667 3.33333 10.4444 3.91667 10 4.41667C9.55556 4.91667 9 5.21111 8.33333 5.3ZM12 10.6667V8.66667C12 8.26667 11.9111 7.88611 11.7333 7.525C11.5556 7.16389 11.3222 6.84444 11.0333 6.56667C11.6 6.76667 12.125 7.025 12.6083 7.34167C13.0917 7.65833 13.3333 8.1 13.3333 8.66667V10.6667H12ZM13.3333 6V4.66667H12V3.33333H13.3333V2H14.6667V3.33333H16V4.66667H14.6667V6H13.3333ZM5.33333 5.33333C4.6 5.33333 3.97222 5.07222 3.45 4.55C2.92778 4.02778 2.66667 3.4 2.66667 2.66667C2.66667 1.93333 2.92778 1.30556 3.45 0.783333C3.97222 0.261111 4.6 0 5.33333 0C6.06667 0 6.69444 0.261111 7.21667 0.783333C7.73889 1.30556 8 1.93333 8 2.66667C8 3.4 7.73889 4.02778 7.21667 4.55C6.69444 5.07222 6.06667 5.33333 5.33333 5.33333ZM0 10.6667V8.8C0 8.42222 0.0972222 8.075 0.291667 7.75833C0.486111 7.44167 0.744444 7.2 1.06667 7.03333C1.75556 6.68889 2.45556 6.43056 3.16667 6.25833C3.87778 6.08611 4.6 6 5.33333 6C6.06667 6 6.78889 6.08611 7.5 6.25833C8.21111 6.43056 8.91111 6.68889 9.6 7.03333C9.92222 7.2 10.1806 7.44167 10.375 7.75833C10.5694 8.075 10.6667 8.42222 10.6667 8.8V10.6667H0ZM5.33333 4C5.7 4 6.01389 3.86944 6.275 3.60833C6.53611 3.34722 6.66667 3.03333 6.66667 2.66667C6.66667 2.3 6.53611 1.98611 6.275 1.725C6.01389 1.46389 5.7 1.33333 5.33333 1.33333C4.96667 1.33333 4.65278 1.46389 4.39167 1.725C4.13056 1.98611 4 2.3 4 2.66667C4 3.03333 4.13056 3.34722 4.39167 3.60833C4.65278 3.86944 4.96667 4 5.33333 4ZM1.33333 9.33333H9.33333V8.8C9.33333 8.67778 9.30278 8.56667 9.24167 8.46667C9.18056 8.36667 9.1 8.28889 9 8.23333C8.4 7.93333 7.79444 7.70833 7.18333 7.55833C6.57222 7.40833 5.95556 7.33333 5.33333 7.33333C4.71111 7.33333 4.09444 7.40833 3.48333 7.55833C2.87222 7.70833 2.26667 7.93333 1.66667 8.23333C1.56667 8.28889 1.48611 8.36667 1.425 8.46667C1.36389 8.56667 1.33333 8.67778 1.33333 8.8V9.33333Z" fill="#4F5D72" />
      </svg>
    )
  }

  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4.86667 13.3333L4.6 11.2C4.45556 11.1444 4.31944 11.0778 4.19167 11C4.06389 10.9222 3.93889 10.8389 3.81667 10.75L1.83333 11.5833L0 8.41667L1.71667 7.11667C1.70556 7.03889 1.7 6.96389 1.7 6.89167C1.7 6.81944 1.7 6.74444 1.7 6.66667C1.7 6.58889 1.7 6.51389 1.7 6.44167C1.7 6.36944 1.70556 6.29444 1.71667 6.21667L0 4.91667L1.83333 1.75L3.81667 2.58333C3.93889 2.49444 4.06667 2.41111 4.2 2.33333C4.33333 2.25556 4.46667 2.18889 4.6 2.13333L4.86667 0H8.53333L8.8 2.13333C8.94444 2.18889 9.08055 2.25556 9.20833 2.33333C9.33611 2.41111 9.46111 2.49444 9.58333 2.58333L11.5667 1.75L13.4 4.91667L11.6833 6.21667C11.6944 6.29444 11.7 6.36944 11.7 6.44167C11.7 6.51389 11.7 6.58889 11.7 6.66667C11.7 6.74444 11.7 6.81944 11.7 6.89167C11.7 6.96389 11.6889 7.03889 11.6667 7.11667L13.3833 8.41667L11.55 11.5833L9.58333 10.75C9.46111 10.8389 9.33333 10.9222 9.2 11C9.06667 11.0778 8.93333 11.1444 8.8 11.2L8.53333 13.3333H4.86667ZM6.03333 12H7.35L7.58333 10.2333C7.92778 10.1444 8.24722 10.0139 8.54167 9.84167C8.83611 9.66944 9.10556 9.46111 9.35 9.21667L11 9.9L11.65 8.76667L10.2167 7.68333C10.2722 7.52778 10.3111 7.36389 10.3333 7.19167C10.3556 7.01944 10.3667 6.84444 10.3667 6.66667C10.3667 6.48889 10.3556 6.31389 10.3333 6.14167C10.3111 5.96944 10.2722 5.80556 10.2167 5.65L11.65 4.56667L11 3.43333L9.35 4.13333C9.10556 3.87778 8.83611 3.66389 8.54167 3.49167C8.24722 3.31944 7.92778 3.18889 7.58333 3.1L7.36667 1.33333H6.05L5.81667 3.1C5.47222 3.18889 5.15278 3.31944 4.85833 3.49167C4.56389 3.66389 4.29444 3.87222 4.05 4.11667L2.4 3.43333L1.75 4.56667L3.18333 5.63333C3.12778 5.8 3.08889 5.96667 3.06667 6.13333C3.04444 6.3 3.03333 6.47778 3.03333 6.66667C3.03333 6.84444 3.04444 7.01667 3.06667 7.18333C3.08889 7.35 3.12778 7.51667 3.18333 7.68333L1.75 8.76667L2.4 9.9L4.05 9.2C4.29444 9.45555 4.56389 9.66944 4.85833 9.84167C5.15278 10.0139 5.47222 10.1444 5.81667 10.2333L6.03333 12ZM6.73333 9C7.37778 9 7.92778 8.77222 8.38333 8.31667C8.83889 7.86111 9.06667 7.31111 9.06667 6.66667C9.06667 6.02222 8.83889 5.47222 8.38333 5.01667C7.92778 4.56111 7.37778 4.33333 6.73333 4.33333C6.07778 4.33333 5.525 4.56111 5.075 5.01667C4.625 5.47222 4.4 6.02222 4.4 6.66667C4.4 7.31111 4.625 7.86111 5.075 8.31667C5.525 8.77222 6.07778 9 6.73333 9Z" fill="#C2410C" />
    </svg>
  )
}

function StaffManagementView({
  staffList,
  isLoading,
  error,
  maxStaffQuota = 10,
  isStaffQuotaUnlimited = false,
  staffAccountCount,
  onCreate,
  onEdit,
  onDelete,
  onSelectStaff,
  onHome,
  currentPage,
  pageCount,
  onPageChange,
  roleFilter,
  statusFilter,
  searchQuery,
  onRoleFilterChange,
  onStatusFilterChange,
  onSearchQueryChange,
  isActionLocked = false,
}: {
  staffList: StaffMember[]
  isLoading: boolean
  error: string
  maxStaffQuota?: number
  isStaffQuotaUnlimited?: boolean
  staffAccountCount: number
  onCreate: () => void
  onEdit: (staff: StaffMember) => void
  onDelete: (staff: StaffMember) => void
  onSelectStaff: (staff: StaffMember) => void
  onHome: () => void
  currentPage: number
  pageCount: number
  onPageChange: (page: number) => void
  roleFilter: string
  statusFilter: string
  searchQuery: string
  onRoleFilterChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onSearchQueryChange: (value: string) => void
  isActionLocked?: boolean
}) {
  const totalElements = getListTotalElements(staffList, staffList.length)
  const totalPages = pageCount
  const paginatedStaff = staffList
  const displayStart = totalElements === 0 ? 0 : ((currentPage - 1) * TENANT_ADMIN_LIST_PAGE_SIZE) + 1
  const displayEnd = displayStart === 0 ? 0 : Math.min(totalElements, displayStart + paginatedStaff.length - 1)

  useEffect(() => {
    if (!isLoading && !error && staffList.length === 0 && currentPage > 1) {
      onPageChange(Math.max(1, currentPage - 1))
    }
  }, [currentPage, error, isLoading, onPageChange, staffList.length])

  const formatDate = (dateStr?: string, fallback = 'Oct 12, 2023') => {
    if (!dateStr) return fallback
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr

    const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))
    if (diffMinutes < 60) return `${diffMinutes || 1} minute${diffMinutes === 1 ? '' : 's'} ago`

    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

    const diffDays = Math.round(diffHours / 24)
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }

  const quotaPercent = Math.min(100, Math.round((staffAccountCount / Math.max(maxStaffQuota, 1)) * 100))
  const hasReachedStaffQuota = !isStaffQuotaUnlimited && staffAccountCount >= maxStaffQuota

  return (
    <div className="role-content staff-management-content">
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Staff Management' }]} />

      <div className="staff-management-head">
        <div>
          <h1>Staff Management</h1>
          <p>Manage your team members and recruitment permissions.</p>
        </div>
        <section className="staff-quota-card">
          <div>
            <span>Staff Accounts</span>
            <strong>{staffAccountCount} / {isStaffQuotaUnlimited ? 'Unlimited' : maxStaffQuota}</strong>
          </div>
          {!isStaffQuotaUnlimited && (
            <i><span style={{ width: `${quotaPercent}%`, background: '#ff5f2b' }} /></i>
          )}
          <small>{isStaffQuotaUnlimited ? 'Unlimited seats available' : `${Math.max(0, maxStaffQuota - staffAccountCount)} seats remaining`}</small>
        </section>
      </div>

      <div className="staff-management-toolbar">
        <label>
          <span>Role:</span>
          <select value={roleFilter} onChange={(e) => onRoleFilterChange(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="hr">HR</option>
            <option value="interviewer">Interviewer</option>
          </select>
        </label>
        <label>
          <span>Status:</span>
          <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
            <option value="all">All Status</option>
            <option value="activated">Active</option>
            <option value="disabled">Inactive</option>
          </select>
        </label>
        <SearchInput
          className="staff-search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search full name or email address..."
          ariaLabel="Staff search"
        />
        <button
          type="button"
          className="tenant-create-btn"
          onClick={onCreate}
          disabled={hasReachedStaffQuota || isActionLocked}
          title={hasReachedStaffQuota ? 'Account quota reached. Please upgrade your subscription plan to add more staff.' : undefined}
        >
          Create Staff Account
        </button>
      </div>

      {isLoading ? (
        <div className="tenant-list-table-state" style={{ marginTop: '24px' }}>Loading staff accounts...</div>
      ) : error ? (
        <div className="tenant-list-table-state error" style={{ marginTop: '24px' }}>{error}</div>
      ) : staffAccountCount === 0 ? (
        <section className="staff-empty-state">
          <i className="fa-solid fa-user-plus"></i>
          <span><i className="fa-solid fa-briefcase"></i></span>
          <strong>No staff accounts found</strong>
          <p>Click "Create Staff Account" to add your first team member.</p>
        </section>
      ) : staffList.length === 0 ? (
        <div className="tenant-list-table-state" style={{ marginTop: '24px' }}>No staff members match the filters.</div>
      ) : (
        <section className="staff-list-table-card">
          <div className="staff-list-table-row staff-list-table-head">
            <span>Full Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Date Created</span>
            <span>Actions</span>
          </div>

          {paginatedStaff.map(staff => {
            const roleList = staff.userRole 
              ? staff.userRole.split(', ').map(r => r.trim())
              : []
            const isActive = staff.status === 'ACTIVE'

            return (
              <div
                className="staff-list-table-row staff-list-table-row-clickable"
                key={staff.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectStaff(staff)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectStaff(staff)
                  }
                }}
              >
                <strong 
                  className="staff-truncate-text"
                  title={staff.fullName}
                >
                  {staff.fullName}
                </strong>
                <span className="staff-truncate-text" title={staff.email}>{staff.email}</span>
                <div>
                  {roleList.map(r => (
                    <span key={r} className="staff-badge">{r}</span>
                  ))}
                </div>
                <em className={isActive ? 'active' : 'disabled'}>
                  <i className="fa-solid fa-circle" style={{ fontSize: '6px' }}></i>
                  {isActive ? 'Active' : 'Inactive'}
                </em>
                <span>{formatDate(staff.createdAt)}</span>
                <div className="staff-actions">
                  <button
                    type="button"
                    className="icon-tooltip"
                    data-tooltip="Edit"
                    aria-label={`Edit ${staff.fullName}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit(staff)
                    }}
                    disabled={isActionLocked}
                  >
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M8.75 21.25V16.25L21.25 3.75L26.25 8.75L13.75 21.25H8.75Z" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.75 26.25H26.25" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17.5 7.5L22.5 12.5" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="icon-tooltip"
                    data-tooltip="Delete"
                    aria-label={`Delete ${staff.fullName}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onDelete(staff)
                    }}
                    disabled={isActionLocked}
                  >
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </div>
            )
          })}

          <footer>
            <span>Showing {displayStart}-{displayEnd} of {totalElements} staff account{totalElements === 1 ? '' : 's'}</span>
            <div>
              <button
                type="button"
                className="icon-tooltip"
                data-tooltip="Previous page"
                disabled={currentPage === 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button 
                  key={p} 
                  type="button" 
                  className={currentPage === p ? 'active' : ''}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="icon-tooltip"
                data-tooltip="Next page"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </footer>
        </section>
      )}
    </div>
  )
}

function CreateStaffAccountView({
  staffMember,
  staffList = [],
  serverFieldErrors = {},
  onHome,
  onCancel,
  onConfirm,
  isSubmitting = false,
  isActionLocked = false,
}: {
  staffMember?: StaffMember
  staffList?: StaffMember[]
  serverFieldErrors?: StaffFormFieldErrors
  onHome: () => void
  onCancel: () => void
  onConfirm: (payload: { fullName: string; email: string; role: string[]; status?: UserStatus }) => void
  isSubmitting?: boolean
  isActionLocked?: boolean
}) {
  const isEdit = !!staffMember
  const [fullName, setFullName] = useState(staffMember?.fullName || '')
  const [email, setEmail] = useState(staffMember?.email || '')
  const [fullNameError, setFullNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  
  // Parse roles
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    if (!staffMember?.userRole) return ['hr'] // default to HR on create
    return staffMember.userRole.split(', ').map(r => r.trim().toLowerCase())
  })
  
  const [status, setStatus] = useState<UserStatus>(staffMember?.status || 'ACTIVE')

  useEffect(() => {
    if (serverFieldErrors.fullName) setFullNameError(serverFieldErrors.fullName)
    if (serverFieldErrors.email) setEmailError(serverFieldErrors.email)
    if (serverFieldErrors.role) setRoleError(serverFieldErrors.role)
  }, [serverFieldErrors])

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role)
      } else {
        if (roleError) setRoleError('')
        return [...prev, role]
      }
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (isActionLocked) return
    const nextFullNameError = !fullName.trim()
      ? validationErrorMessages.staffFullNameRequired
      : hasDuplicateStaffFullName(staffList, fullName, staffMember?.id)
        ? validationErrorMessages.duplicateStaffFullName
        : ''
    const nextEmailError = validateStaffEmail(email, staffList.map((staff) => staff.email), isEdit)
    const nextRoleError = selectedRoles.length > 0 ? '' : validationErrorMessages.roleRequired

    setFullNameError(nextFullNameError)
    setEmailError(nextEmailError)
    setRoleError(nextRoleError)

    if (nextFullNameError || nextEmailError || nextRoleError) {
      return
    }

    const rolePayload = selectedRoles.map((role) => {
      if (role === 'hr') return 'HR'
      return 'Interviewer'
    })
    onConfirm({
      fullName: fullName.trim(),
      email: email.trim(),
      role: rolePayload,
      ...(isEdit ? { status } : {}),
    })
  }

  return (
    <div className="role-content create-staff-content">
      <Breadcrumb
        className="create-staff-breadcrumb"
        items={[
          { label: 'Home', onClick: onHome },
          { label: 'Staff Management', onClick: onCancel },
          { label: isEdit ? 'Edit Staff Account' : 'Create New Staff Account' },
        ]}
      />

      <section className="create-staff-card">
        <header className="create-staff-header">
          <div className="create-staff-title">
            <span><i className={`fa-solid ${isEdit ? 'fa-user-pen' : 'fa-user-plus'}`}></i></span>
            <div>
              <h1>{isEdit ? 'Edit Staff Account' : 'Create Staff Account'}</h1>
              <p>{isEdit ? 'Modify user account settings and access roles.' : 'Provision a new user account with specific access roles.'}</p>
            </div>
          </div>
          <span className="system-status"><i className="fa-solid fa-circle"></i> SYSTEM ONLINE</span>
        </header>

        <form className="create-staff-form" onSubmit={handleSubmit} noValidate>
          <div className="create-staff-grid">
            <fieldset className="staff-fieldset">
              <legend>Identity Details</legend>
              <label>
                <span>Full Name <b className="required-mark">*</b></span>
                <div>
                  <i className="fa-regular fa-user"></i>
                  <input 
                    maxLength={FIELD_LENGTH_LIMITS.defaultText}
                    className={fullNameError ? 'has-error' : ''}
                    type="text" 
                    placeholder="e.g. Sarah Jenkins" 
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (fullNameError) setFullNameError('')
                    }}
                    disabled={isSubmitting || isActionLocked}
                  />
                </div>
                {fullNameError && <small className="staff-field-error">{fullNameError}</small>}
              </label>
              <label>
                <span>Corporate Email Address <b className="required-mark">*</b></span>
                <div>
                  <i className="fa-regular fa-envelope"></i>
                  <input 
                    maxLength={FIELD_LENGTH_LIMITS.defaultText}
                    className={emailError ? 'has-error' : ''}
                    type="email" 
                    placeholder="sarah.j@jobfusion.com" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError('')
                    }}
                    disabled={isEdit || isSubmitting || isActionLocked}
                  />
                </div>
                {emailError && <small className="staff-field-error">{emailError}</small>}
              </label>
              {isEdit && (
                <label style={{ marginTop: '16px' }}>
                  <span>Account Status</span>
                  <div style={{ border: '1px solid #f0b8a8', borderRadius: '5px', padding: '0 8px', background: '#ffffff', height: '45px', display: 'flex', alignItems: 'center' }}>
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value as UserStatus)}
                      disabled={isSubmitting || isActionLocked}
                      style={{ width: '100%', border: 0, outline: 0, background: 'transparent', font: 'inherit', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="DISABLED">Inactive</option>
                    </select>
                  </div>
                </label>
              )}
            </fieldset>

            <fieldset className="staff-fieldset">
              <legend>Access & Permissions <b className="required-mark">*</b></legend>
              <div 
                className={`staff-role-card-option ${selectedRoles.includes('hr') ? 'selected' : ''}`}
                onClick={() => !isSubmitting && !isActionLocked && handleRoleToggle('hr')}
              >
                <input 
                  maxLength={FIELD_LENGTH_LIMITS.defaultText}
                  type="checkbox" 
                  checked={selectedRoles.includes('hr')}
                  onChange={() => {}} // handled by div onClick
                  disabled={isSubmitting || isActionLocked}
                />
                <span><i className="fa-solid fa-users-gear"></i></span>
                <div>
                  <strong>HR</strong>
                  <small>Full access to candidate sourcing and recruitment management tools.</small>
                </div>
                <i className="staff-role-card-dot" aria-hidden="true"></i>
              </div>
              <div 
                className={`staff-role-card-option ${selectedRoles.includes('interviewer') ? 'selected' : ''}`}
                onClick={() => !isSubmitting && !isActionLocked && handleRoleToggle('interviewer')}
              >
                <input 
                  maxLength={FIELD_LENGTH_LIMITS.defaultText}
                  type="checkbox" 
                  checked={selectedRoles.includes('interviewer')}
                  onChange={() => {}} // handled by div onClick
                  disabled={isSubmitting || isActionLocked}
                />
                <span><i className="fa-solid fa-clipboard-check"></i></span>
                <div>
                  <strong>Interviewer</strong>
                  <small>Can view assigned interviews, candidate profiles and submit evaluation feedback.</small>
                </div>
                <i className="staff-role-card-dot" aria-hidden="true"></i>
              </div>
              {roleError && <small className="staff-field-error">{roleError}</small>}
            </fieldset>
          </div>

          <footer className="create-staff-actions">
            <button type="button" onClick={() => setShowCancelConfirm(true)} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="tenant-create-btn" disabled={isSubmitting || isActionLocked}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Account' : 'Confirm'}
            </button>
          </footer>
        </form>
      </section>
      {showCancelConfirm && (
        <ConfirmActionModal
          isSubmitting={false}
          title="Confirm Action"
          message="Are you sure you want to cancel? The staff account will not be created."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => setShowCancelConfirm(false)}
          onConfirm={onCancel}
        />
      )}
    </div>
  )
}

function EditStaffAccountView({
  staffMember,
  staffList = [],
  serverFieldErrors = {},
  onHome,
  onStaffManagement,
  onCancel,
  onConfirm,
  isSubmitting = false,
  isActionLocked = false,
}: {
  staffMember: StaffMember
  staffList?: StaffMember[]
  serverFieldErrors?: StaffFormFieldErrors
  onHome: () => void
  onStaffManagement: () => void
  onCancel: () => void
  onConfirm: (payload: { fullName: string; email: string; role: string[]; status: UserStatus }) => void
  isSubmitting?: boolean
  isActionLocked?: boolean
}) {
  const [fullName, setFullName] = useState(staffMember.fullName)
  const [fullNameError, setFullNameError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    const roles = staffMember.userRole
      ? staffMember.userRole.split(',').map((role) => role.trim().toLowerCase())
      : []

    return roles.length > 0 ? roles : ['hr']
  })

  useEffect(() => {
    if (serverFieldErrors.fullName) setFullNameError(serverFieldErrors.fullName)
    if (serverFieldErrors.role) setRoleError(serverFieldErrors.role)
  }, [serverFieldErrors])

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return 'U'
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
  }

  const formatActivityDate = (dateStr?: string) => {
    if (!dateStr) return '2 hours ago'

    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr

    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.max(1, Math.round(Math.abs(diffMs) / 60000))

    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`

    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

    const diffDays = Math.round(diffHours / 24)
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }

  const toggleRole = (role: string) => {
    setSelectedRoles((current) => {
      if (current.includes(role)) {
        return current.filter((item) => item !== role)
      }

      if (roleError) setRoleError('')
      return [...current, role]
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (isActionLocked) return
    if (!fullName.trim()) {
      setFullNameError(validationErrorMessages.staffFullNameRequired)
      return
    }
    if (hasDuplicateStaffFullName(staffList, fullName, staffMember.id)) {
      setFullNameError(validationErrorMessages.duplicateStaffFullName)
      return
    }
    if (selectedRoles.length === 0) {
      setRoleError(validationErrorMessages.accountRoleRequired)
      return
    }

    const rolePayload = selectedRoles.map((role) => role === 'hr' ? 'HR' : 'Interviewer')

    onConfirm({
      fullName: fullName.trim(),
      email: staffMember.email,
      role: rolePayload,
      status: staffMember.status,
    })
  }

  const isActive = staffMember.status === 'ACTIVE'
  const statusLabel = isActive ? 'Active' : 'Inactive'

  return (
    <div className="role-content edit-staff-content">
      <Breadcrumb
        className="create-staff-breadcrumb"
        items={[
          { label: 'Home', onClick: onHome },
          { label: 'Staff Management', onClick: onStaffManagement },
          { label: 'Edit Staff Account' },
        ]}
      />

      <header className="edit-staff-heading">
        <h1>Edit Staff Account</h1>
        <p>Modify permissions and personal details for {staffMember.fullName}.</p>
      </header>

      <form className="edit-staff-form" onSubmit={handleSubmit} noValidate>
        <div className="edit-staff-layout">
          <aside className="edit-staff-profile-card">
            <div className="edit-staff-profile-banner"></div>
            <div className="edit-staff-avatar">{getInitials(staffMember.fullName)}</div>
            <strong className="staff-truncate-text" title={staffMember.fullName}>{staffMember.fullName}</strong>
            <small>EMPLOYEE ID: {staffMember.employeeCode || `JF-${staffMember.id.slice(0, 6).toUpperCase()}`}</small>

            <div className="edit-staff-meta-list">
              <div>
                <span><i className="fa-regular fa-calendar-check"></i></span>
                <p>Last Active</p>
                <strong>{formatActivityDate(staffMember.createdAt)}</strong>
              </div>
              <div>
                <span><i className="fa-solid fa-shield-heart"></i></span>
                <p>Account Status</p>
                <strong className={isActive ? 'verified' : 'not-verified'}>{statusLabel}</strong>
              </div>
            </div>
          </aside>

          <section className="edit-staff-account-card">
            <h2><i className="fa-solid fa-user"></i> Account Information</h2>

            <label className="edit-staff-field">
              <span>Email Address (Primary)</span>
              <div className="edit-staff-readonly-input">
                <i className="fa-regular fa-envelope"></i>
                <input type="email" value={staffMember.email} readOnly maxLength={FIELD_LENGTH_LIMITS.defaultText}/>
                <em><i className="fa-solid fa-lock"></i> Read-only</em>
              </div>
            </label>

            <label className="edit-staff-field">
              <span>Full Name</span>
              <input
                maxLength={FIELD_LENGTH_LIMITS.defaultText}
                className={fullNameError ? 'has-error' : ''}
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value)
                  if (fullNameError) setFullNameError('')
                }}
                disabled={isSubmitting || isActionLocked}
              />
              {fullNameError && <small className="edit-staff-field-error">{fullNameError}</small>}
            </label>

            <div className="edit-staff-role-head">
              <span>Assigned Roles</span>
              <button type="button">Manage Role Templates</button>
            </div>

            <div className="edit-staff-role-grid">
              <label className={`edit-staff-role-option ${selectedRoles.includes('hr') ? 'selected' : ''}`}>
                <input
                  maxLength={FIELD_LENGTH_LIMITS.defaultText}
                  type="checkbox"
                  checked={selectedRoles.includes('hr')}
                  onChange={() => toggleRole('hr')}
                  disabled={isSubmitting || isActionLocked}
                />
                <span><i className="fa-solid fa-users-gear"></i></span>
                <div>
                  <strong>HR</strong>
                  <small>Full access to candidate sourcing and recruitment management tools.</small>
                </div>
              </label>

              <label className={`edit-staff-role-option ${selectedRoles.includes('interviewer') ? 'selected' : ''}`}>
                <input
                  maxLength={FIELD_LENGTH_LIMITS.defaultText}
                  type="checkbox"
                  checked={selectedRoles.includes('interviewer')}
                  onChange={() => toggleRole('interviewer')}
                  disabled={isSubmitting || isActionLocked}
                />
                <span><i className="fa-solid fa-clipboard-list"></i></span>
                <div>
                  <strong>Interviewer</strong>
                  <small>Can view assigned interviews, candidate profiles and submit evaluation feedback.</small>
                </div>
              </label>
            </div>
            {roleError && <small className="edit-staff-field-error edit-staff-role-error">{roleError}</small>}
          </section>
        </div>

        <footer className="edit-staff-actions">
          <small>All changes will be logged for security purposes.</small>
          <button type="button" onClick={() => setShowCancelConfirm(true)} disabled={isSubmitting}>Cancel</button>
          <button type="submit" disabled={isSubmitting || isActionLocked}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </footer>
      </form>
      {showCancelConfirm && (
        <ConfirmActionModal
          isSubmitting={false}
          title="Confirm Action"
          message="Are you sure you want to cancel? Your changes will not be saved."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => setShowCancelConfirm(false)}
          onConfirm={onCancel}
        />
      )}
    </div>
  )
}

function StaffDetailView({
  staffMember,
  recentActivities,
  isLoadingActivities,
  activityError,
  onHome,
  onBack,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewLogs,
  isActionLocked = false,
}: {
  staffMember: StaffMember
  recentActivities: ActivityLog[]
  isLoadingActivities: boolean
  activityError: string
  onHome: () => void
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
  onViewLogs: () => void
  isActionLocked?: boolean
}) {
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const formatDate = (dateStr?: string, fallback = 'Oct 12, 2023') => {
    if (!dateStr) return fallback
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const roleList = staffMember.userRole
    ? staffMember.userRole.split(',').map(r => r.trim()).filter(Boolean)
    : []
  const hasUniversalAccess = roleList.length > 1

  const isActive = staffMember.status === 'ACTIVE'
  const isDisabled = staffMember.status === 'DISABLED'
  const statusLabel = isActive ? 'Active' : 'Inactive'
  const statusSinceDate = staffMember.activatedAt || staffMember.createdAt

  return (
    <div className="role-content staff-detail-content">
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Staff Management', onClick: onBack }, { label: 'Staff Detail' }]} />

      <section className="staff-header-profile">
        <div className="staff-header-avatar">
          {getInitials(staffMember.fullName)}
        </div>
        <div className="staff-header-info">
          <h1 className="staff-truncate-text" title={staffMember.fullName}>{staffMember.fullName}</h1>
          <div className="staff-header-meta">
            <span>EMPLOYEE ID: {staffMember.employeeCode || `JF-${staffMember.id.slice(0, 4).toUpperCase()}`}</span>
            <span>•</span>
            <span>Created on {formatDate(staffMember.createdAt)}</span>
          </div>
        </div>
        <div className="staff-detail-actions">
          <button type="button" className="btn-delete" onClick={onDelete} disabled={isActionLocked}>
            Delete
          </button>
          <button type="button" className="btn-edit" onClick={onEdit} disabled={isActionLocked}>
            Edit Profile
          </button>
          <button 
            type="button" 
            className={isActive ? "btn-deactivate" : "btn-activate"} 
            onClick={onToggleStatus}
            disabled={isActionLocked}
          >
            {isActive ? 'Deactivate Account' : 'Activate Account'}
          </button>
        </div>
      </section>

      <div className="staff-detail-grid">
        {/* Left Column */}
        <div>
          <section className="staff-detail-card">
            <header style={{ borderBottom: '1px solid #f0d7d0', paddingBottom: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ flex: 1, margin: 0, color: '#101c33', fontSize: '16px' }}>Personal Information</h2>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V7C0 6.45 0.195833 5.97917 0.5875 5.5875C0.979167 5.19583 1.45 5 2 5H7V2C7 1.45 7.19583 0.979167 7.5875 0.5875C7.97917 0.195833 8.45 0 9 0H11C11.55 0 12.0208 0.195833 12.4125 0.5875C12.8042 0.979167 13 1.45 13 2V5H18C18.55 5 19.0208 5.19583 19.4125 5.5875C19.8042 5.97917 20 6.45 20 7V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H2ZM2 18H18V7H13C13 7.55 12.8042 8.02083 12.4125 8.4125C12.0208 8.80417 11.55 9 11 9H9C8.45 9 7.97917 8.80417 7.5875 8.4125C7.19583 8.02083 7 7.55 7 7H2V18ZM4 16H10V15.55C10 15.2667 9.92083 15.0042 9.7625 14.7625C9.60417 14.5208 9.38333 14.3333 9.1 14.2C8.76667 14.05 8.42917 13.9375 8.0875 13.8625C7.74583 13.7875 7.38333 13.75 7 13.75C6.61667 13.75 6.25417 13.7875 5.9125 13.8625C5.57083 13.9375 5.23333 14.05 4.9 14.2C4.61667 14.3333 4.39583 14.5208 4.2375 14.7625C4.07917 15.0042 4 15.2667 4 15.55V16ZM12 14.5H16V13H12V14.5ZM7 13C7.41667 13 7.77083 12.8542 8.0625 12.5625C8.35417 12.2708 8.5 11.9167 8.5 11.5C8.5 11.0833 8.35417 10.7292 8.0625 10.4375C7.77083 10.1458 7.41667 10 7 10C6.58333 10 6.22917 10.1458 5.9375 10.4375C5.64583 10.7292 5.5 11.0833 5.5 11.5C5.5 11.9167 5.64583 12.2708 5.9375 12.5625C6.22917 12.8542 6.58333 13 7 13ZM12 11.5H16V10H12V11.5ZM9 7H11V2H9V7Z" fill="#565E74" />
              </svg>
            </header>
            <div className="staff-detail-info-grid">
              <div>
                <small>Full Name</small>
                <strong className="staff-truncate-text" title={staffMember.fullName}>{staffMember.fullName}</strong>
              </div>
              <div>
                <small>Primary Email</small>
                <strong>
                  {staffMember.email} <i className="fa-solid fa-lock" style={{ color: '#667085', marginLeft: '6px', fontSize: '12px' }}></i>
                </strong>
              </div>
              <div>
                <small>Phone Number</small>
                <strong>{staffMember.phone || '+1 (555) 234-8891'}</strong>
              </div>
              <div>
                <small>Office Location</small>
                <strong>San Francisco, CA (HQ)</strong>
              </div>
            </div>
          </section>

          <section className="staff-detail-card staff-role-assignment-card">
            <h2>Role Assignments</h2>
            <div className="staff-role-assignment-list">
              {roleList.map(role => (
                <span key={role} className="staff-badge">{role}</span>
              ))}
            </div>
            {hasUniversalAccess && (
              <div className="staff-universal-access">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <div>
                  <strong>Universal Access Enabled</strong>
                  <p>This account can switch workspaces seamlessly within the Tenant infrastructure.</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div>
          <section className="staff-status-panel">
            <small className="staff-status-panel-label">Account Status</small>
            <div className={`staff-status-box ${isDisabled ? 'status-disabled' : ''}`}>
              <strong>
                <i className="fa-solid fa-circle" style={{ fontSize: '8px' }}></i>
                {statusLabel}
              </strong>
              {isActive && <span>SINCE {formatDate(statusSinceDate).toUpperCase()}</span>}
            </div>
          </section>

          <section className="staff-detail-card">
            <header style={{ borderBottom: '1px solid #f0d7d0', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#101c33', fontSize: '16px' }}>Recent Activity</h2>
              <button type="button" className="staff-view-logs-btn" onClick={onViewLogs}>View All Logs</button>
            </header>
            <div className="activity-list-container" style={{ marginTop: '16px' }}>
              {isLoadingActivities ? (
                <div className="tenant-list-table-state">Loading activity...</div>
              ) : activityError ? (
                <div className="tenant-list-table-state error">{activityError}</div>
              ) : recentActivities.length === 0 ? (
                <div className="tenant-list-table-state">No activity recorded yet.</div>
              ) : (
                recentActivities.map((activity, index) => (
                  <div className="activity-item" key={activity.id}>
                    <div className="activity-icon-wrapper">
                      <div className="activity-icon"><ActivityLogIcon eventType={activity.eventType} index={index} /></div>
                      <div className="activity-line"></div>
                    </div>
                    <div className="activity-details">
                      <p>{activity.title}</p>
                      <small>{formatActivityDateTime(activity.createdAt)}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StaffActivityLogView({
  staffMember,
  activityLogs,
  isLoadingActivities,
  activityError,
  currentPage,
  pageCount,
  eventTypeFilter,
  startDateFilter,
  endDateFilter,
  isClearingActivityLogs,
  onHome,
  onStaffManagement,
  onBack,
  onPageChange,
  onEventTypeFilterChange,
  onStartDateFilterChange,
  onEndDateFilterChange,
  onClearFilters,
}: {
  staffMember: StaffMember
  activityLogs: ActivityLog[]
  isLoadingActivities: boolean
  activityError: string
  currentPage: number
  pageCount: number
  eventTypeFilter: string
  startDateFilter: string
  endDateFilter: string
  isClearingActivityLogs: boolean
  onHome: () => void
  onStaffManagement: () => void
  onBack: () => void
  onPageChange: (page: number) => void
  onEventTypeFilterChange: (value: string) => void
  onStartDateFilterChange: (value: string) => void
  onEndDateFilterChange: (value: string) => void
  onClearFilters: () => void
}) {
  const totalElements = getListTotalElements(activityLogs, activityLogs.length)
  const displayStart = totalElements === 0 ? 0 : ((currentPage - 1) * ACTIVITY_LOG_PAGE_SIZE) + 1
  const displayEnd = displayStart === 0 ? 0 : Math.min(totalElements, displayStart + activityLogs.length - 1)
  const pageItems = getCompactPageItems(currentPage, pageCount)
  const shouldShowActivityTable = isLoadingActivities || Boolean(activityError) || activityLogs.length > 0
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const endDateInputRef = useRef<HTMLInputElement>(null)
  const openDatePicker = (input: HTMLInputElement | null) => {
    if (!input) return

    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }

    input.focus()
    input.click()
  }

  useEffect(() => {
    if (!isLoadingActivities && !activityError && activityLogs.length === 0 && currentPage > 1) {
      onPageChange(Math.max(1, currentPage - 1))
    }
  }, [activityError, activityLogs.length, currentPage, isLoadingActivities, onPageChange])

  const formatDate = (dateStr?: string, fallback = 'Oct 12, 2023') => {
    if (!dateStr) return fallback

    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  const startDateLabel = formatDate(startDateFilter, 'Oct 12, 2025')
  const endDateLabel = formatDate(endDateFilter, 'Oct 19, 2025')

  return (
    <div className="role-content staff-log-content">
      <Breadcrumb
        className="staff-log-breadcrumb"
        items={[
          { label: 'Home', onClick: onHome },
          { label: 'Staff Management', onClick: onStaffManagement },
          { label: 'Staff Detail', onClick: onBack },
          { label: 'Staff Activity Log' },
        ]}
      />

      <header className="staff-log-header">
        <div>
          <h1>Staff Activity Log</h1>
          <p><i className="fa-regular fa-clock"></i> Real-time auditing and security trail for tenant administrators.</p>
        </div>
        <button type="button" className="staff-log-export-btn">Export to Excel</button>
      </header>

      <section className="staff-log-subject">
        <h2 className="staff-truncate-text" title={staffMember.fullName}>{staffMember.fullName}</h2>
        <p>
          <span>EMPLOYEE ID: {staffMember.employeeCode || `JF-${staffMember.id.slice(0, 6).toUpperCase()}`}</span>
          <span>Created on {formatDate(staffMember.createdAt)}</span>
        </p>
      </section>

      <section className="staff-log-filter-card">
        <strong><i className="fa-solid fa-filter"></i> Filter Logs:</strong>
        <div>
          <label className="staff-log-filter-select">
            <select aria-label="Filter logs by event type" value={eventTypeFilter} onChange={(event) => onEventTypeFilterChange(event.target.value)}>
              <option value="">All Event Types</option>
              <option value="ACCOUNT">Account</option>
              <option value="LOGIN">Login</option>
              <option value="ACTION">Action</option>
            </select>
            <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
          </label>
          <div className="staff-log-date-range-control">
            <span className="staff-log-date-range-label">{startDateLabel}</span>
            <button type="button" className="staff-log-date-picker-trigger" aria-label="Choose start date" onClick={() => openDatePicker(startDateInputRef.current)}>
              <svg className="staff-log-date-range-icon" width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1.66667 16.6667C1.20833 16.6667 0.815972 16.5035 0.489583 16.1771C0.163194 15.8507 0 15.4583 0 15V3.33333C0 2.875 0.163194 2.48264 0.489583 2.15625C0.815972 1.82986 1.20833 1.66667 1.66667 1.66667H2.5V0H4.16667V1.66667H10.8333V0H12.5V1.66667H13.3333C13.7917 1.66667 14.184 1.82986 14.5104 2.15625C14.8368 2.48264 15 2.875 15 3.33333V15C15 15.4583 14.8368 15.8507 14.5104 16.1771C14.184 16.5035 13.7917 16.6667 13.3333 16.6667H1.66667ZM1.66667 15H13.3333V6.66667H1.66667V15ZM1.66667 5H13.3333V3.33333H1.66667V5ZM1.66667 5V3.33333V5ZM7.5 10C7.26389 10 7.06597 9.92014 6.90625 9.76042C6.74653 9.60069 6.66667 9.40278 6.66667 9.16667C6.66667 8.93056 6.74653 8.73264 6.90625 8.57292C7.06597 8.41319 7.26389 8.33333 7.5 8.33333C7.73611 8.33333 7.93403 8.41319 8.09375 8.57292C8.25347 8.73264 8.33333 8.93056 8.33333 9.16667C8.33333 9.40278 8.25347 9.60069 8.09375 9.76042C7.93403 9.92014 7.73611 10 7.5 10ZM4.16667 10C3.93056 10 3.73264 9.92014 3.57292 9.76042C3.41319 9.60069 3.33333 9.40278 3.33333 9.16667C3.33333 8.93056 3.41319 8.73264 3.57292 8.57292C3.73264 8.41319 3.93056 8.33333 4.16667 8.33333C4.40278 8.33333 4.60069 8.41319 4.76042 8.57292C4.92014 8.73264 5 8.93056 5 9.16667C5 9.40278 4.92014 9.60069 4.76042 9.76042C4.60069 9.92014 4.40278 10 4.16667 10ZM10.8333 10C10.5972 10 10.3993 9.92014 10.2396 9.76042C10.0799 9.60069 10 9.40278 10 9.16667C10 8.93056 10.0799 8.73264 10.2396 8.57292C10.3993 8.41319 10.5972 8.33333 10.8333 8.33333C11.0694 8.33333 11.2674 8.41319 11.4271 8.57292C11.5868 8.73264 11.6667 8.93056 11.6667 9.16667C11.6667 9.40278 11.5868 9.60069 11.4271 9.76042C11.2674 9.92014 11.0694 10 10.8333 10ZM7.5 13.3333C7.26389 13.3333 7.06597 13.2535 6.90625 13.0938C6.74653 12.934 6.66667 12.7361 6.66667 12.5C6.66667 12.2639 6.74653 12.066 6.90625 11.9062C7.06597 11.7465 7.26389 11.6667 7.5 11.6667C7.73611 11.6667 7.93403 11.7465 8.09375 11.9062C8.25347 12.066 8.33333 12.2639 8.33333 12.5C8.33333 12.7361 8.25347 12.934 8.09375 13.0938C7.93403 13.2535 7.73611 13.3333 7.5 13.3333ZM4.16667 13.3333C3.93056 13.3333 3.73264 13.2535 3.57292 13.0938C3.41319 12.934 3.33333 12.7361 3.33333 12.5C3.33333 12.2639 3.41319 12.066 3.57292 11.9062C3.73264 11.7465 3.93056 11.6667 4.16667 11.6667C4.40278 11.6667 4.60069 11.7465 4.76042 11.9062C4.92014 12.066 5 12.2639 5 12.5C5 12.7361 4.92014 12.934 4.76042 13.0938C4.60069 13.2535 4.40278 13.3333 4.16667 13.3333ZM10.8333 13.3333C10.5972 13.3333 10.3993 13.2535 10.2396 13.0938C10.0799 12.934 10 12.7361 10 12.5C10 12.2639 10.0799 12.066 10.2396 11.9062C10.3993 11.7465 10.5972 11.6667 10.8333 11.6667C11.0694 11.6667 11.2674 11.7465 11.4271 11.9062C11.5868 12.066 11.6667 12.2639 11.6667 12.5C11.6667 12.7361 11.5868 12.934 11.4271 13.0938C11.2674 13.2535 11.0694 13.3333 10.8333 13.3333Z" fill="#565E74" />
              </svg>
            </button>
            <span className="staff-log-date-range-separator">-</span>
            <span className="staff-log-date-range-label">{endDateLabel}</span>
            <button type="button" className="staff-log-date-picker-trigger" aria-label="Choose end date" onClick={() => openDatePicker(endDateInputRef.current)}>
              <svg className="staff-log-date-range-icon" width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1.66667 16.6667C1.20833 16.6667 0.815972 16.5035 0.489583 16.1771C0.163194 15.8507 0 15.4583 0 15V3.33333C0 2.875 0.163194 2.48264 0.489583 2.15625C0.815972 1.82986 1.20833 1.66667 1.66667 1.66667H2.5V0H4.16667V1.66667H10.8333V0H12.5V1.66667H13.3333C13.7917 1.66667 14.184 1.82986 14.5104 2.15625C14.8368 2.48264 15 2.875 15 3.33333V15C15 15.4583 14.8368 15.8507 14.5104 16.1771C14.184 16.5035 13.7917 16.6667 13.3333 16.6667H1.66667ZM1.66667 15H13.3333V6.66667H1.66667V15ZM1.66667 5H13.3333V3.33333H1.66667V5ZM1.66667 5V3.33333V5ZM7.5 10C7.26389 10 7.06597 9.92014 6.90625 9.76042C6.74653 9.60069 6.66667 9.40278 6.66667 9.16667C6.66667 8.93056 6.74653 8.73264 6.90625 8.57292C7.06597 8.41319 7.26389 8.33333 7.5 8.33333C7.73611 8.33333 7.93403 8.41319 8.09375 8.57292C8.25347 8.73264 8.33333 8.93056 8.33333 9.16667C8.33333 9.40278 8.25347 9.60069 8.09375 9.76042C7.93403 9.92014 7.73611 10 7.5 10ZM4.16667 10C3.93056 10 3.73264 9.92014 3.57292 9.76042C3.41319 9.60069 3.33333 9.40278 3.33333 9.16667C3.33333 8.93056 3.41319 8.73264 3.57292 8.57292C3.73264 8.41319 3.93056 8.33333 4.16667 8.33333C4.40278 8.33333 4.60069 8.41319 4.76042 8.57292C4.92014 8.73264 5 8.93056 5 9.16667C5 9.40278 4.92014 9.60069 4.76042 9.76042C4.60069 9.92014 4.40278 10 4.16667 10ZM10.8333 10C10.5972 10 10.3993 9.92014 10.2396 9.76042C10.0799 9.60069 10 9.40278 10 9.16667C10 8.93056 10.0799 8.73264 10.2396 8.57292C10.3993 8.41319 10.5972 8.33333 10.8333 8.33333C11.0694 8.33333 11.2674 8.41319 11.4271 8.57292C11.5868 8.73264 11.6667 8.93056 11.6667 9.16667C11.6667 9.40278 11.5868 9.60069 11.4271 9.76042C11.2674 9.92014 11.0694 10 10.8333 10ZM7.5 13.3333C7.26389 13.3333 7.06597 13.2535 6.90625 13.0938C6.74653 12.934 6.66667 12.7361 6.66667 12.5C6.66667 12.2639 6.74653 12.066 6.90625 11.9062C7.06597 11.7465 7.26389 11.6667 7.5 11.6667C7.73611 11.6667 7.93403 11.7465 8.09375 11.9062C8.25347 12.066 8.33333 12.2639 8.33333 12.5C8.33333 12.7361 8.25347 12.934 8.09375 13.0938C7.93403 13.2535 7.73611 13.3333 7.5 13.3333ZM4.16667 13.3333C3.93056 13.3333 3.73264 13.2535 3.57292 13.0938C3.41319 12.934 3.33333 12.7361 3.33333 12.5C3.33333 12.2639 3.41319 12.066 3.57292 11.9062C3.73264 11.7465 3.93056 11.6667 4.16667 11.6667C4.40278 11.6667 4.60069 11.7465 4.76042 11.9062C4.92014 12.066 5 12.2639 5 12.5C5 12.7361 4.92014 12.934 4.76042 13.0938C4.60069 13.2535 4.40278 13.3333 4.16667 13.3333ZM10.8333 13.3333C10.5972 13.3333 10.3993 13.2535 10.2396 13.0938C10.0799 12.934 10 12.7361 10 12.5C10 12.2639 10.0799 12.066 10.2396 11.9062C10.3993 11.7465 10.5972 11.6667 10.8333 11.6667C11.0694 11.6667 11.2674 11.7465 11.4271 11.9062C11.5868 12.066 11.6667 12.2639 11.6667 12.5C11.6667 12.7361 11.5868 12.934 11.4271 13.0938C11.2674 13.2535 11.0694 13.3333 10.8333 13.3333Z" fill="#565E74" />
              </svg>
            </button>
            <input ref={startDateInputRef} className="staff-log-date-input" aria-label="Filter logs start date" type="date" value={startDateFilter} onChange={(event) => onStartDateFilterChange(event.target.value)} />
            <input ref={endDateInputRef} className="staff-log-date-input" aria-label="Filter logs end date" type="date" value={endDateFilter} onChange={(event) => onEndDateFilterChange(event.target.value)} />
          </div>
          <button type="button" className="clear" disabled={isClearingActivityLogs} onClick={onClearFilters}>
            {isClearingActivityLogs ? 'Clearing...' : 'Clear All'}
          </button>
        </div>
      </section>

      {shouldShowActivityTable ? (
        <section className="staff-log-table-card">
          <div className="staff-log-table-row staff-log-table-head">
            <span>Activity</span>
            <span>Event Type</span>
            <span>Description</span>
            <span>IP Address</span>
          </div>

          {isLoadingActivities ? (
          <div className="tenant-list-table-state">Loading activity logs...</div>
          ) : activityError ? (
          <div className="tenant-list-table-state error">{activityError}</div>
          ) : (
            activityLogs.map((activity, index) => {
              const createdAt = activity.createdAt ? new Date(activity.createdAt) : null
              const hasValidDate = createdAt && !Number.isNaN(createdAt.getTime())
              const eventTypeLabel = String(activity.eventType || '').replace(/[_-]+/g, ' ').trim() || 'Action'
              const descriptionLabel = activity.description || (hasValidDate ? formatActivityDateTime(activity.createdAt) : activity.createdAt) || '-'
              const ipAddressLabel = activity.ipAddress || '-'

              return (
                <div className="staff-log-table-row" key={activity.id}>
                  <span className="staff-log-activity-cell">
                    <span className="activity-log-table-icon"><ActivityLogIcon eventType={activity.eventType} index={index} /></span>
                    <strong>{activity.title}</strong>
                  </span>
                  <span>{eventTypeLabel}</span>
                  <span>{descriptionLabel}</span>
                  <span>{ipAddressLabel}</span>
                </div>
              )
            })
          )}

          <footer>
            <span>Showing {displayStart}-{displayEnd} of {totalElements} Log{totalElements === 1 ? '' : 's'}</span>
            <div>
              <button type="button" className="icon-tooltip" data-tooltip="Previous page" disabled={currentPage === 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}><i className="fa-solid fa-chevron-left"></i></button>
              {pageItems.map((item, index) => (
                item === 'ellipsis' ? (
                  <span className="pagination-ellipsis" key={`activity-ellipsis-${index}`}>...</span>
                ) : (
                  <button type="button" className={item === currentPage ? 'active' : ''} key={item} onClick={() => onPageChange(item)}>{item}</button>
                )
              ))}
              <button type="button" className="icon-tooltip" data-tooltip="Next page" disabled={currentPage === pageCount} onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}><i className="fa-solid fa-chevron-right"></i></button>
            </div>
          </footer>
        </section>
      ) : (
          <section className="staff-log-empty-state">
            <svg className="staff-log-empty-main-icon" width="110" height="80" viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M85 50V35H70V25H85V10H95V25H110V35H95V50H85ZM40 40C34.5 40 29.7917 38.0417 25.875 34.125C21.9583 30.2083 20 25.5 20 20C20 14.5 21.9583 9.79167 25.875 5.875C29.7917 1.95833 34.5 0 40 0C45.5 0 50.2083 1.95833 54.125 5.875C58.0417 9.79167 60 14.5 60 20C60 25.5 58.0417 30.2083 54.125 34.125C50.2083 38.0417 45.5 40 40 40ZM0 80V66C0 63.1667 0.729167 60.5625 2.1875 58.1875C3.64583 55.8125 5.58333 54 8 52.75C13.1667 50.1667 18.4167 48.2292 23.75 46.9375C29.0833 45.6458 34.5 45 40 45C45.5 45 50.9167 45.6458 56.25 46.9375C61.5833 48.2292 66.8333 50.1667 72 52.75C74.4167 54 76.3542 55.8125 77.8125 58.1875C79.2708 60.5625 80 63.1667 80 66V80H0ZM10 70H70V66C70 65.0833 69.7708 64.25 69.3125 63.5C68.8542 62.75 68.25 62.1667 67.5 61.75C63 59.5 58.4583 57.8125 53.875 56.6875C49.2917 55.5625 44.6667 55 40 55C35.3333 55 30.7083 55.5625 26.125 56.6875C21.5417 57.8125 17 59.5 12.5 61.75C11.75 62.1667 11.1458 62.75 10.6875 63.5C10.2292 64.25 10 65.0833 10 66V70ZM40 30C42.75 30 45.1042 29.0208 47.0625 27.0625C49.0208 25.1042 50 22.75 50 20C50 17.25 49.0208 14.8958 47.0625 12.9375C45.1042 10.9792 42.75 10 40 10C37.25 10 34.8958 10.9792 32.9375 12.9375C30.9792 14.8958 30 17.25 30 20C30 22.75 30.9792 25.1042 32.9375 27.0625C34.8958 29.0208 37.25 30 40 30Z" fill="#E4BEB4" fillOpacity="0.4" />
            </svg>
            <span className="staff-log-empty-small-icon">
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2.5 25C1.8125 25 1.22396 24.7552 0.734375 24.2656C0.244792 23.776 0 23.1875 0 22.5V8.75C0 8.0625 0.244792 7.47396 0.734375 6.98438C1.22396 6.49479 1.8125 6.25 2.5 6.25H8.75V2.5C8.75 1.8125 8.99479 1.22396 9.48438 0.734375C9.97396 0.244792 10.5625 0 11.25 0H13.75C14.4375 0 15.026 0.244792 15.5156 0.734375C16.0052 1.22396 16.25 1.8125 16.25 2.5V6.25H22.5C23.1875 6.25 23.776 6.49479 24.2656 6.98438C24.7552 7.47396 25 8.0625 25 8.75V22.5C25 23.1875 24.7552 23.776 24.2656 24.2656C23.776 24.7552 23.1875 25 22.5 25H2.5ZM2.5 22.5H22.5V8.75H16.25C16.25 9.4375 16.0052 10.026 15.5156 10.5156C15.026 11.0052 14.4375 11.25 13.75 11.25H11.25C10.5625 11.25 9.97396 11.0052 9.48438 10.5156C8.99479 10.026 8.75 9.4375 8.75 8.75H2.5V22.5ZM5 20H12.5V19.4375C12.5 19.0833 12.401 18.7552 12.2031 18.4531C12.0052 18.151 11.7292 17.9167 11.375 17.75C10.9583 17.5625 10.5365 17.4219 10.1094 17.3281C9.68229 17.2344 9.22917 17.1875 8.75 17.1875C8.27083 17.1875 7.81771 17.2344 7.39062 17.3281C6.96354 17.4219 6.54167 17.5625 6.125 17.75C5.77083 17.9167 5.49479 18.151 5.29688 18.4531C5.09896 18.7552 5 19.0833 5 19.4375V20ZM15 18.125H20V16.25H15V18.125ZM8.75 16.25C9.27083 16.25 9.71354 16.0677 10.0781 15.7031C10.4427 15.3385 10.625 14.8958 10.625 14.375C10.625 13.8542 10.4427 13.4115 10.0781 13.0469C9.71354 12.6823 9.27083 12.5 8.75 12.5C8.22917 12.5 7.78646 12.6823 7.42188 13.0469C7.05729 13.4115 6.875 13.8542 6.875 14.375C6.875 14.8958 7.05729 15.3385 7.42188 15.7031C7.78646 16.0677 8.22917 16.25 8.75 16.25ZM15 14.375H20V12.5H15V14.375ZM11.25 8.75H13.75V2.5H11.25V8.75Z" fill="white" />
              </svg>
            </span>
            <p>No activity recorded for this account yet.</p>
          </section>
      )}
    </div>
  )
}

export function TenantAdminDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isPasswordChangeRequired] = useState(() => getStoredRequirePasswordChange())
  const [activeView, setActiveView] = useState<TenantAdminView>(() => (
    getStoredRequirePasswordChange() ? 'settings' : getInitialTenantAdminView(location.pathname)
  ))
  const [tenantId] = useState(() => getStoredTenantId())
  const [tenantDetail, setTenantDetail] = useState<Tenant | null>(null)
  const [tenantPlan, setTenantPlan] = useState<SubscriptionPlan | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState(() => getTenantAdminStaffIdFromUrl(location.pathname))
  const [viewResetKeys, setViewResetKeys] = useState<Record<TenantAdminView, number>>({
    dashboard: 0,
    jobs: 0,
    settings: 0,
    staffManagement: 0,
    staffCreate: 0,
    staffEdit: 0,
    staffDetail: 0,
    staffActivityLog: 0,
  })
  const changeView = (view: TenantAdminView, staffId?: string) => {
    if (isPasswordChangeRequired && view !== 'settings') {
      setActiveView('settings')
      navigate(getTenantAdminViewPath('settings'))
      triggerToast?.(passwordChangeRequiredMessage, 'error')
      return
    }

    setActiveView(view)
    setSelectedStaffId(staffId || '')
    navigate(getTenantAdminViewPath(view, staffId))
  }
  const reloadViewFromSidebar = (view: TenantAdminView) => {
    if (isPasswordChangeRequired && view !== 'settings') {
      setActiveView('settings')
      navigate(getTenantAdminViewPath('settings'))
      triggerToast?.(passwordChangeRequiredMessage, 'error')
      return
    }

    setStaffFormFieldErrors({})
    setActiveView(view)
    setSelectedStaffId('')
    navigate(getTenantAdminViewPath(view))
    setViewResetKeys((current) => ({
      ...current,
      [view]: current[view] + 1,
    }))
  }
  const navItems = buildNavigation(tenantNav, activeView, reloadViewFromSidebar).map((item) => (
    isPasswordChangeRequired && item.label !== 'Settings'
      ? {
          ...item,
          onClick: () => {
            setActiveView('settings')
            navigate(getTenantAdminViewPath('settings'))
            triggerToast?.(passwordChangeRequiredMessage, 'error')
          },
        }
      : item
  ))

  const loadStaffDetail = useCallback((detailStaffId: string, fallbackStaff?: StaffMember, options: { syncSelectedStaffId?: boolean } = {}) => {
    if (!detailStaffId) return () => {}

    let isActive = true
    if (options.syncSelectedStaffId && detailStaffId !== selectedStaffId) {
      setSelectedStaffId(detailStaffId)
    }
    setStaffDetailError('')
    setIsLoadingStaffDetail(true)

    tenantAdminApi.getUserById(detailStaffId)
      .then((staffDetail) => {
        if (!isActive) return

        const normalizedStaffDetail = normalizeStaffMember(staffDetail)
        setSelectedStaff((currentStaff) => {
          const fallback = fallbackStaff || currentStaff
          const nextStaff: StaffMember = {
            id: detailStaffId,
            email: normalizedStaffDetail?.email || fallback?.email || '',
            fullName: normalizedStaffDetail?.fullName || fallback?.fullName || 'Staff Member',
            status: normalizedStaffDetail?.status || fallback?.status || 'DISABLED',
            userRole: normalizedStaffDetail?.userRole || fallback?.userRole || '',
            employeeCode: normalizedStaffDetail?.employeeCode || fallback?.employeeCode,
            phone: normalizedStaffDetail?.phone || fallback?.phone,
            createdAt: normalizedStaffDetail?.createdAt || fallback?.createdAt,
            activatedAt: normalizedStaffDetail?.activatedAt || fallback?.activatedAt,
            lastLoginAt: normalizedStaffDetail?.lastLoginAt || fallback?.lastLoginAt,
            lastLoginLocation: normalizedStaffDetail?.lastLoginLocation || fallback?.lastLoginLocation,
            lastLoginIp: normalizedStaffDetail?.lastLoginIp || fallback?.lastLoginIp,
          }

          saveSelectedStaff(nextStaff)
          return nextStaff
        })
      })
      .catch((error) => {
        if (isActive) {
          setStaffDetailError('Error loading staff details. Please try again.')
          if (shouldToastHttpError(error)) {
            triggerToast?.(getAdminErrorMessage(error, 'Error loading staff details. Please try again.'), 'error')
          }
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingStaffDetail(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [selectedStaffId, triggerToast])

  useEffect(() => {
    if (isPasswordChangeRequired) {
      setActiveView('settings')
      if (location.pathname !== getTenantAdminViewPath('settings')) {
        navigate(getTenantAdminViewPath('settings'), { replace: true })
      }
    }
  }, [isPasswordChangeRequired, location.pathname, navigate])

  useEffect(() => {
    if (isPasswordChangeRequired) {
      return
    }

    const nextView = getInitialTenantAdminView(location.pathname)
    const nextStaffId = getTenantAdminStaffIdFromUrl(location.pathname)

    setActiveView((currentView) => currentView === nextView ? currentView : nextView)
    setSelectedStaffId((currentStaffId) => currentStaffId === nextStaffId ? currentStaffId : nextStaffId)
  }, [isPasswordChangeRequired, location.pathname])

  // CRUD Staff States
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [staffAccountList, setStaffAccountList] = useState<StaffMember[]>([])
  const [staffAccountLimit, setStaffAccountLimit] = useState<StaffAccountLimit>({})
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [isLoadingTenantDetail, setIsLoadingTenantDetail] = useState(false)
  const [isLoadingStaffDetail, setIsLoadingStaffDetail] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [staffDetailError, setStaffDetailError] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(() => getStoredSelectedStaff())
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [activityLogPage, setActivityLogPage] = useState(1)
  const [activityLogPageCount, setActivityLogPageCount] = useState(1)
  const [activityEventTypeFilter, setActivityEventTypeFilter] = useState('')
  const [activityStartDateFilter, setActivityStartDateFilter] = useState('')
  const [activityEndDateFilter, setActivityEndDateFilter] = useState('')
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [isClearingActivityLogs, setIsClearingActivityLogs] = useState(false)
  const [activityError, setActivityError] = useState('')
  
  // Modals & Save states
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<StaffMember | null>(null)
  const [statusConfirmStaff, setStatusConfirmStaff] = useState<StaffMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [staffPage, setStaffPage] = useState(1)
  const [staffPageCount, setStaffPageCount] = useState(1)
  const [staffRoleFilter, setStaffRoleFilter] = useState('all')
  const [staffStatusFilter, setStaffStatusFilter] = useState('all')
  const [staffSearchQuery, setStaffSearchQuery] = useState('')
  const [debouncedStaffSearchQuery, setDebouncedStaffSearchQuery] = useState('')
  const [isActionLocked, setIsActionLocked] = useState(() => isStoredCurrentUserInactive())
  const [staffFormFieldErrors, setStaffFormFieldErrors] = useState<StaffFormFieldErrors>({})

  const shouldLoadTenantWorkspace =
    activeView === 'dashboard' ||
    activeView === 'staffManagement' ||
    activeView === 'staffCreate' ||
    activeView === 'staffEdit' ||
    activeView === 'staffDetail' ||
    activeView === 'staffActivityLog'

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedStaffSearchQuery(staffSearchQuery.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [staffSearchQuery])

  useEffect(() => {
    setStaffPage(1)
  }, [staffRoleFilter, staffStatusFilter, debouncedStaffSearchQuery])

  const staffListFilters = useMemo(() => buildStaffListFilters({
    search: debouncedStaffSearchQuery,
    userRole: staffRoleFilter === 'all'
      ? undefined
      : staffRoleFilter === 'hr'
        ? 'HR'
        : 'Interviewer',
    status: staffStatusFilter === 'all'
      ? undefined
      : staffStatusFilter === 'activated'
        ? 'ACTIVE'
        : 'DISABLED',
  }), [debouncedStaffSearchQuery, staffRoleFilter, staffStatusFilter])

  // API load tenant workspace data
  useEffect(() => {
    if (!shouldLoadTenantWorkspace) {
      return
    }

    let isActive = true
    setIsLoadingStaff(true)
    setIsLoadingTenantDetail(Boolean(tenantId))
    setStaffError('')

    loadTenantWorkspaceData(tenantId, staffPage, staffListFilters)
      .then((data) => {
        if (!isActive) return
        setStaffList(data.staffList)
        setStaffPageCount(data.staffPageCount)
        setStaffAccountLimit(data.staffAccountLimit)
        setTenantDetail(data.tenantDetail)
        setTenantPlan(data.tenantPlan)
      })
      .catch((error) => {
        if (!isActive) return
        setStaffError(getAdminErrorMessage(error, 'Failed to load staff accounts.'))
        setStaffAccountLimit({})
        setTenantDetail(null)
        setTenantPlan(null)
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingStaff(false)
          setIsLoadingTenantDetail(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [shouldLoadTenantWorkspace, refreshKey, staffPage, tenantId, staffListFilters])

  useEffect(() => {
    const routeView = getInitialTenantAdminView(location.pathname)
    const urlStaffId = getTenantAdminStaffIdFromUrl(location.pathname)
    const detailStaffId = selectedStaffId || urlStaffId || selectedStaff?.id || ''
    const shouldLoadStaffDetail =
      activeView === 'staffDetail' ||
      activeView === 'staffEdit' ||
      activeView === 'staffActivityLog' ||
      routeView === 'staffDetail' ||
      routeView === 'staffEdit' ||
      routeView === 'staffActivityLog'

    if (!detailStaffId || !shouldLoadStaffDetail) {
      return
    }

    if (selectedStaff?.id === detailStaffId) {
      return
    }

    return loadStaffDetail(detailStaffId, undefined, { syncSelectedStaffId: true })
  }, [activeView, location.pathname, loadStaffDetail, selectedStaffId, selectedStaff?.id, triggerToast])

  useEffect(() => {
    if (activeView !== 'staffDetail' && activeView !== 'staffActivityLog') {
      return
    }

    const staffUserId = selectedStaff?.id
    if (!staffUserId) {
      setRecentActivities([])
      setActivityLogs([])
      setActivityLogPageCount(1)
      setActivityError('')
      return
    }

    let isActive = true
    const isLogListView = activeView === 'staffActivityLog'
    const activityFilterEntries = {
      ...(tenantId ? { tenantId } : {}),
      userId: staffUserId,
      ...(isLogListView && activityEventTypeFilter ? { eventType: activityEventTypeFilter } : {}),
      ...(isLogListView && activityStartDateFilter ? { startDate: new Date(`${activityStartDateFilter}T00:00:00`).toISOString() } : {}),
      ...(isLogListView && activityEndDateFilter ? { endDate: new Date(`${activityEndDateFilter}T23:59:59`).toISOString() } : {}),
    }
    const activityFilters = Object.keys(activityFilterEntries).length > 0 ? activityFilterEntries : null
    setIsLoadingActivities(true)
    setActivityError('')

    tenantAdminApi.getActivityLogs({
      sortField: 'createdAt',
      filters: activityFilters,
      sortBy: 'DESC',
      page: isLogListView ? activityLogPage : 1,
      size: isLogListView ? ACTIVITY_LOG_PAGE_SIZE : 4,
    })
      .then((items) => {
        if (isActive) {
          if (isLogListView) {
            setActivityLogs(items)
            setActivityLogPageCount(getListPageCount(items, activityLogPage, ACTIVITY_LOG_PAGE_SIZE))
          } else {
            setRecentActivities(items.slice(0, 4))
          }
        }
      })
      .catch((error) => {
        if (isActive) {
          if (isLogListView) {
            setActivityLogs([])
            setActivityLogPageCount(1)
          } else {
            setRecentActivities([])
          }
          setActivityError(getAdminErrorMessage(error, 'Failed to load activity logs.'))
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingActivities(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [activeView, activityEndDateFilter, activityEventTypeFilter, activityLogPage, activityStartDateFilter, refreshKey, selectedStaff?.id, tenantId])

  const hasTenantQuota = Boolean(tenantDetail)
  const isStaffQuotaUnlimited = staffAccountLimit.unlimited ?? (Boolean(tenantDetail?.userQuotaUnlimited) || Boolean(tenantPlan?.staffAccountUnlimited) || (hasTenantQuota && (tenantDetail?.userQuotaLimit || 0) <= 0))
  const staffAccountCount = staffAccountLimit.used ?? tenantDetail?.userQuotaUsed ?? staffAccountList.length
  const maxStaffQuota = isStaffQuotaUnlimited
    ? Math.max(staffAccountCount, 1)
    : staffAccountLimit.limit || tenantDetail?.userQuotaLimit || tenantPlan?.maxStaffAccount || 0
  const staffQuotaSummary = isStaffQuotaUnlimited ? 'Unlimited Seats' : `${staffAccountCount} / ${maxStaffQuota} Seats`
  const staffQuotaRingLabel = isStaffQuotaUnlimited ? String(staffAccountCount) : `${staffAccountCount}/${maxStaffQuota}`
  const remainingStaffSeats = Math.max(0, maxStaffQuota - staffAccountCount)
  const staffQuotaDescription = isStaffQuotaUnlimited
    ? 'Your plan includes unlimited staff seats.'
    : `You have ${remainingStaffSeats} seat${remainingStaffSeats === 1 ? '' : 's'} available in your current plan. Optimize your team allocation now.`
  const isTenantInactive = isInactiveTenantStatus(tenantDetail?.status)
  const detailRouteStaffId = selectedStaffId || getTenantAdminStaffIdFromUrl(location.pathname)
  const selectedStaffMatchesDetailRoute = !detailRouteStaffId || selectedStaff?.id === detailRouteStaffId

  const guardTenantActive = () => {
    if (isActionLocked) {
      triggerToast?.(inactiveUserActionMessage, 'error')
      return false
    }

    if (!isTenantInactive) return true

    triggerToast?.(inactiveTenantActionMessage, 'error')
    return false
  }

  const handleActionError = (error: unknown, fallbackMessage: string) => {
    if (isInactiveUserActionError(error)) {
      setIsActionLocked(true)
    }

    triggerToast?.(getAdminErrorMessage(error, fallbackMessage), 'error')
  }

  // Handlers
  const handleCreateStaffSubmit = async (payload: { fullName: string; email: string; role: string[]; status?: UserStatus }) => {
    if (!guardTenantActive()) return

    setStaffFormFieldErrors({})
    setIsSaving(true)
    try {
      await tenantAdminApi.createStaff({
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
        ...(payload.status ? { status: payload.status } : {}),
        ...(tenantId ? { tenantId } : {}),
      })
      triggerToast?.('Staff account created successfully.', 'success')
      setStaffPage(1)
      setStaffRoleFilter('all')
      setStaffStatusFilter('all')
      setStaffSearchQuery('')
      setDebouncedStaffSearchQuery('')
      setRefreshKey(prev => prev + 1)
      changeView('staffManagement')
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Error system. Please try again.')
      const fieldErrors = getStaffFormFieldErrors(error, message)

      if (Object.keys(fieldErrors).length > 0) {
        setStaffFormFieldErrors(fieldErrors)
      } else if (isInactiveUserActionError(error) || shouldToastHttpError(error)) {
        handleActionError(error, 'Error system. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateStaffSubmit = async (payload: { fullName: string; email: string; role: string[]; status: UserStatus }) => {
    if (!selectedStaff) return
    if (!guardTenantActive()) return

    setStaffFormFieldErrors({})
    setIsSaving(true)
    try {
      await tenantAdminApi.updateStaff(selectedStaff.id, {
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
        status: payload.status,
        ...(tenantId ? { tenantId } : {}),
      })
      triggerToast?.('Staff account updated successfully.', 'success')
      
      setSelectedStaff(prev => {
        if (!prev) return null
        const nextStaff = {
          ...prev,
          fullName: payload.fullName,
          userRole: payload.role.join(', '),
          status: payload.status,
        }
        saveSelectedStaff(nextStaff)
        return nextStaff
      })
      setStaffList((currentStaffList) => currentStaffList.map((staff) => (
        staff.id === selectedStaff.id
          ? {
            ...staff,
            fullName: payload.fullName,
            userRole: payload.role.join(', '),
            status: payload.status,
          }
          : staff
      )))
      setStaffAccountList((currentStaffList) => currentStaffList.map((staff) => (
        staff.id === selectedStaff.id
          ? {
            ...staff,
            fullName: payload.fullName,
            userRole: payload.role.join(', '),
            status: payload.status,
          }
          : staff
      )))

      setRefreshKey(prev => prev + 1)
      changeView('staffDetail', selectedStaff.id)
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Error system. Please try again.')
      const fieldErrors = getStaffFormFieldErrors(error, message)

      if (Object.keys(fieldErrors).length > 0) {
        setStaffFormFieldErrors(fieldErrors)
      } else if (isInactiveUserActionError(error) || shouldToastHttpError(error)) {
        handleActionError(error, 'Error system. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStaffConfirm = async () => {
    if (!deleteConfirmStaff) return
    if (!guardTenantActive()) {
      setDeleteConfirmStaff(null)
      return
    }

    setIsDeleting(true)
    try {
      await tenantAdminApi.deleteStaff(deleteConfirmStaff.id)
      triggerToast?.('Account permanently deleted.', 'success')
      setDeleteConfirmStaff(null)
      
      if (selectedStaff?.id === deleteConfirmStaff.id) {
        clearSelectedStaff()
        setSelectedStaff(null)
        changeView('staffManagement')
      }
      
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      if (isInactiveUserActionError(error) || shouldToastHttpError(error)) {
        handleActionError(error, 'Error system. Please try again.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClearActivityLogs = async () => {
    if (!selectedStaff) return
    if (!guardTenantActive()) return

    setIsClearingActivityLogs(true)
    try {
      await tenantAdminApi.deleteStaffActivityLogs(selectedStaff.id)
      triggerToast?.('Activity logs cleared successfully.', 'success')
      setActivityEventTypeFilter('')
      setActivityStartDateFilter('')
      setActivityEndDateFilter('')
      setActivityLogPage(1)
      setActivityLogs([])
      setRecentActivities([])
      setActivityLogPageCount(1)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      if (isInactiveUserActionError(error) || shouldToastHttpError(error)) {
        handleActionError(error, 'Failed to clear activity logs.')
      }
    } finally {
      setIsClearingActivityLogs(false)
    }
  }

  const handleToggleStatus = async (staff: StaffMember) => {
    if (!guardTenantActive()) {
      setStatusConfirmStaff(null)
      return
    }

    const nextStatus: UserStatus = staff.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const roles = staff.userRole ? staff.userRole.split(', ').map(r => r.trim() === 'HR' ? 'HR' : 'Interviewer') : ['HR']
    
    setIsSaving(true)
    try {
      await tenantAdminApi.updateStaff(staff.id, {
        fullName: staff.fullName,
        email: staff.email,
        role: roles,
        status: nextStatus,
        ...(tenantId ? { tenantId } : {}),
      })
      triggerToast?.(
        nextStatus === 'ACTIVE'
          ? `Account activated successfully. ${staff.fullName} can now log in.`
          : `Account deactivated successfully. ${staff.fullName} no longer has access.`,
        'success',
      )
      setStatusConfirmStaff(null)
      
      setSelectedStaff(prev => {
        if (!prev) return null
        const nextStaff = { ...prev, status: nextStatus }
        saveSelectedStaff(nextStaff)
        return nextStaff
      })
      setStaffList((currentStaffList) => currentStaffList.map((currentStaff) => (
        currentStaff.id === staff.id ? { ...currentStaff, status: nextStatus } : currentStaff
      )))
      setStaffAccountList((currentStaffList) => currentStaffList.map((currentStaff) => (
        currentStaff.id === staff.id ? { ...currentStaff, status: nextStatus } : currentStaff
      )))
      
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      if (isInactiveUserActionError(error) || shouldToastHttpError(error)) {
        handleActionError(error, 'Error system. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardShell navItems={navItems} subtitle="Tenant Admin" onLogout={onLogout} onChangePassword={() => changeView('settings')}>
      {activeView === 'settings' ? (
        <AccountSettingsPanel
          key={viewResetKeys.settings}
          isPasswordChangeRequired={isPasswordChangeRequired}
          onBack={() => changeView('dashboard')}
          triggerToast={triggerToast}
        />
      ) : activeView === 'staffCreate' ? (
        <CreateStaffAccountView
          key={viewResetKeys.staffCreate}
          staffList={staffAccountList}
          serverFieldErrors={staffFormFieldErrors}
          onHome={() => changeView('dashboard')}
          onCancel={() => changeView('staffManagement')}
          onConfirm={handleCreateStaffSubmit}
          isSubmitting={isSaving}
          isActionLocked={isActionLocked}
        />
      ) : activeView === 'staffEdit' ? (
        selectedStaff ? (
          <EditStaffAccountView
            key={`${selectedStaff.id}-${viewResetKeys.staffEdit}`}
            staffMember={selectedStaff}
            staffList={staffAccountList}
            serverFieldErrors={staffFormFieldErrors}
            onHome={() => changeView('dashboard')}
            onStaffManagement={() => changeView('staffManagement')}
            onCancel={() => changeView('staffDetail', selectedStaff.id)}
            onConfirm={handleUpdateStaffSubmit}
            isSubmitting={isSaving}
            isActionLocked={isActionLocked}
          />
        ) : (
          <div className="role-content staff-management-content">
            <div className="tenant-list-table-state">Select a staff account before editing.</div>
          </div>
        )
      ) : (activeView === 'staffDetail' || activeView === 'staffActivityLog') && (isLoadingStaffDetail || (detailRouteStaffId && !selectedStaffMatchesDetailRoute && !staffDetailError)) ? (
        <div className="role-content staff-management-content">
          <div className="tenant-list-table-state">Loading staff details...</div>
        </div>
      ) : activeView === 'staffDetail' && staffDetailError ? (
        <div className="role-content staff-management-content">
          <div className="tenant-list-table-state error">{staffDetailError}</div>
          <button type="button" className="tenant-create-btn" onClick={() => changeView('staffManagement')}>
            Back to Staff Management
          </button>
        </div>
      ) : activeView === 'staffDetail' && selectedStaff && selectedStaffMatchesDetailRoute ? (
        <StaffDetailView
          key={`${selectedStaff.id}-${viewResetKeys.staffDetail}`}
          staffMember={selectedStaff}
          recentActivities={recentActivities}
          isLoadingActivities={isLoadingActivities}
          activityError={activityError}
          onHome={() => changeView('dashboard')}
          onBack={() => changeView('staffManagement')}
          onEdit={() => {
            if (!guardTenantActive()) return
            changeView('staffEdit', selectedStaff.id)
          }}
          onDelete={() => {
            if (!guardTenantActive()) return
            setDeleteConfirmStaff(selectedStaff)
          }}
          onToggleStatus={() => {
            if (!guardTenantActive()) return
            setStatusConfirmStaff(selectedStaff)
          }}
          onViewLogs={() => {
            setActivityLogPage(1)
            changeView('staffActivityLog', selectedStaff.id)
          }}
          isActionLocked={isActionLocked}
        />
      ) : activeView === 'staffActivityLog' && selectedStaff && selectedStaffMatchesDetailRoute ? (
        <StaffActivityLogView
          key={`${selectedStaff.id}-${viewResetKeys.staffActivityLog}`}
          staffMember={selectedStaff}
          activityLogs={activityLogs}
          isLoadingActivities={isLoadingActivities}
          activityError={activityError}
          currentPage={activityLogPage}
          pageCount={activityLogPageCount}
          eventTypeFilter={activityEventTypeFilter}
          startDateFilter={activityStartDateFilter}
          endDateFilter={activityEndDateFilter}
          isClearingActivityLogs={isClearingActivityLogs}
          onHome={() => changeView('dashboard')}
          onStaffManagement={() => changeView('staffManagement')}
          onBack={() => changeView('staffDetail', selectedStaff.id)}
          onPageChange={setActivityLogPage}
          onEventTypeFilterChange={(value) => {
            setActivityEventTypeFilter(value)
            setActivityLogPage(1)
          }}
          onStartDateFilterChange={(value) => {
            setActivityStartDateFilter(value)
            setActivityLogPage(1)
          }}
          onEndDateFilterChange={(value) => {
            setActivityEndDateFilter(value)
            setActivityLogPage(1)
          }}
          onClearFilters={handleClearActivityLogs}
        />
      ) : (activeView === 'staffDetail' || activeView === 'staffActivityLog') ? (
        <div className="role-content staff-management-content">
          <div className="tenant-list-table-state">Select a staff account before viewing details.</div>
          <button type="button" className="tenant-create-btn" onClick={() => changeView('staffManagement')}>
            Back to Staff Management
          </button>
        </div>
      ) : activeView === 'staffManagement' ? (
        <StaffManagementView 
          key={viewResetKeys.staffManagement}
          staffList={staffList}
          isLoading={isLoadingStaff || isLoadingTenantDetail}
          error={staffError}
          maxStaffQuota={maxStaffQuota}
          isStaffQuotaUnlimited={isStaffQuotaUnlimited}
          staffAccountCount={staffAccountCount}
          onCreate={() => {
            if (!guardTenantActive()) return
            clearSelectedStaff()
            setSelectedStaff(null)
            setStaffFormFieldErrors({})
            changeView('staffCreate')
          }}
          onEdit={(staff) => {
            if (!guardTenantActive()) return
            saveSelectedStaff(staff)
            setSelectedStaff(staff)
            setStaffFormFieldErrors({})
            changeView('staffEdit', staff.id)
          }}
          onDelete={(staff) => {
            if (!guardTenantActive()) return
            setDeleteConfirmStaff(staff)
          }}
          onSelectStaff={(staff) => {
            saveSelectedStaff(staff)
            setSelectedStaff(staff)
            loadStaffDetail(staff.id, staff)
            changeView('staffDetail', staff.id)
          }}
          onHome={() => changeView('dashboard')}
          currentPage={staffPage}
          pageCount={staffPageCount}
          onPageChange={setStaffPage}
          roleFilter={staffRoleFilter}
          statusFilter={staffStatusFilter}
          searchQuery={staffSearchQuery}
          onRoleFilterChange={setStaffRoleFilter}
          onStatusFilterChange={setStaffStatusFilter}
          onSearchQueryChange={setStaffSearchQuery}
          isActionLocked={isActionLocked}
        />
      ) : (
      <div key={viewResetKeys.dashboard} className="role-content">
        <div className="role-metrics four tenant-dashboard-metrics">
          <MetricCard icon="fa-briefcase" label="Active Job Postings" value="24" note="+12%" />
          <MetricCard icon="fa-users" label="Total Applicants" value="842" note="+340" />
          <MetricCard icon="fa-clock" label="Time-to-Hire" value="18 Days" note="-3d" />
          <MetricCard icon="fa-calendar-check" label="Interviews Today" value="5" note="Today" />
        </div>

        <div className="tenant-dashboard-grid">
          <div className="tenant-dashboard-top">
            <section className="role-panel funnel-panel">
              <div className="role-panel-head">
                <div>
                  <h2>Recruitment Funnel</h2>
                  <p>Applicant conversion through hiring stages</p>
                </div>
                <a href="#reports">View Detailed Report <i className="fa-solid fa-arrow-right"></i></a>
              </div>
              {[
                ['Applied', '143', '98%'],
                ['Screening', '89', '65%'],
                ['Shortlisted', '42', '29%'],
                ['Interviewing', '21', '15%'],
                ['Offered', '6', '5%'],
              ].map(([label, value, width]) => (
                <div className="funnel-row" key={label}>
                  <div><span>{label}</span><strong>{value}</strong></div>
                  <span className="funnel-track"><span style={{ width }} /></span>
                </div>
              ))}
            </section>

            <div className="tenant-dashboard-top-side">
              <section className={`role-panel quota-panel ${isStaffQuotaUnlimited ? 'quota-panel-unlimited' : ''}`}>
                <div className="role-panel-head"><h2>Staff Quota</h2><small>{staffQuotaSummary}</small></div>
                <div className="quota-ring"><strong>{staffQuotaRingLabel}</strong><span>Used</span></div>
                <p>{staffQuotaDescription}</p>
              </section>
            </div>
          </div>

          <div className="tenant-dashboard-bottom">
            <section className="role-panel interview-list">
              <div className="role-panel-head">
                <div><h2>Upcoming Interviews</h2><p>Scheduled for today & tomorrow</p></div>
                <i className="fa-solid fa-ellipsis-vertical"></i>
              </div>
              {[
                { initials: 'SJ', name: 'Sarah Jenkins', role: 'Senior DevOps Engineer', interviewer: 'David Chen', time: '10:00 AM', wait: 'In 45 mins' },
                { initials: 'MT', name: 'Marcus Thorne', role: 'Product Manager', interviewer: 'Elena Rodriguez', time: '02:30 PM', wait: 'Today' },
              ].map((item) => (
                <article key={item.name}>
                  <span className="role-avatar">{item.initials}</span>
                  <div className="interview-candidate">
                    <strong>{item.name}</strong>
                    <small>{item.role}</small>
                  </div>
                  <div className="interview-interviewer">
                    <small>Interviewer</small>
                    <strong>{item.interviewer}</strong>
                  </div>
                  <em>
                    {item.time}
                    <small>{item.wait}</small>
                  </em>
                </article>
              ))}
            </section>

            <section className="role-panel insights-panel">
              <h2>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19Z" fill="#F24E1E" />
                </svg>
                AI Insights (DSS)
              </h2>
              <div className="tag-list">
                <span>Cloud Architecture <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>
                <span>Go Lang <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>
                <span className="tag-muted">Data Security</span>
              </div>
              <small>Difficult to fill positions</small>
              <div className="insight-row"><span>Senior DevOps Engineer</span><strong>43 Days Open</strong></div>
              <div className="insight-row"><span>ML Ops Specialist</span><strong>31 Days Open</strong></div>
              <button type="button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g clipPath="url(#ai-report-chart-icon)">
                    <path d="M15 10H12V3H15V10ZM0 8H3V13H0V8ZM11 12H10V13H8V0H11V12ZM4 3H7V13H4V3ZM16 13V14H14V16H13V14H11V13H13V11H14V13H16Z" fill="#0B1C30" fillOpacity="0.9" />
                  </g>
                  <defs>
                    <clipPath id="ai-report-chart-icon">
                      <rect width="16" height="16" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                View full AI report <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </button>
            </section>
          </div>
        </div>
      </div>
      )}

      {deleteConfirmStaff && (
        <ConfirmActionModal
          isSubmitting={isDeleting}
          title="Confirm Action"
          message={`Are you sure you want to permanently delete ${deleteConfirmStaff.fullName}'s account? This action cannot be undone. All role assignments will be removed.`}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          submittingLabel="Confirming..."
          onCancel={() => setDeleteConfirmStaff(null)}
          onConfirm={handleDeleteStaffConfirm}
        />
      )}
      {statusConfirmStaff && (
        <ConfirmActionModal
          isSubmitting={isSaving}
          title="Confirm Action"
          message={
            statusConfirmStaff.status === 'ACTIVE'
              ? `Are you sure you want to deactivate ${statusConfirmStaff.fullName}'s account? They will lose access immediately and any active session will be terminated.`
              : `Are you sure you want to activate ${statusConfirmStaff.fullName}'s account? They will be able to log in immediately.`
          }
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          submittingLabel="Confirming..."
          onCancel={() => setStatusConfirmStaff(null)}
          onConfirm={() => handleToggleStatus(statusConfirmStaff)}
        />
      )}
    </DashboardShell>
  )
}
