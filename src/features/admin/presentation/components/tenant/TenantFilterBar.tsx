import { SearchInput } from '@/core/components/SearchInput'
import { ScrollableSelect } from '@/core/components/ScrollableSelect'
import type { SubscriptionPlan } from '@/features/admin/domain/adminApi.types'

export type TenantStatusFilter = 'all' | 'active' | 'inactive'

export type TenantFilterBarProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: TenantStatusFilter
  onStatusFilterChange: (status: TenantStatusFilter) => void
  planFilter: string
  onPlanFilterChange: (planId: string) => void
  subscriptionPlans: SubscriptionPlan[]
  onOpenCreateModal: () => void
}

export function TenantFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  planFilter,
  onPlanFilterChange,
  subscriptionPlans,
  onOpenCreateModal,
}: TenantFilterBarProps) {
  const planOptions = [
    { value: '', label: 'All Subscription Plans' },
    ...subscriptionPlans.map((plan) => ({
      value: plan.id,
      label: plan.name,
    })),
  ]

  return (
    <div className="admin-filter-bar">
      <div className="filter-inputs">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by company name, email..."
        />
        <ScrollableSelect
          value={statusFilter}
          onChange={(val) => onStatusFilterChange(val as TenantStatusFilter)}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        <ScrollableSelect
          value={planFilter}
          onChange={onPlanFilterChange}
          options={planOptions}
        />
      </div>
      <button type="button" className="btn-primary" onClick={onOpenCreateModal}>
        + Create Tenant
      </button>
    </div>
  )
}
