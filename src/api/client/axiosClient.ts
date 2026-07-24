import axios from 'axios'
import { expireAuthSession, getRefreshTokenRequest, getStoredToken, isAuthEndpoint } from '@/api/auth/authSession'
import { getAppErrorMessage, hasBackendErrorMessage } from '@/utils/errorManager'
import { getHttpStatusMessage } from '@/utils/httpStatusManager'

const API_URL = import.meta.env.VITE_BACKEND_API_URL

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
        const message = getAppErrorMessage(responseData, getErrorMessage(responseData, getHttpStatusMessage(response.status)))
        const backendMessage = String(responseData.message || responseData.data?.message || '')
        const code = getErrorCode(responseData) || (/^[a-z][a-z0-9_-]+$/i.test(backendMessage) ? backendMessage : '')
        return Promise.reject(Object.assign(new Error(message), {
          status: response.status,
          code,
          backendMessage,
          errorData: responseData,
          hasBackendMessage: Boolean(responseData.message || responseData.data?.message),
          isAppErrorMessage: true,
        }))
      }

      return responseData
    }

    return {
      data: responseData,
      httpStatus: response.status,
    }
  },
  async (error) => {
    const errorData = error.response?.data
    const backendMessage = String(errorData?.message || errorData?.data?.message || '')
    const code = getErrorCode(errorData) || (/^[a-z][a-z0-9_-]+$/i.test(backendMessage) ? backendMessage : '')
    const status = error.response?.status ?? 0
    const hasBackendMessage = hasBackendErrorMessage(error)
    const message = getAppErrorMessage(error, getErrorMessage(errorData, getHttpStatusMessage(status)))
    const originalRequest = error.config

    if (status === 403 && !isAuthEndpoint(originalRequest?.url || '')) {
      expireAuthSession(message || getHttpStatusMessage(403))
      return Promise.reject(Object.assign(new Error(message), { status, code, backendMessage, errorData, hasBackendMessage, isAppErrorMessage: true }))
    }

    if (status === 401 && originalRequest && !originalRequest._retry && !hasBackendMessage && !isAuthEndpoint(originalRequest.url || '') && getStoredToken('refresh_token')) {
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

      expireAuthSession()
    }

    return Promise.reject(Object.assign(new Error(message), { status, code, backendMessage, errorData, hasBackendMessage, isAppErrorMessage: true }))
  }
)

export default axiosClient
