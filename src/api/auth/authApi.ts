import axiosClient from '../client/axiosClient'
import type { ChangePasswordPayload, LoginPayload, RegisterPayload } from '@/features/auth/types/auth.types'
import { buildChangePasswordPayload, buildRegisterPayload } from './authPayload'

export const authApi = {
  async login(payload: LoginPayload) {
    // Trả về định dạng phản hồi từ Backend AuthResponse
    return axiosClient.post('/api/auth/signin', payload)
  },

  async logout(refreshToken?: string) {
    return axiosClient.post('/api/auth/logout', refreshToken ? { refresh_token: refreshToken, refreshToken } : {})
  },

  async register(payload: RegisterPayload) {
    return axiosClient.post('/api/auth/signup', buildRegisterPayload(payload))
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
    return axiosClient.post('/api/auth/change-password', buildChangePasswordPayload(payload))
  },
}
