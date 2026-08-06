import { useTenantManagementController } from '@/features/admin/application/hooks/useTenantManagementController'
import { formatPlanDate } from '@/features/admin/application/helpers/adminFormatters'
import { formatDashboardPercent, getTenantStatusMeta } from '@/features/admin/application/helpers/tenantDisplayUtils'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { EditIcon, TrashIcon } from '@/core/components/Icons'
import { CreateTenantPage } from '../components/tenant/CreateTenant'
import { TenantDetailView } from '../components/tenant/TenantDetailView'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { ListTable } from '@/core/components/ListTable'
import { SearchInput } from '@/core/components/SearchInput'
import { ScrollableSelect } from '@/core/components/ScrollableSelect'
import { MetricCard } from '@/core/components/MetricCard'
import { formatCurrencyInput } from '@/core/utils/currencyFormat'

export function TenantManagementView({
  onHome,
  triggerToast,
}: {
  onHome: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const ctrl = useTenantManagementController({ onHome, triggerToast })

  if (ctrl.isCreateModalOpen) {
    return (
      <>
        <CreateTenantPage
          form={ctrl.tenantForm}
          error={ctrl.tenantError}
          fieldErrors={ctrl.tenantFieldErrors}
          plans={ctrl.subscriptionPlans}
          isLoadingPlans={ctrl.isLoadingPlans}
          isSubmitting={ctrl.isSubmittingTenant}
          onChange={ctrl.updateTenantForm}
          onClose={ctrl.requestResetCreateTenantPage}
          onGoHome={ctrl.goHomeFromCreateTenant}
          onBackToList={ctrl.confirmCloseCreateModal}
          onSubmit={ctrl.handleCreateTenant}
        />

        {ctrl.isCreateCancelConfirmOpen && (
          <ConfirmActionModal
            isSubmitting={false}
            title="Confirm Action"
            message="Are you sure you want to cancel? Your changes will not be saved."
            cancelLabel="Cancel"
            confirmLabel="Confirm"
            onCancel={() => ctrl.setIsCreateCancelConfirmOpen(false)}
            onConfirm={ctrl.resetCreateTenantPage}
          />
        )}
      </>
    )
  }

  if (ctrl.activeView === 'detail') {
    return <TenantDetailView ctrl={ctrl} onHome={onHome} />
  }

  return (
    <div className="role-content tenant-management-content">
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Tenant Management' }]} />

      <section className="tenant-filter-card">
        <div className="tenant-filter-tabs">
          <button type="button" className={ctrl.tenantStatusFilter === 'all' ? 'active' : ''} onClick={() => ctrl.selectTenantFilter('all')}>All Tenants</button>
          <button type="button" className={ctrl.tenantStatusFilter === 'active' ? 'active' : ''} onClick={() => ctrl.selectTenantFilter('active')}>Active</button>
          <button type="button" className={ctrl.tenantStatusFilter === 'inactive' ? 'active' : ''} onClick={() => ctrl.selectTenantFilter('inactive')}>Inactive</button>
          <ScrollableSelect
            className={`tenant-plan-filter-tab ${ctrl.tenantPlanFilter ? 'active' : ''}`}
            value={ctrl.tenantPlanFilter}
            ariaLabel="Filter by plan"
            placeholder="Filter by Plan"
            options={[
              { value: '', label: 'Filter by Plan' },
              ...ctrl.planFilterOptions.map((plan) => ({ value: plan.value, label: plan.label })),
            ]}
            onChange={ctrl.selectPlanFilter}
          />
        </div>
        <SearchInput
          className="tenant-filter-search"
          value={ctrl.tenantSearchQuery}
          onChange={(event) => ctrl.setTenantSearchQuery(event.target.value)}
          placeholder="Search tenant name"
          ariaLabel="Tenant search"
        />
        <button type="button" className="tenant-create-btn" onClick={ctrl.openCreateTenant}>
          Create New Tenant
        </button>
      </section>

      <div className="tenant-management-metrics">
        <MetricCard
          className="tenant-management-metric-card"
          icon="fa-arrow-trend-up"
          label="Monthly Active Plan Revenue"
          value={(ctrl.metricsAreLoading || ctrl.tenantStatsAreLoading) ? '...' : `$${ctrl.tenantStatsTotalRevenue.toLocaleString()}`}
        />
        <MetricCard
          className="tenant-management-metric-card"
          icon="fa-table-cells-large"
          label="Active Tenants"
          value={ctrl.tenantStatsAreLoading ? '...' : String(ctrl.tenantStatsActiveCount)}
        />
        <MetricCard
          className="tenant-management-metric-card"
          icon="fa-circle-notch"
          label="Average Usage"
          value={ctrl.tenantStatsAreLoading ? '...' : formatDashboardPercent(ctrl.tenantStatsAverageUsage)}
        />
        <MetricCard
          className="tenant-management-metric-card"
          icon="fa-triangle-exclamation"
          label="Churn Rate"
          value={ctrl.tenantStatsAreLoading ? '...' : formatDashboardPercent(ctrl.tenantStatsChurnRate)}
        />
      </div>

      <ListTable
        cardClassName="tenant-list-table-card"
        rowClassName="tenant-list-table-row"
        headClassName="tenant-list-table-head"
        stateClassName="tenant-list-table-state"
        columns={['Full Name', 'Subscription Plan', 'Price', 'Expiration Date', 'User Quota', 'Status', 'Actions']}
        isLoading={ctrl.isLoadingTenants}
        error={ctrl.tenantListError}
        empty={ctrl.displayedTenants.length === 0}
        loadingMessage="Loading tenants..."
        emptyMessage="No tenants found."
        pagination={{
          label: `Showing ${ctrl.tenantDisplayStart}-${ctrl.tenantDisplayEnd} of ${ctrl.tenantTotalElements} Tenant${ctrl.tenantTotalElements === 1 ? '' : 's'}`,
          currentPage: ctrl.tenantPage,
          pageCount: ctrl.tenantPageCount,
          pageItems: ctrl.tenantPageItems,
          onPageChange: ctrl.setTenantPage,
          ellipsisKeyPrefix: 'tenant',
        }}
      >
        {ctrl.paginatedTenants.map((tenant) => {
          const status = getTenantStatusMeta(tenant.status)
          const tenantPlan = ctrl.getTenantPlan(tenant)
          const hasUnlimitedQuota = tenant.userQuotaUnlimited || (tenantPlan ? tenantPlan.staffAccountUnlimited : tenant.userQuotaLimit <= 0)
          const quotaPercent = tenant.userQuotaLimit > 0
            ? Math.min(100, Math.round((tenant.userQuotaUsed / tenant.userQuotaLimit) * 100))
            : 0
          const expirationDateLabel = formatPlanDate(tenant.expirationDate) || tenant.expirationDate || '-'
          const monthlyPriceLabel = tenant.priceLabel || (tenantPlan
            ? tenantPlan.priceLabel || `$${formatCurrencyInput((tenantPlan.price ?? tenantPlan.monthlyPrice).toFixed(2))} /month`
            : '-')
          const handleOpenTenantDetail = () => ctrl.openTenantDetail(tenant.id)

          return (
            <div
              className="tenant-list-table-row tenant-list-table-row-clickable"
              key={tenant.id}
              role="button"
              tabIndex={0}
              onClick={handleOpenTenantDetail}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleOpenTenantDetail()
                }
              }}
            >
              <span className="table-name-tooltip" data-tooltip={tenant.name} title={tenant.name} tabIndex={0}>
                <strong>{tenant.name}</strong>
              </span>
              <span className={`tenant-plan-name ${ctrl.isHighestPricedPlan(tenant, tenantPlan) ? 'premium-plan' : ''}`}>
                {tenantPlan?.name || tenant.subscriptionPlan || '-'}
              </span>
              <span className="tenant-monthly-price">{monthlyPriceLabel}</span>
              <span className="tenant-expiration-date">{expirationDateLabel}</span>
              <span className={`tenant-quota ${hasUnlimitedQuota ? 'unlimited' : ''}`}>
                {!hasUnlimitedQuota && <i><b style={{ width: `${quotaPercent}%` }} /></i>}
                <strong>{hasUnlimitedQuota ? 'Unlimited' : `${tenant.userQuotaUsed}/${tenant.userQuotaLimit}`}</strong>
              </span>
              <em className={status.className}>{status.label}</em>
              <span className="tenant-row-actions">
                <button
                  type="button"
                  className="icon-tooltip"
                  aria-label={`View ${tenant.name}`}
                  data-tooltip="Detail"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleOpenTenantDetail()
                  }}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="icon-tooltip tenant-delete-action"
                  aria-label={`Delete ${tenant.name}`}
                  data-tooltip={ctrl.isTenantActive(tenant) ? 'Deactivate this tenant before deleting it.' : 'Delete'}
                  title={ctrl.isTenantActive(tenant) ? 'Deactivate this tenant before deleting it.' : undefined}
                  disabled={ctrl.isDeletingTenant || ctrl.isTenantActive(tenant)}
                  onClick={(event) => {
                    event.stopPropagation()
                    ctrl.requestDeleteTenant(tenant)
                  }}
                >
                  <TrashIcon />
                </button>
              </span>
            </div>
          )
        })}
      </ListTable>

      {ctrl.deleteTenantTarget && (
        <ConfirmActionModal
          isSubmitting={ctrl.isDeletingTenant}
          title="Confirm Action"
          message={`Are you sure you want to permanently delete ${ctrl.deleteTenantTarget.name}? This action cannot be undone.`}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          submittingLabel="Deleting..."
          onCancel={() => {
            if (!ctrl.isDeletingTenant) ctrl.setDeleteTenantTarget(null)
          }}
          onConfirm={ctrl.confirmDeleteTenant}
        />
      )}
    </div>
  )
}
