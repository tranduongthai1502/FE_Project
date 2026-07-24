import axios from 'axios'
import { AUTH_EXPIRED_EVENT_NAME, clearAuthStorage } from '@/features/auth'

const API_URL = import.meta.env.VITE_BACKEND_API_URL

const refreshClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshTokenRequest: Promise<string> | null = null

export function getStoredToken(key: 'access_token' | 'refresh_token') {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
}

function getAuthStorage() {
  return localStorage.getItem('refresh_token') ? localStorage : sessionStorage
}

export function notifyAuthExpired(message?: string) {
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

export function getRefreshTokenRequest() {
  if (!refreshTokenRequest) {
    refreshTokenRequest = refreshAccessToken().finally(() => {
      refreshTokenRequest = null
    })
  }

  return refreshTokenRequest
}

export function expireAuthSession(message?: string) {
  clearAuthStorage()
  notifyAuthExpired(message)
}

export function isAuthEndpoint(url = '') {
  return /^\/?api\/auth\//.test(url)
}
