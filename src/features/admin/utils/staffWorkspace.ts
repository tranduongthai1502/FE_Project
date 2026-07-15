import type { AppRole } from '@/features/auth'
import { saveAuthRole } from '@/features/auth/utils/authStorage'

function getStoredUser() {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

function normalizeRoleValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeRoleValue(item))
  }

  if (value && typeof value === 'object') {
    const roleObject = value as Record<string, unknown>
    return normalizeRoleValue(
      roleObject.role ||
        roleObject.name ||
        roleObject.roleName ||
        roleObject.role_name ||
        roleObject.authority ||
        roleObject.authorities ||
        roleObject.userRole ||
        roleObject.user_role,
    )
  }

  return String(value || '')
    .split(/[,;/|]+/)
    .map((role) => role.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/^role_/, ''))
    .filter(Boolean)
}

export function getStoredStaffRoles() {
  const user = getStoredUser() || {}
  const roleValues = [
    user.role,
    user.roles,
    user.userRole,
    user.userRoles,
    user.user_role,
    user.authorities,
    user.type,
  ].flatMap((value) => normalizeRoleValue(value))

  return Array.from(new Set(roleValues.filter((role) => role === 'hr' || role === 'interviewer')))
}

export function hasMultipleStaffWorkspaces() {
  return getStoredStaffRoles().length > 1
}

export function switchStaffWorkspace(targetRole: Extract<AppRole, 'hr' | 'interviewer'>) {
  const keepLoggedIn = Boolean(window.localStorage.getItem('access_token') || window.localStorage.getItem('refresh_token') || window.localStorage.getItem('user_info'))
  saveAuthRole(targetRole, keepLoggedIn)
  window.location.assign(targetRole === 'hr' ? '/hr' : '/interviewer')
}
