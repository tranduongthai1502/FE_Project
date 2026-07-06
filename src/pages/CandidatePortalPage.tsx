import { useState, useRef, useEffect, type FormEvent } from 'react'
import { authApi } from '../features/auth/services/authApi'
import { getPasswordStrength } from '../features/auth/utils/passwordStrength'

type CandidatePortalPageProps = {
  onLogout: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

const applications = [
  {
    logo: 'S',
    title: 'Senior UI Designer',
    company: 'VinGroup - Hanoi',
    status: 'Interview Stage',
    updated: 'Updated 2 hours ago',
    progress: 76,
  },
  {
    logo: 'F',
    title: 'Frontend Architect',
    company: 'FPT Software - HCMC',
    status: 'Applied',
    updated: 'Updated 1 day ago',
    progress: 34,
  },
  {
    logo: 'M',
    title: 'Product Designer',
    company: 'MoMo - Remote',
    status: 'Rejected',
    updated: 'Updated 3 days ago',
    progress: 92,
  },
]

const navItems = [
  { label: 'Dashboard', icon: 'fa-table-cells-large', active: true },
  { label: 'My Jobs', icon: 'fa-briefcase' },
  { label: 'Interviews', icon: 'fa-calendar-check' },
  { label: 'AI Insights', icon: 'fa-lightbulb' },
  { label: 'Profile Settings', icon: 'fa-gear' },
]

type CandidatePanel = 'dashboard' | 'changePassword'

type StoredUser = {
  full_name?: string | null
  fullName?: string | null
  name?: string | null
  email?: string | null
  avatar?: string | null
  job_title?: string | null
  jobTitle?: string | null
  headline?: string | null
  user_role?: string | null
  type?: string | null
}

function getStoredUser(): StoredUser | null {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

function getUserDisplayName(user: StoredUser | null) {
  return user?.full_name || user?.fullName || user?.name || user?.email || 'Candidate'
}

function getUserInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'C'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

function getUserSubtitle(user: StoredUser | null) {
  return user?.job_title || user?.jobTitle || user?.headline || user?.user_role || user?.type || 'Candidate'
}

function UserAvatar({ user, className }: { user: StoredUser | null; className: string }) {
  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(displayName)

  if (user?.avatar) {
    return (
      <div className={className} aria-label={displayName}>
        <img src={user.avatar} alt="" />
      </div>
    )
  }

  return <div className={className}>{initials}</div>
}

const passwordRequirementLabels = {
  length: 'At least 8 characters',
  case: 'Uppercase and lowercase letters',
  number: 'At least 1 number',
  special: 'At least 1 symbol',
}

type CandidateChangePasswordViewProps = {
  onBack: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}

function CandidateChangePasswordView({ onBack, triggerToast }: CandidateChangePasswordViewProps) {
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

  const confirmSavePassword = async () => {
    setIsSaving(true)
    try {
      const response: any = await authApi.changePassword({ currentPassword, newPassword })
      const status = Number(response?.httpStatus ?? 0)
      const isSuccess = response?.success === true || (status >= 200 && status < 300)

      if (!isSuccess) {
        triggerToast?.('Error system. Please try again.', 'error')
        return
      }

      setShowSaveConfirm(false)
      resetForm()
      setSaveMessage('Password changed successfully.')
    } catch (error: any) {
      const status = Number(error?.status ?? 0)
      if (status === 0 || status >= 500) {
        triggerToast?.('Error system. Please try again.', 'error')
      } else {
        setShowSaveConfirm(false)
        const errMsg = error?.message || ''
        if (errMsg.includes('wrong_password')) {
          setCurrentPasswordError('Current password is incorrect.')
        } else if (errMsg.includes('old_password_can_not_be_the_same_with_new_password')) {
          setNewPasswordError('New password cannot be the same as the current password.')
        } else {
          setCurrentPasswordError(errMsg || 'Current password is incorrect.')
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
      setCurrentPasswordError('Please enter your current password.')
      hasError = true
    } else {
      setCurrentPasswordError('')
    }

    if (!newPassword) {
      setNewPasswordError('Please enter a new password.')
      hasError = true
    } else if (newPassword === currentPassword) {
      setNewPasswordError('New password duplicates current password.')
      hasError = true
    } else if (missingRequirements.length > 0) {
      setNewPasswordError(`Password is missing: ${missingRequirements.join(', ')}.`)
      hasError = true
    } else {
      setNewPasswordError('')
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.')
      hasError = true
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError('Passwords do not match.')
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

      <button type="button" className="candidate-back-home" onClick={onBack}>
        <i className="fa-solid fa-arrow-left"></i>
        <span>Back to Home</span>
      </button>

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
          <button type="button" className="candidate-change-password-close" onClick={onBack} aria-label="Close change password">
            <i className="fa-solid fa-xmark"></i>
          </button>

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
                  autoComplete="current-password"
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
                      setNewPasswordError('New password duplicates current password.')
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
              <small>Hint: At least 8 character, use mixed case, numbers, and symbols.</small>
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
              <button type="button" className="candidate-password-cancel" onClick={resetForm}>Cancel</button>
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
    </>
  )
}

export function CandidatePortalPage({ onLogout, triggerToast }: CandidatePortalPageProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [activePanel, setActivePanel] = useState<CandidatePanel>('dashboard')
  const [user] = useState<StoredUser | null>(() => getStoredUser())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const displayName = getUserDisplayName(user)
  const firstName = displayName.trim().split(/\s+/)[0] || displayName
  const userSubtitle = getUserSubtitle(user)

  const openLogoutConfirm = () => {
    setShowDropdown(false)
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    setShowLogoutConfirm(false)
    onLogout()
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <main className="candidate-page">
      <aside className="candidate-sidebar">
        <div className="candidate-brand">
          <strong>JobFusion Pro</strong>
          <span>Candidate Portal</span>
        </div>

        <nav className="candidate-nav" aria-label="Candidate navigation">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`candidate-nav-item ${activePanel === 'dashboard' && item.active ? 'active' : ''}`}
              onClick={() => {
                if (item.active) {
                  setActivePanel('dashboard')
                }
              }}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="candidate-profile-card">
          <UserAvatar user={user} className="candidate-avatar" />
          <div>
            <strong>{displayName}</strong>
            <span>{userSubtitle}</span>
          </div>
          <button type="button" onClick={openLogoutConfirm} className="candidate-logout-btn">
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
          </button>
        </div>
      </aside>

      <section className="candidate-main">
        <header className="candidate-topbar">
          <div className="candidate-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="search" placeholder="Search jobs, documents..." aria-label="Search jobs and documents" />
          </div>

          <nav className="candidate-tabs" aria-label="Candidate top navigation">
            <button type="button" className="active">Talent Pool</button>
            <button type="button">Analytics</button>
            <button type="button">Reports</button>
            <button type="button" className="candidate-pill">Candidate Portal</button>
          </nav>

          <button type="button" className="ai-match-btn">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>AI Match</span>
          </button>

          <div className="candidate-top-icons">
            <i className="fa-regular fa-bell"></i>
            <i className="fa-regular fa-circle-question"></i>
            <div className="candidate-user-menu-container" ref={dropdownRef}>
              <button 
                type="button" 
                className="candidate-user-trigger" 
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="User menu"
                aria-expanded={showDropdown}
              >
                <UserAvatar user={user} className="candidate-mini-avatar" />
                <span className="candidate-user-name">{displayName}</span>
                <i className={`fa-solid fa-chevron-down candidate-chevron ${showDropdown ? 'open' : ''}`}></i>
              </button>
              
              {showDropdown && (
                <div className="candidate-user-dropdown" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM18 16V13C18 12.2667 17.7958 11.5625 17.3875 10.8875C16.9792 10.2125 16.4 9.63333 15.65 9.15C16.5 9.25 17.3 9.42083 18.05 9.6625C18.8 9.90417 19.5 10.2 20.15 10.55C20.75 10.8833 21.2083 11.2542 21.525 11.6625C21.8417 12.0708 22 12.5167 22 13V16H18ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM18 4C18 5.1 17.6083 6.04167 16.825 6.825C16.0417 7.60833 15.1 8 14 8C13.8167 8 13.5833 7.97917 13.3 7.9375C13.0167 7.89583 12.7833 7.85 12.6 7.8C13.05 7.26667 13.3958 6.675 13.6375 6.025C13.8792 5.375 14 4.7 14 4C14 3.3 13.8792 2.625 13.6375 1.975C13.3958 1.325 13.05 0.733333 12.6 0.2C12.8333 0.116667 13.0667 0.0625 13.3 0.0375C13.5333 0.0125 13.7667 0 14 0C15.1 0 16.0417 0.391667 16.825 1.175C17.6083 1.95833 18 2.9 18 4ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#0B1C30" />
                    </svg>
                    <span>Profile</span>
                  </button>
                  <button type="button" className="dropdown-item" onClick={() => {
                    setActivePanel('changePassword')
                    setShowDropdown(false)
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM9 6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9V6ZM18 20H6V10H18V20ZM12 17C13.1 17 14 16.1 14 15C14 13.9 13.1 13 12 13C10.9 13 10 13.9 10 15C10 16.1 10.9 17 12 17Z" fill="black" />
                    </svg>
                    <span>Change password</span>
                  </button>
                  <button type="button" className="dropdown-item logout" onClick={openLogoutConfirm}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M6 2H15C15.5304 2 16.0391 2.21071 16.4142 2.58579C16.7893 2.96086 17 3.46957 17 4V6H15V4H6V20H15V18H17V20C17 20.5304 16.7893 21.0391 16.4142 21.4142C16.0391 21.7893 15.5304 22 15 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2Z" fill="black" />
                      <path d="M16.09 15.59L17.5 17L22.5 12L17.5 7L16.09 8.41L18.67 11H9V13H18.67L16.09 15.59Z" fill="black" />
                    </svg>
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={`candidate-content ${activePanel === 'changePassword' ? 'candidate-content-settings' : ''}`}>
          {activePanel === 'changePassword' ? (
            <CandidateChangePasswordView
              onBack={() => setActivePanel('dashboard')}
              triggerToast={triggerToast}
            />
          ) : (
            <>
          <section className="candidate-welcome">
            <div>
              <h1>Welcome back, {firstName}!</h1>
              <p>Here is your application progress and personalized AI recommendations.</p>
            </div>
            <span className="profile-views">
              <i className="fa-solid fa-eye"></i>
              12 Profile Views
            </span>
          </section>

          <section className="candidate-hero-grid">
            <article className="application-status-card">
              <div className="candidate-card-heading">
                <h2>Application Status: Senior UI Designer</h2>
                <span>VinGroup Corp</span>
              </div>
              <div className="status-timeline">
                <div className="status-line"></div>
                <div className="status-step done">
                  <span><i className="fa-solid fa-check"></i></span>
                  <strong>Applied</strong>
                  <small>Oct 12, 2024</small>
                </div>
                <div className="status-step done">
                  <span><i className="fa-solid fa-file-lines"></i></span>
                  <strong>Screening</strong>
                  <small>Oct 15, 2024</small>
                </div>
                <div className="status-step current">
                  <span><i className="fa-solid fa-video"></i></span>
                  <strong>Interviewing</strong>
                  <small>In Progress</small>
                </div>
                <div className="status-step muted">
                  <span><i className="fa-solid fa-desktop"></i></span>
                  <strong>Offer</strong>
                  <small>Pending</small>
                </div>
              </div>
            </article>

            <article className="interview-card">
              <h2><i className="fa-solid fa-chalkboard-user"></i> Upcoming Interview</h2>
              <div className="interview-panel">
                <span>Thursday, October 24</span>
                <strong>Technical & AI Coding Round</strong>
                <small>14:00 - 15:30 - Google Meet</small>
              </div>
              <button type="button">
                <i className="fa-solid fa-play"></i>
                Prepare with AI Coach
              </button>
            </article>
          </section>

          <section className="candidate-lower-grid">
            <article className="resume-insights-card">
              <div className="insight-title-row">
                <h2><i className="fa-solid fa-circle-info"></i> AI Resume Insights</h2>
                <span>85%</span>
              </div>
              <div className="insight-note">
                <strong><i className="fa-solid fa-lightbulb"></i> Improvement Tip:</strong>
                <p>"Your React experience is impressive, but consider adding Next.js projects to increase your match rate at VinGroup (Match +15%)."</p>
              </div>
              <div className="keyword-note">
                <strong><i className="fa-solid fa-key"></i> Missing Keywords:</strong>
                <div>
                  <span>Unit Testing</span>
                  <span>Micro-Frontends</span>
                  <span>CI/CD</span>
                </div>
              </div>
              <button type="button" className="edit-resume-btn">Edit Resume Now <i className="fa-solid fa-arrow-right"></i></button>
            </article>

            <article className="active-applications-card">
              <div className="active-app-header">
                <h2>Active Applications</h2>
                <button type="button">View all (5)</button>
              </div>

              <div className="application-list">
                {applications.map((item) => (
                  <div key={item.title} className="application-row">
                    <div className="application-logo">{item.logo}</div>
                    <div className="application-info">
                      <strong>{item.title}</strong>
                      <span>{item.company}</span>
                    </div>
                    <div className="application-status-text">
                      <strong>{item.status}</strong>
                      <span>{item.updated}</span>
                    </div>
                    <div className="application-progress">
                      <span style={{ width: `${item.progress}%` }}></span>
                    </div>
                    <button type="button" aria-label={`Open ${item.title} actions`}>
                      <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                  </div>
                ))}
              </div>
            </article>
          </section>
            </>
          )}
        </div>

        <footer className="candidate-footer">
          <div>
            <strong>JobFusion AI</strong>
            <span>Copyright 2024 JobFusion AI. All rights reserved.</span>
          </div>
          <nav>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#help">Help Center</a>
          </nav>
        </footer>
      </section>

      {showLogoutConfirm && (
        <div className="candidate-logout-modal-backdrop" role="presentation">
          <section className="candidate-logout-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-logout-title">
            <div className="candidate-logout-modal-body">
              <div className="candidate-logout-modal-heading">
                <h2 id="candidate-logout-title">Confirm Action</h2>
                <button
                  type="button"
                  className="candidate-logout-modal-close"
                  onClick={() => setShowLogoutConfirm(false)}
                  aria-label="Close logout confirmation"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <p>Are you sure you want to log out?</p>
            </div>
            <div className="candidate-logout-modal-footer">
              <button type="button" className="candidate-logout-cancel" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="candidate-logout-confirm" onClick={confirmLogout}>
                Confirm
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
