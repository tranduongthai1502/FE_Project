import type { UserStatus } from './tenantApi.types'

export function isInactiveTenantStatus(status?: string) {
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

export function normalizeUserStatus(value?: string): UserStatus | null {
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
