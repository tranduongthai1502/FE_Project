import { useState, useEffect } from 'react'
import { Toast } from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { CandidatePortalPage } from '../../pages/CandidatePortalPage'
import { LandingPage } from '../../pages/LandingPage'
import { LoginPage } from '../../pages/LoginPage'
import { RoleDashboardPage } from '../../pages/RoleDashboardPage'
import { SignupPage } from '../../pages/SignupPage'
import { authApi } from '../../features/auth/services/authApi'

type AppPage = 'landing' | 'login' | 'signup' | 'candidate' | 'tenantAdmin' | 'superAdmin' | 'hr' | 'interviewer'
const AUTH_PAGE_STORAGE_KEY = 'jobfusion_auth_page'
const AUTH_EXPIRED_EVENT_NAME = 'jobfusion:auth-expired'
const unsupportedRoleMessage = 'This role is not supported in the current frontend.'
const authenticatedPages: AppPage[] = ['candidate', 'tenantAdmin', 'superAdmin', 'hr', 'interviewer']
const authHashes = ['#/login', '#/signup', '#/candidate', '#/tenant-admin', '#/super-admin', '#/hr', '#/interviewer']
const backendRoleConstants = {
  superAdmin: 'Super Admin',
  tenantAdmin: 'Tenant Admin',
  hr: 'HR',
  interviewer: 'Interviewer',
  candidate: 'Candidate',
}

