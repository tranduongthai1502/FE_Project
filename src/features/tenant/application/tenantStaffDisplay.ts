import type { StaffMember } from '../domain/tenantApi.types'

export function getStaffInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'U'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

export function getStaffRoleList(staffMember: StaffMember) {
  return staffMember.userRole
    ? staffMember.userRole.split(',').map((role) => role.trim()).filter(Boolean)
    : []
}

export function formatStaffDate(dateStr?: string, fallback = '-') {
  if (!dateStr) return fallback

  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatRelativeStaffActivityDate(dateStr?: string) {
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

export function getActivityIconType(eventType: string | undefined, index: number) {
  const normalized = String(eventType || '').trim().toLowerCase()
  if (normalized.includes('auth') || normalized.includes('login') || normalized.includes('password')) return 'login'
  if (normalized.includes('assign') || normalized.includes('user') || normalized.includes('staff') || normalized.includes('account')) return 'account'
  if (normalized.includes('setting') || normalized.includes('config') || normalized.includes('action')) return 'action'
  return ['action', 'account', 'login'][index % 3]
}
