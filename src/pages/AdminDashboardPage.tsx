import React from 'react'
import { ConfirmModal } from '../components/common/ConfirmModal'
import SuperAdminFlow from '../features/admin/flows/SuperAdminFlow'
import TenantAdminFlow from '../features/admin/flows/TenantAdminFlow'
import HRFlow from '../features/admin/flows/HRFlow'
import InterviewerFlow from '../features/admin/flows/InterviewerFlow'
import CandidateFlow from '../features/admin/flows/CandidateFlow'

const ROLE_MENU_ITEMS = {
  super_admin: [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-line' },
    { key: 'tenants', label: 'Tenant Management', icon: 'fa-solid fa-building' },
    { key: 'subscriptions', label: 'Subscription Plans', icon: 'fa-solid fa-credit-card' },
    { key: 'prompts', label: 'Prompt Management', icon: 'fa-solid fa-code' },
    { key: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
  ],
  tenant_admin: [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-line' },
    { key: 'staff', label: 'Staff Management', icon: 'fa-solid fa-user-group' },
    { key: 'analytics', label: 'Analytics', icon: 'fa-solid fa-chart-pie' },
    { key: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
  ],
  hr: [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-line' },
    { key: 'jobs', label: 'Jobs', icon: 'fa-solid fa-briefcase' },
    { key: 'candidates', label: 'Candidates', icon: 'fa-solid fa-users' },
    { key: 'email', label: 'Email Management', icon: 'fa-solid fa-envelope' },
    { key: 'interviews', label: 'Interviews', icon: 'fa-solid fa-calendar-days' },
    { key: 'analytics', label: 'Analytics', icon: 'fa-solid fa-chart-pie' },
    { key: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
  ],
  interviewer: [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-line' },
    { key: 'my_interviews', label: 'My Interviews', icon: 'fa-solid fa-calendar-check' },
    { key: 'candidates', label: 'Candidates', icon: 'fa-solid fa-users' },
    { key: 'interview_detail', label: 'Interview Detail', icon: 'fa-solid fa-clipboard-list' },
    { key: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
  ],
  candidate: [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-line' },
    { key: 'my_jobs', label: 'My Jobs', icon: 'fa-solid fa-briefcase' },
    { key: 'interviews', label: 'Interviews', icon: 'fa-solid fa-calendar-days' },
    { key: 'ai_insights', label: 'AI Insights', icon: 'fa-solid fa-brain' },
    { key: 'settings', label: 'Profile Settings', icon: 'fa-solid fa-user-gear' },
  ],
}

const ROLE_USER_METADATA = {
  super_admin: {
    initials: 'SA',
    name: 'System Admin',
    roleName: 'Super Admin',
    email: 'admin@jobfusion.ai',
  },
  tenant_admin: {
    initials: 'TA',
    name: 'Sarah Jenkins',
    roleName: 'Tenant Admin',
    email: 'sarah.j@ttbmedia.com',
  },
  hr: {
    initials: 'HR',
    name: 'David Ross',
    roleName: 'HR Manager',
    email: 'd.ross@ttbmedia.com',
  },
  interviewer: {
    initials: 'IV',
    name: 'Emma Stone',
    roleName: 'Interviewer',
    email: 'emma@ttbmedia.com',
  },
  candidate: {
    initials: 'JD',
    name: 'John Doe',
    roleName: 'Candidate',
    email: 'john.doe@email.com',
  },
}

function getRoleMenuItems(role) {
  return ROLE_MENU_ITEMS[role] || ROLE_MENU_ITEMS.super_admin
}

function getRoleUserMetadata(role) {
  return ROLE_USER_METADATA[role] || ROLE_USER_METADATA.super_admin
}

export function AdminDashboardPage({
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
  handleLogout,
}) {
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = React.useState(false)

  // Local state for Tenant Management
  const [tenantSearch, setTenantSearch] = React.useState('')
  const [tenantFilterTab, setTenantFilterTab] = React.useState('all')
  const [tenantFilterPlan, setTenantFilterPlan] = React.useState('all')
  const [showPlanDropdown, setShowPlanDropdown] = React.useState(false)
  const [selectedTenant, setSelectedTenant] = React.useState(null)
  const [currentRole, setCurrentRole] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('jobfusion_admin_role') || 'super_admin'
    }
    return 'super_admin'
  })
  const [isCreatingTenant, setIsCreatingTenant] = React.useState(false)

  const tenantsData = [
    { id: 'TNT-001', name: 'Nexus Media Group', domain: 'nexusmedia.com', initials: 'NM', plan: 'ENTERPRISE', expiration: 'Oct 24, 2025', expirationSub: 'Auto-renews', expirationSubClass: '', quotaUsed: 12, quotaMax: 14, status: 'Active', bgClass: 'orange-avatar-bg' },
    { id: 'TNT-002', name: 'Vanguard Logistics', domain: 'vanguard.io', initials: 'V', plan: 'PRO PLAN', expiration: 'Dec 15, 2023', expirationSub: 'Expired', expirationSubClass: 'expired-text', quotaUsed: 20, quotaMax: 20, status: 'Inactive', bgClass: 'blue-avatar-bg' },
    { id: 'TNT-003', name: 'TalentCloud AI', domain: 'talentcloud.ai', initials: 'TC', plan: 'ENTERPRISE', expiration: 'May 12, 2026', expirationSub: 'Annual Billing', expirationSubClass: '', quotaUsed: 1, quotaMax: 10, status: 'Active', bgClass: 'light-blue-avatar-bg' },
    { id: 'TNT-004', name: 'SkyBlue Ventures', domain: 'skyblue.com', initials: 'SB', plan: 'GROWTH', expiration: 'Jan 30, 2025', expirationSub: 'Trialing', expirationSubClass: '', quotaUsed: 5, quotaMax: 10, status: 'Active', bgClass: 'indigo-avatar-bg' },
    { id: 'TNT-005', name: 'TTB Media', domain: 'ttbmedia.com', initials: 'TT', plan: 'GROWTH', expiration: 'Oct 23, 2025', expirationSub: 'Trialing', expirationSubClass: '', quotaUsed: 7, quotaMax: 10, status: 'Active', bgClass: 'indigo-avatar-bg' },
  ]


  const meta = getRoleUserMetadata(currentRole)

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

        <div className="role-switcher-container">
          <label className="role-switcher-label">ROLE FLOW</label>
          <select 
            className="role-switcher-select" 
            value={currentRole} 
            onChange={(e) => {
              const role = e.target.value;
              setCurrentRole(role);
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('jobfusion_admin_role', role);
              }
              setActiveSidebarMenu('dashboard');
              setSelectedTenant(null);
              setIsCreatingTenant(false);
            }}
          >
            <option value="super_admin">Super Admin</option>
            <option value="tenant_admin">Tenant Admin</option>
            <option value="hr">HR</option>
            <option value="interviewer">Interviewer</option>
            <option value="candidate">Candidate</option>
          </select>
        </div>

        <ul className="sidebar-menu">
          {getRoleMenuItems(currentRole).map((item) => (
            <li key={item.key} className={`sidebar-menu-item ${activeSidebarMenu === item.key ? 'active' : ''}`}>
              <button type="button" onClick={() => {
                setActiveSidebarMenu(item.key);
                if (item.key !== 'tenants') {
                  setSelectedTenant(null);
                  setIsCreatingTenant(false);
                }
              }}>
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
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
              <div className="user-avatar-placeholder">{meta.initials}</div>
              <div className="user-info">
                <span className="user-name">{meta.name}</span>
                <span className="user-role">{meta.roleName}</span>
              </div>

              {showProfileDropdown && (
                <div className="profile-dropdown-menu custom-logout-dropdown" onClick={(e) => e.stopPropagation()}>
                  <button 
                    type="button" 
                    className="dropdown-item" 
                    onClick={() => {
                      setActiveSidebarMenu('settings')
                      setActiveSettingsTab('profile')
                      setShowProfileDropdown(false)
                    }}
                  >
                    <i className="fa-solid fa-user-group"></i>
                    <span>Profile</span>
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
                    <span>Change password</span>
                  </button>
                  <div className="dropdown-divider"></div>
                  <button 
                    type="button" 
                    className="dropdown-item logout-menu-btn" 
                    onClick={() => {
                      setShowProfileDropdown(false)
                      if (handleLogout) handleLogout()
                    }}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="admin-content-wrapper">
          {activeSidebarMenu === 'tenants' ? (
            selectedTenant ? (
              <div className="admin-breadcrumb">
                <i className="fa-solid fa-house breadcrumb-icon clickable" onClick={() => { setSelectedTenant(null); setIsCreatingTenant(false); }}></i>
                <span className="breadcrumb-item clickable" onClick={() => { setSelectedTenant(null); setIsCreatingTenant(false); }}>Home</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item clickable" onClick={() => { setSelectedTenant(null); setIsCreatingTenant(false); }}>Tenant Management</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item active-breadcrumb">Tenant detail</span>
              </div>
            ) : isCreatingTenant ? (
              <div className="admin-breadcrumb">
                <i className="fa-solid fa-house breadcrumb-icon clickable" onClick={() => { setSelectedTenant(null); setIsCreatingTenant(false); }}></i>
                <span className="breadcrumb-item clickable" onClick={() => { setSelectedTenant(null); setIsCreatingTenant(false); }}>Home</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item clickable" onClick={() => { setSelectedTenant(null); setIsCreatingTenant(false); }}>Tenant Management</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item active-breadcrumb" style={{ color: '#ea4335' }}>Create New Tenant</span>
              </div>
            ) : (
              <div className="admin-breadcrumb">
                <i className="fa-solid fa-house breadcrumb-icon"></i>
                <span className="breadcrumb-item">Home</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item active-breadcrumb">Tenant Management</span>
              </div>
            )
          ) : (
            activeSidebarMenu !== 'dashboard' && (
              <h2 className="admin-page-title">
                {activeSidebarMenu === 'subscriptions' && 'Subscription Plans'}
                {activeSidebarMenu === 'prompts' && 'Prompt Management'}
                {activeSidebarMenu === 'settings' && (currentRole === 'candidate' ? 'Profile Settings' : 'Account Settings')}
                {activeSidebarMenu === 'analytics' && 'Analytics'}
                {activeSidebarMenu === 'jobs' && 'Jobs'}
                {activeSidebarMenu === 'candidates' && 'Candidates'}
                {activeSidebarMenu === 'email' && 'Email Management'}
                {activeSidebarMenu === 'interviews' && 'Interviews'}
                {activeSidebarMenu === 'my_interviews' && 'My Interviews'}
                {activeSidebarMenu === 'interview_detail' && 'Interview Detail'}
                {activeSidebarMenu === 'my_jobs' && 'My Jobs'}
                {activeSidebarMenu === 'ai_insights' && 'AI Insights'}
              </h2>
            )
          )}

          {/* Super Admin views */}
          {currentRole === 'super_admin' && (
            <SuperAdminFlow
              activeSidebarMenu={activeSidebarMenu}
              tenantSearch={tenantSearch}
              setTenantSearch={setTenantSearch}
              tenantFilterTab={tenantFilterTab}
              setTenantFilterTab={setTenantFilterTab}
              tenantFilterPlan={tenantFilterPlan}
              setTenantFilterPlan={setTenantFilterPlan}
              showPlanDropdown={showPlanDropdown}
              setShowPlanDropdown={setShowPlanDropdown}
              selectedTenant={selectedTenant}
              setSelectedTenant={setSelectedTenant}
              tenantsData={tenantsData}
              isCreatingTenant={isCreatingTenant}
              setIsCreatingTenant={setIsCreatingTenant}
            />
          )}

          {/* Tenant Admin views */}
          {currentRole === 'tenant_admin' && (
            <TenantAdminFlow
              activeSidebarMenu={activeSidebarMenu}
              setActiveSidebarMenu={setActiveSidebarMenu}
            />
          )}

          {/* HR views */}
          {currentRole === 'hr' && (
            <HRFlow
              activeSidebarMenu={activeSidebarMenu}
              renderAnalyticsView={() => (
                <div className="dashboard-card full-width">
                  <div className="card-header"><h3 className="card-title">Analytics & Token Usage</h3></div>
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa-solid fa-chart-line" style={{ fontSize: '48px', color: 'var(--primary-color)', marginBottom: '16px' }}></i>
                    <h4>Usage over time</h4>
                    <p>Token usage has increased by 14% this month. Total calls: 124.5k.</p>
                  </div>
                </div>
              )}
            />
          )}

          {/* Interviewer views */}
          {currentRole === 'interviewer' && (
            <InterviewerFlow
              activeSidebarMenu={activeSidebarMenu}
              renderCandidatesView={() => (
                <div className="dashboard-card full-width">
                  <div className="card-header"><h3 className="card-title">Candidates Pool</h3></div>
                  <div className="table-responsive">
                    <table className="dashboard-table large">
                      <thead>
                        <tr><th>Name</th><th>Role Applied</th><th>Match Score</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        <tr><td className="font-semibold">John Doe</td><td>React Tech Lead</td><td><span className="badge badge-starter" style={{ color: '#166534', backgroundColor: '#dcfce7' }}>98% Match</span></td><td><span className="status-indicator status-active">Screened</span></td></tr>
                        <tr><td className="font-semibold">Alice Vance</td><td>UI/UX Designer</td><td><span className="badge badge-starter" style={{ color: '#166534', backgroundColor: '#dcfce7' }}>91% Match</span></td><td><span className="status-indicator status-active">Interviewing</span></td></tr>
                        <tr><td className="font-semibold">Bob Miller</td><td>QA Analyst</td><td><span className="badge badge-enterprise" style={{ color: '#991b1b', backgroundColor: '#fef2f2' }}>45% Match</span></td><td><span className="status-indicator status-suspended">Rejected</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            />
          )}

          {/* Candidate views */}
          {currentRole === 'candidate' && (
            <CandidateFlow
              activeSidebarMenu={activeSidebarMenu}
              renderInterviewsView={() => (
                <div className="dashboard-card full-width">
                  <div className="card-header"><h3 className="card-title">Interviews Calendar</h3></div>
                  <div style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>
                    <i className="fa-regular fa-calendar-days" style={{ fontSize: '48px', color: 'var(--primary-color)', marginBottom: '16px' }}></i>
                    <p>No upcoming interviews scheduled for today.</p>
                  </div>
                </div>
              )}
            />
          )}

          {/* Settings view shared across roles */}
          {activeSidebarMenu === 'settings' && (
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
                    {adminCurrentPasswordError && (
                      <span className="form-label-error">{adminCurrentPasswordError}</span>
                    )}
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
                </div>

                {/* New Password */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <div className="form-label-row">
                    <label htmlFor="adminNewPass" className="form-label" style={{ marginBottom: 0 }}>
                      New Password <span style={{ color: 'var(--error-color)' }}>*</span>
                    </label>
                    {adminNewPasswordError && (
                      <span className="form-label-error">{adminNewPasswordError}</span>
                    )}
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
                    {adminConfirmPasswordError && (
                      <span className="form-label-error">{adminConfirmPasswordError}</span>
                    )}
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
          )}
        </div>
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
