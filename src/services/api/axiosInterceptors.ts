import type { AxiosInstance } from 'axios'
import { AUTH_EXPIRED_EVENT_NAME, clearAuthStorage, getStoredAuthRole } from './authStorage'
import {
  buildAxiosErrorInfo,
  buildSuccessFalseErrorInfo,
  createAppError,
} from './axiosErrorHandler'

let refreshTokenRequest: Promise<string> | null = null

function getStoredToken(key: 'access_token' | 'refresh_token') {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
}

function hasStoredToken() {
  return Boolean(getStoredToken('access_token') || getStoredToken('refresh_token'))
}

function getAuthStorage() {
  return localStorage.getItem('refresh_token') ? localStorage : sessionStorage
}

function notifyAuthExpired(message?: string) {
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT_NAME, {
    detail: { message },
  }))
}

function getAuthResponsePayload(response: any) {
  const payload = response?.data && typeof response.data === 'object' ? response.data : response
  return payload?.data && typeof payload.data === 'object' ? payload.data : payload
}

function getAccessToken(payload: any) {
  return payload?.token || payload?.access_token || payload?.accessToken || payload?.jwt || ''
}

function getRefreshToken(payload: any) {
  return payload?.refresh_token || payload?.refreshToken || ''
}

async function refreshAccessToken(refreshClient: AxiosInstance) {
  const refreshToken = getStoredToken('refresh_token')
  if (!refreshToken) return ''

  const response = await refreshClient.post('/api/auth/refresh-token', {
    refreshToken,
  })
  const payload = getAuthResponsePayload(response.data)
  const nextAccessToken = getAccessToken(payload)
  const nextRefreshToken = getRefreshToken(payload)

  if (!nextAccessToken) return ''

  const storage = getAuthStorage()
  storage.setItem('access_token', nextAccessToken)
  if (nextRefreshToken) {
    storage.setItem('refresh_token', nextRefreshToken)
  }

  return nextAccessToken
}

function getRefreshTokenRequest(refreshClient: AxiosInstance) {
  if (!refreshTokenRequest) {
    refreshTokenRequest = refreshAccessToken(refreshClient).finally(() => {
      refreshTokenRequest = null
    })
  }

  return refreshTokenRequest
}

function isAuthEndpoint(url = '') {
  return /^\/?api\/auth\//.test(url)
}

function normalizeRole(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/^role_/, '')
}

function getStoredUserRoles() {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return []

  try {
    const user = JSON.parse(rawUser)
    const roleValues = [
      user?.role,
      user?.roleName,
      user?.role_name,
      user?.userRole,
      user?.user_role,
      user?.type,
      ...(Array.isArray(user?.roles) ? user.roles : []),
      ...(Array.isArray(user?.userRoles) ? user.userRoles : []),
      ...(Array.isArray(user?.authorities) ? user.authorities : []),
    ]

    return roleValues.flatMap((role) => String(role ?? '').split(/[,;/|]+/)).map(normalizeRole).filter(Boolean)
  } catch {
    return []
  }
}

function isStaffAccountSession() {
  const storedRole = getStoredAuthRole()
  const userRoles = getStoredUserRoles()

  return (
    storedRole === 'hr' ||
    storedRole === 'interviewer' ||
    userRoles.includes('hr') ||
    userRoles.includes('interviewer') ||
    userRoles.includes('tenant_hr') ||
    userRoles.includes('tenant_interviewer')
  )
}

function isStaffManagementContext(url = '') {
  const pathname = window.location.pathname

  return (
    pathname.startsWith('/tenant-admin/staff-management') ||
    /^\/?api\/user\/staff(?:\/|$)/.test(url) ||
    /^\/?api\/activity-log\/staff(?:\/|$)/.test(url)
  )
}

function shouldLogoutOnForbidden(url = '') {
  const pathname = window.location.pathname

  return (
    isStaffAccountSession() ||
    pathname.startsWith('/hr') ||
    pathname.startsWith('/interviewer') ||
    isStaffManagementContext(url)
  )
}

export function setupAxiosInterceptors(axiosClient: AxiosInstance, refreshClient: AxiosInstance) {
  axiosClient.interceptors.request.use(
    (config) => {
      const token = getStoredToken('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  axiosClient.interceptors.response.use(
    (response) => {
      if (response.config.responseType === 'blob') {
        return response
      }

      const responseData = response.data

      if (responseData && typeof responseData === 'object') {
        Object.defineProperty(responseData, 'httpStatus', {
          value: response.status,
          enumerable: false,
          configurable: true,
        })

        if (responseData.success === false && !isAuthEndpoint(response.config.url || '')) {
          return Promise.reject(createAppError(buildSuccessFalseErrorInfo(responseData, response.status)))
        }

        return responseData
      }

      return {
        data: responseData,
        httpStatus: response.status,
      }
    },
    async (error) => {
      const errorInfo = buildAxiosErrorInfo(error)
      const originalRequest = error.config

      if (errorInfo.status === 401 && originalRequest && !originalRequest._retry && !errorInfo.hasBackendMessage && !isAuthEndpoint(originalRequest.url || '') && getStoredToken('refresh_token')) {
        originalRequest._retry = true

        try {
          const token = await getRefreshTokenRequest(refreshClient)
          if (token) {
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosClient(originalRequest)
          }
        } catch {
          // Fall through to clearing tokens and returning the original auth error.
        }

        clearAuthStorage()
        notifyAuthExpired()
      }

      if (errorInfo.status === 403 && originalRequest && !isAuthEndpoint(originalRequest.url || '') && hasStoredToken() && shouldLogoutOnForbidden(originalRequest.url || '')) {
        clearAuthStorage()
        notifyAuthExpired('Your account no longer has permission to access this page. Please log in again.')
      }

      return Promise.reject(createAppError(errorInfo))
    }
  )
}
