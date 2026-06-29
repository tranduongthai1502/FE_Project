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

export const authApi = {
  async login(_payload: LoginPayload) {
    return { ok: true }
  },

  async register(_payload: RegisterPayload) {
    return { ok: true }
  },

  async sendResetCode(_email: string) {
    return { ok: true }
  },

  async verifyOtp(_otp: string) {
    return { ok: true }
  },

  async resetPassword(_password: string) {
    return { ok: true }
  },
}
