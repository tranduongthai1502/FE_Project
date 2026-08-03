import { AuthLayout } from '../components/AuthLayout'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '@/core/components/Icons'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { OtpForm } from '../components/OtpForm'
import { ResetPasswordForm } from '../components/ResetPasswordForm'
import { FIELD_LENGTH_LIMITS, validateOptionalEmail } from '@/core/api/axiosErrorHandler'
import { useLoginFeature } from '../../application/useLoginFeature'
type LoginFeatureProps = {
  onGoToSignup: () => void
  onSignInSuccess: (
    email: string,
    keepLoggedIn: boolean,
    userRole: string,
    options?: { requirePasswordChange?: boolean },
  ) => boolean
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}
export function LoginFeature({ onGoToSignup, onSignInSuccess, triggerToast }: LoginFeatureProps) {
  const {
    confirmPassword,
    confirmPasswordError,
    countdown,
    email,
    emailError,
    forgotEmail,
    forgotEmailError,
    forgotStep,
    handleCloseForgotPassword,
    handleEmailChange,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handlePasswordChange,
    handleResendCode,
    handleResetPassword,
    handleSendCode,
    handleSubmit,
    handleVerifyOtp,
    isLoading,
    isResendingCode,
    isSendingCode,
    keepLoggedIn,
    newPassword,
    newPasswordError,
    otp,
    otpError,
    otpInputsRef,
    password,
    passwordError,
    setConfirmPassword,
    setConfirmPasswordError,
    setForgotEmail,
    setForgotEmailError,
    setKeepLoggedIn,
    setNewPassword,
    setNewPasswordError,
    setShowConfirmPassword,
    setShowForgotPassword,
    setShowNewPassword,
    showConfirmPassword,
    showForgotPassword,
    showNewPassword,
    showPassword,
    setShowPassword,
    strength,
  } = useLoginFeature({ onGoToSignup, onSignInSuccess, triggerToast })
  return (
    <AuthLayout>
      <div className="form-shell">
        <header className="form-header">
          <h2>Welcome Back</h2>
          <p>Enter your credentials to access your dashboard.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} autoComplete="on" noValidate>
          <div className="field-group">
            <label htmlFor="email">Email Address</label>
            <div className={`input-wrap ${emailError ? 'has-error' : ''}`}>
              <MailIcon />
              <input
                maxLength={FIELD_LENGTH_LIMITS.defaultText}
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="name@company.com"
                autoComplete="email"
                aria-invalid={emailError ? 'true' : 'false'}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
            </div>
            {emailError && (
              <span id="email-error" className="field-error">
                {emailError}
              </span>
            )}
          </div>

          <div className="field-group password-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
            </div>
            <div className={`input-wrap ${passwordError ? 'has-error' : ''}`}>
              <LockIcon />
              <input
                maxLength={FIELD_LENGTH_LIMITS.defaultText}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder=".........."
                autoComplete="current-password"
                aria-invalid={passwordError ? 'true' : 'false'}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordError && (
              <span id="password-error" className="field-error">
                {passwordError}
              </span>
            )}
          </div>

          <div className="login-options-row">
            <label className="check-row" htmlFor="keep-logged-in">
              <input
                id="keep-logged-in"
                name="keep-logged-in"
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(event) => setKeepLoggedIn(event.target.checked)}
              />
              <span>Keep me logged in</span>
            </label>
            <button type="button" className="text-link-button" onClick={() => setShowForgotPassword(true)}>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Logging in' : 'Login'}
          </button>
        </form>

        <p className="signup-copy">
          Don't have an account?
          <button type="button" onClick={onGoToSignup}>
            Sign up
          </button>
        </p>
      </div>

      {showForgotPassword && (
        <div className="auth-modal-overlay" role="presentation">
          <div
            className={`forgot-password-modal forgot-password-modal-${forgotStep}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-title"
          >
            {forgotStep === 'email' && (
              <ForgotPasswordForm
                email={forgotEmail}
                setEmail={setForgotEmail}
                emailError={forgotEmailError}
                setEmailError={setForgotEmailError}
                isLoading={isSendingCode}
                validateEmail={validateOptionalEmail}
                handleSendCode={handleSendCode}
                handleBackToLogin={handleCloseForgotPassword}
              />
            )}

            {forgotStep === 'otp' && (
              <OtpForm
                otp={otp}
                otpError={otpError}
                otpInputsRef={otpInputsRef}
                countdown={countdown}
                isLoading={isSendingCode}
                handleOtpChange={handleOtpChange}
                handleOtpKeyDown={handleOtpKeyDown}
                handleOtpPaste={handleOtpPaste}
                handleVerifyOtp={handleVerifyOtp}
                handleBackToLogin={handleCloseForgotPassword}
                handleResendCode={handleResendCode}
                isResendingCode={isResendingCode}
              />
            )}

            {forgotStep === 'reset' && (
              <ResetPasswordForm
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                newPasswordError={newPasswordError}
                setNewPasswordError={setNewPasswordError}
                confirmPasswordError={confirmPasswordError}
                setConfirmPasswordError={setConfirmPasswordError}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                strength={strength}
                isLoading={isSendingCode}
                handleResetPassword={handleResetPassword}
                handleBackToLogin={handleCloseForgotPassword}
              />
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
