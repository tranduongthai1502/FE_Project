import { useState, useRef, useEffect } from 'react'

function App() {
  const [step, setStep] = useState('login') // 'login' | 'forgot' | 'otp' | 'reset' | 'admin'
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const otpInputsRef = useRef([])

  // Resend OTP countdown timer
  const [countdown, setCountdown] = useState(59)
  const timerRef = useRef(null)

  // Reset Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Toast Notification state
  const [showToast, setShowToast] = useState(false)
  const [toastFadeOut, setToastFadeOut] = useState(false)
  const toastTimerRef = useRef(null)
  const toastFadeTimerRef = useRef(null)

  // Admin Account Settings state
  const [activeSidebarMenu, setActiveSidebarMenu] = useState('settings')
  const [activeSettingsTab, setActiveSettingsTab] = useState('change_password')
  
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('')
  const [adminNewPassword, setAdminNewPassword] = useState('')
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')
  
  const [adminCurrentPasswordError, setAdminCurrentPasswordError] = useState('')
  const [adminNewPasswordError, setAdminNewPasswordError] = useState('')
  const [adminConfirmPasswordError, setAdminConfirmPasswordError] = useState('')
  
  const [showAdminCurrentPassword, setShowAdminCurrentPassword] = useState(false)
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false)
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false)

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(59)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handle step-change side-effects (like timers)
  useEffect(() => {
    if (step === 'otp') {
      startTimer()
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [step])

  // Toast cleanup
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current)
    }
  }, [])

  const triggerToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current)
    
    setShowToast(true)
    setToastFadeOut(false)

    toastFadeTimerRef.current = setTimeout(() => {
      setToastFadeOut(true)
    }, 3000)

    toastTimerRef.current = setTimeout(() => {
      setShowToast(false)
    }, 3400)
  }

  // Validate email address
  const validateEmail = (val) => {
    if (!val) {
      return 'Please enter your email address.'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  // Evaluate password strength (for reset screen)
  const getPasswordStrength = () => {
    const requirements = {
      length: newPassword.length >= 8,
      case: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    }

    const score = Object.values(requirements).filter(Boolean).length
    
    let strengthLabel = 'Weak'
    let strengthClass = 'weak'
    let progressWidth = '25%'

    if (score === 3) {
      strengthLabel = 'Medium'
      strengthClass = 'medium'
      progressWidth = '60%'
    } else if (score === 4) {
      strengthLabel = 'Strong'
      strengthClass = 'strong'
      progressWidth = '100%'
    }

    return { requirements, score, strengthLabel, strengthClass, progressWidth }
  }

  const strength = getPasswordStrength()

  // Evaluate password strength (for admin settings screen)
  const getAdminPasswordStrength = () => {
    const requirements = {
      length: adminNewPassword.length >= 8,
      case: /[a-z]/.test(adminNewPassword) && /[A-Z]/.test(adminNewPassword),
      number: /\d/.test(adminNewPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(adminNewPassword),
    }

    const score = Object.values(requirements).filter(Boolean).length
    
    let strengthLabel = 'Weak'
    let strengthClass = 'weak'

    if (adminNewPassword) {
      if (score === 3) {
        strengthLabel = 'Medium'
        strengthClass = 'medium'
      } else if (score === 4) {
        strengthLabel = 'Strong'
        strengthClass = 'strong'
      }
    } else {
      // Default state matching screenshot (empty displays Weak)
      strengthLabel = 'Weak'
      strengthClass = 'weak'
    }

    return { requirements, score, strengthLabel, strengthClass }
  }

  const adminStrength = getAdminPasswordStrength()

  // Handle email form submission
  const handleSendCode = (e) => {
    e.preventDefault()
    const error = validateEmail(email)
    if (error) {
      setEmailError(error)
      return
    }

    setEmailError('')
    setIsLoading(true)

    // Simulate sending code via API
    setTimeout(() => {
      setIsLoading(false)
      setStep('otp')
    }, 1500)
  }

  // Handle individual OTP input changes
  const handleOtpChange = (element, index) => {
    const value = element.value
    if (isNaN(Number(value))) return

    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1) // Keep only the last character
    setOtp(newOtp)
    setOtpError('')

    // Move focus to next input if value is entered
    if (value && index < 5) {
      otpInputsRef.current[index + 1].focus()
    }
  }

  // Handle backspace in OTP input
  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp]
      
      // If current is empty, clear and move focus to previous input
      if (!otp[index] && index > 0) {
        newOtp[index - 1] = ''
        setOtp(newOtp)
        otpInputsRef.current[index - 1].focus()
      } else {
        newOtp[index] = ''
        setOtp(newOtp)
      }
      setOtpError('')
    }
  }

  // Handle paste in OTP input
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (!/^\d+$/.test(pastedData)) return // Only allow digits

    const pastedDigits = pastedData.slice(0, 6).split('')
    const newOtp = [...otp]
    
    pastedDigits.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit
      }
    })
    
    setOtp(newOtp)
    setOtpError('')

    // Focus last filled or next empty input
    const focusIndex = Math.min(pastedDigits.length, 5)
    if (otpInputsRef.current[focusIndex]) {
      otpInputsRef.current[focusIndex].focus()
    }
  }

  // Handle OTP verification submission
  const handleVerifyOtp = (e) => {
    e.preventDefault()
    const otpCode = otp.join('')
    
    if (otpCode.length < 6) {
      setOtpError('Please enter the OTP code.')
      return
    }

    setOtpError('')
    setIsLoading(true)

    // Simulate OTP verification API call
    setTimeout(() => {
      setIsLoading(false)
      setStep('reset')
    }, 1500)
  }

  // Handle Reset Password form submission
  const handleResetPassword = (e) => {
    e.preventDefault()
    let hasError = false

    if (strength.score < 4) {
      setNewPasswordError('Password does not meet requirements.')
      hasError = true
    } else {
      setNewPasswordError('')
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password.')
      hasError = true
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.')
      hasError = true
    } else {
      setConfirmPasswordError('')
    }

    if (hasError) return

    setIsLoading(true)

    // Simulate Reset Password API call
    setTimeout(() => {
      setIsLoading(false)
      
      // Redirect to login screen
      setStep('login')
      
      // Reset form variables
      setNewPassword('')
      setConfirmPassword('')
      setEmail('')
      setOtp(['', '', '', '', '', ''])
      
      // Pop up the success toast notification
      triggerToast()
    }, 1500)
  }

  // Handle Admin Change Password Form Submission
  const handleAdminSaveChanges = (e) => {
    e.preventDefault()
    let hasError = false

    if (!adminCurrentPassword) {
      setAdminCurrentPasswordError('Please enter current password.')
      hasError = true
    } else {
      setAdminCurrentPasswordError('')
    }

    if (!adminNewPassword) {
      setAdminNewPasswordError('Please enter new password.')
      hasError = true
    } else if (adminStrength.score < 4) {
      setAdminNewPasswordError('Password does not meet requirements.')
      hasError = true
    } else {
      setAdminNewPasswordError('')
    }

    if (!adminConfirmPassword) {
      setAdminConfirmPasswordError('Please enter confirm password.')
      hasError = true
    } else if (adminNewPassword !== adminConfirmPassword) {
      setAdminConfirmPasswordError('Passwords do not match.')
      hasError = true
    } else {
      setAdminConfirmPasswordError('')
    }

    if (hasError) return

    setIsLoading(true)

    // Simulate saving changes
    setTimeout(() => {
      setIsLoading(false)
      
      // Clear form
      setAdminCurrentPassword('')
      setAdminNewPassword('')
      setAdminConfirmPassword('')
      
      // Show success toast on top-right
      triggerToast()
    }, 1200)
  }

  // Clear admin change password form
  const handleAdminCancel = () => {
    setAdminCurrentPassword('')
    setAdminNewPassword('')
    setAdminConfirmPassword('')
    setAdminCurrentPasswordError('')
    setAdminNewPasswordError('')
    setAdminConfirmPasswordError('')
  }

  // Back to login from forgot password screen
  const handleBackToLogin = () => {
    setStep('login')
    setEmail('')
    setEmailError('')
    setNewPassword('')
    setConfirmPassword('')
    setNewPasswordError('')
    setConfirmPasswordError('')
  }

  // Login handler
  const handleSignInSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API sign in
    setTimeout(() => {
      setIsLoading(false)
      setStep('admin')
      handleAdminCancel()
    }, 1000)
  }

  return (
    <>
      {/* Floating Success Toast Alert (renders globally over dashboard and cards) */}
      {showToast && (
        <div className={`toast-notification ${toastFadeOut ? 'hide' : ''}`} role="alert" aria-live="assertive">
          <span className="toast-icon">
            <i className="fa-regular fa-square-check"></i>
          </span>
          <span className="toast-text">Password reset successful.</span>
        </div>
      )}

      {step !== 'admin' ? (
        <div style={{ width: '100%', maxWidth: '460px', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* Main Card for Auth Flows */}
          <div className="auth-card">
            {step === 'login' && (
              <form onSubmit={handleSignInSubmit} noValidate>
                <div className="card-header" style={{ justifyContent: 'center', marginBottom: '8px' }}>
                  <h1 className="card-title" style={{ fontSize: '26px' }}>Sign In</h1>
                </div>

                <p className="card-desc" style={{ textAlign: 'center', marginBottom: '28px' }}>
                  Access your JobFusion account.
                </p>

                <div className="form-group">
                  <label htmlFor="loginEmail" className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="loginEmail"
                      className="form-input"
                      placeholder="Enter your email"
                      defaultValue="abcd123@example.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label htmlFor="loginPass" className="form-label" style={{ marginBottom: 0 }}>Password</label>
                    <button 
                      type="button" 
                      className="footer-link" 
                      style={{ fontSize: '13px', padding: 0 }}
                      onClick={() => { setStep('forgot'); setEmail(''); setEmailError(''); }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      id="loginPass"
                      className="form-input"
                      placeholder="Enter your password"
                      defaultValue="••••••••"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn" style={{ marginTop: '8px' }} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="spinner" aria-hidden="true" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>

                <div className="divider"></div>

                <div className="card-footer" style={{ fontSize: '14.2px', color: 'var(--text-muted)' }}>
                  Don't have an account?&nbsp;
                  <button 
                    type="button" 
                    className="footer-link" 
                    style={{ padding: 0 }}
                    onClick={() => alert('Redirecting to Sign Up screen...')}
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            )}

            {step === 'forgot' && (
              <form onSubmit={handleSendCode} noValidate>
                <div className="card-header">
                  <button 
                    type="button" 
                    className="back-icon-btn" 
                    aria-label="Go back"
                    onClick={handleBackToLogin}
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <h1 className="card-title">Forgot Password</h1>
                </div>

                <p className="card-desc">
                  Enter the email address associated with your account and we'll send you a verification code to reset your password.
                </p>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="email"
                      className={`form-input ${emailError ? 'has-error' : ''}`}
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailError) setEmailError(validateEmail(e.target.value))
                      }}
                      disabled={isLoading}
                      autoComplete="email"
                    />
                    {emailError && (
                      <span className="input-error-icon">
                        <i className="fa-solid fa-circle-exclamation"></i>
                      </span>
                    )}
                  </div>
                  {emailError && <span className="error-text">{emailError}</span>}
                </div>

                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="spinner" aria-hidden="true" />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <span>Send code</span>
                  )}
                </button>

                <div className="divider"></div>

                <div className="card-footer">
                  <button 
                    type="button" 
                    className="footer-link"
                    onClick={handleBackToLogin}
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Back to Login</span>
                  </button>
                </div>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} noValidate>
                <div className="shield-icon-container">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>

                <h1 className="card-title" style={{ textAlign: 'center', marginBottom: '8px', fontSize: '24px' }}>
                  {otpError ? 'OTP Verification Error - Invalid' : 'Verify Your Email'}
                </h1>

                <p className="card-desc" style={{ textAlign: 'center', marginBottom: '28px' }}>
                  We've sent a 6-digit code to your email.<br />Enter it below to continue.
                </p>

                <div className="form-group" style={{ textAlign: 'center' }}>
                  <div className="otp-container" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        className={`otp-input ${otpError ? 'has-error' : ''}`}
                        value={digit}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        onChange={(e) => handleOtpChange(e.target, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        disabled={isLoading}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    ))}
                  </div>
                  {otpError && (
                    <span className="error-text" style={{ display: 'block', margin: '8px 0 0', textAlign: 'center' }}>
                      {otpError}
                    </span>
                  )}
                </div>

                <button type="submit" className="submit-btn" disabled={isLoading} style={{ marginTop: '8px' }}>
                  {isLoading ? (
                    <>
                      <div className="spinner" aria-hidden="true" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify OTP</span>
                  )}
                </button>

                <div className="resend-text" style={{ textAlign: 'center', marginTop: '20px' }}>
                  Didn't receive the code? 
                  <button 
                    type="button" 
                    className="resend-link"
                    disabled={countdown > 0 || isLoading}
                    onClick={() => {
                      alert('Verification code resent successfully!');
                      setOtp(['', '', '', '', '', '']);
                      setOtpError('');
                      startTimer();
                    }}
                  >
                    Resend Code {countdown > 0 ? `(${countdown}s)` : ''}
                  </button>
                </div>

                <div className="divider"></div>

                <div className="card-footer">
                  <button 
                    type="button" 
                    className="footer-link" 
                    onClick={handleBackToLogin}
                    disabled={isLoading}
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Back to Login</span>
                  </button>
                </div>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} noValidate>
                <div className="reset-icon-container">
                  <span className="fa-stack">
                    <i className="fa-solid fa-arrow-rotate-left fa-stack-2x"></i>
                    <i className="fa-solid fa-lock fa-stack-1x" style={{ fontSize: '0.58em', transform: 'translateY(1px)' }}></i>
                  </span>
                </div>

                <h1 className="card-title" style={{ textAlign: 'center', marginBottom: '8px', fontSize: '24px' }}>
                  Reset Password
                </h1>

                <p className="card-desc" style={{ textAlign: 'center', marginBottom: '28px' }}>
                  Secure your JobFusion account with a new, strong password.
                </p>

                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <div className="input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      className={`form-input ${newPasswordError ? 'has-error' : ''}`}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (newPasswordError) setNewPasswordError('')
                      }}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="eye-icon-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {newPasswordError && <span className="error-text">{newPasswordError}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                  <div className="input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      className={`form-input ${confirmPasswordError ? 'has-error' : ''}`}
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (confirmPasswordError) setConfirmPasswordError('')
                      }}
                      disabled={isLoading}
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

                <div className="requirements-box">
                  <div className="requirements-header">
                    <div className="requirements-header-title">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4Q10 12 18 12Q10 12 10 20Q10 12 2 12Q10 12 10 4Z" />
                        <path d="M18 2Q18 6 22 6Q18 6 18 10Q18 6 14 6Q18 6 18 2Z" />
                        <path d="M19 13Q19 17 23 17Q19 17 19 21Q19 17 15 17Q19 17 19 13Z" />
                      </svg>
                      <span>Password Requirements</span>
                    </div>
                    <span className={`strength-label ${strength.strengthClass}`}>
                      {strength.strengthLabel}
                    </span>
                  </div>

                  <div className="strength-bar-outer">
                    <div 
                      className={`strength-bar-inner ${strength.strengthClass}`} 
                      style={{ width: newPassword ? strength.progressWidth : '25%' }}
                    />
                  </div>

                  <ul className="req-list">
                    <li className={`req-item ${strength.requirements.length ? 'met' : ''}`}>
                      <i className={strength.requirements.length ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-check'}></i>
                      <span>At least 8 characters</span>
                    </li>
                    <li className={`req-item ${strength.requirements.case ? 'met' : ''}`}>
                      <i className={strength.requirements.case ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-check'}></i>
                      <span>Uppercase & lowercase letters</span>
                    </li>
                    <li className={`req-item ${strength.requirements.number ? 'met' : ''}`}>
                      <i className={strength.requirements.number ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-check'}></i>
                      <span>At least one number</span>
                    </li>
                    <li className={`req-item ${strength.requirements.special ? 'met' : ''}`}>
                      <i className={strength.requirements.special ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle-check'}></i>
                      <span>At least one special character</span>
                    </li>
                  </ul>
                </div>

                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="spinner" aria-hidden="true" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>

                <div className="divider"></div>

                <div className="card-footer">
                  <button 
                    type="button" 
                    className="footer-link" 
                    onClick={handleBackToLogin}
                    disabled={isLoading}
                  >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Back to login</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* WIDESCREEN ADMIN DASHBOARD (State matching the new layout screenshot) */
        <div className="admin-dashboard">
          {/* Sidebar */}
          <aside className="admin-sidebar">
            <div className="sidebar-logo-section">
              <div className="sidebar-logo">
                <i className="fa-solid fa-circle" style={{ fontSize: '12px', color: 'var(--primary-color)' }}></i>
                JobFusion
              </div>
              <span className="sidebar-logo-sub">AI Talent Suite</span>
            </div>

            <ul className="sidebar-menu">
              <li className={`sidebar-menu-item ${activeSidebarMenu === 'dashboard' ? 'active' : ''}`}>
                <button type="button" onClick={() => setActiveSidebarMenu('dashboard')}>
                  <i className="fa-solid fa-grip"></i>
                  <span>Dashboard</span>
                </button>
              </li>
              <li className={`sidebar-menu-item ${activeSidebarMenu === 'jobs' ? 'active' : ''}`}>
                <button type="button" onClick={() => setActiveSidebarMenu('jobs')}>
                  <i className="fa-solid fa-briefcase"></i>
                  <span>Jobs</span>
                </button>
              </li>
              <li className={`sidebar-menu-item ${activeSidebarMenu === 'candidates' ? 'active' : ''}`}>
                <button type="button" onClick={() => setActiveSidebarMenu('candidates')}>
                  <i className="fa-solid fa-users"></i>
                  <span>Candidates</span>
                </button>
              </li>
              <li className={`sidebar-menu-item ${activeSidebarMenu === 'emails' ? 'active' : ''}`}>
                <button type="button" onClick={() => setActiveSidebarMenu('emails')}>
                  <i className="fa-solid fa-envelope"></i>
                  <span>Email Management</span>
                </button>
              </li>
              <li className={`sidebar-menu-item ${activeSidebarMenu === 'interviews' ? 'active' : ''}`}>
                <button type="button" onClick={() => setActiveSidebarMenu('interviews')}>
                  <i className="fa-solid fa-calendar-days"></i>
                  <span>Interviews</span>
                </button>
              </li>
              <li className={`sidebar-menu-item ${activeSidebarMenu === 'analytics' ? 'active' : ''}`}>
                <button type="button" onClick={() => setActiveSidebarMenu('analytics')}>
                  <i className="fa-solid fa-chart-line"></i>
                  <span>Analytics</span>
                </button>
              </li>
              <li className={`sidebar-menu-item ${activeSidebarMenu === 'settings' ? 'active' : ''}`}>
                <button type="button" onClick={() => setActiveSidebarMenu('settings')}>
                  <i className="fa-solid fa-gear"></i>
                  <span>Settings</span>
                </button>
              </li>
            </ul>
          </aside>

          {/* Main Content Area */}
          <main className="admin-main">
            {/* Header */}
            <header className="admin-header">
              <div className="header-search-wrapper">
                <i className="fa-solid fa-magnifying-glass header-search-icon"></i>
                <input 
                  type="text" 
                  className="header-search-input" 
                  placeholder="Search candidates, skills, or locations..." 
                />
              </div>

              <div className="header-actions">
                <button type="button" className="workspace-btn">
                  Workspace Switcher
                </button>

                <button type="button" className="header-icon-link" aria-label="Notifications">
                  <i className="fa-regular fa-bell"></i>
                </button>

                <button type="button" className="header-icon-link" aria-label="Help Center">
                  <i className="fa-regular fa-circle-question"></i>
                </button>

                <div className="user-profile-section">
                  <div className="user-avatar-placeholder">AT</div>
                  <div className="user-info">
                    <span className="user-name">Alex Thompson</span>
                    <span className="user-role">HR</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Content Body */}
            <div className="admin-content-wrapper">
              <button type="button" className="back-home-link" onClick={handleBackToLogin}>
                <i className="fa-solid fa-arrow-left"></i>
                <span>Back to Home</span>
              </button>

              <h2 className="admin-page-title">Account Settings</h2>

              <div className="settings-grid">
                {/* Security Tabs Card */}
                <div className="settings-tabs-card">
                  <span className="tabs-group-title">Security Tabs</span>
                  
                  <button 
                    type="button" 
                    className={`settings-tab-btn ${activeSettingsTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveSettingsTab('profile')}
                  >
                    <i className="fa-regular fa-user"></i>
                    <span>Profile Information</span>
                  </button>

                  <button 
                    type="button" 
                    className={`settings-tab-btn ${activeSettingsTab === 'change_password' ? 'active' : ''}`}
                    onClick={() => setActiveSettingsTab('change_password')}
                  >
                    <i className="fa-solid fa-lock"></i>
                    <span>Change Password</span>
                  </button>
                </div>

                {/* Settings Form Card (Right Column) */}
                <div className="settings-form-card">
                  <button 
                    type="button" 
                    style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
                    onClick={handleAdminCancel}
                    aria-label="Clear form"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>

                  <h3 className="settings-form-title">Change Password</h3>
                  <p className="settings-form-desc">
                    Update your account password to maintain security. We recommend using a unique password you don't use elsewhere.
                  </p>

                  <form onSubmit={handleAdminSaveChanges} noValidate>
                    {/* Current Password */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <div className="form-label-row">
                        <label htmlFor="adminCurrentPass" className="form-label" style={{ marginBottom: 0 }}>
                          Current Password <span style={{ color: 'var(--error-color)' }}>*</span>
                        </label>
                        {adminCurrentPasswordError && (
                          <span className="form-label-error">{adminCurrentPasswordError}</span>
                        )}
                      </div>
                      <div className="input-wrapper">
                        <input
                          type={showAdminCurrentPassword ? 'text' : 'password'}
                          id="adminCurrentPass"
                          className={`form-input ${adminCurrentPasswordError ? 'has-error' : ''}`}
                          placeholder="••••••••"
                          value={adminCurrentPassword}
                          onChange={(e) => {
                            setAdminCurrentPassword(e.target.value)
                            if (adminCurrentPasswordError) setAdminCurrentPasswordError('')
                          }}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="eye-icon-btn"
                          onClick={() => setShowAdminCurrentPassword(!showAdminCurrentPassword)}
                          aria-label={showAdminCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={`fa-solid ${showAdminCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <div className="form-label-row">
                        <label htmlFor="adminNewPass" className="form-label" style={{ marginBottom: 0 }}>
                          New Password <span style={{ color: 'var(--error-color)' }}>*</span>
                        </label>
                        {adminNewPasswordError && (
                          <span className="form-label-error">{adminNewPasswordError}</span>
                        )}
                      </div>
                      <div className="input-wrapper">
                        <input
                          type={showAdminNewPassword ? 'text' : 'password'}
                          id="adminNewPass"
                          className={`form-input ${adminNewPasswordError ? 'has-error' : ''}`}
                          placeholder="•••••••••••••••"
                          value={adminNewPassword}
                          onChange={(e) => {
                            setAdminNewPassword(e.target.value)
                            if (adminNewPasswordError) setAdminNewPasswordError('')
                          }}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="eye-icon-btn"
                          onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                          aria-label={showAdminNewPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={`fa-solid ${showAdminNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    {/* Password Strength segments indicator */}
                    <div style={{ marginBottom: '20px' }}>
                      <div className="form-label-row">
                        <span className="form-label" style={{ marginBottom: 0, textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                          Password Strength
                        </span>
                        {adminNewPassword && (
                          <span className={`strength-label ${adminStrength.strengthClass}`} style={{ fontSize: '12px' }}>
                            {adminStrength.strengthLabel}
                          </span>
                        )}
                      </div>
                      
                      {/* Segmented Strength Bar */}
                      <div className="strength-segments-container">
                        <div className={`strength-segment ${adminNewPassword && adminStrength.score >= 1 ? `active-${adminStrength.strengthClass}` : ''}`} />
                        <div className={`strength-segment ${adminNewPassword && adminStrength.score >= 2 ? `active-${adminStrength.strengthClass}` : ''}`} />
                        <div className={`strength-segment ${adminNewPassword && adminStrength.score >= 3 ? `active-${adminStrength.strengthClass}` : ''}`} />
                        <div className={`strength-segment ${adminNewPassword && adminStrength.score >= 4 ? `active-${adminStrength.strengthClass}` : ''}`} />
                      </div>

                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
                        Hint: Use mixed case, numbers, and symbols.
                      </span>
                    </div>

                    {/* Confirm New Password */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <div className="form-label-row">
                        <label htmlFor="adminConfirmPass" className="form-label" style={{ marginBottom: 0 }}>
                          Confirm New Password <span style={{ color: 'var(--error-color)' }}>*</span>
                        </label>
                        {adminConfirmPasswordError && (
                          <span className="form-label-error">{adminConfirmPasswordError}</span>
                        )}
                      </div>
                      <div className="input-wrapper">
                        <input
                          type={showAdminConfirmPassword ? 'text' : 'password'}
                          id="adminConfirmPass"
                          className={`form-input ${adminConfirmPasswordError ? 'has-error' : ''}`}
                          placeholder="Re-type new password"
                          value={adminConfirmPassword}
                          onChange={(e) => {
                            setAdminConfirmPassword(e.target.value)
                            if (adminConfirmPasswordError) setAdminConfirmPasswordError('')
                          }}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="eye-icon-btn"
                          onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                          aria-label={showAdminConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={`fa-solid ${showAdminConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    {/* Cancel & Save Buttons */}
                    <div className="form-actions-row">
                      <button 
                        type="button" 
                        className="btn-outline-cancel"
                        onClick={handleAdminCancel}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>

                      <button 
                        type="submit" 
                        className="btn-save-changes"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="spinner" style={{ borderTopColor: '#ffffff', marginRight: '8px' }} />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="admin-footer">
              <span className="footer-copyright">
                <strong>JobFusion AI</strong> &copy; 2024 JobFusion AI. All rights reserved.
              </span>
              <div className="footer-links-group">
                <a href="#privacy" className="footer-link-item" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                <a href="#terms" className="footer-link-item" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                <a href="#help" className="footer-link-item" onClick={(e) => e.preventDefault()}>Help Center</a>
              </div>
            </footer>
          </main>
        </div>
      )}
    </>
  )
}

export default App
