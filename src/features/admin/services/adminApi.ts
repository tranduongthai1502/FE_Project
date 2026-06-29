export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export const adminApi = {
  async changePassword(_payload: ChangePasswordPayload) {
    return { ok: true }
  },
}
