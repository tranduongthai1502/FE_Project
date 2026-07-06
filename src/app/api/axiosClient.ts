import axios from 'axios'

//const API_URL = 'https://modifications-casting-discover-mesh.trycloudflare.com'
 const API_URL = 'https://breakfast-town-html-integrity.trycloudflare.com'

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
    const status = error.response?.status ?? 0

    if (status === 401) {
      localStorage.removeItem('access_token')
      sessionStorage.removeItem('access_token')
    }

    return Promise.reject(Object.assign(new Error(message), { status }))
  }
)

export default axiosClient
