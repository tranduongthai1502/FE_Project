import type { ReactElement } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CandidatePortalPage } from '@/pages/CandidatePortalPage'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RoleDashboardPage } from '@/pages/RoleDashboardPage'
import { SignupPage } from '@/pages/SignupPage'
import type { AppRole } from '@/features/auth'

export type AppPage = AppRole

export const pathByPage: Record<AppPage, string> = {
  candidate: '/candidate',
  tenantAdmin: '/tenant-admin',
  superAdmin: '/super-admin',
  hr: '/hr',
  interviewer: '/interviewer',
}

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
  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultPath} replace />} />
      <Route
        path="/landingpage"
        element={<LandingPage onGoToLogin={() => navigate('/login')} onGoToSignup={() => navigate('/signup')} />}
      />
      <Route
        path="/login"
        element={
          loginRedirect ? (
            <Navigate to={loginRedirect} replace />
          ) : (
            <LoginPage
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
            <SignupPage onGoToSignin={() => navigate('/login')} triggerToast={triggerToast} />
          )
        }
      />
      <Route
        path="/candidate/*"
        element={protect('candidate', <CandidatePortalPage onLogout={onLogout} triggerToast={triggerToast} />)}
      />
      <Route
        path="/tenant-admin/*"
        element={protect('tenantAdmin', <RoleDashboardPage role="tenantAdmin" onLogout={onLogout} triggerToast={triggerToast} />)}
      />
      <Route
        path="/super-admin/*"
        element={protect('superAdmin', <RoleDashboardPage role="superAdmin" onLogout={onLogout} triggerToast={triggerToast} />)}
      />
      <Route
        path="/hr/*"
        element={protect('hr', <RoleDashboardPage role="hr" onLogout={onLogout} triggerToast={triggerToast} />)}
      />
      <Route
        path="/interviewer/*"
        element={protect('interviewer', <RoleDashboardPage role="interviewer" onLogout={onLogout} triggerToast={triggerToast} />)}
      />
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  )
}
