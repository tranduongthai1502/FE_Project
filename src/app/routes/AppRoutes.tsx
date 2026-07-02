import { useState, useEffect } from 'react'
import { Toast } from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { CandidatePortalPage } from '../../pages/CandidatePortalPage'
import { LoginPage } from '../../pages/LoginPage'
import { SignupPage } from '../../pages/SignupPage'

type AppPage = 'login' | 'signup' | 'candidate'
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
    return 'login'
  }
  const hash = window.location.hash
  if (hash === '#/signup') return 'signup'
  if (hash === '#/candidate') return 'candidate'
  return 'login'
}

export function AppRoutes() {
  const [page, setPage] = useState<AppPage>(() => {
    const hashPage = getPageFromHash()
    const savedPage = getSavedPage()

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
    if (page !== currentHashPage) {
      window.location.hash = `#/${page}`
    }

    const handleHashChange = () => {
      const hashPage = getPageFromHash()
      const savedPage = getSavedPage()

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

  const handleSignInSuccess = (_email: string, keepLoggedIn: boolean) => {
    const targetPage = 'candidate'

    const storage = keepLoggedIn ? window.localStorage : window.sessionStorage
    storage.setItem(AUTH_PAGE_STORAGE_KEY, targetPage)
    
    window.location.hash = `#/${targetPage}`
    triggerToast('Logged in successfully.')
  }

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_PAGE_STORAGE_KEY)
    window.sessionStorage.removeItem(AUTH_PAGE_STORAGE_KEY)
    window.location.hash = '#/login'
    triggerToast('Logged out successfully.')
  }

  if (page === 'signup') {
    return (
      <>
        <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
        <SignupPage
          onGoToSignin={() => { window.location.hash = '#/login' }}
          triggerToast={triggerToast}
        />
      </>
    )
  }

  if (page === 'candidate') {
    return (
      <>
        <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
        <CandidatePortalPage onLogout={handleLogout} />
      </>
    )
  }

  return (
    <>
      <Toast isVisible={showToast} isFadingOut={toastFadeOut} message={toastMessage} type={toastType} />
      <LoginPage
        onGoToSignup={() => { window.location.hash = '#/signup' }}
        onSignInSuccess={handleSignInSuccess}
      />
    </>
  )
}
