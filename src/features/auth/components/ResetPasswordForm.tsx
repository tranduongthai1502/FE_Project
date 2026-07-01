import type { Dispatch, FormEventHandler, SetStateAction } from 'react'

type PasswordStrength = {
  requirements: {
    length: boolean
    case: boolean
    number: boolean
    special: boolean
  }
  score: number
  strengthLabel: string
  strengthClass: string
  progressWidth: string
}

type ResetPasswordFormProps = {
  newPassword: string
  setNewPassword: Dispatch<SetStateAction<string>>
  confirmPassword: string
  setConfirmPassword: Dispatch<SetStateAction<string>>
  newPasswordError: string
  setNewPasswordError: Dispatch<SetStateAction<string>>
  confirmPasswordError: string
  setConfirmPasswordError: Dispatch<SetStateAction<string>>
  showNewPassword: boolean
  setShowNewPassword: Dispatch<SetStateAction<boolean>>
  showConfirmPassword: boolean
  setShowConfirmPassword: Dispatch<SetStateAction<boolean>>
  strength: PasswordStrength
  isLoading: boolean
  handleResetPassword: FormEventHandler<HTMLFormElement>
  handleBackToLogin: () => void
}

export function ResetPasswordForm({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  newPasswordError,
  setNewPasswordError,
  confirmPasswordError,
  setConfirmPasswordError,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  strength,
  isLoading,
  handleResetPassword,
  handleBackToLogin,
}: ResetPasswordFormProps) {
  return (
    <form onSubmit={handleResetPassword} noValidate className="auth-form-content">
      <div className="reset-icon-container">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path className="reset-ring" d="M12 24a23 23 0 1 1 3 20" />
          <path className="reset-arrow" d="M21 24H8V11" />
          <g className="reset-lock-mark">
            <path className="reset-lock-shackle" d="M29 34v-7a6 6 0 0 1 12 0v7" />
            <path className="reset-lock-body" d="M26 34h18a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H26a3 3 0 0 1-3-3V37a3 3 0 0 1 3-3z" />
          </g>
        </svg>
      </div>

      <h1 className="form-title">Reset Password</h1>

      <p className="form-desc">
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
            required
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

      <div className="requirements-box">
        <div className="requirements-header">
          <div className="requirements-header-title">Password Strength</div>
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

        <p className="requirements-hint">Hint: At least 8 characters, use mixed case, numbers, and symbols.</p>
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

      <div className="form-footer">
        <button 
          type="button" 
          className="footer-back-link" 
          onClick={handleBackToLogin}
          disabled={isLoading}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Back to login</span>
        </button>
      </div>
    </form>
  )
}
