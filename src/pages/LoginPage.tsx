import { useState, type ChangeEvent, type FormEvent } from 'react'
import { AuthLayout } from '../components/layout/AuthLayout'
import { EyeIcon, GoogleIcon, LockIcon, MailIcon } from '../components/icons/Icons'

type LoginPageProps = {
  onGoToSignup: () => void
  onSignInSuccess: () => void
}

export function LoginPage({ onGoToSignup, onSignInSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    window.setTimeout(() => {
      setIsLoading(false)
      onSignInSuccess()
    }, 800)
  }

  return (
    <AuthLayout>
      <div className="form-shell">
        <header className="form-header">
          <h2>Welcome Back</h2>
          <p>Enter your credentials to access your dashboard.</p>
        </header>

        <button type="button" className="google-button">
          <GoogleIcon />
          <span>Google</span>
        </button>

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrap">
              <MailIcon />
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="field-group password-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <a href="#forgot">Forgot password?</a>
            </div>
            <div className="input-wrap">
              <LockIcon />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="********"
                autoComplete="current-password"
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
    </AuthLayout>
  )
}
