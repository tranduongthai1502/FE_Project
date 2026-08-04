import type { ActivityLog, StaffMember } from '@/features/tenant/domain/tenantApi.types'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { formatActivityDateTime } from '../../domain/tenantActivityDates'
import { formatStaffDate, getStaffInitials, getStaffRoleList } from '../../application/tenantStaffDisplay'
import { ActivityLogIcon } from './ActivityLogIcon'
export function StaffDetailView({
  staffMember,
  recentActivities,
  isLoadingActivities,
  activityError,
  onHome,
  onBack,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewLogs,
  isActionLocked = false,
}: {
  staffMember: StaffMember
  recentActivities: ActivityLog[]
  isLoadingActivities: boolean
  activityError: string
  onHome: () => void
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
  onViewLogs: () => void
  isActionLocked?: boolean
}) {
  const roleList = getStaffRoleList(staffMember)
  const hasUniversalAccess = roleList.length > 1

  const isActive = staffMember.status === 'ACTIVE'
  const isDisabled = staffMember.status === 'DISABLED'
  const statusLabel = isActive ? 'Active' : 'Inactive'
  const statusSinceDate = staffMember.activatedAt || staffMember.createdAt

  return (
    <div className="role-content staff-detail-content">
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Staff Management', onClick: onBack }, { label: 'Staff Detail' }]} />

      <section className="staff-header-profile">
        <div className="staff-header-avatar">
          {getStaffInitials(staffMember.fullName)}
        </div>
        <div className="staff-header-info">
          <h1 className="staff-truncate-text" title={staffMember.fullName}>{staffMember.fullName}</h1>
          <div className="staff-header-meta">
            <span>EMPLOYEE ID: {staffMember.employeeCode || `JF-${staffMember.id.slice(0, 4).toUpperCase()}`}</span>
            <span>•</span>
            <span>Created on {formatStaffDate(staffMember.createdAt, 'Oct 12, 2023')}</span>
          </div>
        </div>
        <div className="staff-detail-actions">
          <button type="button" className="btn-delete" onClick={onDelete} disabled={isActionLocked}>
            Delete
          </button>
          <button type="button" className="btn-edit" onClick={onEdit} disabled={isActionLocked}>
            Edit Profile
          </button>
          <button 
            type="button" 
            className={isActive ? "btn-deactivate" : "btn-activate"} 
            onClick={onToggleStatus}
            disabled={isActionLocked}
          >
            {isActive ? 'Deactivate Account' : 'Activate Account'}
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
                <strong>{staffMember.phone || '_'}</strong>
              </div>
              <div>
                <small>Office Location</small>
                <strong>_</strong>
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
            <div className={`staff-status-box ${isDisabled ? 'status-disabled' : ''}`}>
              <strong>
                <i className="fa-solid fa-circle" style={{ fontSize: '8px' }}></i>
                {statusLabel}
              </strong>
              {isActive && <span>SINCE {formatStaffDate(statusSinceDate, 'Oct 12, 2023').toUpperCase()}</span>}
            </div>
          </section>

          <section className="staff-detail-card">
            <header style={{ borderBottom: '1px solid #f0d7d0', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#101c33', fontSize: '16px' }}>Recent Activity</h2>
              <button type="button" className="staff-view-logs-btn" onClick={onViewLogs}>View All Logs</button>
            </header>
            <div className="activity-list-container" style={{ marginTop: '16px' }}>
              {isLoadingActivities ? (
                <div className="tenant-list-table-state">Loading activity...</div>
              ) : activityError ? (
                <div className="tenant-list-table-state error">{activityError}</div>
              ) : recentActivities.length === 0 ? (
                <div className="tenant-list-table-state">No activity recorded yet.</div>
              ) : (
                recentActivities.map((activity, index) => (
                  <div className="activity-item" key={activity.id}>
                    <div className="activity-icon-wrapper">
                      <div className="activity-icon"><ActivityLogIcon eventType={activity.eventType} index={index} /></div>
                      <div className="activity-line"></div>
                    </div>
                    <div className="activity-details">
                      <p>{activity.title}</p>
                      <small>{formatActivityDateTime(activity.createdAt)}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}


