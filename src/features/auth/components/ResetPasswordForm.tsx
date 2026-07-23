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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M11.6667 23.3333C10.0528 23.3333 8.53611 23.0271 7.11667 22.4146C5.69722 21.8021 4.4625 20.9708 3.4125 19.9208C2.3625 18.8708 1.53125 17.6361 0.91875 16.2167C0.30625 14.7972 0 13.2806 0 11.6667H2.33333C2.33333 12.95 2.57639 14.1604 3.0625 15.2979C3.54861 16.4354 4.21458 17.4271 5.06042 18.2729C5.90625 19.1187 6.89792 19.7896 8.03542 20.2854C9.17292 20.7812 10.3833 21.0292 11.6667 21.0292C14.2722 21.0292 16.4792 20.125 18.2875 18.3167C20.0958 16.5083 21 14.3014 21 11.6958C21 9.09028 20.0958 6.88333 18.2875 5.075C16.4792 3.26667 14.2722 2.3625 11.6667 2.3625C9.93611 2.3625 8.36597 2.78542 6.95625 3.63125C5.54653 4.47708 4.43333 5.6 3.61667 7H7V9.33333H0V2.33333H2.33333V4.66667C3.40278 3.24722 4.74444 2.11458 6.35833 1.26875C7.97222 0.422917 9.74167 0 11.6667 0C13.2806 0 14.7972 0.30625 16.2167 0.91875C17.6361 1.53125 18.8708 2.3625 19.9208 3.4125C20.9708 4.4625 21.8021 5.69722 22.4146 7.11667C23.0271 8.53611 23.3333 10.0528 23.3333 11.6667C23.3333 13.2806 23.0271 14.7972 22.4146 16.2167C21.8021 17.6361 20.9708 18.8708 19.9208 19.9208C18.8708 20.9708 17.6361 21.8021 16.2167 22.4146C14.7972 23.0271 13.2806 23.3333 11.6667 23.3333ZM9.33333 16.3333C9.00278 16.3333 8.72569 16.2215 8.50208 15.9979C8.27847 15.7743 8.16667 15.4972 8.16667 15.1667V11.6667C8.16667 11.3361 8.27847 11.059 8.50208 10.8354C8.72569 10.6118 9.00278 10.5 9.33333 10.5V9.33333C9.33333 8.69167 9.56181 8.14236 10.0188 7.68542C10.4757 7.22847 11.025 7 11.6667 7C12.3083 7 12.8576 7.22847 13.3146 7.68542C13.7715 8.14236 14 8.69167 14 9.33333V10.5C14.3306 10.5 14.6076 10.6118 14.8313 10.8354C15.0549 11.059 15.1667 11.3361 15.1667 11.6667V15.1667C15.1667 15.4972 15.0549 15.7743 14.8313 15.9979C14.6076 16.2215 14.3306 16.3333 14 16.3333H9.33333ZM10.5 10.5H12.8333V9.33333C12.8333 9.00278 12.7215 8.72569 12.4979 8.50208C12.2743 8.27847 11.9972 8.16667 11.6667 8.16667C11.3361 8.16667 11.059 8.27847 10.8354 8.50208C10.6118 8.72569 10.5 9.00278 10.5 9.33333V10.5Z" fill="#AD2B00" />
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
            maxLength={50}
            type={showNewPassword ? 'text' : 'password'}
            id="newPassword"
            className={`form-input ${newPasswordError ? 'has-error' : ''}`}
            placeholder="Enter new password"
            value={newPassword}
            autoComplete="new-password"
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
            maxLength={50}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            className={`form-input ${confirmPasswordError ? 'has-error' : ''}`}
            placeholder="Re-type new password"
            value={confirmPassword}
            autoComplete="new-password"
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

        <div
          className="strength-bar-outer"
          role="progressbar"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={newPassword ? strength.score : 0}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={`strength-bar-segment ${index < strength.score ? `active ${strength.strengthClass}` : ''}`}
            />
          ))}
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
