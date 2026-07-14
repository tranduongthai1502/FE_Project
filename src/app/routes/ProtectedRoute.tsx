import type { ReactNode } from 'react'
import type { AppRole } from '@/features/auth'

type ProtectedRouteProps = {
  allowedRole: AppRole
  currentRole: AppRole | null
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ allowedRole, currentRole, children, fallback = null }: ProtectedRouteProps) {
  if (currentRole !== allowedRole) {
    return fallback
  }

  return children
}
