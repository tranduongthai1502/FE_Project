import { formatPlanDate } from './adminFormatters'

export function getTenantStatusMeta(statusValue: string) {
  const normalized = statusValue.trim().toUpperCase()
  const isActive = normalized === 'ACTIVE'

  if (isActive) {
    return { className: 'active', label: 'Active', isActive: true }
  }

  return { className: 'inactive', label: 'Inactive', isActive: false }
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

  const expiration = new Date(expirationDate)
  if (Number.isNaN(expiration.getTime())) return '-'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiration.setHours(0, 0, 0, 0)

  const daysRemaining = Math.round((expiration.getTime() - today.getTime()) / 86_400_000)
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
