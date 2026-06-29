import React, { useState } from 'react'
import { validateEmail } from '../utils/validation'
import { getPasswordStrength } from '../utils/passwordStrength'

export function RegisterForm({
  setStep,
  isLoading: parentIsLoading,
  handleSignUpSubmit,
  triggerToast,
}) {
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

  const strength = getPasswordStrength(password)

  const validateName = (val) => {
    if (!val.trim()) return 'Please enter your full name.'
    if (val.trim().length < 2) return 'Name must be at least 2 characters.'
    return ''
  }

  const validatePhone = (val) => {
    if (!val.trim()) return 'Please enter your phone number.'
    const phoneRegex = /^\d{10,11}$/
    if (!phoneRegex.test(val.trim())) return 'Please enter a valid phone number (10-11 digits).'
    return ''
  }

  const validatePassword = (val) => {
    if (!val) return 'Please enter a password.'
    if (val.length < 8) return 'Password must be at least 8 characters.'
    
    const hasLetter = /[a-zA-Z]/.test(val)
    const hasNumber = /\d/.test(val)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val)
    
    if (!hasLetter || !hasNumber || !hasSpecial) {
      return 'Password must contain at least one letter, one number, and one special character.'
    }
    return ''
  }

  const validateConfirmPassword = (val, pass) => {
    if (!val) return 'Please confirm your password.'
    if (val !== pass) return 'Passwords do not match.'
    return ''
  }

  const onSubmit = (e) => {
    e.preventDefault()
    
    const nErr = validateName(fullName)
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
            placeholder="Eliot Huang"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              if (nameError) setNameError(validateName(e.target.value))
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
            placeholder="xingqiu99@gmail.com"
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
            placeholder="0475845252"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              if (phoneError) setPhoneError(validatePhone(e.target.value))
            }}
            disabled={isLoading}
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
            placeholder="*********"
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
            <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        {passwordError && <span className="error-text">{passwordError}</span>}
      </div>

      {/* Confirm Password */}
      <div className="form-group">
        <label htmlFor="regConfirmPass" className="form-label font-bold">Confirm password</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <i className="fa-solid fa-lock"></i>
          </span>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="regConfirmPass"
            className={`form-input form-input-with-icon ${confirmPasswordError ? 'has-error' : ''}`}
            placeholder="*************"
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
            <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        {confirmPasswordError && <span className="error-text">{confirmPasswordError}</span>}
      </div>

      {/* Password Strength Section */}
      <div className="form-group password-strength-group">
        <div className="strength-header-row">
          <span className="strength-title-label">PASSWORD STRENGTH</span>
          <span className={`strength-value-label ${strength.strengthClass}`}>
            {strength.strengthLabel === 'Weak' ? 'Week' : strength.strengthLabel}
          </span>
        </div>
        <div className="strength-segments-container">
          <div className={`strength-segment ${password && strength.score >= 1 ? `active-${strength.strengthClass}` : ''}`} />
          <div className={`strength-segment ${password && strength.score >= 2 ? `active-${strength.strengthClass}` : ''}`} />
          <div className={`strength-segment ${password && strength.score >= 3 ? `active-${strength.strengthClass}` : ''}`} />
          <div className={`strength-segment ${password && strength.score >= 4 ? `active-${strength.strengthClass}` : ''}`} />
        </div>
        <p className="strength-hint-text">Hint: Use mixed case, numbers, and symbols.</p>
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

      <div className="form-footer footer-centered-text">
        <span>Do you have an account?</span>
        <button
          type="button"
          className="footer-link-btn font-bold-red"
          onClick={() => setStep('login')}
          disabled={isLoading}
        >
          Log in
        </button>
      </div>
    </form>
  )
}
