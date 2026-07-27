import { formatPlanDate } from './adminFormatters'

export function getTenantStatusMeta(statusValue: string) {
  const normalized = statusValue.trim().toLowerCase()
  const isActive = normalized === 'active' || normalized === 'activated' || normalized === 'enabled'
  const isPending = normalized === 'pending' || normalized === 'invited' || normalized === 'waiting_activation'
  const isInactive =
    normalized === 'inactive' ||
    normalized === 'in_active' ||
    normalized === 'not_active' ||
    normalized === 'not active' ||
    normalized === 'disabled' ||
    normalized === 'deactivated' ||
    normalized === 'suspended'

  if (isActive) {
    return { className: 'active', label: 'Active', isActive: true }
  }

  if (isPending) {
    return { className: 'pending', label: 'Pending', isActive: false }
  }

  if (isInactive) {
    return { className: 'inactive', label: 'Inactive', isActive: false }
  }

  return {
    className: 'inactive',
    label: statusValue ? statusValue.trim() : 'Inactive',
    isActive: false,
  }
}

export function formatTenantDate(value?: string) {
  return value ? formatPlanDate(value) || value : '-'
}

export function addDaysToDate(value: string | undefined, days: number) {
  if (!value) return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function getDaysRemainingLabel(expirationDate?: string) {
  if (!expirationDate || expirationDate === '-') return '-'

  const expirationTime = Date.parse(expirationDate)
  if (Number.isNaN(expirationTime)) return '-'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysRemaining = Math.ceil((expirationTime - today.getTime()) / 86_400_000)
  return `${Math.max(0, daysRemaining)} Day${Math.max(0, daysRemaining) === 1 ? '' : 's'}`
}

export function getUsagePercent(used: number, limit: number) {
  if (limit <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)))
}

export function formatDashboardPercent(value?: number) {
  if (value === undefined || value === null || !Number.isFinite(value)) return '...'

  return `${Number(value.toFixed(2)).toLocaleString()}%`
}

export function getRemainingLabel(remaining: number, noun: string, unlimited = false) {
  if (unlimited) return `Unlimited ${noun} available`
  return `${Math.max(0, remaining)} ${noun} ${Math.max(0, remaining) === 1 ? 'available' : 'available'}`
}
