import type { Dispatch, FormEventHandler, SetStateAction } from 'react'

type ForgotPasswordFormProps = {
  email: string
  setEmail: Dispatch<SetStateAction<string>>
  emailError: string
  setEmailError: Dispatch<SetStateAction<string>>
  isLoading: boolean
  validateEmail: (value: string) => string
  handleSendCode: FormEventHandler<HTMLFormElement>
  handleBackToLogin: () => void
}

export function ForgotPasswordForm({
  email,
  setEmail,
  emailError,
  setEmailError,
  isLoading,
  validateEmail,
  handleSendCode,
  handleBackToLogin,
}: ForgotPasswordFormProps) {
  return (
    <form onSubmit={handleSendCode} noValidate className="auth-form-content">
      <div className="form-header-with-back">
        <button 
          type="button" 
          className="back-icon-btn" 
          aria-label="Go back to login"
          onClick={handleBackToLogin}
          disabled={isLoading}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h1 id="forgot-title" className="form-title">Forgot Password</h1>
      </div>

      <p className="form-desc" style={{ marginTop: '8px' }}>
        Enter the email address associated with your account and we'll send you a verification code to reset your password.
      </p>

      <div className="form-group" style={{ marginTop: '8px' }}>
        <label htmlFor="email" className="form-label">Email Address</label>
        <div className="input-wrapper">
          <input
            maxLength={50}
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
            required
          />
        </div>
        {emailError && <span className="error-text">{emailError}</span>}
      </div>

      <button type="submit" className="submit-btn" style={{ marginTop: '16px' }} disabled={isLoading}>
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

      <div className="form-footer">
        <button 
          type="button" 
          className="footer-back-link"
          onClick={handleBackToLogin}
          disabled={isLoading}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Back to Login</span>
        </button>
      </div>
    </form>
  )
}
