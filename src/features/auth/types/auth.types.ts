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
