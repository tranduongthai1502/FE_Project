import { SearchInput } from '@/core/components/SearchInput'
import { ScrollableSelect } from '@/core/components/ScrollableSelect'

export type JobStatusFilter = 'ALL' | 'OPEN' | 'CLOSED' | 'DRAFT'

export type JobFilterBarProps = {
  searchQuery: string
  onSearchChange: (val: string) => void
  statusFilter: JobStatusFilter
  onStatusFilterChange: (val: JobStatusFilter) => void
  departmentFilter: string
  onDepartmentFilterChange: (val: string) => void
  departmentOptions: Array<{ value: string; label: string }>
  onOpenCreateModal: () => void
}

export function JobFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  departmentOptions,
  onOpenCreateModal,
}: JobFilterBarProps) {
  return (
    <div className="hr-filter-bar">
      <div className="filter-inputs">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search job title, department..."
        />
        <ScrollableSelect
          value={statusFilter}
          onChange={(val) => onStatusFilterChange(val as JobStatusFilter)}
          options={[
            { value: 'ALL', label: 'All Statuses' },
            { value: 'OPEN', label: 'Open' },
            { value: 'CLOSED', label: 'Closed' },
            { value: 'DRAFT', label: 'Draft' },
          ]}
        />
        {departmentOptions.length > 0 && (
          <ScrollableSelect
            value={departmentFilter}
            onChange={onDepartmentFilterChange}
            options={[
              { value: '', label: 'All Departments' },
              ...departmentOptions,
            ]}
          />
        )}
      </div>
      <button type="button" className="btn-primary" onClick={onOpenCreateModal}>
        + Post New Job
      </button>
    </div>
  )
}
