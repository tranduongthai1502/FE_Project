import React from 'react'

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
}) {
  return (
    <form onSubmit={handleResetPassword} noValidate className="auth-form-content">
      <div className="reset-icon-container">
        <span className="fa-stack">
          <i className="fa-solid fa-arrow-rotate-left fa-stack-2x"></i>
          <i className="fa-solid fa-lock fa-stack-1x" style={{ fontSize: '0.58em', transform: 'translateY(1px)' }}></i>
        </span>
      </div>

      <h1 className="form-title" style={{ textAlign: 'center', marginBottom: '8px', fontSize: '24px' }}>
        Reset Password
      </h1>

      <p className="form-desc" style={{ textAlign: 'center', marginBottom: '28px' }}>
        Secure your JobFusion account with a new, strong password.
      </p>

      <div className="form-group">
        <label htmlFor="newPassword" className="form-label font-bold">New Password</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <i className="fa-solid fa-lock"></i>
          </span>
          <input
            type={showNewPassword ? 'text' : 'password'}
            id="newPassword"
            className={`form-input form-input-with-icon ${newPasswordError ? 'has-error' : ''}`}
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
        <label htmlFor="confirmPassword" className="form-label font-bold">Confirm New Password</label>
        <div className="input-wrapper">
          <span className="input-icon-left">
            <i className="fa-solid fa-lock"></i>
          </span>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            className={`form-input form-input-with-icon ${confirmPasswordError ? 'has-error' : ''}`}
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

      {/* Password Strength Section */}
      <div className="form-group password-strength-group" style={{ marginTop: '4px', marginBottom: '24px' }}>
        <div className="strength-header-row">
          <span className="strength-title-label">PASSWORD STRENGTH</span>
          <span className={`strength-value-label ${strength.strengthClass}`}>
            {strength.strengthLabel === 'Weak' ? 'Week' : strength.strengthLabel}
          </span>
        </div>
        <div className="strength-segments-container">
          <div className={`strength-segment ${newPassword && strength.score >= 1 ? `active-${strength.strengthClass}` : ''}`} />
          <div className={`strength-segment ${newPassword && strength.score >= 2 ? `active-${strength.strengthClass}` : ''}`} />
          <div className={`strength-segment ${newPassword && strength.score >= 3 ? `active-${strength.strengthClass}` : ''}`} />
          <div className={`strength-segment ${newPassword && strength.score >= 4 ? `active-${strength.strengthClass}` : ''}`} />
        </div>
        <p className="strength-hint-text">Hint: Use mixed case, numbers, and symbols.</p>
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
