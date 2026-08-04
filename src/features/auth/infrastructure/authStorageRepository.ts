import {
  AUTH_EXPIRED_EVENT_NAME,
  AUTH_PAGE_STORAGE_KEY,
  clearAuthStorage,
  clearRequirePasswordChange,
  getStoredAuthRole,
  getStoredRequirePasswordChange,
  hasStoredAuthToken,
  saveAuthRole,
  saveRequirePasswordChange,
} from '@/core/api/authStorage'

export {
  AUTH_EXPIRED_EVENT_NAME,
  AUTH_PAGE_STORAGE_KEY,
  clearAuthStorage,
  clearRequirePasswordChange,
  getStoredAuthRole,
  getStoredRequirePasswordChange,
  hasStoredAuthToken,
  saveAuthRole,
  saveRequirePasswordChange,
}

export const rememberedEmailStorageKey = 'jobfusion_remembered_email'

export function getStoredUserInfo() {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export function getStoredRefreshToken() {
  return window.localStorage.getItem('refresh_token') || window.sessionStorage.getItem('refresh_token') || undefined
}

export function getRememberedEmail() {
  return window.localStorage.getItem(rememberedEmailStorageKey) || ''
}

export function saveRememberedEmail(email: string, shouldRemember: boolean) {
  if (shouldRemember) {
    window.localStorage.setItem(rememberedEmailStorageKey, email)
    return
  }

  window.localStorage.removeItem(rememberedEmailStorageKey)
}

export function saveLoginSession({
  keepLoggedIn,
  refreshToken,
  token,
  user,
}: {
  keepLoggedIn: boolean
  refreshToken: string
  token: string
  user: unknown
}) {
  const storage = keepLoggedIn ? window.localStorage : window.sessionStorage
  const inactiveStorage = keepLoggedIn ? window.sessionStorage : window.localStorage

  inactiveStorage.removeItem('access_token')
  inactiveStorage.removeItem('refresh_token')
  inactiveStorage.removeItem('user_info')
  inactiveStorage.removeItem(AUTH_PAGE_STORAGE_KEY)

  if (token) {
    storage.setItem('access_token', token)
  }
  if (refreshToken) {
    storage.setItem('refresh_token', refreshToken)
  }
  if (user) {
    storage.setItem('user_info', JSON.stringify(user))
  }
}
