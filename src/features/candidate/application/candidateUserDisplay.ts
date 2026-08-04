import type { DashboardUser } from '@/features/auth'

export function getUserDisplayName(user: DashboardUser | null) {
  return user?.full_name || user?.fullName || user?.name || user?.email || 'Candidate'
}
