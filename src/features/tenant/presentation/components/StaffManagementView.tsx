import type { StaffMember } from '@/features/tenant/domain/tenantApi.types'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { SearchInput } from '@/core/components/SearchInput'
import { ListTable } from '@/core/components/ListTable'
import { EditIcon, TrashIcon } from '@/core/components/Icons'
import { getCompactPageItems } from '@/core/utils/pagination'
import { formatStaffDate, getStaffRoleList } from '../../application/tenantStaffDisplay'
import { useStaffManagementList } from '../../application/useStaffManagementList'
export function StaffManagementView({
  staffList,
  isLoading,
  error,
  maxStaffQuota = 10,
  isStaffQuotaUnlimited = false,
  staffAccountCount,
  onCreate,
  onEdit,
  onDelete,
  onSelectStaff,
  onHome,
  currentPage,
  pageCount,
  onPageChange,
  roleFilter,
  statusFilter,
  searchQuery,
  onRoleFilterChange,
  onStatusFilterChange,
  onSearchQueryChange,
  isActionLocked = false,
}: {
  staffList: StaffMember[]
  isLoading: boolean
  error: string
  maxStaffQuota?: number
  isStaffQuotaUnlimited?: boolean
  staffAccountCount: number
  onCreate: () => void
  onEdit: (staff: StaffMember) => void
  onDelete: (staff: StaffMember) => void
  onSelectStaff: (staff: StaffMember) => void
  onHome: () => void
  currentPage: number
  pageCount: number
  onPageChange: (page: number) => void
  roleFilter: string
  statusFilter: string
  searchQuery: string
  onRoleFilterChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onSearchQueryChange: (value: string) => void
  isActionLocked?: boolean
}) {
  const totalPages = pageCount
  const paginatedStaff = staffList
  const pageItems = getCompactPageItems(currentPage, totalPages)
  const {
    displayEnd,
    displayStart,
    hasReachedStaffQuota,
    quotaPercent,
    totalElements,
  } = useStaffManagementList({
    currentPage,
    error,
    isLoading,
    isStaffQuotaUnlimited,
    maxStaffQuota,
    onPageChange,
    staffAccountCount,
    staffList,
  })

  return (
    <div className="role-content staff-management-content">
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Staff Management' }]} />

      <div className="staff-management-head">
        <div>
          <h1>Staff Management</h1>
          <p>Manage your team members and recruitment permissions.</p>
        </div>
        <section className="staff-quota-card">
          <div>
            <span>Staff Accounts</span>
            <strong>{staffAccountCount} / {isStaffQuotaUnlimited ? 'Unlimited' : maxStaffQuota}</strong>
          </div>
          {!isStaffQuotaUnlimited && (
            <i><span style={{ width: `${quotaPercent}%`, background: '#ff5f2b' }} /></i>
          )}
          <small>{isStaffQuotaUnlimited ? 'Unlimited seats available' : `${Math.max(0, maxStaffQuota - staffAccountCount)} seats remaining`}</small>
        </section>
      </div>

      <div className="staff-management-toolbar">
        <label>
          <span>Role:</span>
          <select value={roleFilter} onChange={(e) => onRoleFilterChange(e.target.value)}>
            <option value="all">All</option>
            <option value="hr">HR</option>
            <option value="interviewer">Interviewer</option>
          </select>
        </label>
        <label>
          <span>Status:</span>
          <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
            <option value="all">All</option>
            <option value="activated">Active</option>
            <option value="disabled">Inactive</option>
          </select>
        </label>
        <SearchInput
          className="staff-search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search full name or email address..."
          ariaLabel="Staff search"
        />
        <button
          type="button"
          className="tenant-create-btn"
          onClick={onCreate}
          disabled={hasReachedStaffQuota || isActionLocked}
          title={hasReachedStaffQuota ? 'Account quota reached. Please upgrade your subscription plan to add more staff.' : undefined}
        >
          Create Staff Account
        </button>
      </div>

      {isLoading ? (
        <div className="tenant-list-table-state" style={{ marginTop: '24px' }}>Loading staff accounts...</div>
      ) : error ? (
        <div className="tenant-list-table-state error" style={{ marginTop: '24px' }}>{error}</div>
      ) : staffAccountCount === 0 ? (
        <section className="staff-empty-state">
          <i className="fa-solid fa-user-plus"></i>
          <span><i className="fa-solid fa-briefcase"></i></span>
          <strong>No staff accounts found</strong>
          <p>Click "Create Staff Account" to add your first team member.</p>
        </section>
      ) : staffList.length === 0 ? (
        <div className="tenant-list-table-state" style={{ marginTop: '24px' }}>No staff members match the filters.</div>
      ) : (
        <ListTable
          cardClassName="staff-list-table-card"
          rowClassName="staff-list-table-row"
          headClassName="staff-list-table-head"
          stateClassName="tenant-list-table-state"
          columns={['Full Name', 'Email', 'Role', 'Status', 'Date Created', 'Actions']}
          isLoading={false}
          empty={false}
          loadingMessage="Loading staff accounts..."
          emptyMessage="No staff members match the filters."
          pagination={{
            label: `Showing ${displayStart}-${displayEnd} of ${totalElements} staff account${totalElements === 1 ? '' : 's'}`,
            currentPage,
            pageCount: totalPages,
            pageItems,
            onPageChange,
            ellipsisKeyPrefix: 'staff',
          }}
        >
          {paginatedStaff.map(staff => {
            const roleList = getStaffRoleList(staff)
            const isActive = staff.status === 'ACTIVE'

            return (
              <div
                className="staff-list-table-row staff-list-table-row-clickable"
                key={staff.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectStaff(staff)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectStaff(staff)
                  }
                }}
              >
                <strong 
                  className="staff-truncate-text"
                  title={staff.fullName}
                >
                  {staff.fullName}
                </strong>
                <span className="staff-truncate-text" title={staff.email}>{staff.email}</span>
                <div>
                  {roleList.map(r => (
                    <span key={r} className="staff-badge">{r}</span>
                  ))}
                </div>
                <em className={isActive ? 'active' : 'disabled'}>
                  <i className="fa-solid fa-circle" style={{ fontSize: '6px' }}></i>
                  {isActive ? 'Active' : 'Inactive'}
                </em>
                <span>{formatStaffDate(staff.createdAt)}</span>
                <div className="staff-actions">
                  <button
                    type="button"
                    className="icon-tooltip"
                    data-tooltip="Edit"
                    aria-label={`Edit ${staff.fullName}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit(staff)
                    }}
                    disabled={isActionLocked}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-tooltip"
                    data-tooltip="Delete"
                    aria-label={`Delete ${staff.fullName}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onDelete(staff)
                    }}
                    disabled={isActionLocked}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )
          })}
        </ListTable>
      )}
    </div>
  )
}
