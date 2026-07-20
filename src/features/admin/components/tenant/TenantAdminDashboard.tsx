import { useEffect, useState, type FormEvent } from 'react'
import { getTenantAdminNav } from '../../data/adminNavigation'
import type { TenantAdminView, StaffMember, UserStatus, Tenant, SubscriptionPlan } from '../../types/admin.types'
import { getInitialTenantAdminView, updateTenantAdminViewUrl } from '../../utils/adminRouteHelpers'
import { AccountSettingsView } from '../shared/AccountSettingsView'
import { DashboardShell } from '../shared/DashboardShell'
import { MetricCard } from '../shared/MetricCard'
import { ADMIN_LIST_PAGE_SIZE, adminApi } from '../../services/adminApi'
import { ConfirmActionModal } from '../shared/ConfirmActionModal'
import { getAdminErrorMessage } from '../../utils/adminErrors'
import { shouldToastHttpError } from '../../../../utils/httpStatusManager'
import { getListPageCount, getPaginationMeta } from '../../utils/adminMappers'

function getStoredTenantId() {
  const rawUser = window.localStorage.getItem('user_info') || window.sessionStorage.getItem('user_info')
  if (!rawUser) return ''

  try {
    const user = JSON.parse(rawUser)
    const tenant =
      user?.tenant ||
      user?.tenantInfo ||
      user?.company ||
      user?.workspace ||
      {}
    const tenantId =
      user?.tenantId ||
      user?.tenant_id ||
      user?.companyId ||
      user?.company_id ||
      user?.workspaceId ||
      user?.workspace_id ||
      tenant?.id ||
      tenant?.tenantId ||
      tenant?.uuid

    return tenantId ? String(tenantId) : ''
  } catch {
    return ''
  }
}

function formatDashboardDate(value?: string) {
  if (!value || value === '-') return '-'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(parsed))
}

function StaffManagementView({
  staffList,
  isLoading,
  error,
  maxStaffQuota = 10,
  isStaffQuotaUnlimited = false,
  onCreate,
  onEdit,
  onDelete,
  onSelectStaff,
  currentPage,
  pageCount,
  onPageChange,
}: {
  staffList: StaffMember[]
  isLoading: boolean
  error: string
  maxStaffQuota?: number
  isStaffQuotaUnlimited?: boolean
  onCreate: () => void
  onEdit: (staff: StaffMember) => void
  onDelete: (staff: StaffMember) => void
  onSelectStaff: (staff: StaffMember) => void
  currentPage: number
  pageCount: number
  onPageChange: (page: number) => void
}) {
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStaff = staffList.filter(staff => {
    // 1. Search Query
    const normalizedSearch = searchQuery.toLowerCase().trim()
    const matchesSearch = !normalizedSearch || 
      staff.fullName.toLowerCase().includes(normalizedSearch) || 
      staff.email.toLowerCase().includes(normalizedSearch)

    // 2. Role Filter
    const matchesRole = roleFilter === 'all' || 
      (staff.userRole && staff.userRole.toLowerCase().includes(roleFilter))

    // 3. Status Filter
    let matchesStatus = true
    if (statusFilter === 'activated') {
      matchesStatus = staff.status === 'ACTIVE'
    } else if (statusFilter === 'pending') {
      matchesStatus = staff.status === 'PENDING'
    } else if (statusFilter === 'disabled') {
      matchesStatus = staff.status === 'DISABLED'
    }

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalElements = filteredStaff.length
  const totalPages = pageCount
  const paginatedStaff = filteredStaff
  const displayStart = totalElements === 0 ? 0 : ((currentPage - 1) * ADMIN_LIST_PAGE_SIZE) + 1
  const displayEnd = displayStart === 0 ? 0 : displayStart + totalElements - 1

  useEffect(() => {
    onPageChange(1)
  }, [roleFilter, statusFilter, searchQuery, onPageChange])

  useEffect(() => {
    if (!isLoading && !error && staffList.length === 0 && currentPage > 1) {
      onPageChange(Math.max(1, currentPage - 1))
    }
  }, [currentPage, error, isLoading, onPageChange, staffList.length])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Oct 12, 2023'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const quotaPercent = Math.min(100, Math.round((staffList.length / Math.max(maxStaffQuota, 1)) * 100))
  const hasReachedStaffQuota = !isStaffQuotaUnlimited && staffList.length >= maxStaffQuota

  return (
    <div className="role-content staff-management-content">
      <div className="tenant-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <span className="breadcrumb-separator">/</span>
        <strong>Staff Management</strong>
      </div>

      <div className="staff-management-head">
        <div>
          <h1>Staff Management</h1>
          <p>Manage your team members and recruitment permissions.</p>
        </div>
        <section className="staff-quota-card">
          <div>
            <span>Staff Accounts</span>
            <strong>{staffList.length} / {isStaffQuotaUnlimited ? 'Unlimited' : maxStaffQuota}</strong>
          </div>
          {!isStaffQuotaUnlimited && (
            <i><span style={{ width: `${quotaPercent}%`, background: '#ff5f2b' }} /></i>
          )}
          <small>{isStaffQuotaUnlimited ? 'Unlimited seats available' : `${Math.max(0, maxStaffQuota - staffList.length)} seats remaining`}</small>
        </section>
      </div>

      <div className="staff-management-toolbar">
        <label>
          <span>Role:</span>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="hr">HR</option>
            <option value="interviewer">Interviewer</option>
          </select>
        </label>
        <label>
          <span>Status:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="activated">Active</option>
            <option value="pending">Pending</option>
            <option value="disabled">Inactive</option>
          </select>
        </label>
        <div className="staff-search">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input 
            type="search" 
            placeholder="Search full name or email address..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="tenant-create-btn"
          onClick={onCreate}
          disabled={hasReachedStaffQuota}
        >
          Create Staff Account
        </button>
      </div>

      {isLoading ? (
        <div className="tenant-list-table-state" style={{ marginTop: '24px' }}>Loading staff accounts...</div>
      ) : error ? (
        <div className="tenant-list-table-state error" style={{ marginTop: '24px' }}>{error}</div>
      ) : staffList.length === 0 ? (
        <section className="staff-empty-state">
          <i className="fa-solid fa-user-plus"></i>
          <span><i className="fa-solid fa-briefcase"></i></span>
          <strong>No staff accounts found</strong>
          <p>Click "Create Staff Account" to add your first team member.</p>
        </section>
      ) : filteredStaff.length === 0 ? (
        <div className="tenant-list-table-state" style={{ marginTop: '24px' }}>No staff members match the filters.</div>
      ) : (
        <section className="staff-list-table-card">
          <div className="staff-list-table-row staff-list-table-head">
            <span>Full Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Date Created</span>
            <span>Actions</span>
          </div>

          {paginatedStaff.map(staff => {
            const roleList = staff.userRole 
              ? staff.userRole.split(', ').map(r => r.trim())
              : []
            const isActive = staff.status === 'ACTIVE'
            const isPending = staff.status === 'PENDING'

            return (
              <div className="staff-list-table-row" key={staff.id}>
                <strong 
                  className="staff-clickable-name staff-truncate-text"
                  title={staff.fullName}
                  onClick={() => onSelectStaff(staff)}
                >
                  {staff.fullName}
                </strong>
                <span className="staff-truncate-text" title={staff.email}>{staff.email}</span>
                <div>
                  {roleList.map(r => (
                    <span key={r} className="staff-badge">{r}</span>
                  ))}
                </div>
                <em className={isActive ? 'active' : isPending ? 'pending' : 'disabled'}>
                  <i className="fa-solid fa-circle" style={{ fontSize: '6px' }}></i>
                  {isActive ? 'Active' : isPending ? 'Pending' : 'Inactive'}
                </em>
                <span>{formatDate(staff.createdAt)}</span>
                <div className="staff-actions">
                  <button 
                    type="button" 
                    aria-label={`Edit ${staff.fullName}`}
                    onClick={() => onEdit(staff)}
                  >
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M8.75 21.25V16.25L21.25 3.75L26.25 8.75L13.75 21.25H8.75Z" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.75 26.25H26.25" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17.5 7.5L22.5 12.5" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button 
                    type="button" 
                    aria-label={`Delete ${staff.fullName}`}
                    onClick={() => onDelete(staff)}
                  >
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                </div>
              </div>
            )
          })}

          <footer>
            <span>Showing {displayStart}-{displayEnd} of {totalElements} staff account{totalElements === 1 ? '' : 's'}</span>
            <div>
              <button 
                type="button" 
                disabled={currentPage === 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button 
                  key={p} 
                  type="button" 
                  className={currentPage === p ? 'active' : ''}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              ))}
              <button 
                type="button" 
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </footer>
        </section>
      )}
    </div>
  )
}

