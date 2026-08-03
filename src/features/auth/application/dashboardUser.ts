import { getStoredUserInfo } from '../infrastructure/authStorageRepository'

export type DashboardUser = {
  full_name?: string | null
  fullName?: string | null
  name?: string | null
  email?: string | null
  avatar?: string | null
  role?: string | null
  roleName?: string | null
  role_name?: string | null
  userRole?: string | null
  user_role?: string | null
  type?: string | null
}

export function getStoredDashboardUser(): DashboardUser | null {
  return getStoredUserInfo()
}
