import axios from 'axios'
import { setupAxiosInterceptors } from './axiosInterceptors'

export function resolveApiBaseUrl(backendUrl = import.meta.env.VITE_BACKEND_API_URL) {
  const normalizedUrl = String(backendUrl ?? '').trim()

  if (normalizedUrl) {
    return normalizedUrl.replace(/\/+$/, '')
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return 'http://localhost:8080'
}

const API_URL = resolveApiBaseUrl()

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

setupAxiosInterceptors(axiosClient, refreshClient)

export default axiosClient
