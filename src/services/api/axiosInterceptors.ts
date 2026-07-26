import type { AxiosInstance } from 'axios'
import { AUTH_EXPIRED_EVENT_NAME, clearAuthStorage } from './authStorage'
import {
  buildAxiosErrorInfo,
  buildSuccessFalseErrorInfo,
  createAppError,
  getHttpStatusFallbackMessage,
} from './axiosErrorHandler'

let refreshTokenRequest: Promise<string> | null = null

function getStoredToken(key: 'access_token' | 'refresh_token') {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
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

      if (errorInfo.status === 403 && !isAuthEndpoint(originalRequest?.url || '')) {
        clearAuthStorage()
        notifyAuthExpired(errorInfo.message || getHttpStatusFallbackMessage(403))
        return Promise.reject(createAppError(errorInfo))
      }

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

      return Promise.reject(createAppError(errorInfo))
    }
  )
}
