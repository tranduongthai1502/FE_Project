import axios from 'axios'
import { setupAxiosInterceptors } from './axiosInterceptors'

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

setupAxiosInterceptors(axiosClient, refreshClient)

export default axiosClient
