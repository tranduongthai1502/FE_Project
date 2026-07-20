import { useEffect, useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { NavigateFunction } from 'react-router-dom'
import { authApi } from '@/features/auth/services/authApi'
import { getAppErrorMessage } from '@/utils/errorManager'
import { shouldToastHttpError } from '@/utils/httpStatusManager'

type ActivationStatus = 'loading' | 'verified' | 'success' | 'error'

type ActivationDetails = {
  workspaceName?: string
  role?: string
  email?: string
}

type ActivationPageProps = {
  navigate: NavigateFunction
  onSignInSuccess: (email: string, keepLoggedIn: boolean, userRole: string) => boolean
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

// Extract roles in the same shape used by LoginFeature.
function normalizeRoleValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeRoleValue(item))
  }

  if (value && typeof value === 'object') {
    const roleObject = value as Record<string, unknown>
    return normalizeRoleValue(
      roleObject.role ||
        roleObject.name ||
        roleObject.roleName ||
        roleObject.role_name ||
        roleObject.authority ||
        roleObject.authorities ||
        roleObject.userRole ||
        roleObject.user_role,
    )
  }

  return String(value || '')
    .split(/[,;/|]+/)
    .map((role) => role.trim())
    .filter(Boolean)
}

function getAuthUserRole(user: any, payload: any) {
  const primaryRoleValues = [
    user?.role,
    user?.userRole,
    user?.user_role,
    user?.type,
    payload?.role,
    payload?.userRole,
    payload?.user_role,
    payload?.type,
  ].flatMap((value) => normalizeRoleValue(value))

  if (primaryRoleValues.length > 0) {
    return primaryRoleValues.join(',')
  }

  const multiRoleValues = [
    user?.roles,
    user?.userRoles,
    user?.authorities,
    payload?.roles,
    payload?.userRoles,
    payload?.authorities,
  ].flatMap((value) => normalizeRoleValue(value))

  return multiRoleValues.join(',')
}

