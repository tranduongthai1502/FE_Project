import type { StaffMember, UserStatus } from '@/features/tenant/domain/tenantApi.types'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import type { StaffFormFieldErrors } from '../../application/tenantStaffFormValidation'
import { useStaffAccountForm } from '../../application/useStaffAccountForm'

export function CreateStaffAccountView({
  staffMember,
  staffList = [],
  serverFieldErrors = {},
  onHome,
  onCancel,
  onConfirm,
  isSubmitting = false,
  isActionLocked = false,
}: {
  staffMember?: StaffMember
  staffList?: StaffMember[]
  serverFieldErrors?: StaffFormFieldErrors
  onHome: () => void
  onCancel: () => void
  onConfirm: (payload: { fullName: string; email: string; role: string[]; status?: UserStatus }) => void
  isSubmitting?: boolean
  isActionLocked?: boolean
}) {
  const {
    email,
    emailError,
    fullName,
    fullNameError,
    handleRoleToggle,
    handleSubmit,
    isEdit,
    roleError,
    selectedRoles,
    setShowCancelConfirm,
    setStatus,
    showCancelConfirm,
    status,
    updateEmail,
    updateFullName,
  } = useStaffAccountForm({
    isActionLocked,
    onConfirm,
    serverFieldErrors,
    staffList,
    staffMember,
  })

  return (
    <div className="role-content create-staff-content">
      <Breadcrumb
        className="create-staff-breadcrumb"
        items={[
          { label: 'Home', onClick: onHome },
          { label: 'Staff Management', onClick: onCancel },
          { label: isEdit ? 'Edit Staff Account' : 'Create New Staff Account' },
        ]}
      />

      <section className="create-staff-card">
        <header className="create-staff-header">
          <div className="create-staff-title">
            <span>
              <i className={`fa-solid ${isEdit ? 'fa-user-pen' : 'fa-user-plus'}`}></i>
            </span>
            <div>
              <h1>{isEdit ? 'Edit Staff Account' : 'Create Staff Account'}</h1>
              <p>
                {isEdit
                  ? 'Modify user account settings and access roles.'
                  : 'Provision a new user account with specific access roles.'}
              </p>
            </div>
          </div>
          <span className="system-status">
            <i className="fa-solid fa-circle"></i> SYSTEM ONLINE
          </span>
        </header>

        <form className="create-staff-form" onSubmit={handleSubmit} noValidate>
          <div className="create-staff-grid">
            <fieldset className="staff-fieldset">
              <legend>Identity Details</legend>
              <label>
                <span>
                  Full Name <b className="required-mark">*</b>
                </span>
                <div>
                  <i className="fa-regular fa-user"></i>
                  <input
                    className={fullNameError ? 'has-error' : ''}
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={fullName}
                    onChange={(event) => {
                      updateFullName(event.target.value)
                    }}
                    disabled={isSubmitting || isActionLocked}
                  />
                </div>
                {fullNameError && <small className="staff-field-error">{fullNameError}</small>}
              </label>
              <label>
                <span>
                  Corporate Email Address <b className="required-mark">*</b>
                </span>
                <div>
                  <i className="fa-regular fa-envelope"></i>
                  <input
                    className={emailError ? 'has-error' : ''}
                    type="email"
                    placeholder="sarah.j@jobfusion.com"
                    value={email}
                    onChange={(event) => {
                      updateEmail(event.target.value)
                    }}
                    disabled={isEdit || isSubmitting || isActionLocked}
                  />
                </div>
                {emailError && <small className="staff-field-error">{emailError}</small>}
              </label>
              {isEdit && (
                <label style={{ marginTop: '16px' }}>
                  <span>Account Status</span>
                  <div
                    style={{
                      alignItems: 'center',
                      background: '#ffffff',
                      border: '1px solid #f0b8a8',
                      borderRadius: '5px',
                      display: 'flex',
                      height: '45px',
                      padding: '0 8px',
                    }}
                  >
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value as UserStatus)}
                      disabled={isSubmitting || isActionLocked}
                      style={{
                        background: 'transparent',
                        border: 0,
                        font: 'inherit',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        outline: 0,
                        width: '100%',
                      }}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="DISABLED">Inactive</option>
                    </select>
                  </div>
                </label>
              )}
            </fieldset>

            <fieldset className="staff-fieldset">
              <legend>
                Access & Permissions <b className="required-mark">*</b>
              </legend>
              <div
                className={`staff-role-card-option ${selectedRoles.includes('hr') ? 'selected' : ''}`}
                onClick={() => !isSubmitting && !isActionLocked && handleRoleToggle('hr')}
              >
                <input
                  maxLength={FIELD_LENGTH_LIMITS.defaultText}
                  type="checkbox"
                  checked={selectedRoles.includes('hr')}
                  onChange={() => {}}
                  disabled={isSubmitting || isActionLocked}
                />
                <span>
                  <i className="fa-solid fa-users-gear"></i>
                </span>
                <div>
                  <strong>HR</strong>
                  <small>Full access to candidate sourcing and recruitment management tools.</small>
                </div>
                <i className="staff-role-card-dot" aria-hidden="true"></i>
              </div>
              <div
                className={`staff-role-card-option ${selectedRoles.includes('interviewer') ? 'selected' : ''}`}
                onClick={() => !isSubmitting && !isActionLocked && handleRoleToggle('interviewer')}
              >
                <input
                  maxLength={FIELD_LENGTH_LIMITS.defaultText}
                  type="checkbox"
                  checked={selectedRoles.includes('interviewer')}
                  onChange={() => {}}
                  disabled={isSubmitting || isActionLocked}
                />
                <span>
                  <i className="fa-solid fa-clipboard-check"></i>
                </span>
                <div>
                  <strong>Interviewer</strong>
                  <small>Can view assigned interviews, candidate profiles and submit evaluation feedback.</small>
                </div>
                <i className="staff-role-card-dot" aria-hidden="true"></i>
              </div>
              {roleError && <small className="staff-field-error">{roleError}</small>}
            </fieldset>
          </div>

          <footer className="create-staff-actions">
            <button type="button" onClick={() => setShowCancelConfirm(true)} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="tenant-create-btn" disabled={isSubmitting || isActionLocked}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Account' : 'Confirm'}
            </button>
          </footer>
        </form>
      </section>

      {showCancelConfirm && (
        <ConfirmActionModal
          isSubmitting={false}
          title="Confirm Action"
          message="Are you sure you want to cancel? The staff account will not be created."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => setShowCancelConfirm(false)}
          onConfirm={onCancel}
        />
      )}
    </div>
  )
}

