import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toast } from '@/core/components/Toast'
import { useToast } from '@/core/hooks/useToast'
import { useAuthSession } from '@/features/auth'
import { RoleGuard } from '@/features/auth/presentation/components/RoleGuard'
import { RouteConfig, type AppPage } from './RouteConfig'

export function AppRouteContent() {
  const navigate = useNavigate()
  const { showToast, toastFadeOut, toastMessage, toastType, triggerToast } = useToast()
  const {
    currentRole,
    defaultPath,
    handleLogout,
    handleSignInSuccess,
    loginRedirect,
    requirePasswordChange,
  } = useAuthSession(navigate, triggerToast)

  const protect = (page: AppPage, element: ReactElement) => (
    <RoleGuard currentRole={currentRole} page={page} requirePasswordChange={requirePasswordChange}>
      {element}
    </RoleGuard>
  )

  return (
    <>
      <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
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
