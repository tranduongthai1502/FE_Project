import axios from 'axios'
import { AUTH_EXPIRED_EVENT_NAME, clearAuthStorage } from '@/features/auth'
import { getAppErrorMessage, hasBackendErrorMessage } from '@/utils/errorManager'
import { getHttpStatusMessage } from '@/utils/httpStatusManager'

const API_URL = import.meta.env.VITE_BACKEND_API_URL

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshTokenRequest: Promise<string> | null = null

function getStoredToken(key: 'access_token' | 'refresh_token') {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
}

function getAuthStorage() {
  return localStorage.getItem('refresh_token') ? localStorage : sessionStorage
}

function notifyAuthExpired() {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT_NAME))
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

function getErrorMessage(errorData: any, fallbackMessage: string) {
  return (
    errorData?.message ||
    errorData?.data?.message ||
    fallbackMessage ||
    'An error occurred'
  )
}

function getErrorCode(errorData: any) {
  return (
    errorData?.code ||
    errorData?.errorCode ||
    errorData?.data?.code ||
    errorData?.data?.errorCode ||
    errorData?.error ||
    ''
  )
}

async function refreshAccessToken() {
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

function getRefreshTokenRequest() {
  if (!refreshTokenRequest) {
    refreshTokenRequest = refreshAccessToken().finally(() => {
      refreshTokenRequest = null
    })
  }

  return refreshTokenRequest
}

function isAuthEndpoint(url = '') {
  return /^\/?api\/auth\//.test(url)
}

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

      return responseData
    }

    return {
      data: responseData,
      httpStatus: response.status,
    }
  },
  async (error) => {
    const errorData = error.response?.data
    const code = getErrorCode(errorData)
    const status = error.response?.status ?? 0
    const hasBackendMessage = hasBackendErrorMessage(error)
    const message = getAppErrorMessage(error, getErrorMessage(errorData, getHttpStatusMessage(status)))
    const originalRequest = error.config

    if ((status === 401 || status === 403) && originalRequest && !originalRequest._retry && !hasBackendMessage && !isAuthEndpoint(originalRequest.url || '') && getStoredToken('refresh_token')) {
      originalRequest._retry = true

      try {
        const token = await getRefreshTokenRequest()
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

    return Promise.reject(Object.assign(new Error(message), { status, code, hasBackendMessage, isAppErrorMessage: true }))
  }
)

export default axiosClient
