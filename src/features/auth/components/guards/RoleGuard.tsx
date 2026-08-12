import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { AppRole } from '@/features/auth/types/role.types'
import { ProtectedRoute } from './ProtectedRoute'

type RoleGuardProps = {
  children: ReactElement
  currentRole: AppRole | null
  page: AppRole
  requirePasswordChange: boolean
}

const requiredPasswordChangePathByPage: Partial<Record<AppRole, string>> = {
  tenantAdmin: '/tenant-admin/settings',
  hr: '/hr/settings',
  interviewer: '/interviewer/settings',
}

export function RoleGuard({ children, currentRole, page, requirePasswordChange }: RoleGuardProps) {
  const location = useLocation()
  const passwordChangePath = requiredPasswordChangePathByPage[page]
  const shouldRedirectToPasswordChange =
    requirePasswordChange && passwordChangePath && location.pathname !== passwordChangePath

  return (
    <ProtectedRoute allowedRole={page} currentRole={currentRole} fallback={<Navigate to="/login" replace />}>
      {shouldRedirectToPasswordChange ? <Navigate to={passwordChangePath} replace /> : children}
    </ProtectedRoute>
  )
}
