import axiosClient from '../../../app/api/axiosClient'

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  fullName: string
  email: string
  phone: string
  password: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export const authApi = {
  async login(payload: LoginPayload) {
    // Trả về định dạng phản hồi từ Backend AuthResponse
    return axiosClient.post('/api/auth/signin', payload)
  },

  async logout(refreshToken?: string) {
    return axiosClient.post('/api/auth/logout', refreshToken ? { refresh_token: refreshToken } : {})
  },

  async refreshToken(refreshToken: string) {
    return axiosClient.post('/api/auth/refresh-token', {
      refresh_token: refreshToken,
      refreshToken,
    })
  },

  async register(payload: RegisterPayload) {
    // Chuyển đổi sang snake_case cho trường full_name
    const backendPayload = {
      email: payload.email,
      password: payload.password,
      full_name: payload.fullName,
      phone: payload.phone,
    }
    return axiosClient.post('/api/auth/signup', backendPayload)
  },

  async sendResetCode(email: string) {
    return axiosClient.post('/api/auth/forgot-password', { email })
  },

  async verifyOtp(email: string, otp: string) {
    return axiosClient.post('/api/auth/check-otp', { email, otp })
  },

  async resetPassword(email: string, otp: string, password: string) {
    return axiosClient.post('/api/auth/reset-password', { email, otp, newPassword: password })
  },

  async changePassword(payload: ChangePasswordPayload) {
    return axiosClient.post('/api/auth/change-password', {
      oldPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    })
  },
}
