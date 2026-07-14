import type { AppRole } from './authRole'

export const AUTH_PAGE_STORAGE_KEY = 'jobfusion_auth_page'
export const AUTH_EXPIRED_EVENT_NAME = 'jobfusion:auth-expired'

const authStorageKeys = [
  AUTH_PAGE_STORAGE_KEY,
  'access_token',
  'refresh_token',
  'user_info',
] as const

export function getStoredAuthRole(): AppRole | null {
  const savedPage = window.localStorage.getItem(AUTH_PAGE_STORAGE_KEY) || window.sessionStorage.getItem(AUTH_PAGE_STORAGE_KEY)
  return isStoredAuthRole(savedPage) ? savedPage : null
}

export function saveAuthRole(role: AppRole, keepLoggedIn: boolean) {
  const storage = keepLoggedIn ? window.localStorage : window.sessionStorage
  storage.setItem(AUTH_PAGE_STORAGE_KEY, role)
}

export function clearAuthStorage() {
  authStorageKeys.forEach((key) => {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  })
}

function isStoredAuthRole(value: string | null): value is AppRole {
  return Boolean(
    value === 'candidate' ||
      value === 'tenantAdmin' ||
      value === 'superAdmin' ||
      value === 'hr' ||
      value === 'interviewer'
  )
}
