import type { Tenant } from './adminApi.types'

export function getNormalizedTenantStatus(status?: string): string {
  return String(status || '').trim().toLowerCase()
}

export function isActiveTenant(tenant: Pick<Tenant, 'status'>): boolean {
  return getNormalizedTenantStatus(tenant.status) === 'active'
}

export function getDaysUntilExpiration(expirationDateStr?: string, nowMs: number = Date.now()): number | null {
  if (!expirationDateStr) return null
  const expiresAt = Date.parse(expirationDateStr)
  if (Number.isNaN(expiresAt)) return null

  return (expiresAt - nowMs) / (1000 * 60 * 60 * 24)
}

export function isTenantExpiringSoon(expirationDateStr?: string, thresholdDays = 30, nowMs: number = Date.now()): boolean {
  const days = getDaysUntilExpiration(expirationDateStr, nowMs)
  if (days === null) return false
  return days >= 0 && days <= thresholdDays
}

export function getTenantStatusBadgeClass(status?: string): 'active' | 'inactive' | 'suspended' {
  const normalized = getNormalizedTenantStatus(status)
  if (normalized === 'active') return 'active'
  if (normalized === 'suspended') return 'suspended'
  return 'inactive'
}
