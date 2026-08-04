import { getStoredRequirePasswordChange } from '@/core/api/authStorage'
import { getStoredDashboardUser, isStoredCurrentUserInactive } from '@/features/auth'
import type { TenantAdminSession } from '../application/tenantAdminSession'

export const tenantAdminSessionStorage: TenantAdminSession = {
  getDashboardUser: getStoredDashboardUser,
  isPasswordChangeRequired: getStoredRequirePasswordChange,
  isCurrentUserInactive: isStoredCurrentUserInactive,
}
