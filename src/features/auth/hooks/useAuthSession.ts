import { useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import type { NavigateFunction } from 'react-router-dom'
import { authApi } from '@/services/api/authApi'
import { getPageForUserRole, unsupportedRoleMessage } from '../utils/authRole'
import {
  AUTH_EXPIRED_EVENT_NAME,
  clearAuthStorage,
  getStoredRequirePasswordChange,
  getStoredAuthRole,
  hasStoredAuthToken,
  saveAuthRole,
} from '@/services/api/authStorage'

const pathByAuthRole = {
  candidate: '/candidate',
  tenantAdmin: '/tenant-admin',
  superAdmin: '/super-admin/dashboard',
  hr: '/hr',
  interviewer: '/interviewer',
}

const passwordChangePathByAuthRole = {
  candidate: '/candidate/change-password',
  tenantAdmin: '/tenant-admin/settings',
  superAdmin: '/super-admin/settings',
  hr: '/hr/settings',
  interviewer: '/interviewer/settings',
}

export function useAuthSession(
  navigate: NavigateFunction,
  triggerToast: (message: string, type?: 'success' | 'error') => void,
) {
  const [sessionState, setSessionState] = useState(() => ({
    currentRole: hasStoredAuthToken() ? getStoredAuthRole() : null,
    requirePasswordChange: getStoredRequirePasswordChange(),
  }))
  const { currentRole, requirePasswordChange } = sessionState
  const defaultPath = currentRole
    ? requirePasswordChange
      ? passwordChangePathByAuthRole[currentRole]
      : pathByAuthRole[currentRole]
    : '/landingpage'
  const loginRedirect = currentRole
    ? requirePasswordChange
      ? passwordChangePathByAuthRole[currentRole]
      : pathByAuthRole[currentRole]
    : null

  useEffect(() => {
    const handleAuthExpired = (event: Event) => {
      const message = event instanceof CustomEvent && typeof event.detail?.message === 'string'
        ? event.detail.message
        : 'Your session has expired. Please log in again.'

      clearAuthStorage()
      navigate('/login', { replace: true })
      triggerToast(message, 'error')
    }

    window.addEventListener(AUTH_EXPIRED_EVENT_NAME, handleAuthExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT_NAME, handleAuthExpired)
  }, [navigate, triggerToast])

  const handleSignInSuccess = useCallback((
    _: string,
    keepLoggedIn: boolean,
    userRole: string,
    options?: { requirePasswordChange?: boolean },
  ) => {
    const targetPage = getPageForUserRole(userRole)

    if (!targetPage) {
      triggerToast(unsupportedRoleMessage, 'error')
      return false
    }

    saveAuthRole(targetPage, keepLoggedIn)
    const shouldRequirePasswordChange = options?.requirePasswordChange || getStoredRequirePasswordChange()
    const targetPath = shouldRequirePasswordChange
      ? passwordChangePathByAuthRole[targetPage]
      : pathByAuthRole[targetPage]

    flushSync(() => {
      setSessionState({
        currentRole: targetPage,
        requirePasswordChange: shouldRequirePasswordChange,
      })
    })
    if (shouldRequirePasswordChange) {
      window.location.replace(targetPath)
      return true
    }

    navigate(targetPath, { replace: true })
    triggerToast('Logged in successfully.')
    return true
  }, [navigate, triggerToast])

  const handleLogout = useCallback(async () => {
    const refreshToken = window.localStorage.getItem('refresh_token') || window.sessionStorage.getItem('refresh_token') || undefined

    try {
      await authApi.logout(refreshToken)
    } catch {
      // Local logout should still complete if the server token is already invalid.
    } finally {
      clearAuthStorage()
      setSessionState({
        currentRole: null,
        requirePasswordChange: false,
      })
      navigate('/login', { replace: true })
      triggerToast('Logged out successfully.')
    }
  }, [navigate, triggerToast])

  return {
    currentRole,
    defaultPath,
    handleLogout,
    handleSignInSuccess,
    loginRedirect,
    pathByAuthRole,
    requirePasswordChange,
  }
}
