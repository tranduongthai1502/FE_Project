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
