import axios from 'axios'

const API_URL = 'http://localhost:8080'

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
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
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred'

    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      sessionStorage.removeItem('access_token')
    }

    return Promise.reject(new Error(message))
  }
)

export default axiosClient
