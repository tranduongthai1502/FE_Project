import { useState, useEffect } from 'react'
import { Toast } from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { CandidatePortalPage } from '../../pages/CandidatePortalPage'
import { LandingPage } from '../../pages/LandingPage'
import { LoginPage } from '../../pages/LoginPage'
import { SignupPage } from '../../pages/SignupPage'
import { authApi } from '../../features/auth/services/authApi'

type AppPage = 'landing' | 'login' | 'signup' | 'candidate'
const AUTH_PAGE_STORAGE_KEY = 'jobfusion_auth_page'

function getSavedPage(): AppPage | null {
  if (typeof window === 'undefined') {
    return null
  }
  const savedPage = window.localStorage.getItem(AUTH_PAGE_STORAGE_KEY) || window.sessionStorage.getItem(AUTH_PAGE_STORAGE_KEY)
  return savedPage === 'candidate' ? savedPage : null
}

function getPageFromHash(): AppPage {
  if (typeof window === 'undefined') {
    return 'landing'
  }
  const hash = window.location.hash
  if (hash === '#/signup') return 'signup'
  if (hash === '#/candidate') return 'candidate'
  if (hash === '#/login') return 'login'
  if (hash === '#/landingpage') return 'landing'
  if (window.location.pathname === '/landingpage') return 'landing'
  return 'login'
}

export function AppRoutes() {
  const [page, setPage] = useState<AppPage>(() => {
    const hashPage = getPageFromHash()
    const savedPage = getSavedPage()
    const hasAuthHash = ['#/login', '#/signup', '#/candidate'].includes(window.location.hash)

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
    } else if (page !== currentHashPage) {
      window.location.hash = `#/${page}`
    }

    const handleHashChange = () => {
      const hashPage = getPageFromHash()
      const savedPage = getSavedPage()

      if (hashPage === 'landing') {
        setPage('landing')
        return
      }

      if (savedPage) {
        if (hashPage === 'login' || hashPage === 'signup') {
          window.location.hash = `#/${savedPage}`
        } else {
          setPage(hashPage)
        }
      } else {
        if (hashPage === 'signup') {
          setPage('signup')
        } else {
          window.location.hash = '#/login'
          setPage('login')
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [page])

  const navigateToAuthPage = (targetPage: 'login' | 'signup') => {
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/')
    }
    window.location.hash = `#/${targetPage}`
    setPage(targetPage)
  }

  const handleSignInSuccess = (_email: string, keepLoggedIn: boolean) => {
    const targetPage = 'candidate'

    const storage = keepLoggedIn ? window.localStorage : window.sessionStorage
    storage.setItem(AUTH_PAGE_STORAGE_KEY, targetPage)
    
    window.location.hash = `#/${targetPage}`
    triggerToast('Logged in successfully.')
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
      window.location.hash = '#/login'
      triggerToast('Logged out successfully.')
    }
  }

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
