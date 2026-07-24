import { useEffect, type ReactElement } from 'react'
import { BrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Toast } from '@/components/common/Toast'
import { passwordChangePathByAuthRole, useAuthSession } from '@/features/auth'
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

  useEffect(() => {
    if (!location.hash.startsWith('#/')) {
      return
    }

    navigate(location.hash.slice(1), { replace: true })
  }, [location.hash, navigate])

  const protect = (page: AppPage, element: ReactElement) => {
    const passwordChangePath = page === 'candidate' ? null : passwordChangePathByAuthRole[page]

    return (
      <ProtectedRoute allowedRole={page} currentRole={currentRole} fallback={<Navigate to="/login" replace />}>
        {requirePasswordChange && passwordChangePath && location.pathname !== passwordChangePath ? (
          <Navigate to={passwordChangePath} replace />
        ) : (
          element
        )}
      </ProtectedRoute>
    )
  }

  return (
    <>
      <Toast isVisible={showToast} isFadingOut={toastFadeOut} text={toastMessage} isError={toastType === 'error'} />
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
