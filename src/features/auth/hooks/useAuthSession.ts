import { useCallback, useEffect } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { getPageForUserRole, unsupportedRoleMessage } from '../utils/authRole'
import {
  AUTH_EXPIRED_EVENT_NAME,
  clearAuthStorage,
  getStoredRequirePasswordChange,
  getStoredAuthRole,
  saveAuthRole,
} from '../utils/authStorage'

const pathByAuthRole = {
  candidate: '/candidate',
  tenantAdmin: '/tenant-admin',
  superAdmin: '/super-admin',
  hr: '/hr',
  interviewer: '/interviewer',
}

export const passwordChangePathByAuthRole = {
  tenantAdmin: '/tenant-admin/settings',
  superAdmin: '/super-admin/settings',
  hr: '/hr/settings',
  interviewer: '/interviewer/settings',
}

function getPasswordChangePath(role: keyof typeof pathByAuthRole) {
  return role === 'candidate' ? pathByAuthRole.candidate : passwordChangePathByAuthRole[role]
}

export function useAuthSession(
  navigate: NavigateFunction,
  triggerToast: (message: string, type?: 'success' | 'error') => void,
) {
  const currentRole = getStoredAuthRole()
  const requirePasswordChange = getStoredRequirePasswordChange()
  const defaultPath = currentRole
    ? requirePasswordChange
      ? getPasswordChangePath(currentRole)
      : pathByAuthRole[currentRole]
    : '/landingpage'
  const loginRedirect = currentRole
    ? requirePasswordChange
      ? getPasswordChangePath(currentRole)
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
    navigate(
      options?.requirePasswordChange
        ? getPasswordChangePath(targetPage)
        : pathByAuthRole[targetPage],
      { replace: true },
    )
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
