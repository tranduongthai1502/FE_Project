import { useState, type FormEvent } from 'react'
import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '../utils/validation'

type RegisterFormProps = {
  setStep: (step: 'login' | 'register' | 'forgot' | 'otp' | 'reset') => void
  isLoading?: boolean
  handleSignUpSubmit?: (event: FormEvent<HTMLFormElement>) => void
  triggerToast?: (message: string) => void
}

export function RegisterForm({
  setStep,
  isLoading: parentIsLoading = false,
  handleSignUpSubmit,
  triggerToast,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  
  const [localIsLoading, setLocalIsLoading] = useState(false)
  const isLoading = parentIsLoading || localIsLoading

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const nErr = validateFullName(fullName)
    const eErr = validateEmail(email)
    const pErr = validatePhone(phone)
    const passErr = validatePassword(password)
    const cPassErr = validateConfirmPassword(confirmPassword, password)
    
    setNameError(nErr)
    setEmailError(eErr)
    setPhoneError(pErr)
    setPasswordError(passErr)
    setConfirmPasswordError(cPassErr)
    
    if (nErr || eErr || pErr || passErr || cPassErr) {
      return
    }
    
    if (handleSignUpSubmit) {
      handleSignUpSubmit(e)
    } else {
      setLocalIsLoading(true)
      setTimeout(() => {
        setLocalIsLoading(false)
        setStep('login')
        if (triggerToast) {
          triggerToast("Register succeeded. Please log in.")
        }
      }, 1500)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="auth-form-content register-form-style">
      <div className="form-header centered-header">
        <h1 className="form-title large-title">Sign up</h1>
      </div>

      {/* Full Name */}
      <div className="form-group">
        <label htmlFor="regName" className="form-label font-bold">Your Full Name</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <i className="fa-regular fa-user"></i>
          </span>
          <input
            type="text"
            id="regName"
            className={`form-input form-input-with-icon ${nameError ? 'has-error' : ''}`}
            placeholder="full name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              if (nameError) setNameError(validateFullName(e.target.value))
            }}
            disabled={isLoading}
            required
          />
        </div>
        {nameError && <span className="error-text">{nameError}</span>}
      </div>

      {/* Email Address */}
      <div className="form-group">
        <label htmlFor="regEmail" className="form-label font-bold">Email Address</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <i className="fa-regular fa-envelope"></i>
          </span>
          <input
            type="email"
            id="regEmail"
            className={`form-input form-input-with-icon ${emailError ? 'has-error' : ''}`}
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (emailError) setEmailError(validateEmail(e.target.value))
            }}
            disabled={isLoading}
            required
          />
        </div>
        {emailError && <span className="error-text">{emailError}</span>}
      </div>

      {/* Phone Number */}
      <div className="form-group">
        <label htmlFor="regPhone" className="form-label font-bold">Phone Number</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <i className="fa-solid fa-phone"></i>
          </span>
          <input
            type="tel"
            id="regPhone"
            className={`form-input form-input-with-icon ${phoneError ? 'has-error' : ''}`}
            placeholder="0xxxxxxxxx"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              if (phoneError) setPhoneError(validatePhone(e.target.value))
            }}
            disabled={isLoading}
            inputMode="numeric"
            maxLength={10}
            required
          />
        </div>
        {phoneError && <span className="error-text">{phoneError}</span>}
      </div>

      {/* Password */}
      <div className="form-group">
        <label htmlFor="regPass" className="form-label font-bold">Password</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <i className="fa-solid fa-lock"></i>
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            id="regPass"
            className={`form-input form-input-with-icon ${passwordError ? 'has-error' : ''}`}
            placeholder="********"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (passwordError) setPasswordError(validatePassword(e.target.value))
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
        {passwordError && <span className="error-text">{passwordError}</span>}
      </div>

      {/* Confirm Password */}
      <div className="form-group">
        <label htmlFor="regConfirmPass" className="form-label font-bold">Confirm Password</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <i className="fa-solid fa-lock"></i>
          </span>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="regConfirmPass"
            className={`form-input form-input-with-icon ${confirmPasswordError ? 'has-error' : ''}`}
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (confirmPasswordError) setConfirmPasswordError(validateConfirmPassword(e.target.value, password))
            }}
            disabled={isLoading}
            required
          />
          <button
            type="button"
            className="eye-icon-btn"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        {confirmPasswordError && <span className="error-text">{confirmPasswordError}</span>}
      </div>

      <button type="submit" className="submit-btn register-submit-btn" disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="spinner" aria-hidden="true" />
            <span>Signing up...</span>
          </>
        ) : (
          <span>Sign up</span>
        )}
      </button>

      <div className="divider-text uppercase-divider">
        <span>Or continue with</span>
      </div>

      <div className="google-center-wrapper">
        <button type="button" className="google-signin-btn-narrow" disabled={isLoading}>
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Google</span>
        </button>
      </div>

      <div className="form-footer footer-centered-text">
        <span>Do you have an account?</span>
        <button
          type="button"
          className="footer-link-btn font-bold-red"
          onClick={() => setStep('login')}
          disabled={isLoading}
        >
          Sign in
        </button>
      </div>
    </form>
  )
}