function normalizeRole(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

const pageByBackendRole: Record<string, AppPage> = {
  [normalizeRole(backendRoleConstants.superAdmin)]: 'superAdmin',
  [normalizeRole(backendRoleConstants.tenantAdmin)]: 'tenantAdmin',
  [normalizeRole(backendRoleConstants.hr)]: 'hr',
  [normalizeRole(backendRoleConstants.interviewer)]: 'interviewer',
  [normalizeRole(backendRoleConstants.candidate)]: 'candidate',
}

function isAuthenticatedPage(value: string | null): value is AppPage {
  return Boolean(value && authenticatedPages.includes(value as AppPage))
}

function getHashForPage(page: AppPage) {
  const hashes: Record<AppPage, string> = {
    landing: '#/landingpage',
    login: '#/login',
    signup: '#/signup',
    candidate: '#/candidate',
    tenantAdmin: '#/tenant-admin',
    superAdmin: '#/super-admin',
    hr: '#/hr',
    interviewer: '#/interviewer',
  }

  return hashes[page]
}

function getPathForPage(page: AppPage) {
  const paths: Partial<Record<AppPage, string>> = {
    superAdmin: '/super-admin/dashboard',
    tenantAdmin: '/tenant-admin',
    hr: '/hr',
    interviewer: '/interviewer',
  }

  return paths[page]
}

function setBrowserLocationForPage(page: AppPage) {
  const path = getPathForPage(page)

  if (path) {
    window.history.pushState(null, '', path)
    return
  }

  window.location.hash = getHashForPage(page)
}

function setBrowserLocationForAuthPage(page: 'login' | 'signup', mode: 'push' | 'replace' = 'replace') {
  window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', `/#/${page}`)
}

function getSavedPage(): AppPage | null {
  if (typeof window === 'undefined') {
    return null
  }
  const savedPage = window.localStorage.getItem(AUTH_PAGE_STORAGE_KEY) || window.sessionStorage.getItem(AUTH_PAGE_STORAGE_KEY)
  return isAuthenticatedPage(savedPage) ? savedPage : null
}

function getPageFromHash(): AppPage {
  if (typeof window === 'undefined') {
    return 'landing'
  }
  const hash = window.location.hash
  if (hash === '#/signup') return 'signup'
  if (hash === '#/candidate' || hash.startsWith('#/candidate/')) return 'candidate'
  if (hash === '#/tenant-admin') return 'tenantAdmin'
  if (hash === '#/super-admin') return 'superAdmin'
  if (hash === '#/hr') return 'hr'
  if (hash === '#/interviewer') return 'interviewer'
  if (hash === '#/login') return 'login'
  if (hash === '#/landingpage') return 'landing'
  if (window.location.pathname === '/super-admin' || window.location.pathname.startsWith('/super-admin/')) return 'superAdmin'
  if (window.location.pathname === '/tenant-admin') return 'tenantAdmin'
  if (window.location.pathname === '/hr') return 'hr'
  if (window.location.pathname === '/interviewer') return 'interviewer'
  if (window.location.pathname === '/landingpage') return 'landing'
  return 'login'
}

function isKnownAuthHash(hash: string) {
  return authHashes.includes(hash) || hash.startsWith('#/candidate/')
}

export function AppRoutes() {
  const [page, setPage] = useState<AppPage>(() => {
    const hashPage = getPageFromHash()
    const savedPage = getSavedPage()
    const hasAuthHash = isKnownAuthHash(window.location.hash)

    if (!hasAuthHash && (window.location.pathname === '/' || window.location.pathname === '/landingpage')) {
      return 'landing'
    }

    if (savedPage) {
      if (hashPage === 'login' || hashPage === 'signup') {
        return savedPage
      }
      return hashPage
    } else {
      if (hashPage === 'signup') {
        return 'signup'
      }
      return 'login'
    }
  })

  const { showToast, toastFadeOut, toastMessage, toastType, triggerToast } = useToast()

  useEffect(() => {
    const currentHashPage = getPageFromHash()
    if (page === 'landing') {
      if (window.location.pathname !== '/landingpage') {
        window.history.replaceState(null, '', '/landingpage')
      }
    } else if (page === 'superAdmin') {
      if (window.location.pathname === '/super-admin' || !window.location.pathname.startsWith('/super-admin')) {
        window.history.replaceState(null, '', '/super-admin/dashboard')
      }
    } else if (page === 'login' || page === 'signup') {
      const expectedHash = getHashForPage(page)
      if (window.location.pathname !== '/' || window.location.hash !== expectedHash) {
        setBrowserLocationForAuthPage(page)
      }
    } else if (page !== currentHashPage) {
      window.location.hash = getHashForPage(page)
    }

    const handleRouteChange = () => {
      const hashPage = getPageFromHash()
      const savedPage = getSavedPage()

      if (hashPage === 'landing') {
        setPage('landing')
        return
      }

      if (savedPage) {
        if (hashPage === 'login' || hashPage === 'signup') {
          setBrowserLocationForPage(savedPage)
          setPage(savedPage)
        } else {
          setPage(hashPage)
        }
      } else {
        if (hashPage === 'signup') {
          setPage('signup')
        } else {
          setBrowserLocationForAuthPage('login')
          setPage('login')
        }
      }
    }

    window.addEventListener('hashchange', handleRouteChange)
    window.addEventListener('popstate', handleRouteChange)
    return () => {
      window.removeEventListener('hashchange', handleRouteChange)
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [page])

  const navigateToAuthPage = (targetPage: 'login' | 'signup') => {
    const shouldKeepLandingBehind = page === 'landing' || window.location.pathname === '/landingpage'

    setBrowserLocationForAuthPage(targetPage, shouldKeepLandingBehind ? 'push' : 'replace')
    setPage(targetPage)
  }

  const getPageForUserRole = (userRole: string): AppPage | null => {
    const normalizedRole = normalizeRole(userRole)
    const backendRolePage = pageByBackendRole[normalizedRole]

    if (backendRolePage) {
      return backendRolePage
    }

    const legacyRolePages: Record<string, AppPage> = {
      tenantadmin: 'tenantAdmin',
      admin: 'tenantAdmin',
      superadmin: 'superAdmin',
      recruiter: 'hr',
      tenant_hr: 'hr',
      tenant_recruiter: 'hr',
    }

    return legacyRolePages[normalizedRole] || null
  }

  const handleSignInSuccess = (_email: string, keepLoggedIn: boolean, userRole: string) => {
    const targetPage = getPageForUserRole(userRole)

    if (!targetPage) {
      triggerToast(unsupportedRoleMessage, 'error')
      return false
    }

    const storage = keepLoggedIn ? window.localStorage : window.sessionStorage
    storage.setItem(AUTH_PAGE_STORAGE_KEY, targetPage)
    
    setBrowserLocationForPage(targetPage)
    setPage(targetPage)
    triggerToast('Logged in successfully.')
    return true
  }

  const clearAuthStorage = () => {
    window.localStorage.removeItem(AUTH_PAGE_STORAGE_KEY)
    window.sessionStorage.removeItem(AUTH_PAGE_STORAGE_KEY)
    window.localStorage.removeItem('access_token')
    window.localStorage.removeItem('refresh_token')
    window.localStorage.removeItem('user_info')
    window.sessionStorage.removeItem('access_token')
    window.sessionStorage.removeItem('refresh_token')
    window.sessionStorage.removeItem('user_info')
  }

  const handleLogout = async () => {
    const refreshToken = window.localStorage.getItem('refresh_token') || window.sessionStorage.getItem('refresh_token') || undefined

    try {
      await authApi.logout(refreshToken)
    } catch {
      // Local logout should still complete if the server token is already invalid.
    } finally {
      clearAuthStorage()
      setBrowserLocationForAuthPage('login')
      setPage('login')
      triggerToast('Logged out successfully.')
    }
  }

  useEffect(() => {
    const handleAuthExpired = () => {
      clearAuthStorage()
      setBrowserLocationForAuthPage('login')
      setPage('login')
      triggerToast('Your session has expired. Please log in again.', 'error')
    }

    window.addEventListener(AUTH_EXPIRED_EVENT_NAME, handleAuthExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT_NAME, handleAuthExpired)
  }, [triggerToast])

  if (page === 'landing') {
    return (
      <>
        <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
        <LandingPage
          onGoToLogin={() => navigateToAuthPage('login')}
          onGoToSignup={() => navigateToAuthPage('signup')}
        />
      </>
    )
  }

  if (page === 'signup') {
    return (
      <>
        <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
        <SignupPage
          onGoToSignin={() => navigateToAuthPage('login')}
          triggerToast={triggerToast}
        />
      </>
    )
  }

  if (page === 'candidate') {
    return (
      <>
        <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
        <CandidatePortalPage onLogout={handleLogout} triggerToast={triggerToast} />
      </>
    )
  }

  if (page === 'tenantAdmin' || page === 'superAdmin' || page === 'hr' || page === 'interviewer') {
    return (
      <>
        <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
        <RoleDashboardPage role={page} onLogout={handleLogout} triggerToast={triggerToast} />
      </>
    )
  }

  return (
    <>
      <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
      <LoginPage
        onGoToSignup={() => navigateToAuthPage('signup')}
        onSignInSuccess={handleSignInSuccess}
        triggerToast={triggerToast}
      />
    </>
  )
}
