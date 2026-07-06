import axios from 'axios'

// const API_URL = 'https://modifications-casting-discover-mesh.trycloudflare.com'
const API_URL = import.meta.env.VITE_BACKEND_API_URL
// const API_URL = 'http://localhost:8080'

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

function getStoredToken(key: 'access_token' | 'refresh_token') {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
}

function getAuthStorage() {
  return localStorage.getItem('refresh_token') ? localStorage : sessionStorage
}

function clearAuthTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
}

function getAuthResponsePayload(response: any) {
  return response?.data && typeof response.data === 'object' ? response.data : response
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
    refresh_token: refreshToken,
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
    const message = error.response?.data?.message || error.message || 'An error occurred'
    const status = error.response?.status ?? 0
    const originalRequest = error.config

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const token = await refreshAccessToken()
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosClient(originalRequest)
        }
      } catch {
        // Fall through to clearing tokens and returning the original auth error.
      }

      clearAuthTokens()
    }

    return Promise.reject(Object.assign(new Error(message), { status }))
  }
)

export default axiosClient
