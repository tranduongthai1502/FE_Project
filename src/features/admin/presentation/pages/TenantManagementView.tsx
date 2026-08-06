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
          iconClassName="metric-icon-success"
          iconElement={<svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1.4 12L0 10.6L7.4 3.15L11.4 7.15L16.6 2H14V0H20V6H18V3.4L11.4 10L7.4 6L1.4 12Z" fill="#16A34A" /></svg>}
          label="Monthly Active Plan Revenue"
          value={(ctrl.metricsAreLoading || ctrl.tenantStatsAreLoading) ? '...' : `$${ctrl.tenantStatsTotalRevenue.toLocaleString()}`}
        />
        <MetricCard
          className="tenant-management-metric-card"
          iconClassName="metric-icon-primary"
          iconElement={<svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M0 18V0H10V4H20V18H0ZM2 16H4V14H2V16ZM2 12H4V10H2V12ZM2 8H4V6H2V8ZM2 4H4V2H2V4ZM6 16H8V14H6V16ZM6 12H8V10H6V12ZM6 8H8V6H6V8ZM6 4H8V2H6V4ZM10 16H18V6H10V8H12V10H10V12H12V14H10V16ZM14 10V8H16V10H14ZM14 14V12H16V14H14Z" fill="#2563EB" /></svg>}
          label="Active Tenants"
          value={ctrl.tenantStatsAreLoading ? '...' : String(ctrl.tenantStatsActiveCount)}
        />
        <MetricCard
          className="tenant-management-metric-card"
          iconClassName="metric-icon-warning"
          iconElement={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M10 19.95C8.61667 19.95 7.31667 19.6875 6.1 19.1625C4.88333 18.6375 3.825 17.9208 2.925 17.0125C2.025 16.1042 1.3125 15.0417 0.7875 13.825C0.2625 12.6083 0 11.3167 0 9.95C0 7.33333 0.866667 5.08333 2.6 3.2C4.33333 1.31667 6.46667 0.25 9 0V3C7.28333 3.23333 5.85417 4.00417 4.7125 5.3125C3.57083 6.62083 3 8.16667 3 9.95C3 11.8833 3.68333 13.5333 5.05 14.9C6.41667 16.2667 8.06667 16.95 10 16.95C11.1 16.95 12.1292 16.7167 13.0875 16.25C14.0458 15.7833 14.85 15.15 15.5 14.35L18.1 15.85C17.2 17.1 16.0417 18.0958 14.625 18.8375C13.2083 19.5792 11.6667 19.95 10 19.95ZM19.15 14L16.55 12.5C16.7 12.1 16.8125 11.6875 16.8875 11.2625C16.9625 10.8375 17 10.4 17 9.95C17 8.16667 16.4292 6.62083 15.2875 5.3125C14.1458 4.00417 12.7167 3.23333 11 3V0C13.5333 0.25 15.6667 1.31667 17.4 3.2C19.1333 5.08333 20 7.33333 20 9.95C20 10.6833 19.9333 11.3917 19.8 12.075C19.6667 12.7583 19.45 13.4 19.15 14Z" fill="#EA580C" /></svg>}
          label="Average Usage"
          value={ctrl.tenantStatsAreLoading ? '...' : formatDashboardPercent(ctrl.tenantStatsAverageUsage)}
        />
        <MetricCard
          className="tenant-management-metric-card"
          iconClassName="metric-icon-danger"
          iconElement={<svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M0 19L11 0L22 19H0ZM3.45 17H18.55L11 4L3.45 17ZM11 16C11.2833 16 11.5208 15.9042 11.7125 15.7125C11.9042 15.5208 12 15.2833 12 15C12 14.7167 11.9042 14.4792 11.7125 14.2875C11.5208 14.0958 11.2833 14 11 14C10.7167 14 10.4792 14.0958 10.2875 14.2875C10.0958 14.4792 10 14.7167 10 15C10 15.2833 10.0958 15.5208 10.2875 15.7125C10.4792 15.9042 10.7167 16 11 16ZM10 13H12V8H10V13Z" fill="#DC2626" /></svg>}
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
