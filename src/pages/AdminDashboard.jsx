import React from 'react'
import { ConfirmModal } from '../components/ConfirmModal'

export function AdminDashboard({
  activeSidebarMenu,
  setActiveSidebarMenu,
  activeSettingsTab,
  setActiveSettingsTab,
  adminCurrentPassword,
  setAdminCurrentPassword,
  adminNewPassword,
  setAdminNewPassword,
  adminConfirmPassword,
  setAdminConfirmPassword,
  adminCurrentPasswordError,
  setAdminCurrentPasswordError,
  adminNewPasswordError,
  setAdminNewPasswordError,
  adminConfirmPasswordError,
  setAdminConfirmPasswordError,
  showAdminCurrentPassword,
  setShowAdminCurrentPassword,
  showAdminNewPassword,
  setShowAdminNewPassword,
  showAdminConfirmPassword,
  setShowAdminConfirmPassword,
  adminStrength,
  isLoading,
  showConfirmSave,
  setShowConfirmSave,
  handleAdminSaveChanges,
  executeAdminSaveChanges,
  handleAdminCancel,
  handleBackToLogin,
  handleLogout,
}) {
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = React.useState(false)

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo-section">
          <div className="sidebar-logo">
            <i className="fa-solid fa-circle" style={{ fontSize: '12px', color: 'var(--primary-color)' }}></i>
            JobFusion
          </div>
          <span className="sidebar-logo-sub">AI Talent Suite</span>
        </div>

        <ul className="sidebar-menu">
          <li className={`sidebar-menu-item ${activeSidebarMenu === 'dashboard' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveSidebarMenu('dashboard')}>
              <i className="fa-solid fa-grip"></i>
              <span>Dashboard</span>
            </button>
          </li>
          <li className={`sidebar-menu-item ${activeSidebarMenu === 'jobs' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveSidebarMenu('jobs')}>
              <i className="fa-solid fa-briefcase"></i>
              <span>Jobs</span>
            </button>
          </li>
          <li className={`sidebar-menu-item ${activeSidebarMenu === 'candidates' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveSidebarMenu('candidates')}>
              <i className="fa-solid fa-users"></i>
              <span>Candidates</span>
            </button>
          </li>
          <li className={`sidebar-menu-item ${activeSidebarMenu === 'emails' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveSidebarMenu('emails')}>
              <i className="fa-solid fa-envelope"></i>
              <span>Email Management</span>
            </button>
          </li>
          <li className={`sidebar-menu-item ${activeSidebarMenu === 'interviews' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveSidebarMenu('interviews')}>
              <i className="fa-solid fa-calendar-days"></i>
              <span>Interviews</span>
            </button>
          </li>
          <li className={`sidebar-menu-item ${activeSidebarMenu === 'analytics' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveSidebarMenu('analytics')}>
              <i className="fa-solid fa-chart-line"></i>
              <span>Analytics</span>
            </button>
          </li>
          <li className={`sidebar-menu-item ${activeSidebarMenu === 'settings' ? 'active' : ''}`}>
            <button type="button" onClick={() => setActiveSidebarMenu('settings')}>
              <i className="fa-solid fa-gear"></i>
              <span>Settings</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-search-wrapper">
            <i className="fa-solid fa-magnifying-glass header-search-icon"></i>
            <input 
              type="text" 
              className="header-search-input" 
              placeholder="Search candidates, skills, or locations..." 
            />
          </div>

          <div className="header-actions">
            <button type="button" className="workspace-btn">
              Workspace Switcher
            </button>

            <button type="button" className="header-icon-link" aria-label="Notifications">
              <i className="fa-regular fa-bell"></i>
            </button>

            <button type="button" className="header-icon-link" aria-label="Help Center">
              <i className="fa-regular fa-circle-question"></i>
            </button>

            <div 
              className="user-profile-section" 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{ position: 'relative', cursor: 'pointer' }}
            >
              <div className="user-avatar-placeholder">AT</div>
              <div className="user-info">
                <span className="user-name">Alex Thompson</span>
                <span className="user-role">HR</span>
              </div>

              {showProfileDropdown && (
                <div className="profile-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  <div className="dropdown-user-header">
                    <span className="dropdown-user-name">Alex Thompson</span>
                    <span className="dropdown-user-role">alex.t@jobfusion.ai</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button 
                    type="button" 
                    className="dropdown-item" 
                    onClick={() => {
                      setActiveSidebarMenu('settings')
                      setActiveSettingsTab('profile')
                      setShowProfileDropdown(false)
                    }}
                  >
                    <i className="fa-regular fa-user"></i>
                    <span>Profile Information</span>
                  </button>
                  <button 
                    type="button" 
                    className="dropdown-item" 
                    onClick={() => {
                      setActiveSidebarMenu('settings')
                      setActiveSettingsTab('change_password')
                      setShowProfileDropdown(false)
                    }}
                  >
                    <i className="fa-solid fa-lock"></i>
                    <span>Change Password</span>
                  </button>
                  <div className="dropdown-divider"></div>
                  <button 
                    type="button" 
                    className="dropdown-item logout-btn" 
                    onClick={() => {
                      setShowProfileDropdown(false)
                      if (handleLogout) handleLogout()
                    }}
                  >
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="admin-content-wrapper">
          <button type="button" className="back-home-link" onClick={handleBackToLogin}>
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back to Home</span>
          </button>

          <h2 className="admin-page-title">Account Settings</h2>

          <div className="settings-grid">
            {/* Security Tabs Card */}
            <div className="settings-tabs-card">
              <span className="tabs-group-title">Security Tabs</span>
              
              <button 
                type="button" 
                className={`settings-tab-btn ${activeSettingsTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('profile')}
              >
                <i className="fa-regular fa-user"></i>
                <span>Profile Information</span>
              </button>

              <button 
                type="button" 
                className={`settings-tab-btn ${activeSettingsTab === 'change_password' ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab('change_password')}
              >
                <i className="fa-solid fa-lock"></i>
                <span>Change Password</span>
              </button>
            </div>

            {/* Settings Form Card (Right Column) */}
            <div className="settings-form-card">
              <button 
                type="button" 
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
                onClick={() => setShowConfirmCancel(true)}
                aria-label="Clear form"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              <h3 className="settings-form-title">Change Password</h3>
              <p className="settings-form-desc">
                Update your account password to maintain security. We recommend using a unique password you don't use elsewhere.
              </p>

              <form onSubmit={handleAdminSaveChanges} noValidate>
                {/* Current Password */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <div className="form-label-row">
                    <label htmlFor="adminCurrentPass" className="form-label" style={{ marginBottom: 0 }}>
                      Current Password <span style={{ color: 'var(--error-color)' }}>*</span>
                    </label>
                  </div>
                  <div className="input-wrapper">
                    <input
                      type={showAdminCurrentPassword ? 'text' : 'password'}
                      id="adminCurrentPass"
                      className={`form-input ${adminCurrentPasswordError ? 'has-error' : ''}`}
                      placeholder="••••••••"
                      value={adminCurrentPassword}
                      onChange={(e) => {
                        setAdminCurrentPassword(e.target.value)
                        if (adminCurrentPasswordError) setAdminCurrentPasswordError('')
                      }}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="eye-icon-btn"
                      onClick={() => setShowAdminCurrentPassword(!showAdminCurrentPassword)}
                      aria-label={showAdminCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showAdminCurrentPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {adminCurrentPasswordError && (
                    <span className="error-text">{adminCurrentPasswordError}</span>
                  )}
                </div>

                {/* New Password */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <div className="form-label-row">
                    <label htmlFor="adminNewPass" className="form-label" style={{ marginBottom: 0 }}>
                      New Password <span style={{ color: 'var(--error-color)' }}>*</span>
                    </label>
                  </div>
                  <div className="input-wrapper">
                    <input
                      type={showAdminNewPassword ? 'text' : 'password'}
                      id="adminNewPass"
                      className={`form-input ${adminNewPasswordError ? 'has-error' : ''}`}
                      placeholder="•••••••••••••••"
                      value={adminNewPassword}
                      onChange={(e) => {
                        setAdminNewPassword(e.target.value)
                        if (adminNewPasswordError) setAdminNewPasswordError('')
                      }}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="eye-icon-btn"
                      onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                      aria-label={showAdminNewPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showAdminNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {adminNewPasswordError && (
                    <span className="error-text">{adminNewPasswordError}</span>
                  )}
                </div>

                {/* Password Strength segments indicator */}
                <div style={{ marginBottom: '20px' }}>
                  <div className="form-label-row">
                    <span className="form-label" style={{ marginBottom: 0, textTransform: 'uppercase', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                      Password Strength
                    </span>
                    {adminNewPassword && (
                      <span className={`strength-label ${adminStrength.strengthClass}`} style={{ fontSize: '12px' }}>
                        {adminStrength.strengthLabel}
                      </span>
                    )}
                  </div>
                  
                  {/* Segmented Strength Bar */}
                  <div className="strength-segments-container">
                    <div className={`strength-segment ${adminNewPassword && adminStrength.score >= 1 ? `active-${adminStrength.strengthClass}` : ''}`} />
                    <div className={`strength-segment ${adminNewPassword && adminStrength.score >= 2 ? `active-${adminStrength.strengthClass}` : ''}`} />
                    <div className={`strength-segment ${adminNewPassword && adminStrength.score >= 3 ? `active-${adminStrength.strengthClass}` : ''}`} />
                    <div className={`strength-segment ${adminNewPassword && adminStrength.score >= 4 ? `active-${adminStrength.strengthClass}` : ''}`} />
                  </div>

                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
                    Hint: Use mixed case, numbers, and symbols.
                  </span>
                </div>

                {/* Confirm New Password */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <div className="form-label-row">
                    <label htmlFor="adminConfirmPass" className="form-label" style={{ marginBottom: 0 }}>
                      Confirm New Password <span style={{ color: 'var(--error-color)' }}>*</span>
                    </label>
                  </div>
                  <div className="input-wrapper">
                    <input
                      type={showAdminConfirmPassword ? 'text' : 'password'}
                      id="adminConfirmPass"
                      className={`form-input ${adminConfirmPasswordError ? 'has-error' : ''}`}
                      placeholder="Re-type new password"
                      value={adminConfirmPassword}
                      onChange={(e) => {
                        setAdminConfirmPassword(e.target.value)
                        if (adminConfirmPasswordError) setAdminConfirmPasswordError('')
                      }}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="eye-icon-btn"
                      onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                      aria-label={showAdminConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showAdminConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {adminConfirmPasswordError && (
                    <span className="error-text">{adminConfirmPasswordError}</span>
                  )}
                </div>

                {/* Cancel & Save Buttons */}
                <div className="form-actions-row">
                  <button 
                    type="button" 
                    className="btn-outline-cancel"
                    onClick={() => setShowConfirmCancel(true)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>

                  <button 
                    type="submit" 
                    className="btn-save-changes"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner" style={{ borderTopColor: '#ffffff', marginRight: '8px' }} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="admin-footer">
          <span className="footer-copyright">
            <strong>JobFusion AI</strong> &copy; 2024 JobFusion AI. All rights reserved.
          </span>
          <div className="footer-links-group">
            <a href="#privacy" className="footer-link-item" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" className="footer-link-item" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#help" className="footer-link-item" onClick={(e) => e.preventDefault()}>Help Center</a>
          </div>
        </footer>
      </main>

      {/* Confirmation Modal for Cancel */}
      <ConfirmModal
        isOpen={showConfirmCancel}
        title="Confirm Action"
        message="Are you sure you want to proceed? This action will trigger the next step in the recruitment workflow."
        alertTitle="WORKFLOW ALERT"
        alertMessage="Are you sure you want to cancel? Your changes will not be saved."
        onCancel={() => setShowConfirmCancel(false)}
        onConfirm={() => {
          handleAdminCancel()
          setShowConfirmCancel(false)
        }}
      />

      {/* Confirmation Modal for Save Changes */}
      <ConfirmModal
        isOpen={showConfirmSave}
        title="Confirm Save Changes"
        message="Are you sure you want to update your password? This action will update your login credentials."
        alertTitle="SECURITY ALERT"
        alertMessage="Make sure you remember your new password before confirming. You will need to use it for your next sign in."
        onCancel={() => setShowConfirmSave(false)}
        onConfirm={executeAdminSaveChanges}
      />
    </div>
  )
}
