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
  const [rememberMe, setRememberMe] = useState(true)

  const [email, setEmail] = useState('admin@company.com')
  const [password, setPassword] = useState('12345678')
  
  const [localEmailError, setLocalEmailError] = useState('')
  const [localPasswordError, setLocalPasswordError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    
    const eErr = validateEmail(email)
    let pErr = ''
    if (!password) {
      pErr = 'Please enter your password.'
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


      {/* Email Address */}
      <div className="form-group">
        <label htmlFor="loginEmail" className="form-label font-bold">Email Address</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <i className="fa-regular fa-envelope"></i>
          </span>
          <input
            type="email"
            id="loginEmail"
            className={`form-input form-input-with-icon ${localEmailError ? 'has-error' : ''}`}
            placeholder="Enter your email"
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
        <div className="form-label-row">
          <label htmlFor="loginPass" className="form-label font-bold" style={{ marginBottom: 0 }}>Password</label>
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
        <div className="input-wrapper">
          <span className="input-icon-left">
            <i className="fa-solid fa-lock"></i>
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            id="loginPass"
            className={`form-input form-input-with-icon ${localPasswordError ? 'has-error' : ''}`}
            placeholder="********"
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
            <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        {localPasswordError && (
          <span className="error-text">
            {localPasswordError}
          </span>
        )}
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
          <span className="checkbox-label">Keep me logged in</span>
        </label>
      </div>

      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="spinner" aria-hidden="true" />
            <span>Logging in...</span>
          </>
        ) : (
          <span>Login</span>
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
