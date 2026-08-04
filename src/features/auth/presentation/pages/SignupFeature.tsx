import { AuthLayout } from '../components/AuthLayout'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, PhoneIcon, UserIcon } from '@/core/components/Icons'
import { useSignupForm } from '../../application'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'

type SignupFeatureProps = {
  onGoToSignin: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

export function SignupFeature({ onGoToSignin, triggerToast }: SignupFeatureProps) {
  const {
    confirmPassword,
    confirmPasswordError,
    email,
    emailError,
    fullName,
    fullNameError,
    handleSubmit,
    isLoading,
    password,
    passwordError,
    passwordStrength,
    phone,
    phoneError,
    showConfirmPassword,
    showPassword,
    toggleConfirmPasswordVisibility,
    togglePasswordVisibility,
    updateConfirmPassword,
    updateEmail,
    updateFullName,
    updatePassword,
    updatePhone,
    visibleStrengthScore,
  } = useSignupForm({ onGoToSignin, triggerToast })

  return (
    <AuthLayout isSignup>
      <div className="form-shell signup-shell">
        <header className="signup-header">
          <h2>Sign up</h2>
        </header>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="fullName">
              Your Full Name <span className="required-star">*</span>
            </label>
            <div className={`input-wrap ${fullNameError ? 'has-error' : ''}`}>
              <UserIcon />
              <input
                maxLength={FIELD_LENGTH_LIMITS.defaultText}
                id="fullName"
                name="fullName"
                type="text"
                value={fullName}
                onChange={updateFullName}
                placeholder="Full name"
                autoComplete="name"
                aria-invalid={fullNameError ? 'true' : 'false'}
                aria-describedby={fullNameError ? 'full-name-error' : undefined}
              />
            </div>
            {fullNameError && (
              <span id="full-name-error" className="field-error">
                {fullNameError}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="signupEmail">
              Email Address <span className="required-star">*</span>
            </label>
            <div className={`input-wrap ${emailError ? 'has-error' : ''}`}>
              <MailIcon />
              <input
                maxLength={FIELD_LENGTH_LIMITS.defaultText}
                id="signupEmail"
                name="email"
                type="email"
                value={email}
                onChange={updateEmail}
                placeholder="name@company.com"
                autoComplete="email"
                aria-invalid={emailError ? 'true' : 'false'}
                aria-describedby={emailError ? 'signup-email-error' : undefined}
              />
            </div>
            {emailError && (
              <span id="signup-email-error" className="field-error">
                {emailError}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="phone">
              Phone Number <span className="required-star">*</span>
            </label>
            <div className={`input-wrap ${phoneError ? 'has-error' : ''}`}>
              <PhoneIcon />
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={updatePhone}
                placeholder="0xxxxxxxxx"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={FIELD_LENGTH_LIMITS.phone}
                aria-invalid={phoneError ? 'true' : 'false'}
                aria-describedby={phoneError ? 'phone-error' : undefined}
              />
            </div>
            {phoneError && (
              <span id="phone-error" className="field-error">
                {phoneError}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="signupPassword">
              Password <span className="required-star">*</span>
            </label>
            <div className={`input-wrap ${passwordError ? 'has-error' : ''}`}>
              <LockIcon />
              <input
                maxLength={FIELD_LENGTH_LIMITS.defaultText}
                id="signupPassword"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={updatePassword}
                placeholder="............"
                autoComplete="new-password"
                aria-invalid={passwordError ? 'true' : 'false'}
                aria-describedby={passwordError ? 'signup-password-error' : undefined}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordError && (
              <span id="signup-password-error" className="field-error">
                {passwordError}
              </span>
            )}
          </div>

          <div className="field-group">
            <label htmlFor="confirmPassword">
              Confirm password <span className="required-star">*</span>
            </label>
            <div className={`input-wrap ${confirmPasswordError ? 'has-error' : ''}`}>
              <LockIcon />
              <input
                maxLength={FIELD_LENGTH_LIMITS.defaultText}
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={updateConfirmPassword}
                placeholder="............"
                autoComplete="new-password"
                aria-invalid={confirmPasswordError ? 'true' : 'false'}
                aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirmPasswordError && (
              <span id="confirm-password-error" className="field-error">
                {confirmPasswordError}
              </span>
            )}
          </div>

          <div className="register-strength" aria-live="polite">
            <div className="register-strength-header">
              <span>PASSWORD STRENGTH</span>
              <span className={`register-strength-label ${password ? passwordStrength.strengthClass : ''}`}>
                {password ? passwordStrength.strengthLabel : ''}
              </span>
            </div>
            <div className="register-strength-segments" aria-hidden="true">
              <span className={`register-strength-segment ${visibleStrengthScore >= 1 ? passwordStrength.strengthClass : ''}`} />
              <span className={`register-strength-segment ${visibleStrengthScore >= 2 ? passwordStrength.strengthClass : ''}`} />
              <span className={`register-strength-segment ${visibleStrengthScore >= 3 ? passwordStrength.strengthClass : ''}`} />
              <span className={`register-strength-segment ${visibleStrengthScore >= 4 ? passwordStrength.strengthClass : ''}`} />
            </div>
            <p className="register-strength-hint">Hint: At least 8 character, use mixed case, numbers, and symbols.</p>
          </div>

          <button type="submit" className="submit-button signup-submit" disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

        <p className="signup-copy signin-copy">
          Do you have an account?
          <button className='signInBtn' type="button" onClick={onGoToSignin}>
            Log in
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
