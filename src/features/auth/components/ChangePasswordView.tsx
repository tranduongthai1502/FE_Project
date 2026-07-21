import { useEffect, useState, type FormEvent } from 'react'
import { passwordRequirementLabels } from '../data/passwordRequirements'
import { authApi } from '../services/authApi'
import { getPasswordStrength } from '../utils/passwordStrength'
import { getAppErrorMessage, getErrorCode } from '../../../utils/errorManager'
import { authErrorMessages } from '../errors'
import { clearAuthStorage, clearRequirePasswordChange } from '../utils/authStorage'

type CandidateChangePasswordViewProps = {
  isPasswordChangeRequired?: boolean
  onBack: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

export function CandidateChangePasswordView({
  isPasswordChangeRequired = false,
  onBack,
  triggerToast,
}: CandidateChangePasswordViewProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const strength = getPasswordStrength(newPassword)
  const passwordRequirements = Object.entries(strength.requirements) as Array<[
    keyof typeof strength.requirements,
    boolean,
  ]>
  const missingRequirements = passwordRequirements
    .filter(([, isMet]) => !isMet)
    .map(([requirement]) => passwordRequirementLabels[requirement])
  const visibleStrengthClass = newPassword ? strength.strengthClass : ''
  const visibleStrengthLabel = newPassword ? strength.strengthLabel : 'Not entered'

  useEffect(() => {
    if (!saveMessage) return undefined

    const hideToastTimer = window.setTimeout(() => {
      setSaveMessage('')
    }, 3000)

    return () => window.clearTimeout(hideToastTimer)
  }, [saveMessage])

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setCurrentPasswordError('')
    setNewPasswordError('')
    setConfirmPasswordError('')
    setSaveMessage('')
    setShowSaveConfirm(false)
  }

  const closeSaveConfirm = () => {
    setShowSaveConfirm(false)
  }

  const openCancelConfirm = () => {
    if (isPasswordChangeRequired) {
      triggerToast?.('Please change your password before using this workspace.', 'error')
      return
    }

    setShowCancelConfirm(true)
  }

  const openBackConfirm = () => {
    if (isPasswordChangeRequired) {
      triggerToast?.('Please change your password before using this workspace.', 'error')
      return
    }

    setShowBackConfirm(true)
  }

  const closeCancelConfirm = () => {
    setShowCancelConfirm(false)
  }

  const closeBackConfirm = () => {
    setShowBackConfirm(false)
  }

  const confirmCancelChanges = () => {
    setShowCancelConfirm(false)
    resetForm()
  }

  const confirmBackHome = () => {
    setShowBackConfirm(false)
    resetForm()
    onBack()
  }

  const confirmSavePassword = async () => {
    setIsSaving(true)
    try {
      const response: any = await authApi.changePassword({ currentPassword, newPassword })
      const status = Number(response?.httpStatus ?? 0)
      const isSuccess = response?.success === true || (status >= 200 && status < 300)

      if (!isSuccess) {
        triggerToast?.(authErrorMessages.systemError, 'error')
        return
      }

      setShowSaveConfirm(false)
      resetForm()
      clearRequirePasswordChange()
      clearAuthStorage()
      triggerToast?.('Password changed successfully. Please log in again.', 'success')
      window.location.assign('/login')
    } catch (error: any) {
      const status = Number(error?.status ?? 0)
      if (status === 0 || status >= 500) {
        triggerToast?.(authErrorMessages.systemError, 'error')
      } else {
        setShowSaveConfirm(false)
        const errMsg = error?.message || ''
        const errCode = getErrorCode(error)
        if (errCode === 'wrong_password') {
          setCurrentPasswordError(authErrorMessages.currentPasswordIncorrect)
        } else if (errCode === 'old_password_can_not_be_the_same_with_new_password') {
          setNewPasswordError(authErrorMessages.newPasswordDuplicatesCurrent)
        } else {
          setCurrentPasswordError(getAppErrorMessage(error, errMsg || authErrorMessages.currentPasswordIncorrect))
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let hasError = false

    if (!currentPassword.trim()) {
      setCurrentPasswordError(authErrorMessages.currentPasswordRequired)
      hasError = true
    } else {
      setCurrentPasswordError('')
    }

    if (!newPassword) {
      setNewPasswordError(authErrorMessages.newPasswordRequired)
      hasError = true
    } else if (newPassword === currentPassword) {
      setNewPasswordError(authErrorMessages.newPasswordDuplicatesCurrent)
      hasError = true
    } else if (newPassword.length < 8 || newPassword.length > 20) {
      setNewPasswordError(authErrorMessages.passwordLength)
      hasError = true
    } else if (missingRequirements.length > 0) {
      setNewPasswordError(authErrorMessages.passwordComplexity)
      hasError = true
    } else {
      setNewPasswordError('')
    }

    if (!confirmPassword) {
      setConfirmPasswordError(authErrorMessages.confirmNewPasswordRequired)
      hasError = true
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError(authErrorMessages.passwordsDoNotMatch)
      hasError = true
    } else {
      setConfirmPasswordError('')
    }

    if (hasError) {
      setSaveMessage('')
      return
    }

    setSaveMessage('')
    setShowSaveConfirm(true)
  }

  return (
    <>
      <section className="candidate-settings-screen">
        {saveMessage && (
          <div className="candidate-password-toast" role="alert" aria-live="polite">
            <i className="fa-regular fa-square-check"></i>
            <span>{saveMessage}</span>
          </div>
        )}

      {!isPasswordChangeRequired && (
        <button type="button" className="candidate-back-home" onClick={openBackConfirm}>
          <i className="fa-solid fa-arrow-left"></i>
          <span>Back to Home</span>
        </button>
      )}

      <h1>Account Settings</h1>

      <div className="candidate-settings-layout">
        <aside className="security-tabs-card">
          <span className="security-tabs-title">Security Tabs</span>
          <button type="button" className="security-tab">
            <i className="fa-regular fa-user"></i>
            <span>Profile Information</span>
          </button>
          <button type="button" className="security-tab active">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM9 6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9V6ZM18 20H6V10H18V20ZM12 17C13.1 17 14 16.1 14 15C14 13.9 13.1 13 12 13C10.9 13 10 13.9 10 15C10 16.1 10.9 17 12 17Z" fill="currentColor" />
            </svg>
            <span>Change Password</span>
          </button>
        </aside>

        <section className="candidate-change-password-card">
          {!isPasswordChangeRequired && (
            <button type="button" className="candidate-change-password-close" onClick={openCancelConfirm} aria-label="Close change password">
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}

          <div className="candidate-change-password-heading">
            <h2>Change Password</h2>
            <p>Update your account password to maintain security. We recommend using a unique password you don't use elsewhere.</p>
          </div>

          <form className="candidate-change-password-form" onSubmit={handleSubmit} noValidate>
            <div className="candidate-password-field">
              <label htmlFor="candidate-current-password">Current Password <span>*</span></label>
              <div className={`candidate-password-input ${currentPasswordError ? 'has-error' : ''}`}>
                <input
                  id="candidate-current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  autoComplete="off"
                  onChange={(event) => {
                    const nextCurrentPassword = event.target.value
                    setCurrentPassword(nextCurrentPassword)
                    if (currentPasswordError) setCurrentPasswordError('')
                    if (newPasswordError && newPassword !== nextCurrentPassword && missingRequirements.length === 0) {
                      setNewPasswordError('')
                    }
                    if (saveMessage) setSaveMessage('')
                  }}
                />
                <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}>
                  <i className={`fa-regular ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {currentPasswordError && <span className="candidate-password-error">{currentPasswordError}</span>}
            </div>

            <div className="candidate-password-field">
              <label htmlFor="candidate-new-password">New Password <span>*</span></label>
              <div className={`candidate-password-input ${newPasswordError ? 'has-error' : ''}`}>
                <input
                  id="candidate-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter at least 8 characters"
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(event) => {
                    const nextPassword = event.target.value
                    const nextStrength = getPasswordStrength(nextPassword)
                    const nextMissingRequirements = (Object.entries(nextStrength.requirements) as Array<[
                      keyof typeof nextStrength.requirements,
                      boolean,
                    ]>)
                      .filter(([, isMet]) => !isMet)
                      .map(([requirement]) => passwordRequirementLabels[requirement])

                    setNewPassword(nextPassword)
                    if (!nextPassword) {
                      setNewPasswordError('')
                    } else if (nextPassword === currentPassword) {
                      setNewPasswordError(authErrorMessages.newPasswordDuplicatesCurrent)
                    } else if (newPasswordError && nextMissingRequirements.length === 0) {
                      setNewPasswordError('')
                    }
                    if (confirmPasswordError && confirmPassword === nextPassword) {
                      setConfirmPasswordError('')
                    }
                    if (saveMessage) setSaveMessage('')
                  }}
                />
                <button type="button" onClick={() => setShowNewPassword((value) => !value)} aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}>
                  <i className={`fa-regular ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {newPasswordError && <span className="candidate-password-error">{newPasswordError}</span>}
            </div>

            <div className="candidate-password-strength">
              <div>
                <span>Password Strength</span>
                <strong className={visibleStrengthClass}>{visibleStrengthLabel}</strong>
              </div>
              <div
                className="candidate-strength-track"
                aria-label={`Password strength: ${visibleStrengthLabel}`}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuenow={newPassword ? strength.score : 0}
                role="progressbar"
              >
                {Array.from({ length: 4 }, (_, index) => (
                  <span
                    key={index}
                    className={`candidate-strength-segment ${index < strength.score ? `active ${strength.strengthClass}` : ''}`}
                  />
                ))}
              </div>
              <small>Hint: At least 8 characters, use mixed case, numbers, and symbols.</small>
            </div>

            <div className="candidate-password-field">
              <label htmlFor="candidate-confirm-password">Confirm New Password <span>*</span></label>
              <div className={`candidate-password-input ${confirmPasswordError ? 'has-error' : ''}`}>
                <input
                  id="candidate-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-type your new password"
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    if (confirmPasswordError) setConfirmPasswordError('')
                    if (saveMessage) setSaveMessage('')
                  }}
                />
                <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                  <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {confirmPasswordError && <span className="candidate-password-error">{confirmPasswordError}</span>}
            </div>

            <div className="candidate-change-password-actions">
              {!isPasswordChangeRequired && (
                <button type="button" className="candidate-password-cancel" onClick={openCancelConfirm}>Cancel</button>
              )}
              <button type="submit" className="candidate-password-save">Save Changes</button>
            </div>
          </form>
        </section>
      </div>
      </section>

      {showSaveConfirm && (
        <div className="candidate-change-confirm-backdrop" role="presentation">
          <section className="candidate-change-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-change-confirm-title">
            <div className="candidate-change-confirm-body">
              <div className="candidate-change-confirm-heading">
                <h2 id="candidate-change-confirm-title">Confirm Action</h2>
                <button
                  type="button"
                  className="candidate-change-confirm-close"
                  onClick={closeSaveConfirm}
                  aria-label="Close change password confirmation"
                  disabled={isSaving}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <p>Are you sure you want to change your password? You will need to use the new password the next time you sign in.</p>
            </div>
            <div className="candidate-change-confirm-footer">
              <button type="button" className="candidate-change-confirm-cancel" onClick={closeSaveConfirm} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className="candidate-change-confirm-action" onClick={confirmSavePassword} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </section>
        </div>
      )}

      {showCancelConfirm && (
        <div className="candidate-change-confirm-backdrop" role="presentation">
          <section className="candidate-change-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-cancel-confirm-title">
            <div className="candidate-change-confirm-body">
              <div className="candidate-change-confirm-heading">
                <h2 id="candidate-cancel-confirm-title">Confirm Action</h2>
                <button
                  type="button"
                  className="candidate-change-confirm-close"
                  onClick={closeCancelConfirm}
                  aria-label="Close cancel confirmation"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <p>Are you sure you want to cancel? Your changes will not be saved.</p>
            </div>
            <div className="candidate-change-confirm-footer">
              <button type="button" className="candidate-change-confirm-cancel" onClick={closeCancelConfirm}>
                Cancel
              </button>
              <button type="button" className="candidate-change-confirm-action" onClick={confirmCancelChanges}>
                Confirm
              </button>
            </div>
          </section>
        </div>
      )}

      {showBackConfirm && (
        <div className="candidate-change-confirm-backdrop" role="presentation">
          <section className="candidate-change-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-back-confirm-title">
            <div className="candidate-change-confirm-body">
              <div className="candidate-change-confirm-heading">
                <h2 id="candidate-back-confirm-title">Confirm Action</h2>
                <button
                  type="button"
                  className="candidate-change-confirm-close"
                  onClick={closeBackConfirm}
                  aria-label="Close back home confirmation"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <p>Are you sure you want to go back home? Your changes will not be saved.</p>
            </div>
            <div className="candidate-change-confirm-footer">
              <button type="button" className="candidate-change-confirm-cancel" onClick={closeBackConfirm}>
                Cancel
              </button>
              <button type="button" className="candidate-change-confirm-action" onClick={confirmBackHome}>
                Confirm
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
