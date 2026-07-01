import { useState, type ChangeEvent, type FormEvent } from 'react'
import { AuthLayout } from '../components/layout/AuthLayout'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, PhoneIcon, UserIcon } from '../components/icons/Icons'
import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '../features/auth/utils/validation'
import { getPasswordStrength } from '../features/auth/utils/passwordStrength'

type SignupPageProps = {
  onGoToSignin: () => void
}

export function SignupPage({ onGoToSignin }: SignupPageProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fullNameError, setFullNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const passwordStrength = getPasswordStrength(password)
  const visibleStrengthScore = password ? passwordStrength.score : 0

  const handleInput =
    (setter: (value: string) => void, clearError?: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value
      setter(nextValue)
      clearError?.(nextValue)
    }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const nextFullNameError = validateFullName(fullName)
    const nextEmailError = validateEmail(email)
    const nextPhoneError = validatePhone(phone)
    const nextPasswordError = validatePassword(password)
    const nextConfirmPasswordError = validateConfirmPassword(confirmPassword, password)

    setFullNameError(nextFullNameError)
    setEmailError(nextEmailError)
    setPhoneError(nextPhoneError)
    setPasswordError(nextPasswordError)
    setConfirmPasswordError(nextConfirmPasswordError)

    if (
      nextFullNameError ||
      nextEmailError ||
      nextPhoneError ||
      nextPasswordError ||
      nextConfirmPasswordError
    ) {
      return
    }

    setIsLoading(true)
    window.setTimeout(() => setIsLoading(false), 800)
  }

  return (
    <AuthLayout isSignup>
      <div className="form-shell signup-shell">
        <header className="signup-header">
          <h2>Sign up</h2>
        </header>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="fullName">Your Full Name</label>
            <div className={`input-wrap ${fullNameError ? 'has-error' : ''}`}>
              <UserIcon />
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={fullName}
                onChange={handleInput(setFullName, (value) => {
                  if (fullNameError) setFullNameError(validateFullName(value))
                })}
                placeholder="full name"
                autoComplete="name"
                aria-invalid={fullNameError ? 'true' : 'false'}
                aria-describedby={fullNameError ? 'full-name-error' : undefined}
              />
            </div>
            {fullNameError && (
              <span id="full-name-error" className="field-error">
                {fullNameError}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="signupEmail">Email Address</label>
            <div className={`input-wrap ${emailError ? 'has-error' : ''}`}>
              <MailIcon />
              <input
                id="signupEmail"
                name="email"
                type="email"
                value={email}
                onChange={handleInput(setEmail, (value) => {
                  if (emailError) setEmailError(validateEmail(value))
                })}
                placeholder="name@company.com"
                autoComplete="email"
                aria-invalid={emailError ? 'true' : 'false'}
                aria-describedby={emailError ? 'signup-email-error' : undefined}
              />
            </div>
            {emailError && (
              <span id="signup-email-error" className="field-error">
                {emailError}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="phone">Phone Number</label>
            <div className={`input-wrap ${phoneError ? 'has-error' : ''}`}>
              <PhoneIcon />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={handleInput(setPhone, (value) => {
                  if (phoneError) setPhoneError(validatePhone(value))
                })}
                placeholder="0xxxxxxxxx"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                aria-invalid={phoneError ? 'true' : 'false'}
                aria-describedby={phoneError ? 'phone-error' : undefined}
              />
            </div>
            {phoneError && (
              <span id="phone-error" className="field-error">
                {phoneError}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="signupPassword">Password</label>
            <div className={`input-wrap ${passwordError ? 'has-error' : ''}`}>
              <LockIcon />
              <input
                id="signupPassword"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handleInput(setPassword, (value) => {
                  if (passwordError) setPasswordError(validatePassword(value))
                  if (confirmPasswordError) {
                    setConfirmPasswordError(validateConfirmPassword(confirmPassword, value))
                  }
                })}
                placeholder="********"
                autoComplete="new-password"
                aria-invalid={passwordError ? 'true' : 'false'}
                aria-describedby={passwordError ? 'signup-password-error' : undefined}
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
              <span id="signup-password-error" className="field-error">
                {passwordError}
              </span>
            )}
            <div className="register-strength" aria-live="polite">
              <div className="register-strength-header">
                <span>PASSWORD STRENGTH</span>
                <span className={`register-strength-label ${password ? passwordStrength.strengthClass : ''}`}>
                  {password ? passwordStrength.strengthLabel : ''}
                </span>
              </div>
              <div className="register-strength-segments" aria-hidden="true">
                <span className={`register-strength-segment ${visibleStrengthScore >= 1 ? passwordStrength.strengthClass : ''}`} />
                <span className={`register-strength-segment ${visibleStrengthScore >= 2 ? passwordStrength.strengthClass : ''}`} />
                <span className={`register-strength-segment ${visibleStrengthScore >= 3 ? passwordStrength.strengthClass : ''}`} />
                <span className={`register-strength-segment ${visibleStrengthScore >= 4 ? passwordStrength.strengthClass : ''}`} />
              </div>
              <p className="register-strength-hint">Hint: Use mixed case, numbers, and symbols.</p>
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={`input-wrap ${confirmPasswordError ? 'has-error' : ''}`}>
              <LockIcon />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={handleInput(setConfirmPassword, (value) => {
                  if (confirmPasswordError) {
                    setConfirmPasswordError(validateConfirmPassword(value, password))
                  }
                })}
                placeholder="********"
                autoComplete="new-password"
                aria-invalid={confirmPasswordError ? 'true' : 'false'}
                aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirmPassword((value) => !value)}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirmPasswordError && (
              <span id="confirm-password-error" className="field-error">
                {confirmPasswordError}
              </span>
            )}
          </div>

          <button type="submit" className="submit-button signup-submit" disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

        <p className="signup-copy signin-copy">
          Already have an account?
          <button type="button" onClick={onGoToSignin}>
            Sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