function CreateStaffAccountView({
  staffMember,
  staffList = [],
  onCancel,
  onConfirm,
  isSubmitting = false,
}: {
  staffMember?: StaffMember
  staffList?: StaffMember[]
  onCancel: () => void
  onConfirm: (payload: { fullName: string; email: string; role: string[]; status: UserStatus }) => void
  isSubmitting?: boolean
}) {
  const isEdit = !!staffMember
  const [fullName, setFullName] = useState(staffMember?.fullName || '')
  const [email, setEmail] = useState(staffMember?.email || '')
  const [fullNameError, setFullNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  
  // Parse roles
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    if (!staffMember?.userRole) return ['hr'] // default to HR on create
    return staffMember.userRole.split(', ').map(r => r.trim().toLowerCase())
  })
  
  const [status, setStatus] = useState<UserStatus>(staffMember?.status || 'ACTIVE')

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        // Must have at least one role selected
        if (prev.length === 1) return prev
        return prev.filter(r => r !== role)
      } else {
        return [...prev, role]
      }
    })
  }

  const validateEmail = (value: string) => {
    const trimmedEmail = value.trim()
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/

    if (!trimmedEmail) return 'Please enter an email address.'
    if (!emailPattern.test(trimmedEmail)) {
      const [localPart = '', domainPart = ''] = trimmedEmail.split('@')
      const topLevelDomain = domainPart.includes('.') ? domainPart.split('.').pop() || '' : ''

      if (/[^A-Za-z0-9._%+-]/.test(localPart) || /[^A-Za-z0-9.-]/.test(domainPart)) {
        return 'Please enter a valid email address.'
      }

      if (topLevelDomain.length < 2) {
        return 'Please enter a valid email address.'
      }

      return 'Please enter a valid email address.'
    }

    const isEmailRegistered = staffList.some((staff) => staff.email.trim().toLowerCase() === trimmedEmail.toLowerCase())
    if (!isEdit && isEmailRegistered) {
      return 'This email address is already registered. Please use a different email.'
    }

    return ''
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const nextFullNameError = fullName.trim() ? '' : "Please enter the staff member's full name."
    const nextEmailError = validateEmail(email)

    setFullNameError(nextFullNameError)
    setEmailError(nextEmailError)

    if (nextFullNameError || nextEmailError) {
      return
    }

    // Map roles to uppercase: "HR" or "Interviewer" (matching backend validation regexp ^(HR|Interviewer)$)
    const rolePayload = selectedRoles.map(r => r === 'hr' ? 'HR' : 'Interviewer')
    onConfirm({
      fullName,
      email: email.trim(),
      role: rolePayload,
      status,
    })
  }

  return (
    <div className="role-content create-staff-content">
      <div className="tenant-breadcrumb create-staff-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <span className="breadcrumb-separator">/</span>
        <span>Staff Management</span>
        <span className="breadcrumb-separator">/</span>
        <strong>{isEdit ? 'Edit Staff Account' : 'Create New Staff Account'}</strong>
      </div>

      <section className="create-staff-card">
        <header className="create-staff-header">
          <div className="create-staff-title">
            <span><i className={`fa-solid ${isEdit ? 'fa-user-pen' : 'fa-user-plus'}`}></i></span>
            <div>
              <h1>{isEdit ? 'Edit Staff Account' : 'Create Staff Account'}</h1>
              <p>{isEdit ? 'Modify user account settings and access roles.' : 'Provision a new user account with specific access roles.'}</p>
            </div>
          </div>
          <span className="system-status"><i className="fa-solid fa-circle"></i> SYSTEM ONLINE</span>
        </header>

        <form className="create-staff-form" onSubmit={handleSubmit} noValidate>
          <div className="create-staff-grid">
            <fieldset className="staff-fieldset">
              <legend>Identity Details</legend>
              <label>
                <span>Full Name</span>
                <div>
                  <i className="fa-regular fa-user"></i>
                  <input 
                    className={fullNameError ? 'has-error' : ''}
                    type="text" 
                    placeholder="e.g. Sarah Jenkins" 
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (fullNameError) setFullNameError('')
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                {fullNameError && <small className="staff-field-error">{fullNameError}</small>}
              </label>
              <label>
                <span>Corporate Email Address</span>
                <div>
                  <i className="fa-regular fa-envelope"></i>
                  <input 
                    className={emailError ? 'has-error' : ''}
                    type="email" 
                    placeholder="sarah.j@jobfusion.com" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError('')
                    }}
                    disabled={isEdit || isSubmitting}
                  />
                </div>
                {emailError && <small className="staff-field-error">{emailError}</small>}
              </label>
              {isEdit && (
                <label style={{ marginTop: '16px' }}>
                  <span>Account Status</span>
                  <div style={{ border: '1px solid #f0b8a8', borderRadius: '5px', padding: '0 8px', background: '#ffffff', height: '45px', display: 'flex', alignItems: 'center' }}>
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value as UserStatus)}
                      disabled={isSubmitting}
                      style={{ width: '100%', border: 0, outline: 0, background: 'transparent', font: 'inherit', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING">Pending</option>
                      <option value="DISABLED">Inactive</option>
                    </select>
                  </div>
                </label>
              )}
            </fieldset>

            <fieldset className="staff-fieldset">
              <legend>Access & Permissions</legend>
              <div 
                className={`staff-role-card-option ${selectedRoles.includes('hr') ? 'selected' : ''}`}
                onClick={() => !isSubmitting && handleRoleToggle('hr')}
              >
                <input 
                  type="checkbox" 
                  checked={selectedRoles.includes('hr')}
                  onChange={() => {}} // handled by div onClick
                  disabled={isSubmitting}
                />
                <span><i className="fa-solid fa-users-gear"></i></span>
                <div>
                  <strong>HR</strong>
                  <small>Full access to candidate sourcing and recruitment management tools.</small>
                </div>
                <i className="staff-role-card-dot" aria-hidden="true"></i>
              </div>
              <div 
                className={`staff-role-card-option ${selectedRoles.includes('interviewer') ? 'selected' : ''}`}
                onClick={() => !isSubmitting && handleRoleToggle('interviewer')}
              >
                <input 
                  type="checkbox" 
                  checked={selectedRoles.includes('interviewer')}
                  onChange={() => {}} // handled by div onClick
                  disabled={isSubmitting}
                />
                <span><i className="fa-solid fa-clipboard-check"></i></span>
                <div>
                  <strong>Interviewer</strong>
                  <small>Can view assigned interviews, candidate profiles and submit evaluation feedback.</small>
                </div>
                <i className="staff-role-card-dot" aria-hidden="true"></i>
              </div>
            </fieldset>
          </div>

          <div className="staff-automation-note">
            <span><i className="fa-solid fa-wand-magic-sparkles"></i></span>
            <div>
              <strong>Platform Automation Notice</strong>
              <p>Once you confirm, an activation email will be dispatched immediately. The new team member will have <b>48 hours</b> to securely set their password and finalize their profile before the invitation link expires.</p>
            </div>
          </div>

          <footer className="create-staff-actions">
            <small><i className="fa-regular fa-circle-question"></i> Required fields are validated before submission.</small>
            <button type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="tenant-create-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Account' : 'Confirm'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function EditStaffAccountView({
  staffMember,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: {
  staffMember: StaffMember
  onCancel: () => void
  onConfirm: (payload: { fullName: string; email: string; role: string[]; status: UserStatus }) => void
  isSubmitting?: boolean
}) {
  const [fullName, setFullName] = useState(staffMember.fullName)
  const [fullNameError, setFullNameError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    const roles = staffMember.userRole
      ? staffMember.userRole.split(',').map((role) => role.trim().toLowerCase())
      : []

    return roles.length > 0 ? roles : ['hr']
  })

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return 'U'
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
  }

  const formatActivityDate = (dateStr?: string) => {
    if (!dateStr) return '2 hours ago'

    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr

    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.max(1, Math.round(Math.abs(diffMs) / 60000))

    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`

    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

    const diffDays = Math.round(diffHours / 24)
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }

  const toggleRole = (role: string) => {
    setSelectedRoles((current) => {
      if (current.includes(role)) {
        return current.length === 1 ? current : current.filter((item) => item !== role)
      }

      return [...current, role]
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!fullName.trim()) {
      setFullNameError('Full name cannot be empty.')
      return
    }

    const rolePayload = selectedRoles.map((role) => role === 'hr' ? 'HR' : 'Interviewer')

    onConfirm({
      fullName: fullName.trim(),
      email: staffMember.email,
      role: rolePayload,
      status: staffMember.status,
    })
  }

  const isActive = staffMember.status === 'ACTIVE'
  const statusLabel = isActive ? 'Active' : staffMember.status === 'PENDING' ? 'Pending' : 'Inactive'

  return (
    <div className="role-content edit-staff-content">
      <div className="tenant-breadcrumb create-staff-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <span className="breadcrumb-separator">/</span>
        <span>Staff Management</span>
        <span className="breadcrumb-separator">/</span>
        <strong>Edit Staff Account</strong>
      </div>

      <header className="edit-staff-heading">
        <h1>Edit Staff Account</h1>
        <p>Modify permissions and personal details for {staffMember.fullName}.</p>
      </header>

      <form className="edit-staff-form" onSubmit={handleSubmit} noValidate>
        <div className="edit-staff-layout">
          <aside className="edit-staff-profile-card">
            <div className="edit-staff-profile-banner"></div>
            <div className="edit-staff-avatar">{getInitials(staffMember.fullName)}</div>
            <strong className="staff-truncate-text" title={staffMember.fullName}>{staffMember.fullName}</strong>
            <small>EMPLOYEE ID: {staffMember.employeeCode || `JF-${staffMember.id.slice(0, 6).toUpperCase()}`}</small>

            <div className="edit-staff-meta-list">
              <div>
                <span><i className="fa-regular fa-calendar-check"></i></span>
                <p>Last Active</p>
                <strong>{formatActivityDate(staffMember.createdAt)}</strong>
              </div>
              <div>
                <span><i className="fa-solid fa-shield-heart"></i></span>
                <p>Account Status</p>
                <strong className={isActive ? 'verified' : 'not-verified'}>{statusLabel}</strong>
              </div>
            </div>
          </aside>

          <section className="edit-staff-account-card">
            <h2><i className="fa-solid fa-user"></i> Account Information</h2>

            <label className="edit-staff-field">
              <span>Email Address (Primary)</span>
              <div className="edit-staff-readonly-input">
                <i className="fa-regular fa-envelope"></i>
                <input type="email" value={staffMember.email} readOnly />
                <em><i className="fa-solid fa-lock"></i> Read-only</em>
              </div>
              <small>Email addresses are locked for security. Contact System Admin to change.</small>
            </label>

            <label className="edit-staff-field">
              <span>Full Name</span>
              <input
                className={fullNameError ? 'has-error' : ''}
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value)
                  if (fullNameError) setFullNameError('')
                }}
                disabled={isSubmitting}
              />
              {fullNameError && <small className="edit-staff-field-error">{fullNameError}</small>}
            </label>

            <div className="edit-staff-role-head">
              <span>Assigned Roles</span>
              <button type="button">Manage Role Templates</button>
            </div>

            <div className="edit-staff-role-grid">
              <label className={`edit-staff-role-option ${selectedRoles.includes('hr') ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('hr')}
                  onChange={() => toggleRole('hr')}
                  disabled={isSubmitting}
                />
                <span><i className="fa-solid fa-users-gear"></i></span>
                <div>
                  <strong>HR</strong>
                  <small>Full access to candidate sourcing and recruitment management tools.</small>
                </div>
              </label>

              <label className={`edit-staff-role-option ${selectedRoles.includes('interviewer') ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedRoles.includes('interviewer')}
                  onChange={() => toggleRole('interviewer')}
                  disabled={isSubmitting}
                />
                <span><i className="fa-solid fa-clipboard-list"></i></span>
                <div>
                  <strong>Interviewer</strong>
                  <small>Can view assigned interviews, candidate profiles and submit evaluation feedback.</small>
                </div>
              </label>
            </div>
          </section>
        </div>

        <footer className="edit-staff-actions">
          <small>All changes will be logged for security purposes.</small>
          <button type="button" onClick={() => setShowCancelConfirm(true)} disabled={isSubmitting}>Cancel</button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </footer>
      </form>
      {showCancelConfirm && (
        <ConfirmActionModal
          isSubmitting={false}
          title="Confirm Action"
          message="Are you sure you want to cancel? Your changes will not be saved."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => setShowCancelConfirm(false)}
          onConfirm={onCancel}
        />
      )}
    </div>
  )
}

function StaffDetailView({
  staffMember,
  onBack,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewLogs,
}: {
  staffMember: StaffMember
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
  onViewLogs: () => void
}) {
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Oct 12, 2023'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const roleList = staffMember.userRole
    ? staffMember.userRole.split(',').map(r => r.trim()).filter(Boolean)
    : []
  const hasUniversalAccess = roleList.length > 1

  const isActive = staffMember.status === 'ACTIVE'
  const isPending = staffMember.status === 'PENDING'
  const isDisabled = staffMember.status === 'DISABLED'

  return (
    <div className="role-content staff-detail-content">
      <div className="tenant-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span style={{ cursor: 'pointer' }} onClick={onBack}>Home</span>
        <span className="breadcrumb-separator">/</span>
        <span style={{ cursor: 'pointer' }} onClick={onBack}>Staff Management</span>
        <span className="breadcrumb-separator">/</span>
        <strong>Staff Detail</strong>
      </div>

      <section className="staff-header-profile">
        <div className="staff-header-avatar">
          {getInitials(staffMember.fullName)}
        </div>
        <div className="staff-header-info">
          <h1 className="staff-truncate-text" title={staffMember.fullName}>{staffMember.fullName}</h1>
          <div className="staff-header-meta">
            <span>EMPLOYEE ID: {staffMember.employeeCode || `JF-${staffMember.id.slice(0, 4).toUpperCase()}`}</span>
            <span>•</span>
            <span>Created on {formatDate(staffMember.createdAt)}</span>
          </div>
        </div>
        <div className="staff-detail-actions">
          <button type="button" className="btn-delete" onClick={onDelete}>
            Delete
          </button>
          <button type="button" className="btn-edit" onClick={onEdit}>
            Edit Profile
          </button>
          <button 
            type="button" 
            className={isActive ? "btn-deactivate" : "btn-activate"} 
            onClick={onToggleStatus}
          >
            {isActive ? 'Deactivate Account' : 'Resend activation email'}
          </button>
        </div>
      </section>

      <div className="staff-detail-grid">
        {/* Left Column */}
        <div>
          <section className="staff-detail-card">
            <header style={{ borderBottom: '1px solid #f0d7d0', paddingBottom: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ flex: 1, margin: 0, color: '#101c33', fontSize: '16px' }}>Personal Information</h2>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V7C0 6.45 0.195833 5.97917 0.5875 5.5875C0.979167 5.19583 1.45 5 2 5H7V2C7 1.45 7.19583 0.979167 7.5875 0.5875C7.97917 0.195833 8.45 0 9 0H11C11.55 0 12.0208 0.195833 12.4125 0.5875C12.8042 0.979167 13 1.45 13 2V5H18C18.55 5 19.0208 5.19583 19.4125 5.5875C19.8042 5.97917 20 6.45 20 7V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H2ZM2 18H18V7H13C13 7.55 12.8042 8.02083 12.4125 8.4125C12.0208 8.80417 11.55 9 11 9H9C8.45 9 7.97917 8.80417 7.5875 8.4125C7.19583 8.02083 7 7.55 7 7H2V18ZM4 16H10V15.55C10 15.2667 9.92083 15.0042 9.7625 14.7625C9.60417 14.5208 9.38333 14.3333 9.1 14.2C8.76667 14.05 8.42917 13.9375 8.0875 13.8625C7.74583 13.7875 7.38333 13.75 7 13.75C6.61667 13.75 6.25417 13.7875 5.9125 13.8625C5.57083 13.9375 5.23333 14.05 4.9 14.2C4.61667 14.3333 4.39583 14.5208 4.2375 14.7625C4.07917 15.0042 4 15.2667 4 15.55V16ZM12 14.5H16V13H12V14.5ZM7 13C7.41667 13 7.77083 12.8542 8.0625 12.5625C8.35417 12.2708 8.5 11.9167 8.5 11.5C8.5 11.0833 8.35417 10.7292 8.0625 10.4375C7.77083 10.1458 7.41667 10 7 10C6.58333 10 6.22917 10.1458 5.9375 10.4375C5.64583 10.7292 5.5 11.0833 5.5 11.5C5.5 11.9167 5.64583 12.2708 5.9375 12.5625C6.22917 12.8542 6.58333 13 7 13ZM12 11.5H16V10H12V11.5ZM9 7H11V2H9V7Z" fill="#565E74" />
              </svg>
            </header>
            <div className="staff-detail-info-grid">
              <div>
                <small>Full Name</small>
                <strong className="staff-truncate-text" title={staffMember.fullName}>{staffMember.fullName}</strong>
              </div>
              <div>
                <small>Primary Email</small>
                <strong>
                  {staffMember.email} <i className="fa-solid fa-lock" style={{ color: '#667085', marginLeft: '6px', fontSize: '12px' }}></i>
                </strong>
              </div>
              <div>
                <small>Phone Number</small>
                <strong>{staffMember.phone || '+1 (555) 234-8891'}</strong>
              </div>
              <div>
                <small>Office Location</small>
                <strong>San Francisco, CA (HQ)</strong>
              </div>
            </div>
          </section>

          <section className="staff-detail-card staff-role-assignment-card">
            <h2>Role Assignments</h2>
            <div className="staff-role-assignment-list">
              {roleList.map(role => (
                <span key={role} className="staff-badge">{role}</span>
              ))}
            </div>
            {hasUniversalAccess && (
              <div className="staff-universal-access">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <div>
                  <strong>Universal Access Enabled</strong>
                  <p>This account can switch workspaces seamlessly within the Tenant infrastructure.</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div>
          <section className="staff-status-panel">
            <small className="staff-status-panel-label">Account Status</small>
            <div className={`staff-status-box ${isPending ? 'status-pending' : isDisabled ? 'status-disabled' : ''}`}>
              <strong>
                <i className="fa-solid fa-circle" style={{ fontSize: '8px' }}></i>
                {isActive ? 'Active' : isPending ? 'Pending' : 'Inactive'}
              </strong>
              <span>SINCE {isDisabled ? 'JAN 2026' : formatDate(staffMember.createdAt).toUpperCase()}</span>
            </div>
            <div className="staff-login-meta">
              <div className="staff-login-row">
                <span>Last Login</span>
                <strong>2 hours ago</strong>
              </div>
              <div className="staff-login-row">
                <span>Login Location</span>
                <strong>San Francisco, US (IP: 192.168.1.1)</strong>
              </div>
            </div>
          </section>

          <section className="staff-detail-card">
            <header style={{ borderBottom: '1px solid #f0d7d0', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#101c33', fontSize: '16px' }}>Recent Activity</h2>
              <button type="button" className="staff-view-logs-btn" onClick={onViewLogs}>View All Logs</button>
            </header>
            <div className="activity-list-container" style={{ marginTop: '16px' }}>
              <div className="activity-item">
                <div className="activity-icon-wrapper">
                  <div className="activity-icon"><i className="fa-solid fa-pen"></i></div>
                  <div className="activity-line"></div>
                </div>
                <div className="activity-details">
                  <p>Modified Job Post: <strong>"Sr. Engineer"</strong></p>
                  <small>TODAY • 11:45 AM</small>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon-wrapper">
                  <div className="activity-icon"><i className="fa-solid fa-user-plus"></i></div>
                  <div className="activity-line"></div>
                </div>
                <div className="activity-details">
                  <p>Assigned to <strong>"Team Alpha"</strong></p>
                  <small>YESTERDAY • 04:20 PM</small>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon-wrapper">
                  <div className="activity-icon"><i className="fa-solid fa-key"></i></div>
                  <div className="activity-line"></div>
                </div>
                <div className="activity-details">
                  <p>Authenticated via SSO</p>
                  <small>NOV 12 • 09:00 AM</small>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-icon-wrapper">
                  <div className="activity-icon"><i className="fa-solid fa-gear"></i></div>
                  <div className="activity-line"></div>
                </div>
                <div className="activity-details">
                  <p>Updated Notification Settings</p>
                  <small>NOV 10 • 02:15 PM</small>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StaffActivityLogView({
  staffMember,
  onBack,
}: {
  staffMember: StaffMember
  onBack: () => void
}) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Oct 12, 2023'

    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="role-content staff-log-content">
      <div className="tenant-breadcrumb staff-log-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <button type="button" onClick={onBack}>Home</button>
        <span className="breadcrumb-separator">/</span>
        <button type="button" onClick={onBack}>Staff Management</button>
        <span className="breadcrumb-separator">/</span>
        <button type="button" onClick={onBack}>Staff Detail</button>
        <span className="breadcrumb-separator">/</span>
        <strong>Staff Activity Log</strong>
      </div>

      <header className="staff-log-header">
        <div>
          <h1>Staff Activity Log</h1>
          <p><i className="fa-regular fa-clock"></i> Real-time auditing and security trail for tenant administrators.</p>
        </div>
        <button type="button" className="staff-log-export-btn">Export to Excel</button>
      </header>

      <section className="staff-log-subject">
        <h2 className="staff-truncate-text" title={staffMember.fullName}>{staffMember.fullName}</h2>
        <p>
          <span>EMPLOYEE ID: {staffMember.employeeCode || `JF-${staffMember.id.slice(0, 6).toUpperCase()}`}</span>
          <span>Created on {formatDate(staffMember.createdAt)}</span>
        </p>
      </section>

      <section className="staff-log-filter-card">
        <strong><i className="fa-solid fa-filter"></i> Filter Logs:</strong>
        <div>
          <button type="button">All Event Types <i className="fa-solid fa-chevron-down"></i></button>
          <button type="button"><i className="fa-regular fa-calendar"></i> Oct 12, 2023 - Oct 19, 2023</button>
          <button type="button" className="clear">Clear All</button>
        </div>
      </section>

      <section className="staff-log-empty-state">
        <i className="fa-regular fa-user-plus"></i>
        <span><i className="fa-regular fa-calendar-check"></i></span>
        <p>No activity recorded for this account yet.</p>
      </section>
    </div>
  )
}

export function TenantAdminDashboard({ onLogout, triggerToast }: { onLogout: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<TenantAdminView>(() => getInitialTenantAdminView())
  const [tenantId] = useState(() => getStoredTenantId())
  const [tenantDetail, setTenantDetail] = useState<Tenant | null>(null)
  const [tenantPlan, setTenantPlan] = useState<SubscriptionPlan | null>(null)
  const changeView = (view: TenantAdminView) => {
    setActiveView(view)
    updateTenantAdminViewUrl(view)
  }
  const navItems = getTenantAdminNav(activeView, changeView)

  useEffect(() => {
    const handlePopState = () => setActiveView(getInitialTenantAdminView())

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // CRUD Staff States
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [isLoadingTenantDetail, setIsLoadingTenantDetail] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  
  // Modals & Save states
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<StaffMember | null>(null)
  const [statusConfirmStaff, setStatusConfirmStaff] = useState<StaffMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [staffPage, setStaffPage] = useState(1)
  const [staffPageCount, setStaffPageCount] = useState(1)
  const shouldLoadTenantWorkspace =
    activeView === 'dashboard' ||
    activeView === 'staffManagement' ||
    activeView === 'staffCreate' ||
    activeView === 'staffEdit' ||
    activeView === 'staffDetail' ||
    activeView === 'staffActivityLog'

  // API load staff
  useEffect(() => {
    if (!shouldLoadTenantWorkspace) {
      return
    }

    let isActive = true
    setIsLoadingStaff(true)
    setStaffError('')

    adminApi.getStaffList(staffPage, ADMIN_LIST_PAGE_SIZE, tenantId)
      .then((response: any) => {
        if (!isActive) return
        const payload = response?.data || response
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.content) ? payload.content : [])
        setStaffList(list)
        setStaffPageCount(getListPageCount(Object.assign([...list], { __pagination: getPaginationMeta(response) }), staffPage, ADMIN_LIST_PAGE_SIZE))
      })
      .catch((error) => {
        if (!isActive) return
        setStaffError(getAdminErrorMessage(error, 'Failed to load staff accounts.'))
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingStaff(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [shouldLoadTenantWorkspace, refreshKey, staffPage, tenantId])

  useEffect(() => {
    if (!tenantId || !shouldLoadTenantWorkspace) {
      return
    }

    let isActive = true
    setIsLoadingTenantDetail(true)

    const fetchTenantDetail = async () => {
      try {
        const tenant = await adminApi.getTenantById(tenantId)
        if (!isActive) return

        setTenantDetail(tenant)
        setTenantPlan(tenant.subscriptionPlanDetail || null)
      } catch (error) {
        if (isActive) {
          setTenantDetail(null)
          setTenantPlan(null)
          setStaffError(getAdminErrorMessage(error, 'Failed to load tenant details.'))
        }
      } finally {
        if (isActive) {
          setIsLoadingTenantDetail(false)
        }
      }
    }

    fetchTenantDetail()

    return () => {
      isActive = false
    }
  }, [shouldLoadTenantWorkspace, tenantId])

  const hasTenantQuota = Boolean(tenantDetail)
  const isStaffQuotaUnlimited = Boolean(tenantPlan?.staffAccountUnlimited) || (hasTenantQuota && (tenantDetail?.userQuotaLimit || 0) <= 0)
  const maxStaffQuota = isStaffQuotaUnlimited
    ? Math.max(staffList.length, 1)
    : tenantDetail?.userQuotaLimit || tenantPlan?.maxStaffAccount || 10
  const staffQuotaSummary = `${staffList.length} / ${isStaffQuotaUnlimited ? 'Unlimited' : maxStaffQuota}`
  const staffQuotaRingLabel = isStaffQuotaUnlimited ? 'Unlimited' : `${staffList.length}/${maxStaffQuota}`
  const remainingStaffSeats = Math.max(0, maxStaffQuota - staffList.length)
  const staffQuotaDescription = isStaffQuotaUnlimited
    ? 'Your current plan includes unlimited staff seats. Optimize your team allocation now.'
    : `You have ${remainingStaffSeats} seat${remainingStaffSeats === 1 ? '' : 's'} available in your current plan. Optimize your team allocation now.`
  const currentPlanName = tenantPlan?.name || tenantDetail?.subscriptionPlan || 'Current Plan'
  const currentPlanDescription = tenantPlan?.description || 'Tenant subscription plan'
  const renewalDateLabel = formatDashboardDate(tenantDetail?.expirationDate)

  // Handlers
  const handleCreateStaffSubmit = async (payload: { fullName: string; email: string; role: string[]; status: UserStatus }) => {
    setIsSaving(true)
    try {
      await adminApi.createStaff({
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
        status: payload.status,
        ...(tenantId ? { tenantId } : {}),
      })
      triggerToast?.('Staff account created successfully. Invitation email sent.', 'success')
      setRefreshKey(prev => prev + 1)
      changeView('staffManagement')
    } catch (error) {
      if (shouldToastHttpError(error)) {
        triggerToast?.(getAdminErrorMessage(error, 'Failed to create staff account.'), 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateStaffSubmit = async (payload: { fullName: string; email: string; role: string[]; status: UserStatus }) => {
    if (!selectedStaff) return
    setIsSaving(true)
    try {
      await adminApi.updateStaff(selectedStaff.id, {
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
        status: payload.status,
        ...(tenantId ? { tenantId } : {}),
      })
      triggerToast?.('Staff account updated successfully.', 'success')
      
      setSelectedStaff(prev => {
        if (!prev) return null
        return {
          ...prev,
          fullName: payload.fullName,
          userRole: payload.role.join(', '),
          status: payload.status,
        }
      })

      setRefreshKey(prev => prev + 1)
      changeView('staffManagement')
    } catch (error) {
      if (shouldToastHttpError(error)) {
        triggerToast?.(getAdminErrorMessage(error, 'Failed to update staff account.'), 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStaffConfirm = async () => {
    if (!deleteConfirmStaff) return
    setIsDeleting(true)
    try {
      await adminApi.deleteStaff(deleteConfirmStaff.id)
      triggerToast?.('Account permanently deleted.', 'success')
      setDeleteConfirmStaff(null)
      
      if (selectedStaff?.id === deleteConfirmStaff.id) {
        setSelectedStaff(null)
        changeView('staffManagement')
      }
      
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      if (shouldToastHttpError(error)) {
        triggerToast?.(getAdminErrorMessage(error, 'Failed to delete staff account.'), 'error')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async (staff: StaffMember) => {
    const nextStatus = staff.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const roles = staff.userRole ? staff.userRole.split(', ').map(r => r.trim() === 'HR' ? 'HR' : 'Interviewer') : ['HR']
    
    setIsSaving(true)
    try {
      await adminApi.updateStaff(staff.id, {
        fullName: staff.fullName,
        email: staff.email,
        role: roles,
        status: nextStatus,
        ...(tenantId ? { tenantId } : {}),
      })
      triggerToast?.(
        nextStatus === 'ACTIVE'
          ? `Activation email successfully resent to ${staff.email}.`
          : 'Account deactivated successfully.',
        'success',
      )
      setStatusConfirmStaff(null)
      
      setSelectedStaff(prev => {
        if (!prev) return null
        return { ...prev, status: nextStatus }
      })
      
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      if (shouldToastHttpError(error)) {
        triggerToast?.(getAdminErrorMessage(error, 'Failed to update account status.'), 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardShell navItems={navItems} subtitle="Tenant Admin" onLogout={onLogout} onChangePassword={() => changeView('settings')}>
      {activeView === 'settings' ? (
        <AccountSettingsView onBack={() => changeView('dashboard')} triggerToast={triggerToast} />
      ) : activeView === 'staffCreate' ? (
        <CreateStaffAccountView
          staffList={staffList}
          onCancel={() => changeView('staffManagement')}
          onConfirm={handleCreateStaffSubmit}
          isSubmitting={isSaving}
        />
      ) : activeView === 'staffEdit' ? (
        selectedStaff ? (
          <EditStaffAccountView
            staffMember={selectedStaff}
            onCancel={() => changeView('staffManagement')}
            onConfirm={handleUpdateStaffSubmit}
            isSubmitting={isSaving}
          />
        ) : (
          <div className="role-content staff-management-content">
            <div className="tenant-list-table-state">Select a staff account before editing.</div>
          </div>
        )
      ) : activeView === 'staffDetail' && selectedStaff ? (
        <StaffDetailView
          staffMember={selectedStaff}
          onBack={() => changeView('staffManagement')}
          onEdit={() => changeView('staffEdit')}
          onDelete={() => setDeleteConfirmStaff(selectedStaff)}
          onToggleStatus={() => setStatusConfirmStaff(selectedStaff)}
          onViewLogs={() => changeView('staffActivityLog')}
        />
      ) : activeView === 'staffActivityLog' && selectedStaff ? (
        <StaffActivityLogView
          staffMember={selectedStaff}
          onBack={() => changeView('staffDetail')}
        />
      ) : activeView === 'staffManagement' ? (
        <StaffManagementView 
          staffList={staffList}
          isLoading={isLoadingStaff || isLoadingTenantDetail}
          error={staffError}
          maxStaffQuota={maxStaffQuota}
          isStaffQuotaUnlimited={isStaffQuotaUnlimited}
          onCreate={() => {
            setSelectedStaff(null)
            changeView('staffCreate')
          }}
          onEdit={(staff) => {
            setSelectedStaff(staff)
            changeView('staffEdit')
          }}
          onDelete={(staff) => {
            setDeleteConfirmStaff(staff)
          }}
          onSelectStaff={(staff) => {
            setSelectedStaff(staff)
            changeView('staffDetail')
          }}
          currentPage={staffPage}
          pageCount={staffPageCount}
          onPageChange={setStaffPage}
        />
      ) : (
      <div className="role-content">
        <div className="role-metrics four tenant-dashboard-metrics">
          <MetricCard icon="fa-briefcase" label="Active Job Postings" value="24" note="+12%" />
          <MetricCard icon="fa-users" label="Total Applicants" value="842" note="+340" />
          <MetricCard icon="fa-clock" label="Time-to-Hire" value="18 Days" note="-3d" />
          <MetricCard icon="fa-calendar-check" label="Interviews Today" value="5" note="Today" />
        </div>

        <div className="tenant-dashboard-grid">
          <div className="tenant-dashboard-top">
            <section className="role-panel funnel-panel">
              <div className="role-panel-head">
                <div>
                  <h2>Recruitment Funnel</h2>
                  <p>Applicant conversion through hiring stages</p>
                </div>
                <a href="#reports">View Detailed Report <i className="fa-solid fa-arrow-right"></i></a>
              </div>
              {[
                ['Applied', '143', '98%'],
                ['Screening', '89', '65%'],
                ['Shortlisted', '42', '29%'],
                ['Interviewing', '21', '15%'],
                ['Offered', '6', '5%'],
              ].map(([label, value, width]) => (
                <div className="funnel-row" key={label}>
                  <div><span>{label}</span><strong>{value}</strong></div>
                  <span className="funnel-track"><span style={{ width }} /></span>
                </div>
              ))}
            </section>

            <div className="tenant-dashboard-top-side">
              <section className="role-panel quota-panel">
                <div className="role-panel-head"><h2>Staff Quota</h2><small>{staffQuotaSummary} Seats</small></div>
                <div className="quota-ring"><strong>{staffQuotaRingLabel}</strong><span>Used</span></div>
                <p>{staffQuotaDescription}</p>
              </section>

              <section className="role-panel plan-panel">
                <small>
                  <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M5.7 15.75L4.275 13.35L1.575 12.75L1.8375 9.975L0 7.875L1.8375 5.775L1.575 3L4.275 2.4L5.7 0L8.25 1.0875L10.8 0L12.225 2.4L14.925 3L14.6625 5.775L16.5 7.875L14.6625 9.975L14.925 12.75L12.225 13.35L10.8 15.75L8.25 14.6625L5.7 15.75ZM6.3375 13.8375L8.25 13.0125L10.2 13.8375L11.25 12.0375L13.3125 11.55L13.125 9.45L14.5125 7.875L13.125 6.2625L13.3125 4.1625L11.25 3.7125L10.1625 1.9125L8.25 2.7375L6.3 1.9125L5.25 3.7125L3.1875 4.1625L3.375 6.2625L1.9875 7.875L3.375 9.45L3.1875 11.5875L5.25 12.0375L6.3375 13.8375ZM7.4625 10.5375L11.7 6.3L10.65 5.2125L7.4625 8.4L5.85 6.825L4.8 7.875L7.4625 10.5375Z" fill="#FFB5A1" />
                  </svg>
                  Active Plan
                </small>
                <h2>{currentPlanName}</h2>
                <p>{currentPlanDescription}</p>
                <footer><span>Renewal Date<br /><strong>{renewalDateLabel}</strong></span><button type="button">Manage</button></footer>
              </section>
            </div>
          </div>

          <div className="tenant-dashboard-bottom">
            <section className="role-panel interview-list">
              <div className="role-panel-head">
                <div><h2>Upcoming Interviews</h2><p>Scheduled for today & tomorrow</p></div>
                <i className="fa-solid fa-ellipsis-vertical"></i>
              </div>
              {[
                { initials: 'SJ', name: 'Sarah Jenkins', role: 'Senior DevOps Engineer', interviewer: 'David Chen', time: '10:00 AM', wait: 'In 45 mins' },
                { initials: 'MT', name: 'Marcus Thorne', role: 'Product Manager', interviewer: 'Elena Rodriguez', time: '02:30 PM', wait: 'Today' },
              ].map((item) => (
                <article key={item.name}>
                  <span className="role-avatar">{item.initials}</span>
                  <div className="interview-candidate">
                    <strong>{item.name}</strong>
                    <small>{item.role}</small>
                  </div>
                  <div className="interview-interviewer">
                    <small>Interviewer</small>
                    <strong>{item.interviewer}</strong>
                  </div>
                  <em>
                    {item.time}
                    <small>{item.wait}</small>
                  </em>
                </article>
              ))}
            </section>

            <section className="role-panel insights-panel">
              <h2>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 8L16.75 5.25L14 4L16.75 2.75L18 0L19.25 2.75L22 4L19.25 5.25L18 8ZM18 22L16.75 19.25L14 18L16.75 16.75L18 14L19.25 16.75L22 18L19.25 19.25L18 22ZM8 19L5.5 13.5L0 11L5.5 8.5L8 3L10.5 8.5L16 11L10.5 13.5L8 19Z" fill="#F24E1E" />
                </svg>
                AI Insights (DSS)
              </h2>
              <div className="tag-list">
                <span>Cloud Architecture <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>
                <span>Go Lang <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>
                <span className="tag-muted">Data Security</span>
              </div>
              <small>Difficult to fill positions</small>
              <div className="insight-row"><span>Senior DevOps Engineer</span><strong>43 Days Open</strong></div>
              <div className="insight-row"><span>ML Ops Specialist</span><strong>31 Days Open</strong></div>
              <button type="button">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g clipPath="url(#ai-report-chart-icon)">
                    <path d="M15 10H12V3H15V10ZM0 8H3V13H0V8ZM11 12H10V13H8V0H11V12ZM4 3H7V13H4V3ZM16 13V14H14V16H13V14H11V13H13V11H14V13H16Z" fill="#0B1C30" fillOpacity="0.9" />
                  </g>
                  <defs>
                    <clipPath id="ai-report-chart-icon">
                      <rect width="16" height="16" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                View full AI report <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </button>
            </section>
          </div>
        </div>
      </div>
      )}

      {deleteConfirmStaff && (
        <ConfirmActionModal
          isSubmitting={isDeleting}
          title="Confirm Action"
          message={`Are you sure you want to permanently delete ${deleteConfirmStaff.fullName}'s account? This action cannot be undone. All role assignments will be removed.`}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          submittingLabel="Confirming..."
          onCancel={() => setDeleteConfirmStaff(null)}
          onConfirm={handleDeleteStaffConfirm}
        />
      )}
      {statusConfirmStaff && (
        <ConfirmActionModal
          isSubmitting={isSaving}
          title="Confirm Action"
          message={
            statusConfirmStaff.status === 'ACTIVE'
              ? `Are you sure you want to deactivate ${statusConfirmStaff.fullName}'s account? They will lose access immediately and any active session will be terminated.`
              : `A new activation email will be sent to ${statusConfirmStaff.email}. The previous activation link will be immediately invalidated. Do you want to proceed?`
          }
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          submittingLabel="Confirming..."
          onCancel={() => setStatusConfirmStaff(null)}
          onConfirm={() => handleToggleStatus(statusConfirmStaff)}
        />
      )}
    </DashboardShell>
  )
}
