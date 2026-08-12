import type { AppRole } from './role.types'

export type AuthUser = {
  email: string
  role: AppRole
  requirePasswordChange?: boolean
}
