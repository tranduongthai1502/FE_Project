import type { ReactElement } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from '@/features/landing'
import { LoginFeature, SignupFeature, type AppRole } from '@/features/auth'
import { RoleRoutes } from './RoleRoutes'

export type AppPage = AppRole

type RouteConfigProps = {
  defaultPath: string
  loginRedirect: string | null
  navigate: NavigateFunction
  onLogout: () => void
  onSignInSuccess: (
    email: string,
    keepLoggedIn: boolean,
    userRole: string,
    options?: { requirePasswordChange?: boolean },
  ) => boolean
  protect: (page: AppPage, element: ReactElement) => ReactElement
  triggerToast: (message: string, type?: 'success' | 'error') => void
}

export function RouteConfig({
  defaultPath,
  loginRedirect,
  navigate,
  onLogout,
  onSignInSuccess,
  protect,
  triggerToast,
}: RouteConfigProps) {
  const landingPage = (
    <LandingPage
      onGoToLanding={() => navigate('/landingpage')}
      onGoToLogin={() => navigate('/login')}
      onGoToSignup={() => navigate('/signup')}
    />
  )

  return (
    <Routes>
      <Route path="/" element={defaultPath === '/landingpage' ? landingPage : <Navigate to={defaultPath} replace />} />
      <Route path="/landingpage" element={landingPage} />
      <Route path="/landing" element={<Navigate to="/landingpage" replace />} />
      <Route
        path="/login"
        element={
          loginRedirect ? (
            <Navigate to={loginRedirect} replace />
          ) : (
            <LoginFeature
              onGoToSignup={() => navigate('/signup')}
              onSignInSuccess={onSignInSuccess}
              triggerToast={triggerToast}
            />
          )
        }
      />
      <Route
        path="/signup"
        element={
          loginRedirect ? (
            <Navigate to={loginRedirect} replace />
          ) : (
            <SignupFeature onGoToSignin={() => navigate('/login')} triggerToast={triggerToast} />
          )
        }
      />
      {RoleRoutes({ onLogout, protect, triggerToast })}
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  )
}
