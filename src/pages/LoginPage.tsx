import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { AuthLayout } from '../components/layout/AuthLayout'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '../components/icons/Icons'
import { ForgotPasswordForm } from '../features/auth/components/ForgotPasswordForm'
import { OtpForm } from '../features/auth/components/OtpForm'
import { ResetPasswordForm } from '../features/auth/components/ResetPasswordForm'
import { getPasswordStrength } from '../features/auth/utils/passwordStrength'
import { validateEmail, validateRequired } from '../features/auth/utils/validation'

import { authApi } from '../features/auth/services/authApi'

const emptyOtp = ['', '', '', '', '', '']
const accountNotFoundMessage = 'Account not found. Please check your email.'
const forgotAccountNotFoundMessage = 'This email address is not registered in our system.'
const systemErrorMessage = 'Error system. Please try again.'
const incorrectPasswordMessage = 'The password is incorrect. Please retry.'
const expiredOtpMessage = 'OTP has expired. Please request a new one.'
const invalidOtpMessage = 'Invalid OTP. Please retry.'
const rememberedEmailStorageKey = 'jobfusion_remembered_email'
const resendOtpCountdownSeconds = 30
type ForgotStep = 'email' | 'otp' | 'reset'

function getAuthResponsePayload(response: any) {
  return response?.data && typeof response.data === 'object' ? response.data : response
}

function isLoginSuccessResponse(response: any) {
  const payload = getAuthResponsePayload(response)
  const success = response?.success ?? payload?.success
  const status = String(response?.status ?? payload?.status ?? '').toLowerCase()
  const message = String(response?.message ?? payload?.message ?? '').toLowerCase()
  const code = response?.httpStatus ?? payload?.httpStatus ?? response?.code ?? payload?.code ?? response?.statusCode ?? payload?.statusCode
  const token = getAuthToken(payload)

  const hasFailureMessage =
    message.includes('invalid credentials') ||
    message.includes('bad credentials') ||
    message.includes('incorrect password') ||
    message.includes('wrong password') ||
    message.includes('password is incorrect') ||
    message.includes('authentication failed') ||
    message.includes('login failed') ||
    message.includes('unauthorized')

  if (success === false || status === 'error' || status === 'failed' || status === 'failure' || hasFailureMessage) {
    return false
  }

  return Boolean(
    success === true ||
    status === 'success' ||
    status === 'ok' ||
    (code >= 200 && code < 300) ||
    message.includes('login successful') ||
    message.includes('logged in') ||
    message.includes('success') ||
    token
  )
}

function getAuthToken(payload: any) {
  return payload?.token || payload?.access_token || payload?.accessToken || payload?.jwt || ''
}

function getRefreshToken(payload: any) {
  return payload?.refresh_token || payload?.refreshToken || ''
}

function isAccountNotFoundError(message = '') {
  const normalizedMessage = message.toLowerCase()

  return (
    normalizedMessage.includes('account not found') ||
    normalizedMessage.includes('user not found') ||
    normalizedMessage.includes('email not found') ||
    normalizedMessage.includes('not registered') ||
    normalizedMessage.includes('does not exist')
  )
}

function isExpiredOtpError(message = '') {
  const normalizedMessage = message.toLowerCase()

  return (
    normalizedMessage.includes('otp expired') ||
    normalizedMessage.includes('expired otp') ||
    normalizedMessage.includes('code expired') ||
    normalizedMessage.includes('expired') ||
    normalizedMessage.includes('expire')
  )
}

function getOtpErrorMessage(message = '') {
  return isExpiredOtpError(message) ? expiredOtpMessage : invalidOtpMessage
}

function isSystemApiError(error: any) {
  const status = Number(error?.status ?? 0)
  return status === 0 || status >= 500
}

