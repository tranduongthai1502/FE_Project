import { useRef } from 'react'
import type { ActivityLog, StaffMember } from '@/features/tenant/domain/tenantApi.types'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { useStaffActivityLogList } from '../../application/useStaffActivityLogList'

export function StaffActivityLogView({
  staffMember,
  activityLogs,
  isLoadingActivities,
  activityError,
  currentPage,
  pageCount,
  eventTypeFilter,
  startDateFilter,
  endDateFilter,
  isClearingActivityLogs,
  isExportingActivityLogs,
  onHome,
  onStaffManagement,
  onBack,
  onExport,
  onPageChange,
  onEventTypeFilterChange,
  onStartDateFilterChange,
  onEndDateFilterChange,
  onClearFilters,
}: {
  staffMember: StaffMember
  activityLogs: ActivityLog[]
  isLoadingActivities: boolean
  activityError: string
  currentPage: number
  pageCount: number
  eventTypeFilter: string
  startDateFilter: string
  endDateFilter: string
  isClearingActivityLogs: boolean
  isExportingActivityLogs: boolean
  onHome: () => void
  onStaffManagement: () => void
  onBack: () => void
  onExport: () => void
  onPageChange: (page: number) => void
  onEventTypeFilterChange: (value: string) => void
  onStartDateFilterChange: (value: string) => void
  onEndDateFilterChange: (value: string) => void
  onClearFilters: () => void
}) {
  const {
    displayEnd,
    displayStart,
    endDateLabel,
    formatDate,
    formatLogDateTime,
    pageItems,
    shouldShowActivityTable,
    startDateLabel,
    totalElements,
  } = useStaffActivityLogList({
    activityError,
    activityLogs,
    currentPage,
    endDateFilter,
    isLoadingActivities,
    onPageChange,
    pageCount,
    startDateFilter,
  })
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const endDateInputRef = useRef<HTMLInputElement>(null)
  const openDatePicker = (input: HTMLInputElement | null) => {
    if (!input) return

    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }

    input.focus()
    input.click()
  }


  return (
    <div className="role-content staff-log-content">
      <Breadcrumb
        className="staff-log-breadcrumb"
        items={[
          { label: 'Home', onClick: onHome },
          { label: 'Staff Management', onClick: onStaffManagement },
          { label: 'Staff Detail', onClick: onBack },
          { label: 'Staff Activity Log' },
        ]}
      />

      <header className="staff-log-header">
        <div>
          <h1>Staff Activity Log</h1>
          <p><i className="fa-regular fa-clock"></i> Real-time auditing and security trail for tenant administrators.</p>
        </div>
        <button type="button" className="staff-log-export-btn" disabled={isExportingActivityLogs} onClick={onExport}>
          {isExportingActivityLogs ? 'Exporting...' : 'Export to Excel'}
        </button>
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
          <label className="staff-log-filter-select">
            <select aria-label="Filter logs by event type" value={eventTypeFilter} onChange={(event) => onEventTypeFilterChange(event.target.value)}>
              <option value="">All Event Types</option>
              <option value="ACCOUNT">Account</option>
              <option value="LOGIN">Login</option>
              <option value="ACTION">Action</option>
            </select>
            <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
          </label>
          <div className="staff-log-date-range-control">
            <span className="staff-log-date-range-label">{startDateLabel}</span>
            <button type="button" className="staff-log-date-picker-trigger" aria-label="Choose start date" onClick={() => openDatePicker(startDateInputRef.current)}>
              <svg className="staff-log-date-range-icon" width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1.66667 16.6667C1.20833 16.6667 0.815972 16.5035 0.489583 16.1771C0.163194 15.8507 0 15.4583 0 15V3.33333C0 2.875 0.163194 2.48264 0.489583 2.15625C0.815972 1.82986 1.20833 1.66667 1.66667 1.66667H2.5V0H4.16667V1.66667H10.8333V0H12.5V1.66667H13.3333C13.7917 1.66667 14.184 1.82986 14.5104 2.15625C14.8368 2.48264 15 2.875 15 3.33333V15C15 15.4583 14.8368 15.8507 14.5104 16.1771C14.184 16.5035 13.7917 16.6667 13.3333 16.6667H1.66667ZM1.66667 15H13.3333V6.66667H1.66667V15ZM1.66667 5H13.3333V3.33333H1.66667V5ZM1.66667 5V3.33333V5ZM7.5 10C7.26389 10 7.06597 9.92014 6.90625 9.76042C6.74653 9.60069 6.66667 9.40278 6.66667 9.16667C6.66667 8.93056 6.74653 8.73264 6.90625 8.57292C7.06597 8.41319 7.26389 8.33333 7.5 8.33333C7.73611 8.33333 7.93403 8.41319 8.09375 8.57292C8.25347 8.73264 8.33333 8.93056 8.33333 9.16667C8.33333 9.40278 8.25347 9.60069 8.09375 9.76042C7.93403 9.92014 7.73611 10 7.5 10ZM4.16667 10C3.93056 10 3.73264 9.92014 3.57292 9.76042C3.41319 9.60069 3.33333 9.40278 3.33333 9.16667C3.33333 8.93056 3.41319 8.73264 3.57292 8.57292C3.73264 8.41319 3.93056 8.33333 4.16667 8.33333C4.40278 8.33333 4.60069 8.41319 4.76042 8.57292C4.92014 8.73264 5 8.93056 5 9.16667C5 9.40278 4.92014 9.60069 4.76042 9.76042C4.60069 9.92014 4.40278 10 4.16667 10ZM10.8333 10C10.5972 10 10.3993 9.92014 10.2396 9.76042C10.0799 9.60069 10 9.40278 10 9.16667C10 8.93056 10.0799 8.73264 10.2396 8.57292C10.3993 8.41319 10.5972 8.33333 10.8333 8.33333C11.0694 8.33333 11.2674 8.41319 11.4271 8.57292C11.5868 8.73264 11.6667 8.93056 11.6667 9.16667C11.6667 9.40278 11.5868 9.60069 11.4271 9.76042C11.2674 9.92014 11.0694 10 10.8333 10ZM7.5 13.3333C7.26389 13.3333 7.06597 13.2535 6.90625 13.0938C6.74653 12.934 6.66667 12.7361 6.66667 12.5C6.66667 12.2639 6.74653 12.066 6.90625 11.9062C7.06597 11.7465 7.26389 11.6667 7.5 11.6667C7.73611 11.6667 7.93403 11.7465 8.09375 11.9062C8.25347 12.066 8.33333 12.2639 8.33333 12.5C8.33333 12.7361 8.25347 12.934 8.09375 13.0938C7.93403 13.2535 7.73611 13.3333 7.5 13.3333ZM4.16667 13.3333C3.93056 13.3333 3.73264 13.2535 3.57292 13.0938C3.41319 12.934 3.33333 12.7361 3.33333 12.5C3.33333 12.2639 3.41319 12.066 3.57292 11.9062C3.73264 11.7465 3.93056 11.6667 4.16667 11.6667C4.40278 11.6667 4.60069 11.7465 4.76042 11.9062C4.92014 12.066 5 12.2639 5 12.5C5 12.7361 4.92014 12.934 4.76042 13.0938C4.60069 13.2535 4.40278 13.3333 4.16667 13.3333ZM10.8333 13.3333C10.5972 13.3333 10.3993 13.2535 10.2396 13.0938C10.0799 12.934 10 12.7361 10 12.5C10 12.2639 10.0799 12.066 10.2396 11.9062C10.3993 11.7465 10.5972 11.6667 10.8333 11.6667C11.0694 11.6667 11.2674 11.7465 11.4271 11.9062C11.5868 12.066 11.6667 12.2639 11.6667 12.5C11.6667 12.7361 11.5868 12.934 11.4271 13.0938C11.2674 13.2535 11.0694 13.3333 10.8333 13.3333Z" fill="#565E74" />
              </svg>
            </button>
            <span className="staff-log-date-range-separator">-</span>
            <span className="staff-log-date-range-label">{endDateLabel}</span>
            <button type="button" className="staff-log-date-picker-trigger" aria-label="Choose end date" onClick={() => openDatePicker(endDateInputRef.current)}>
              <svg className="staff-log-date-range-icon" width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1.66667 16.6667C1.20833 16.6667 0.815972 16.5035 0.489583 16.1771C0.163194 15.8507 0 15.4583 0 15V3.33333C0 2.875 0.163194 2.48264 0.489583 2.15625C0.815972 1.82986 1.20833 1.66667 1.66667 1.66667H2.5V0H4.16667V1.66667H10.8333V0H12.5V1.66667H13.3333C13.7917 1.66667 14.184 1.82986 14.5104 2.15625C14.8368 2.48264 15 2.875 15 3.33333V15C15 15.4583 14.8368 15.8507 14.5104 16.1771C14.184 16.5035 13.7917 16.6667 13.3333 16.6667H1.66667ZM1.66667 15H13.3333V6.66667H1.66667V15ZM1.66667 5H13.3333V3.33333H1.66667V5ZM1.66667 5V3.33333V5ZM7.5 10C7.26389 10 7.06597 9.92014 6.90625 9.76042C6.74653 9.60069 6.66667 9.40278 6.66667 9.16667C6.66667 8.93056 6.74653 8.73264 6.90625 8.57292C7.06597 8.41319 7.26389 8.33333 7.5 8.33333C7.73611 8.33333 7.93403 8.41319 8.09375 8.57292C8.25347 8.73264 8.33333 8.93056 8.33333 9.16667C8.33333 9.40278 8.25347 9.60069 8.09375 9.76042C7.93403 9.92014 7.73611 10 7.5 10ZM4.16667 10C3.93056 10 3.73264 9.92014 3.57292 9.76042C3.41319 9.60069 3.33333 9.40278 3.33333 9.16667C3.33333 8.93056 3.41319 8.73264 3.57292 8.57292C3.73264 8.41319 3.93056 8.33333 4.16667 8.33333C4.40278 8.33333 4.60069 8.41319 4.76042 8.57292C4.92014 8.73264 5 8.93056 5 9.16667C5 9.40278 4.92014 9.60069 4.76042 9.76042C4.60069 9.92014 4.40278 10 4.16667 10ZM10.8333 10C10.5972 10 10.3993 9.92014 10.2396 9.76042C10.0799 9.60069 10 9.40278 10 9.16667C10 8.93056 10.0799 8.73264 10.2396 8.57292C10.3993 8.41319 10.5972 8.33333 10.8333 8.33333C11.0694 8.33333 11.2674 8.41319 11.4271 8.57292C11.5868 8.73264 11.6667 8.93056 11.6667 9.16667C11.6667 9.40278 11.5868 9.60069 11.4271 9.76042C11.2674 9.92014 11.0694 10 10.8333 10ZM7.5 13.3333C7.26389 13.3333 7.06597 13.2535 6.90625 13.0938C6.74653 12.934 6.66667 12.7361 6.66667 12.5C6.66667 12.2639 6.74653 12.066 6.90625 11.9062C7.06597 11.7465 7.26389 11.6667 7.5 11.6667C7.73611 11.6667 7.93403 11.7465 8.09375 11.9062C8.25347 12.066 8.33333 12.2639 8.33333 12.5C8.33333 12.7361 8.25347 12.934 8.09375 13.0938C7.93403 13.2535 7.73611 13.3333 7.5 13.3333ZM4.16667 13.3333C3.93056 13.3333 3.73264 13.2535 3.57292 13.0938C3.41319 12.934 3.33333 12.7361 3.33333 12.5C3.33333 12.2639 3.41319 12.066 3.57292 11.9062C3.73264 11.7465 3.93056 11.6667 4.16667 11.6667C4.40278 11.6667 4.60069 11.7465 4.76042 11.9062C4.92014 12.066 5 12.2639 5 12.5C5 12.7361 4.92014 12.934 4.76042 13.0938C4.60069 13.2535 4.40278 13.3333 4.16667 13.3333ZM10.8333 13.3333C10.5972 13.3333 10.3993 13.2535 10.2396 13.0938C10.0799 12.934 10 12.7361 10 12.5C10 12.2639 10.0799 12.066 10.2396 11.9062C10.3993 11.7465 10.5972 11.6667 10.8333 11.6667C11.0694 11.6667 11.2674 11.7465 11.4271 11.9062C11.5868 12.066 11.6667 12.2639 11.6667 12.5C11.6667 12.7361 11.5868 12.934 11.4271 13.0938C11.2674 13.2535 11.0694 13.3333 10.8333 13.3333Z" fill="#565E74" />
              </svg>
            </button>
            <input ref={startDateInputRef} className="staff-log-date-input" aria-label="Filter logs start date" type="date" value={startDateFilter} onChange={(event) => onStartDateFilterChange(event.target.value)} />
            <input ref={endDateInputRef} className="staff-log-date-input" aria-label="Filter logs end date" type="date" value={endDateFilter} onChange={(event) => onEndDateFilterChange(event.target.value)} />
          </div>
          <button type="button" className="clear" disabled={isClearingActivityLogs} onClick={onClearFilters}>
            {isClearingActivityLogs ? 'Clearing...' : 'Clear All'}
          </button>
        </div>
      </section>

      {shouldShowActivityTable ? (
        <section className="staff-log-table-card">
          <div className="staff-log-table-row staff-log-table-head">
            <span>Date &amp; Time</span>
            <span>Event Type</span>
            <span>Description</span>
            <span>IP Address</span>
          </div>

          {isLoadingActivities ? (
          <div className="tenant-list-table-state">Loading activity logs...</div>
          ) : activityError ? (
          <div className="tenant-list-table-state error">{activityError}</div>
          ) : (
            activityLogs.map((activity) => {
              const eventTypeLabel = String(activity.eventType || '').replace(/[_-]+/g, ' ').trim() || 'Action'
              const descriptionLabel = activity.description || activity.title || '-'
              const dateTimeLabel = formatLogDateTime(activity.createdAt)
              const ipAddressLabel = activity.ipAddress || '-'

              return (
                <div className="staff-log-table-row" key={activity.id}>
                  <strong className="staff-log-date-time-cell">{dateTimeLabel}</strong>
                  <span>{eventTypeLabel}</span>
                  <span className={descriptionLabel.toLowerCase().includes('failed') ? 'staff-log-description-danger' : ''}>{descriptionLabel}</span>
                  <span>{ipAddressLabel}</span>
                </div>
              )
            })
          )}

          <footer>
            <span>Showing {displayStart}-{displayEnd} of {totalElements} Log{totalElements === 1 ? '' : 's'}</span>
            <div>
              <button type="button" className="icon-tooltip" data-tooltip="Previous page" disabled={currentPage === 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))}><i className="fa-solid fa-chevron-left"></i></button>
              {pageItems.map((item, index) => (
                item === 'ellipsis' ? (
                  <span className="pagination-ellipsis" key={`activity-ellipsis-${index}`}>...</span>
                ) : (
                  <button type="button" className={item === currentPage ? 'active' : ''} key={item} onClick={() => onPageChange(item)}>{item}</button>
                )
              ))}
              <button type="button" className="icon-tooltip" data-tooltip="Next page" disabled={currentPage === pageCount} onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}><i className="fa-solid fa-chevron-right"></i></button>
            </div>
          </footer>
        </section>
      ) : (
          <section className="staff-log-empty-state">
            <svg className="staff-log-empty-main-icon" width="110" height="80" viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M85 50V35H70V25H85V10H95V25H110V35H95V50H85ZM40 40C34.5 40 29.7917 38.0417 25.875 34.125C21.9583 30.2083 20 25.5 20 20C20 14.5 21.9583 9.79167 25.875 5.875C29.7917 1.95833 34.5 0 40 0C45.5 0 50.2083 1.95833 54.125 5.875C58.0417 9.79167 60 14.5 60 20C60 25.5 58.0417 30.2083 54.125 34.125C50.2083 38.0417 45.5 40 40 40ZM0 80V66C0 63.1667 0.729167 60.5625 2.1875 58.1875C3.64583 55.8125 5.58333 54 8 52.75C13.1667 50.1667 18.4167 48.2292 23.75 46.9375C29.0833 45.6458 34.5 45 40 45C45.5 45 50.9167 45.6458 56.25 46.9375C61.5833 48.2292 66.8333 50.1667 72 52.75C74.4167 54 76.3542 55.8125 77.8125 58.1875C79.2708 60.5625 80 63.1667 80 66V80H0ZM10 70H70V66C70 65.0833 69.7708 64.25 69.3125 63.5C68.8542 62.75 68.25 62.1667 67.5 61.75C63 59.5 58.4583 57.8125 53.875 56.6875C49.2917 55.5625 44.6667 55 40 55C35.3333 55 30.7083 55.5625 26.125 56.6875C21.5417 57.8125 17 59.5 12.5 61.75C11.75 62.1667 11.1458 62.75 10.6875 63.5C10.2292 64.25 10 65.0833 10 66V70ZM40 30C42.75 30 45.1042 29.0208 47.0625 27.0625C49.0208 25.1042 50 22.75 50 20C50 17.25 49.0208 14.8958 47.0625 12.9375C45.1042 10.9792 42.75 10 40 10C37.25 10 34.8958 10.9792 32.9375 12.9375C30.9792 14.8958 30 17.25 30 20C30 22.75 30.9792 25.1042 32.9375 27.0625C34.8958 29.0208 37.25 30 40 30Z" fill="#E4BEB4" fillOpacity="0.4" />
            </svg>
            <span className="staff-log-empty-small-icon">
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2.5 25C1.8125 25 1.22396 24.7552 0.734375 24.2656C0.244792 23.776 0 23.1875 0 22.5V8.75C0 8.0625 0.244792 7.47396 0.734375 6.98438C1.22396 6.49479 1.8125 6.25 2.5 6.25H8.75V2.5C8.75 1.8125 8.99479 1.22396 9.48438 0.734375C9.97396 0.244792 10.5625 0 11.25 0H13.75C14.4375 0 15.026 0.244792 15.5156 0.734375C16.0052 1.22396 16.25 1.8125 16.25 2.5V6.25H22.5C23.1875 6.25 23.776 6.49479 24.2656 6.98438C24.7552 7.47396 25 8.0625 25 8.75V22.5C25 23.1875 24.7552 23.776 24.2656 24.2656C23.776 24.7552 23.1875 25 22.5 25H2.5ZM2.5 22.5H22.5V8.75H16.25C16.25 9.4375 16.0052 10.026 15.5156 10.5156C15.026 11.0052 14.4375 11.25 13.75 11.25H11.25C10.5625 11.25 9.97396 11.0052 9.48438 10.5156C8.99479 10.026 8.75 9.4375 8.75 8.75H2.5V22.5ZM5 20H12.5V19.4375C12.5 19.0833 12.401 18.7552 12.2031 18.4531C12.0052 18.151 11.7292 17.9167 11.375 17.75C10.9583 17.5625 10.5365 17.4219 10.1094 17.3281C9.68229 17.2344 9.22917 17.1875 8.75 17.1875C8.27083 17.1875 7.81771 17.2344 7.39062 17.3281C6.96354 17.4219 6.54167 17.5625 6.125 17.75C5.77083 17.9167 5.49479 18.151 5.29688 18.4531C5.09896 18.7552 5 19.0833 5 19.4375V20ZM15 18.125H20V16.25H15V18.125ZM8.75 16.25C9.27083 16.25 9.71354 16.0677 10.0781 15.7031C10.4427 15.3385 10.625 14.8958 10.625 14.375C10.625 13.8542 10.4427 13.4115 10.0781 13.0469C9.71354 12.6823 9.27083 12.5 8.75 12.5C8.22917 12.5 7.78646 12.6823 7.42188 13.0469C7.05729 13.4115 6.875 13.8542 6.875 14.375C6.875 14.8958 7.05729 15.3385 7.42188 15.7031C7.78646 16.0677 8.22917 16.25 8.75 16.25ZM15 14.375H20V12.5H15V14.375ZM11.25 8.75H13.75V2.5H11.25V8.75Z" fill="white" />
              </svg>
            </span>
            <p>No activity recorded for this account yet.</p>
          </section>
      )}
    </div>
  )
}


