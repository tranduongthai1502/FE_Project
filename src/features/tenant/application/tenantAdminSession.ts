import type { DashboardUser } from '@/features/auth'

export type TenantAdminSession = {
  getDashboardUser: () => DashboardUser | null
  isPasswordChangeRequired: () => boolean
  isCurrentUserInactive: () => boolean
}