type LoginPageProps = {
  onGoToSignup: () => void
  onSignInSuccess: (email: string, keepLoggedIn: boolean) => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

export function LoginPage({ onGoToSignup, onSignInSuccess, triggerToast }: LoginPageProps) {
  const rememberedEmail = window.localStorage.getItem(rememberedEmailStorageKey) || ''
  const [email, setEmail] = useState(rememberedEmail)
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState(emptyOtp)
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(Boolean(rememberedEmail))
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isResendingCode, setIsResendingCode] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [forgotEmailError, setForgotEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const strength = getPasswordStrength(newPassword)

  useEffect(() => {
    if (!showForgotPassword || forgotStep !== 'otp' || countdown <= 0) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setCountdown((value) => Math.max(value - 1, 0))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [countdown, forgotStep, showForgotPassword])

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextEmail = event.target.value
    setEmail(nextEmail)
    if (emailError) {
      setEmailError(validateEmail(nextEmail))
    }
  }

  const updatePassword = (nextPassword: string) => {
    setPassword(nextPassword)
    if (passwordError) {
      setPasswordError(validateRequired(nextPassword, 'Please enter your password.'))
    }
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    updatePassword(event.target.value)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const nextEmailError = validateEmail(email)
    const nextPasswordError = validateRequired(password, 'Please enter your password.')

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)

    if (nextEmailError || nextPasswordError) {
      return
    }

    setIsLoading(true)
    try {
      const response: any = await authApi.login({ email, password })
      const payload = getAuthResponsePayload(response)
      const responseMessage = response?.message || payload?.message || ''
      if (isAccountNotFoundError(responseMessage)) {
        setEmailError('')
        setPasswordError(accountNotFoundMessage)
      } else if (isLoginSuccessResponse(response)) {
        const token = getAuthToken(payload)
        const refreshToken = getRefreshToken(payload)
        const user = payload?.user || payload?.user_info || payload?.userInfo
        const storage = keepLoggedIn ? window.localStorage : window.sessionStorage
        const inactiveStorage = keepLoggedIn ? window.sessionStorage : window.localStorage
        inactiveStorage.removeItem('access_token')
        inactiveStorage.removeItem('refresh_token')
        inactiveStorage.removeItem('user_info')
        if (token) {
          storage.setItem('access_token', token)
        }
        if (refreshToken) {
          storage.setItem('refresh_token', refreshToken)
        }
        if (user) {
          storage.setItem('user_info', JSON.stringify(user))
        }
        if (keepLoggedIn) {
          window.localStorage.setItem(rememberedEmailStorageKey, email)
        } else {
          window.localStorage.removeItem(rememberedEmailStorageKey)
        }
        onSignInSuccess(email, keepLoggedIn)
      } else {
        setPasswordError(incorrectPasswordMessage)
      }
    } catch (error: any) {
      if (isSystemApiError(error)) {
        triggerToast?.(systemErrorMessage, 'error')
      } else if (isAccountNotFoundError(error.message)) {
        setEmailError('')
        setPasswordError(accountNotFoundMessage)
      } else {
        setPasswordError(incorrectPasswordMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextEmailError = validateEmail(forgotEmail)
    setForgotEmailError(nextEmailError)

    if (nextEmailError) {
      return
    }

    setIsSendingCode(true)
    try {
      const response: any = await authApi.sendResetCode(forgotEmail)
      if (response && response.success) {
        setForgotStep('otp')
        setCountdown(resendOtpCountdownSeconds)
      } else if (isAccountNotFoundError(response?.message)) {
        setForgotEmailError(forgotAccountNotFoundMessage)
      } else {
        triggerToast?.(systemErrorMessage, 'error')
      }
    } catch (error: any) {
      if (isSystemApiError(error)) {
        triggerToast?.(systemErrorMessage, 'error')
      } else if (isAccountNotFoundError(error.message)) {
        setForgotEmailError(forgotAccountNotFoundMessage)
      } else {
        triggerToast?.(systemErrorMessage, 'error')
      }
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleCloseForgotPassword = () => {
    if (isSendingCode || isResendingCode) {
      return
    }

    setShowForgotPassword(false)
    setForgotStep('email')
    setForgotEmailError('')
    setOtpError('')
    setNewPasswordError('')
    setConfirmPasswordError('')
    setOtp(emptyOtp)
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value
    if (Number.isNaN(Number(value))) return

    const nextOtp = [...otp]
    nextOtp[index] = value.slice(-1)
    setOtp(nextOtp)
    setOtpError('')

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== 'Backspace') return

    const nextOtp = [...otp]
    if (!otp[index] && index > 0) {
      nextOtp[index - 1] = ''
      otpInputsRef.current[index - 1]?.focus()
    } else {
      nextOtp[index] = ''
    }
    setOtp(nextOtp)
    setOtpError('')
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const pastedDigits = event.clipboardData.getData('text').trim().slice(0, 6)
    if (!/^\d+$/.test(pastedDigits)) return

    const nextOtp = [...emptyOtp]
    pastedDigits.split('').forEach((digit, index) => {
      nextOtp[index] = digit
    })
    setOtp(nextOtp)
    setOtpError('')
    otpInputsRef.current[Math.min(pastedDigits.length, 5)]?.focus()
  }

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const otpCode = otp.join('')
    if (otpCode.length < 6) {
      setOtpError('Please enter the OTP code.')
      return
    }

    setIsSendingCode(true)
    try {
      const response: any = await authApi.verifyOtp(forgotEmail, otpCode)
      if (response && response.success) {
        setForgotStep('reset')
      } else {
        setOtpError(getOtpErrorMessage(response?.message))
      }
    } catch (error: any) {
      if (isSystemApiError(error)) {
        triggerToast?.(systemErrorMessage, 'error')
      } else {
        setOtpError(getOtpErrorMessage(error.message))
      }
    } finally {
      setIsSendingCode(false)
    }
  }

  const startTimer = () => {
    setCountdown(resendOtpCountdownSeconds)
  }

  const handleResendCode = async () => {
    if (countdown > 0 || isResendingCode) {
      return
    }

    setIsResendingCode(true)
    try {
      const response: any = await authApi.sendResetCode(forgotEmail)
      if (response && response.success) {
        setOtp(emptyOtp)
        setOtpError('')
        startTimer()
        otpInputsRef.current[0]?.focus()
      } else if (isAccountNotFoundError(response?.message)) {
        setOtpError(forgotAccountNotFoundMessage)
      } else {
        triggerToast?.(systemErrorMessage, 'error')
      }
    } catch (error: any) {
      if (isSystemApiError(error)) {
        triggerToast?.(systemErrorMessage, 'error')
      } else if (isAccountNotFoundError(error.message)) {
        setOtpError(forgotAccountNotFoundMessage)
      } else {
        triggerToast?.(systemErrorMessage, 'error')
      }
    } finally {
      setIsResendingCode(false)
    }
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let hasError = false

    if (!newPassword) {
      setNewPasswordError('Please enter new password.')
      hasError = true
    } else if (strength.score < 4) {
      setNewPasswordError('Password does not meet requirements.')
      hasError = true
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.')
      hasError = true
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.')
      hasError = true
    }

    if (hasError) return

    setIsSendingCode(true)
    try {
      const response: any = await authApi.resetPassword(forgotEmail, otp.join(''), newPassword)
      if (response && response.success) {
        handleCloseForgotPassword()
        triggerToast?.('Password reset successfully.', 'success')
      } else {
        triggerToast?.(systemErrorMessage, 'error')
      }
    } catch (error: any) {
      if (isSystemApiError(error)) {
        triggerToast?.(systemErrorMessage, 'error')
      } else {
        setConfirmPasswordError(error.message || 'Password reset failed. Please try again.')
      }
    } finally {
      setIsSendingCode(false)
    }
  }

  return (
    <AuthLayout>
      <div className="form-shell">
        <header className="form-header">
          <h2>Welcome Back</h2>
          <p>Enter your credentials to access your dashboard.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} autoComplete="on" noValidate>
          <div className="field-group">
            <label htmlFor="email">Email Address</label>
            <div className={`input-wrap ${emailError ? 'has-error' : ''}`}>
              <MailIcon />
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="name@company.com"
                autoComplete="email"
                aria-invalid={emailError ? 'true' : 'false'}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
            </div>
            {emailError && (
              <span id="email-error" className="field-error">
                {emailError}
              </span>
            )}
          </div>

          <div className="field-group password-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <button type="button" className="text-link-button" onClick={() => setShowForgotPassword(true)}>
                Forgot password?
              </button>
            </div>
            <div className={`input-wrap ${passwordError ? 'has-error' : ''}`}>
              <LockIcon />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder=".........."
                autoComplete="current-password"
                aria-invalid={passwordError ? 'true' : 'false'}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordError && (
              <span id="password-error" className="field-error">
                {passwordError}
              </span>
            )}
          </div>

          <label className="check-row" htmlFor="keep-logged-in">
            <input
              id="keep-logged-in"
              name="keep-logged-in"
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(event) => setKeepLoggedIn(event.target.checked)}
            />
            <span>Keep me logged in</span>
          </label>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Logging in' : 'Login'}
          </button>
        </form>

        <p className="signup-copy">
          Don't have an account?
          <button type="button" onClick={onGoToSignup}>
            Sign up
          </button>
        </p>
      </div>

      {showForgotPassword && (
        <div className="auth-modal-overlay" role="presentation">
          <div
            className={`forgot-password-modal forgot-password-modal-${forgotStep}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
          >
            {forgotStep === 'email' && (
              <ForgotPasswordForm
                email={forgotEmail}
                setEmail={setForgotEmail}
                emailError={forgotEmailError}
                setEmailError={setForgotEmailError}
                isLoading={isSendingCode}
                validateEmail={validateEmail}
                handleSendCode={handleSendCode}
                handleBackToLogin={handleCloseForgotPassword}
              />
            )}

            {forgotStep === 'otp' && (
              <OtpForm
                otp={otp}
                otpError={otpError}
                otpInputsRef={otpInputsRef}
                countdown={countdown}
                isLoading={isSendingCode}
                handleOtpChange={handleOtpChange}
                handleOtpKeyDown={handleOtpKeyDown}
                handleOtpPaste={handleOtpPaste}
                handleVerifyOtp={handleVerifyOtp}
                handleBackToLogin={handleCloseForgotPassword}
                handleResendCode={handleResendCode}
                isResendingCode={isResendingCode}
              />
            )}

            {forgotStep === 'reset' && (
              <ResetPasswordForm
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                newPasswordError={newPasswordError}
                setNewPasswordError={setNewPasswordError}
                confirmPasswordError={confirmPasswordError}
                setConfirmPasswordError={setConfirmPasswordError}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                strength={strength}
                isLoading={isSendingCode}
                handleResetPassword={handleResetPassword}
                handleBackToLogin={handleCloseForgotPassword}
              />
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
