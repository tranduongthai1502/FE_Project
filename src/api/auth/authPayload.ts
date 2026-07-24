import type { ChangePasswordPayload, RegisterPayload } from '@/features/auth/types/auth.types'

export function buildRegisterPayload(payload: RegisterPayload) {
  return {
    email: payload.email,
    password: payload.password,
    fullName: payload.fullName,
    phone: payload.phone,
  }
}

export function buildChangePasswordPayload(payload: ChangePasswordPayload) {
  return {
    oldPassword: payload.currentPassword,
    newPassword: payload.newPassword,
  }
}