export function ActivationPage({ navigate, onSignInSuccess, triggerToast }: ActivationPageProps) {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<ActivationStatus>('loading')
  const [message, setMessage] = useState('We are verifying your activation link. Please wait a moment...')
  const [activationDetails, setActivationDetails] = useState<ActivationDetails | null>(null)
  
  // Resend state
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isResending, setIsResending] = useState(false)
  
  // Activation state
  const [isActivating, setIsActivating] = useState(false)

  const hasCalledApi = useRef(false)

  useEffect(() => {
    if (hasCalledApi.current) return
    hasCalledApi.current = true

    if (!token) {
      setStatus('error')
      setMessage('Invalid activation link. No verification token was found.')
      return
    }

    const fetchDetails = async () => {
      try {
        const response: any = await authApi.activate(token)
        const payload = response?.data && typeof response.data === 'object' ? response.data : response
        
        // Store activation details.
        setActivationDetails({
          workspaceName: payload?.workspaceName || payload?.companyName || payload?.tenantName || 'JobFusion Workspace',
          role: payload?.role || payload?.roleName || 'Staff Member',
          email: payload?.email || payload?.username || '',
        })
        
        setStatus('verified')
        setMessage('Review your invitation details below, then click the button to activate your account.')
      } catch (error: any) {
        setStatus('error')
        const errorMsg = error?.message || 'This activation code is invalid, has already been used, or has expired.'
        setMessage(errorMsg)
        triggerToast?.(errorMsg, 'error')
      }
    }

    fetchDetails()
  }, [token, triggerToast])

  const handleActivateClick = async () => {
    if (!token) return

    setIsActivating(true)
    try {
      const response: any = await authApi.confirmActivation(token)
      const payload = response?.data && typeof response.data === 'object' ? response.data : response
      
      const tokenVal = payload?.token || payload?.access_token || payload?.accessToken || payload?.jwt || ''
      const refreshToken = payload?.refresh_token || payload?.refreshToken || ''
      const user = payload?.user || payload?.user_info || payload?.userInfo || null
      const userRole = getAuthUserRole(user, payload)
      const emailVal = user?.email || activationDetails?.email || ''

      // Store tokens using the same flow as Login.
      const storage = window.localStorage
      window.sessionStorage.removeItem('access_token')
      window.sessionStorage.removeItem('refresh_token')
      window.sessionStorage.removeItem('user_info')

      if (tokenVal) {
        storage.setItem('access_token', tokenVal)
      }
      if (refreshToken) {
        storage.setItem('refresh_token', refreshToken)
      }
      if (user) {
        storage.setItem('user_info', JSON.stringify(user))
      }

      setStatus('success')
      setMessage('Your account has been activated successfully. Redirecting you to the dashboard...')
      triggerToast?.('Account activated and signed in successfully.', 'success')

      // Let the app route the user to the correct dashboard.
      setTimeout(() => {
        onSignInSuccess(emailVal, true, userRole)
      }, 1500)

    } catch (error: any) {
      const errorMsg = getAppErrorMessage(error, 'Account activation failed. Please try again.')
      triggerToast?.(errorMsg, 'error')
    } finally {
      setIsActivating(false)
    }
  }

  const handleResend = async (e: FormEvent) => {
    e.preventDefault()
    setEmailError('')

    if (!email.trim()) {
      setEmailError('Please enter your email address.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setIsResending(true)
    try {
      await authApi.resendActivation(email)
      triggerToast?.('Activation link resent successfully. Please check your email.', 'success')
      setEmail('')
    } catch (error: any) {
      const errorMsg = getAppErrorMessage(error, 'Something went wrong while resending the activation link.')
      if (shouldToastHttpError(error)) {
        triggerToast?.(errorMsg, 'error')
      } else {
        setEmailError(errorMsg)
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleGoToLogin = () => {
    navigate('/login', { replace: true })
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return 'fa-solid fa-spinner fa-spin'
      case 'verified':
        return 'fa-regular fa-envelope'
      case 'success':
        return 'fa-solid fa-circle-check text-success'
      case 'error':
        return 'fa-solid fa-circle-xmark text-danger'
    }
  }

  return (
    <main className="tenant-activation-page">
      <section className="tenant-activation-shell" aria-labelledby="tenant-activation-title">
        <div className={`tenant-activation-badge ${status}`}>
          <i className={getStatusIcon()} style={{ fontSize: '2.5rem' }}></i>
        </div>

        <div className="tenant-activation-copy">
          <span>JobFusion System</span>
          <h2 id="tenant-activation-title">
            {status === 'loading' && 'Verifying Activation Link'}
            {status === 'verified' && 'Verify Your Invitation'}
            {status === 'success' && 'Activation Successful'}
            {status === 'error' && 'Activation Failed'}
          </h2>
          <p>{message}</p>
        </div>

        {status === 'verified' && activationDetails && (
          <div className="tenant-activation-summary">
            <div>
              <small>Workspace / Company</small>
              <strong>{activationDetails.workspaceName}</strong>
            </div>
            <div>
              <small>Role</small>
              <strong>{activationDetails.role}</strong>
            </div>
            <div>
              <small>Email Address</small>
              <strong>{activationDetails.email}</strong>
            </div>
          </div>
        )}

        {status === 'verified' && (
          <button
            type="button"
            className="tenant-activation-button"
            onClick={handleActivateClick}
            disabled={isActivating}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%' }}
          >
            {isActivating ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Activating...
              </>
            ) : (
              'Activate Account'
            )}
          </button>
        )}

        {status === 'error' && (
          <form onSubmit={handleResend} style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label htmlFor="resend-email" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                Enter your email to receive a new activation link:
              </label>
              <input
                id="resend-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError('')
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #ccc)',
                  backgroundColor: 'var(--bg-input, #fff)',
                  color: 'var(--text-main, #333)',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                disabled={isResending}
              />
              {emailError && (
                <p style={{ margin: '0.5rem 0 0', color: '#ef4444', fontSize: '0.85rem', fontWeight: 700 }}>
                  {emailError}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="tenant-activation-button"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Sending...
                </>
              ) : (
                'Resend Activation Link'
              )}
            </button>
          </form>
        )}

        {status === 'error' && (
          <button type="button" className="tenant-activation-secondary" onClick={handleGoToLogin} style={{ width: '100%', marginTop: '0.5rem' }}>
            Back to Login
          </button>
        )}
      </section>
    </main>
  )
}
