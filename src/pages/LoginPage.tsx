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
const incorrectPasswordMessage = 'The password is incorrect. Please retry.'
type ForgotStep = 'email' | 'otp' | 'reset'

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

type LoginPageProps = {
  onGoToSignup: () => void
  onSignInSuccess: (email: string, keepLoggedIn: boolean) => void
}

export function LoginPage({ onGoToSignup, onSignInSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState(emptyOtp)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
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

  const setPasswordCaret = (position: number) => {
    window.requestAnimationFrame(() => {
      passwordInputRef.current?.setSelectionRange(position, position)
    })
  }

  const replacePasswordSelection = (value: string) => {
    const input = passwordInputRef.current
    const start = input?.selectionStart ?? password.length
    const end = input?.selectionEnd ?? start
    const nextPassword = `${password.slice(0, start)}${value}${password.slice(end)}`

    updatePassword(nextPassword)
    setPasswordCaret(start + value.length)
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (showPassword) {
      updatePassword(event.target.value)
      return
    }

    if (event.target.value.replace(/\*/g, '')) {
      updatePassword(event.target.value)
    }
  }

  const handlePasswordKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (showPassword || event.ctrlKey || event.metaKey || event.altKey) return

    if (event.key.length === 1) {
      event.preventDefault()
      replacePasswordSelection(event.key)
      return
    }

    const input = event.currentTarget
    const start = input.selectionStart ?? password.length
    const end = input.selectionEnd ?? start

    if (event.key === 'Backspace') {
      event.preventDefault()
      if (start !== end) {
        replacePasswordSelection('')
        return
      }
      if (start > 0) {
        const nextPassword = `${password.slice(0, start - 1)}${password.slice(end)}`
        updatePassword(nextPassword)
        setPasswordCaret(start - 1)
      }
      return
    }

    if (event.key === 'Delete') {
      event.preventDefault()
      if (start !== end) {
        replacePasswordSelection('')
        return
      }
      if (start < password.length) {
        const nextPassword = `${password.slice(0, start)}${password.slice(start + 1)}`
        updatePassword(nextPassword)
        setPasswordCaret(start)
      }
    }
  }

  const handlePasswordPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    if (showPassword) return

    event.preventDefault()
    replacePasswordSelection(event.clipboardData.getData('text'))
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
      if (response && response.success) {
        const { token, refresh_token, user } = response.data
        const storage = keepLoggedIn ? window.localStorage : window.sessionStorage
        storage.setItem('access_token', token)
        if (refresh_token) {
          storage.setItem('refresh_token', refresh_token)
        }
        if (user) {
          storage.setItem('user_info', JSON.stringify(user))
        }
        onSignInSuccess(email, keepLoggedIn)
      } else if (isAccountNotFoundError(response?.message)) {
        setPasswordError('')
        setEmailError(accountNotFoundMessage)
      } else {
        setPasswordError(incorrectPasswordMessage)
      }
    } catch (error: any) {
      if (isAccountNotFoundError(error.message)) {
        setPasswordError('')
        setEmailError(accountNotFoundMessage)
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
        setCountdown(59)
      } else {
        setForgotEmailError(response.message || 'Failed to send OTP')
      }
    } catch (error: any) {
      setForgotEmailError(error.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleCloseForgotPassword = () => {
    if (isSendingCode) {
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
        setOtpError(response.message || 'Invalid OTP code')
      }
    } catch (error: any) {
      setOtpError(error.message || 'Verification failed. Please try again.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const startTimer = () => {
    setCountdown(59)
  }

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let hasError = false

    if (strength.score < 4) {
      setNewPasswordError('Password does not meet requirements.')
      hasError = true
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password.')
      hasError = true
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.')
      hasError = true
    }

    if (hasError) return

    setIsSendingCode(true)
    try {
      const response: any = await authApi.resetPassword(forgotEmail, newPassword)
      if (response && response.success) {
        alert('Password reset successful! Please log in.')
        handleCloseForgotPassword()
      } else {
        setConfirmPasswordError(response.message || 'Password reset failed')
      }
    } catch (error: any) {
      setConfirmPasswordError(error.message || 'Password reset failed. Please try again.')
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

        <form className="login-form" onSubmit={handleSubmit} noValidate>
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
                ref={passwordInputRef}
                id="password"
                name="password"
                type="text"
                value={showPassword ? password : '*'.repeat(password.length)}
                onChange={handlePasswordChange}
                onKeyDown={handlePasswordKeyDown}
                onPaste={handlePasswordPaste}
                placeholder="********"
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
                setOtp={setOtp}
                otpError={otpError}
                setOtpError={setOtpError}
                otpInputsRef={otpInputsRef}
                countdown={countdown}
                isLoading={isSendingCode}
                handleOtpChange={handleOtpChange}
                handleOtpKeyDown={handleOtpKeyDown}
                handleOtpPaste={handleOtpPaste}
                handleVerifyOtp={handleVerifyOtp}
                handleBackToLogin={handleCloseForgotPassword}
                startTimer={startTimer}
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
