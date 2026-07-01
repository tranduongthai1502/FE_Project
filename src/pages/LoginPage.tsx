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

const emptyOtp = ['', '', '', '', '', '']
type ForgotStep = 'email' | 'otp' | 'reset'

type LoginPageProps = {
  onGoToSignup: () => void
  onSignInSuccess: (email: string, keepLoggedIn: boolean) => void
}

export function LoginPage({ onGoToSignup, onSignInSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState(emptyOtp)
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

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextPassword = event.target.value
    setPassword(nextPassword)
    if (passwordError) {
      setPasswordError(validateRequired(nextPassword, 'Please enter your password.'))
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const nextEmailError = validateEmail(email)
    const nextPasswordError = validateRequired(password, 'Please enter your password.')

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)

    if (nextEmailError || nextPasswordError) {
      return
    }

    setIsLoading(true)
    window.setTimeout(() => {
      setIsLoading(false)
      onSignInSuccess(email, keepLoggedIn)
    }, 800)
  }

  const handleSendCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextEmailError = validateEmail(forgotEmail)
    setForgotEmailError(nextEmailError)

    if (nextEmailError) {
      return
    }

    setIsSendingCode(true)
    window.setTimeout(() => {
      setIsSendingCode(false)
      setForgotStep('otp')
      setCountdown(59)
    }, 800)
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

  const handleVerifyOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (otp.join('').length < 6) {
      setOtpError('Please enter the OTP code.')
      return
    }

    setIsSendingCode(true)
    window.setTimeout(() => {
      setIsSendingCode(false)
      setForgotStep('reset')
    }, 800)
  }

  const startTimer = () => {
    setCountdown(59)
  }

  const handleResetPassword = (event: FormEvent<HTMLFormElement>) => {
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
    window.setTimeout(() => {
      setIsSendingCode(false)
      handleCloseForgotPassword()
    }, 800)
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
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
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
            {isLoading ? 'Signing in' : 'Sign in'}
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
