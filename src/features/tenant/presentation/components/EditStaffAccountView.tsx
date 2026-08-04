import type { StaffMember, UserStatus } from '@/features/tenant/domain/tenantApi.types'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { formatRelativeStaffActivityDate, getStaffInitials } from '../../application/tenantStaffDisplay'
import type { StaffFormFieldErrors } from '../../application/tenantStaffFormValidation'
import { useEditStaffAccountForm } from '../../application/useEditStaffAccountForm'

export function EditStaffAccountView({
  staffMember,
  staffList = [],
  serverFieldErrors = {},
  onHome,
  onStaffManagement,
  onConfirm,
  isSubmitting = false,
  isActionLocked = false,
}: {
  staffMember: StaffMember
  staffList?: StaffMember[]
  serverFieldErrors?: StaffFormFieldErrors
  onHome: () => void
  onStaffManagement: () => void
  onConfirm: (payload: { fullName: string; email: string; role: string[]; status: UserStatus }) => void
  isSubmitting?: boolean
  isActionLocked?: boolean
}) {
  const {
    fullName,
    fullNameError,
    handleSubmit,
    resetEditStaffForm,
    roleError,
    selectedRoles,
    setShowCancelConfirm,
    showCancelConfirm,
    toggleRole,
    updateFullName,
  } = useEditStaffAccountForm({
    isActionLocked,
    onConfirm,
    serverFieldErrors,
    staffList,
    staffMember,
  })

  const isActive = staffMember.status === 'ACTIVE'
  const statusLabel = isActive ? 'Active' : 'Inactive'

  return (
    <div className="role-content edit-staff-content">
      <Breadcrumb
        className="create-staff-breadcrumb"
        items={[
          { label: 'Home', onClick: onHome },
          { label: 'Staff Management', onClick: onStaffManagement },
          { label: 'Edit Staff Account' },
        ]}
      />

      <header className="edit-staff-heading">
        <h1>Edit Staff Account</h1>
        <p>Modify permissions and personal details for {staffMember.fullName}.</p>
      </header>

      <form className="edit-staff-form" onSubmit={handleSubmit} noValidate>
        <div className="edit-staff-layout">
          <aside className="edit-staff-profile-card">
            <div className="edit-staff-profile-banner"></div>
            <div className="edit-staff-avatar">{getStaffInitials(staffMember.fullName)}</div>
            <strong className="staff-truncate-text" title={staffMember.fullName}>
              {staffMember.fullName}
            </strong>
            <small>EMPLOYEE ID: {staffMember.employeeCode || `JF-${staffMember.id.slice(0, 6).toUpperCase()}`}</small>

            <div className="edit-staff-meta-list">
              <div>
                <span>
                  <i className="fa-regular fa-calendar-check"></i>
                </span>
                <p>Last Active</p>
                <strong>{formatRelativeStaffActivityDate(staffMember.createdAt)}</strong>
              </div>
              <div>
                <span>
                  <i className="fa-solid fa-shield-heart"></i>
                </span>
                <p>Account Status</p>
                <strong className={isActive ? 'verified' : 'not-verified'}>{statusLabel}</strong>
              </div>
            </div>
          </aside>

          <section className="edit-staff-account-card">
            <h2>
              <i className="fa-solid fa-user"></i> Account Information
            </h2>

            <label className="edit-staff-field">
              <span>Email Address (Primary)</span>
              <div className="edit-staff-readonly-input">
                <i className="fa-regular fa-envelope"></i>
                <input type="email" value={staffMember.email} readOnly maxLength={50} />
                <em>
                  <i className="fa-solid fa-lock"></i> Read-only
                </em>
              </div>
            </label>

            <label className="edit-staff-field">
              <span>Full Name</span>
              <input
                className={fullNameError ? 'has-error' : ''}
                type="text"
                value={fullName}
                onChange={(event) => {
                  updateFullName(event.target.value)
                }}
                disabled={isSubmitting || isActionLocked}
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
                  maxLength={FIELD_LENGTH_LIMITS.defaultText}
                  type="checkbox"
                  checked={selectedRoles.includes('hr')}
                  onChange={() => toggleRole('hr')}
                  disabled={isSubmitting || isActionLocked}
                />
                <span>
                  <i className="fa-solid fa-users-gear"></i>
                </span>
                <div>
                  <strong>HR</strong>
                  <small>Full access to candidate sourcing and recruitment management tools.</small>
                </div>
              </label>

              <label className={`edit-staff-role-option ${selectedRoles.includes('interviewer') ? 'selected' : ''}`}>
                <input
                  maxLength={FIELD_LENGTH_LIMITS.defaultText}
                  type="checkbox"
                  checked={selectedRoles.includes('interviewer')}
                  onChange={() => toggleRole('interviewer')}
                  disabled={isSubmitting || isActionLocked}
                />
                <span>
                  <i className="fa-solid fa-clipboard-list"></i>
                </span>
                <div>
                  <strong>Interviewer</strong>
                  <small>Can view assigned interviews, candidate profiles and submit evaluation feedback.</small>
                </div>
              </label>
            </div>
            {roleError && <small className="edit-staff-field-error edit-staff-role-error">{roleError}</small>}
          </section>
        </div>

        <footer className="edit-staff-actions">
          <small>All changes will be logged for security purposes.</small>
          <button type="button" onClick={() => setShowCancelConfirm(true)} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || isActionLocked}>
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
          onConfirm={resetEditStaffForm}
        />
      )}
    </div>
  )
}

