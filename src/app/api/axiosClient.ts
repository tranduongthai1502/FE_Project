import axios from 'axios'

const API_URL = 'http://localhost:8080'

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Tự động đính kèm JWT Token vào Header của các request tiếp theo
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

// Response Interceptor: Xử lý tập trung lỗi hoặc cấu trúc dữ liệu trả về
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về dữ liệu chính từ phản hồi của server
    return response.data
  },
  (error) => {
    // Xử lý các lỗi HTTP chung (ví dụ: 401 Unauthorized, 403 Forbidden...)
    const message = error.response?.data?.message || error.message || 'Đã có lỗi xảy ra'
    
    if (error.response?.status === 401) {
      // Có thể xử lý logout hoặc làm mới token tại đây
      localStorage.removeItem('access_token')
      sessionStorage.removeItem('access_token')
    }
    
    return Promise.reject(new Error(message))
  }
)

export default axiosClient
