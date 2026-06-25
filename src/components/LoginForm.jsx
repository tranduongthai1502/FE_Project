import React, { useState } from 'react'
import { validateEmail } from '../utils/validation'

export function LoginForm({
  setStep,
  setEmail: setParentEmail,
  setEmailError: setParentEmailError,
  isLoading,
  handleSignInSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [email, setEmail] = useState('abcd123@example.com')
  const [password, setPassword] = useState('12345678')
  
  const [localEmailError, setLocalEmailError] = useState('')
  const [localPasswordError, setLocalPasswordError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    
    const eErr = validateEmail(email)
    let pErr = ''
    if (!password) {
      pErr = 'Please enter a password.'
    }
    
    setLocalEmailError(eErr)
    setLocalPasswordError(pErr)
    
    if (eErr || pErr) {
      return
    }
    
    handleSignInSubmit(e)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="auth-form-content">
      <div className="form-header">
        <h1 className="form-title">Welcome Back</h1>
        <p className="form-desc">
          Enter your credentials to access your dashboard.
        </p>
      </div>

      {/* Google Sign-in Button */}
      <button type="button" className="google-signin-btn" disabled={isLoading}>
        <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Sign in with Google</span>
      </button>

      <div className="divider-text">
        <span>Or continue with</span>
      </div>

      {/* Work Email */}
      <div className="form-group">
        <label htmlFor="loginEmail" className="form-label">Work Email</label>
        <div className="input-wrapper">
          <input
            type="email"
            id="loginEmail"
            className={`form-input ${localEmailError ? 'has-error' : ''}`}
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (localEmailError) setLocalEmailError(validateEmail(e.target.value))
            }}
            disabled={isLoading}
            required
          />
        </div>
        {localEmailError && <span className="error-text">{localEmailError}</span>}
      </div>

      {/* Password */}
      <div className="form-group">
        <label htmlFor="loginPass" className="form-label">Password</label>
        <div className="input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="loginPass"
            className={`form-input ${localPasswordError ? 'has-error' : ''}`}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (localPasswordError) setLocalPasswordError(e.target.value ? '' : 'Please enter a password.')
            }}
            disabled={isLoading}
            required
          />
          <button
            type="button"
            className="eye-icon-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        {localPasswordError && <span className="error-text">{localPasswordError}</span>}
      </div>

      <div className="form-options">
        <label className="remember-me-checkbox">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <span className="checkbox-custom"></span>
          <span className="checkbox-label">Remember me</span>
        </label>

        <button
          type="button"
          className="forgot-password-link"
          onClick={() => {
            setStep('forgot')
            setParentEmail('')
            setParentEmailError('')
          }}
          disabled={isLoading}
        >
          Forgot password?
        </button>
      </div>

      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="spinner" aria-hidden="true" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>

      <div className="form-footer">
        <span>Don't have an account?</span>
        <button
          type="button"
          className="footer-link-btn"
          onClick={() => setStep('register')}
          disabled={isLoading}
        >
          Sign up
        </button>
      </div>
    </form>
  )
}
