import type { StaffAccountLimit, StaffMember } from '../domain/tenantApi.types'
import { normalizeUserStatus } from '../domain/tenantStaffStatus'
import { normalizeTenantAdminUser } from './tenantMappers'

export function getStaffListItems(payload: any): any[] {
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

export function readFiniteNumber(payload: any, keys: string[]) {
  for (const key of keys) {
    const value = payload?.[key]
    const numberValue = Number(value)

    if (value !== undefined && value !== null && Number.isFinite(numberValue)) {
      return numberValue
    }
  }

  return undefined
}

export function readBooleanFlag(payload: any, keys: string[]) {
  for (const key of keys) {
    const value = payload?.[key]

    if (typeof value === 'boolean') return value

    const normalized = String(value ?? '').trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true
    if (['false', '0', 'no', 'n'].includes(normalized)) return false
  }

  return undefined
}

export function getStaffAccountLimitPayload(payload: any): any {
  const body = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  return body?.data && typeof body.data === 'object' ? body.data : body
}

export function normalizeStaffAccountLimit(payload: any): StaffAccountLimit {
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

export function normalizeStaffMember(user: any): StaffMember | null {
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
