import { useState, useRef, useEffect, type FormEvent } from 'react'
import { getPasswordStrength } from '../features/auth/utils/passwordStrength'

type CandidatePortalPageProps = {
  onLogout: () => void
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

export function CandidatePortalPage({ onLogout }: CandidatePortalPageProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [activePanel, setActivePanel] = useState<'dashboard' | 'changePassword'>('dashboard')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordSaveMessage, setPasswordSaveMessage] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const passwordStrength = getPasswordStrength(newPassword)

  const resetPasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setCurrentPasswordError('')
    setNewPasswordError('')
    setConfirmPasswordError('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setPasswordSaveMessage('')
  }

  const closeChangePasswordPanel = () => {
    resetPasswordForm()
    setActivePanel('dashboard')
  }

  const handleChangePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordSaveMessage('')

    let hasError = false

    if (!currentPassword.trim()) {
      setCurrentPasswordError('Please enter current password.')
      hasError = true
    } else {
      setCurrentPasswordError('')
    }

    if (!newPassword) {
      setNewPasswordError('Please enter new password.')
      hasError = true
    } else if (newPassword === currentPassword) {
      setNewPasswordError('New password must be different from current password.')
      hasError = true
    } else if (passwordStrength.score < 4) {
      setNewPasswordError('Password does not meet requirements.')
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

    if (hasError) return

    setIsSavingPassword(true)
    window.setTimeout(() => {
      resetPasswordForm()
      setIsSavingPassword(false)
      setPasswordSaveMessage('Password changed successfully.')
    }, 800)
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
            <button key={item.label} type="button" className={`candidate-nav-item ${item.active ? 'active' : ''}`}>
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="candidate-profile-card">
          <div className="candidate-avatar">A</div>
          <div>
            <strong>Alex Nguyen</strong>
            <span>Senior Developer</span>
          </div>
          <button type="button" onClick={onLogout} className="candidate-logout-btn">
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
                <div className="candidate-mini-avatar">A</div>
                <span className="candidate-user-name">Alex Nguyen</span>
                <i className={`fa-solid fa-chevron-down candidate-chevron ${showDropdown ? 'open' : ''}`}></i>
              </button>
              
              {showDropdown && (
                <div className="candidate-user-dropdown" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <i className="fa-regular fa-user"></i>
                    <span>Profile</span>
                  </button>
                  <button type="button" className="dropdown-item" onClick={() => {
                    setActivePanel('changePassword')
                    setShowDropdown(false)
                  }}>
                    <i className="fa-solid fa-lock"></i>
                    <span>Change password</span>
                  </button>
                  <div className="dropdown-divider"></div>
                  <button type="button" className="dropdown-item logout" onClick={() => {
                    setShowDropdown(false)
                    onLogout()
                  }}>
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="candidate-content">
          {activePanel === 'changePassword' ? (
            <section className="candidate-settings-screen">
              <button type="button" className="candidate-back-home" onClick={closeChangePasswordPanel}>
                <i className="fa-solid fa-arrow-left"></i>
                <span>Back to Home</span>
              </button>

              <h1>Account Settings</h1>

              <div className="candidate-settings-layout">
                <aside className="security-tabs-card" aria-label="Security tabs">
                  <strong>Security Tabs</strong>
                  <button type="button">
                    <i className="fa-regular fa-user"></i>
                    <span>Profile Information</span>
                  </button>
                  <button type="button" className="active">
                    <i className="fa-solid fa-lock"></i>
                    <span>Change Password</span>
                  </button>
                </aside>

                <section className="change-password-card">
                  <button type="button" className="change-password-close" aria-label="Close" onClick={closeChangePasswordPanel}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>

                  <div className="change-password-heading">
                    <h2>Change Password</h2>
                    <p>Update your account password to maintain security. We recommend using a unique password you don't use elsewhere.</p>
                  </div>

                  <form className="change-password-form" onSubmit={handleChangePasswordSubmit} noValidate>
                    <label>
                      <span>Current Password <em>*</em></span>
                      <div className={`password-input-row ${currentPasswordError ? 'has-error' : ''}`}>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(event) => {
                            setCurrentPassword(event.target.value)
                            if (currentPasswordError) setCurrentPasswordError('')
                            if (passwordSaveMessage) setPasswordSaveMessage('')
                          }}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="password-eye-btn"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        >
                          <i className={`fa-regular ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      {currentPasswordError && <small className="password-error">{currentPasswordError}</small>}
                    </label>

                    <label>
                      <span>New Password <em>*</em></span>
                      <div className={`password-input-row ${newPasswordError ? 'has-error' : ''}`}>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(event) => {
                            setNewPassword(event.target.value)
                            if (newPasswordError) setNewPasswordError('')
                            if (confirmPasswordError && confirmPassword === event.target.value) setConfirmPasswordError('')
                            if (passwordSaveMessage) setPasswordSaveMessage('')
                          }}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="password-eye-btn"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        >
                          <i className={`fa-regular ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      {newPasswordError && <small className="password-error">{newPasswordError}</small>}
                    </label>

                    <div className="password-strength-row">
                      <div>
                        <span>Password Strength</span>
                        <strong className={passwordStrength.strengthClass}>{newPassword ? passwordStrength.strengthLabel : 'Weak'}</strong>
                      </div>
                      <div className="password-strength-meter">
                        <span className={passwordStrength.strengthClass} style={{ width: newPassword ? passwordStrength.progressWidth : '0%' }}></span>
                      </div>
                      <small>Hint: At least 8 characters, use mixed case, numbers, and symbols.</small>
                    </div>

                    <label>
                      <span>Confirm New Password <em>*</em></span>
                      <div className={`password-input-row ${confirmPasswordError ? 'has-error' : ''}`}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value)
                            if (confirmPasswordError) setConfirmPasswordError('')
                            if (passwordSaveMessage) setPasswordSaveMessage('')
                          }}
                          placeholder="Re-type your new password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="password-eye-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      {confirmPasswordError && <small className="password-error">{confirmPasswordError}</small>}
                    </label>

                    {passwordSaveMessage && <p className="password-success-message">{passwordSaveMessage}</p>}

                    <div className="change-password-actions">
                      <button type="button" className="password-cancel-btn" onClick={resetPasswordForm} disabled={isSavingPassword}>Cancel</button>
                      <button type="submit" className="password-save-btn" disabled={isSavingPassword}>
                        {isSavingPassword ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            </section>
          ) : (
            <>
          <section className="candidate-welcome">
            <div>
              <h1>Welcome back, Alex!</h1>
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
    </main>
  )
}
