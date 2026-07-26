import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Toast } from '@/components/common/Toast'
import { useAuthSession } from '@/features/auth'
import { useToast } from '@/hooks/useToast'
import { ProtectedRoute } from './ProtectedRoute'
import { RouteConfig, type AppPage } from './RouteConfig'

function AppRouteContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast, toastFadeOut, toastMessage, toastType, triggerToast } = useToast()
  const {
    currentRole,
    defaultPath,
    handleLogout,
    handleSignInSuccess,
    loginRedirect,
    requirePasswordChange,
  } = useAuthSession(navigate, triggerToast)

  const toast = <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />

  const protect = (page: AppPage, element: ReactElement) => (
    <ProtectedRoute allowedRole={page} currentRole={currentRole} fallback={<Navigate to="/login" replace />}>
      {requirePasswordChange && page === 'tenantAdmin' && location.pathname !== '/tenant-admin/settings' ? (
        <Navigate to="/tenant-admin/settings" replace />
      ) : (
        element
      )}
    </ProtectedRoute>
  )

  return (
    <>
      {toast}
      <RouteConfig
        defaultPath={defaultPath}
        loginRedirect={loginRedirect}
        navigate={navigate}
        onLogout={handleLogout}
        onSignInSuccess={handleSignInSuccess}
        protect={protect}
        triggerToast={triggerToast}
      />
    </>
  )
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AppRouteContent />
    </BrowserRouter>
  )
}
