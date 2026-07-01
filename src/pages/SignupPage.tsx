import { useState, type ChangeEvent, type FormEvent } from 'react'
import { AuthLayout } from '../components/AuthLayout'
import { EyeIcon, GoogleIcon, LockIcon, MailIcon, PhoneIcon, UserIcon } from '../components/icons'
import { getPasswordStrength } from '../utils/passwordStrength'

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

  const handleInput =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value)
    }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    window.setTimeout(() => setIsLoading(false), 800)
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <AuthLayout isSignup>
      <div className="form-shell signup-shell signup-card">
        <header className="signup-header">
          <h2>Sign up</h2>
        </header>

        <form className="signup-form signup-form-layout" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="fullName">Your Full Name</label>
            <div className="input-wrap">
              <UserIcon />
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={fullName}
                onChange={handleInput(setFullName)}
                placeholder="full name"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="signupEmail">Email Address</label>
            <div className="input-wrap">
              <MailIcon />
              <input
                id="signupEmail"
                name="email"
                type="email"
                value={email}
                onChange={handleInput(setEmail)}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-wrap">
              <PhoneIcon />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={handleInput(setPhone)}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="signupPassword">Password</label>
            <div className="input-wrap">
              <LockIcon />
              <input
                id="signupPassword"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handleInput(setPassword)}
                autoComplete="new-password"
                placeholder="********"
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                <EyeIcon />
              </button>
            </div>

            <div className="password-strength-header">
              <span>PASSWORD STRENGTH</span>
              <span className={`strength-label ${passwordStrength.strengthClass}`}>{passwordStrength.strengthLabel}</span>
            </div>
            <div className="strength-bar-outer">
              <div
                className={`strength-bar-inner ${passwordStrength.strengthClass}`}
                style={{ width: password ? passwordStrength.progressWidth : '15%' }}
              />
            </div>
            <p className="password-hint">Hint: At least 8 character, use mixed case, numbers, and symbols.</p>
          </div>

          <div className="field-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrap">
              <LockIcon />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={handleInput(setConfirmPassword)}
                autoComplete="new-password"
                placeholder="********"
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirmPassword((value) => !value)}
              >
                <EyeIcon />
              </button>
            </div>
          </div>

          <button type="submit" className="submit-button signup-submit" disabled={isLoading}>
            {isLoading ? 'Signing up' : 'Sign up'}
          </button>
        </form>

        <div className="divider signup-divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <button type="button" className="google-button signup-google">
          <GoogleIcon />
          <span>Google</span>
        </button>

        <p className="signup-copy signin-copy">
          Do you have an account?
          <button type="button" onClick={onGoToSignin}>
            Sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
