import axiosClient from '../../../api/axiosClient'
import type { ChangePasswordPayload, LoginPayload, RegisterPayload } from '../types/auth.types'

export const authApi = {
  async login(payload: LoginPayload) {
    // Trả về định dạng phản hồi từ Backend AuthResponse
    return axiosClient.post('/api/auth/signin', payload)
  },

  async logout(refreshToken?: string) {
    return axiosClient.post('/api/auth/logout', refreshToken ? { refresh_token: refreshToken, refreshToken } : {})
  },

  async register(payload: RegisterPayload) {
    const backendPayload = {
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
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
