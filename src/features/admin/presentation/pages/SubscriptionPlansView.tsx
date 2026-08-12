import { useSubscriptionPlansController } from '@/features/admin/application/hooks/useSubscriptionPlansController'
import { CreatePlanView } from '../components/plan/CreatePlanView'
import { EditPlanDetailView } from '../components/plan/EditPlanDetailView'
import {
  getSubscriptionPlanUsagePercent,
  getTenantJobUsage,
  type PlanSortOption,
} from '../../infrastructure/subscriptionPlansService'
import { formatFeatureLabel, formatPlanDate } from '@/features/admin/application/helpers/adminFormatters'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { EditIcon, TrashIcon } from '@/core/components/Icons'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { ListTable } from '@/core/components/ListTable'
import { MetricCard } from '@/core/components/MetricCard'
import { ScrollableSelect } from '@/core/components/ScrollableSelect'
import { formatCurrencyInput } from '@/core/utils/currencyFormat'
import { planFeatureDefaults } from '../../domain/subscriptionPlanFeatures'

function isActivePlanFeatureStatus(status?: string) {
  return ['active', 'enabled', 'true'].includes(String(status || '').trim().toLowerCase())
}

function getPlanFeatureDisplayLabel(featureKey: string) {
  const normalizedKey = featureKey.trim().toUpperCase()
  const matchingFeature = planFeatureDefaults.find((feature) => (
    feature.code === normalizedKey || feature.key.toUpperCase() === normalizedKey
  ))

  return matchingFeature?.title || formatFeatureLabel(featureKey)
}

export function SubscriptionPlansView({
  onHome,
  triggerToast,
}: {
  onHome: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const ctrl = useSubscriptionPlansController({ onHome, triggerToast })

  if (ctrl.activeView === 'create') {
    return (
      <CreatePlanView
        onBack={() => {
          ctrl.setActiveView('list')
        }}
        onHome={onHome}
        onCreated={ctrl.handlePlanCreated}
        triggerToast={triggerToast}
      />
    )
  }

  if (ctrl.activeView === 'detail') {
    const selectedPlan = ctrl.selectedPlanDetail
    const matchingTenants = selectedPlan ? ctrl.tenants : []
    const enabledFeatures = selectedPlan?.features.filter((feature) => isActivePlanFeatureStatus(feature.status)) || []
    const selectedPlanTenantCount = ctrl.subscriberTotalCount
    const selectedPlanDeleteTooltip = ctrl.getPlanDeleteTooltip(selectedPlanTenantCount)

    return (
      <div className="role-content subscription-plan-detail-content">
        <Breadcrumb
          items={[
            { label: 'Home', onClick: onHome },
            { label: 'Subscription Plans', onClick: ctrl.closePlanDetail },
            { label: 'Plan Detail' },
          ]}
        />

        {ctrl.isLoadingPlanDetail ? (
          <div className="subscription-table-state">Loading plan details...</div>
        ) : ctrl.planDetailError ? (
          <div className="subscription-table-state error">{ctrl.planDetailError}</div>
        ) : !selectedPlan ? (
          <div className="subscription-table-state">Plan not found.</div>
        ) : (
          <>
            <div className="plan-detail-title-row">
              <div>
                <h1>
                  <span>{selectedPlan.name}</span>
                  <em className={selectedPlan.status.toLowerCase() === 'active' ? 'active' : 'inactive'}>
                    {selectedPlan.status}
                  </em>
                </h1>
              </div>
              <div className="plan-detail-title-actions">
                <button
                  type="button"
                  className="plan-detail-delete-button icon-tooltip"
                  data-tooltip={selectedPlanDeleteTooltip}
                  title={selectedPlanTenantCount > 0 ? selectedPlanDeleteTooltip : undefined}
                  onClick={() => ctrl.requestDeletePlan(selectedPlan)}
                  disabled={ctrl.isDeletingPlan || selectedPlanTenantCount > 0}
                >
                  Delete
                </button>
                <button type="button" onClick={() => ctrl.openPlanEdit(selectedPlan.id)}>Edit</button>
              </div>
            </div>

            <section className="plan-detail-card plan-configuration-card">
              <h2>Plan Configuration</h2>
              <div className="plan-config-grid">
                <div className="plan-config-description">
                  <span>Short Description</span>
                  <strong>{selectedPlan.description || '-'}</strong>
                </div>
                <div>
                  <span>Base Price</span>
                  <strong className="price">{selectedPlan.priceLabel || `$${formatCurrencyInput((selectedPlan.price ?? selectedPlan.monthlyPrice).toFixed(2))} /month`}</strong>
                </div>
                <div>
                  <span>Staff Limit</span>
                  <strong><i className="fa-regular fa-calendar-days"></i> {selectedPlan.staffAccountUnlimited ? 'Unlimited' : `${selectedPlan.maxStaffAccount} Members`}</strong>
                </div>
                <div>
                  <span>Job Limit</span>
                  <strong><i className="fa-regular fa-folder-open"></i> {selectedPlan.activeJobPostingUnlimited ? 'Unlimited' : `${selectedPlan.maxActiveJobPosting} Active Jobs`}</strong>
                </div>
                <div>
                  <span>Created Date</span>
                  <strong><i className="fa-regular fa-calendar"></i> {formatPlanDate(selectedPlan.createdAt)}</strong>
                </div>
                <div>
                  <span>AI Features</span>
                  <div className="plan-feature-tags">
                    {enabledFeatures.length > 0 ? (
                      enabledFeatures.map((feature) => (
                        <em key={feature.key} className="enabled">
                          {getPlanFeatureDisplayLabel(feature.key)}
                        </em>
                      ))
                    ) : (
                      <strong>-</strong>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="active-subscribers-section">
              <h2>Active Subscribers</h2>
              <div className="plan-detail-card active-subscribers-card">
                {matchingTenants.length === 0 ? (
                  <div className="plan-no-tenants">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span>No tenants found.</span>
                  </div>
                ) : (
                  <div className="plan-subscriber-table">
                    <div className="plan-subscriber-row plan-subscriber-head">
                      <span>Company Name</span>
                      <span>Domain</span>
                      <span>Staff Usage</span>
                      <span>Job Usage</span>
                      <span>Expiration Date</span>
                      <span>Status</span>
                    </div>

                    {matchingTenants.map((tenant) => {
                      const staffUnlimited = tenant.userQuotaUnlimited || selectedPlan.staffAccountUnlimited
                      const staffLimit = tenant.userQuotaLimit || selectedPlan.maxStaffAccount || 0
                      const staffPercent = staffUnlimited ? 0 : getSubscriptionPlanUsagePercent(tenant.userQuotaUsed, staffLimit)
                      const jobUsage = getTenantJobUsage(tenant, selectedPlan)
                      const status = tenant.status.toLowerCase()
                      const statusLabel = status.includes('expir') ? 'Expiring' : status === 'active' ? 'Active' : 'Inactive'
                      const statusClassName = statusLabel.toLowerCase()

                      return (
                        <div className="plan-subscriber-row" key={tenant.id}>
                          <strong>{tenant.name}</strong>
                          <code>{tenant.domain || '-'}</code>
                          <div className="subscriber-usage-cell">
                            <span><b>{tenant.userQuotaUsed}/{staffUnlimited ? 'Unlimited' : staffLimit}</b>{!staffUnlimited && <small>{staffPercent}%</small>}</span>
                            {!staffUnlimited && <i><em style={{ width: `${staffPercent}%` }} /></i>}
                          </div>
                          <div className="subscriber-usage-cell">
                            <span><b>{jobUsage.used}/{jobUsage.isUnlimited ? 'Unlimited' : jobUsage.limit}</b>{!jobUsage.isUnlimited && <small>{jobUsage.percent}%</small>}</span>
                            {!jobUsage.isUnlimited && <i><em style={{ width: `${jobUsage.percent}%` }} /></i>}
                          </div>
                          <span>{formatPlanDate(tenant.expirationDate) || tenant.expirationDate || '-'}</span>
                          <em className={statusClassName}>{statusLabel}</em>
                        </div>
                      )
                    })}

                    <footer>
                      <span>Showing {matchingTenants.length} of {ctrl.subscriberTotalCount} subscribers</span>
                      <div>
                        <button type="button" className="icon-tooltip" data-tooltip="Previous page" disabled={ctrl.subscriberPage === 1} onClick={() => ctrl.setSubscriberPage((page) => Math.max(1, page - 1))}><i className="fa-solid fa-chevron-left"></i></button>
                        {Array.from({ length: ctrl.subscriberPageCount }, (_, index) => index + 1).map((page) => (
                          <button type="button" className={ctrl.subscriberPage === page ? 'active' : ''} key={page} onClick={() => ctrl.setSubscriberPage(page)}>{page}</button>
                        ))}
                        <button type="button" className="icon-tooltip" data-tooltip="Next page" disabled={ctrl.subscriberPage === ctrl.subscriberPageCount} onClick={() => ctrl.setSubscriberPage((page) => Math.min(ctrl.subscriberPageCount, page + 1))}><i className="fa-solid fa-chevron-right"></i></button>
                      </div>
                    </footer>
                  </div>
                )}
              </div>
            </section>

            {ctrl.deletePlanTarget && (
              <ConfirmActionModal
                isSubmitting={ctrl.isDeletingPlan}
                title="Confirm Action"
                message={(
                  <>
                    Are you sure you want to delete <span className="tenant-confirm-target-name">{ctrl.deletePlanTarget.name}</span>?
                    <br />
                    This action cannot be undone.
                  </>
                )}
                cancelLabel="Cancel"
                confirmLabel="Delete"
                submittingLabel="Deleting..."
                onCancel={() => {
                  if (!ctrl.isDeletingPlan) ctrl.setDeletePlanTarget(null)
                }}
                onConfirm={ctrl.confirmDeletePlan}
              />
            )}
          </>
        )}
      </div>
    )
  }

  if (ctrl.activeView === 'edit') {
    const selectedPlan = ctrl.selectedPlanDetail
    const assignedTenantCount = ctrl.subscriberTotalCount
    const activeAssignedTenantCount = ctrl.tenants.filter((tenant) => tenant.status.toLowerCase() === 'active').length

    if (ctrl.isLoadingPlanDetail) {
      return (
        <div className="role-content subscription-plan-detail-content">
          <div className="subscription-table-state">Loading plan details...</div>
        </div>
      )
    }

    if (ctrl.planDetailError || !selectedPlan) {
      return (
        <div className="role-content subscription-plan-detail-content">
          <div className={`subscription-table-state ${ctrl.planDetailError ? 'error' : ''}`}>
            {ctrl.planDetailError || 'Plan not found.'}
          </div>
        </div>
      )
    }

    return (
      <EditPlanDetailView
        plan={selectedPlan}
        onHome={onHome}
        onPlans={ctrl.openPlanList}
        existingPlans={ctrl.plans}
        assignedTenantCount={assignedTenantCount}
        activeAssignedTenantCount={activeAssignedTenantCount}
        onBack={() => {
          ctrl.setActiveView('detail')
        }}
        onSaved={() => {
          ctrl.setRefreshPlansKey((value) => value + 1)
          ctrl.setActiveView('detail')
        }}
        triggerToast={triggerToast}
      />
    )
  }

  return (
    <div className="role-content subscription-plans-content">
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Subscription Plans' }]} />

      <div className="subscription-title-row">
        <div>
          <h1>Subscription Plans</h1>
          <p>Manage tier configurations and global recruitment limits for platform customers.</p>
        </div>
        <button type="button" onClick={ctrl.openPlanCreate}>Create New Plan</button>
      </div>

      <div className="role-metrics subscription-plan-metrics">
        <MetricCard
          className="subscription-plan-card"
          icon="fa-layer-group"
          label="Active Plans"
          value={ctrl.planStatsActivePlans}
        />
        <MetricCard
          className="subscription-plan-card"
          icon="fa-crown"
          label="Top Tier"
          value={ctrl.planStatsTopTierName}
        />
        <MetricCard
          className="subscription-plan-card"
          icon="fa-money-bill-trend-up"
          label="Monthly Active Plan Revenue"
          value={ctrl.planStatsMonthlyRevenueLabel}
        />
        <MetricCard
          className="subscription-plan-card recommendation"
          icon="fa-rotate"
          label="Renewal Rate"
          value={ctrl.planStatsRenewalRateLabel}
        />
      </div>

      <ListTable
        cardClassName="subscription-table-card"
        rowClassName="subscription-table-row"
        headClassName="subscription-table-head"
        stateClassName="subscription-table-state"
        bodyClassName="subscription-table-body"
        columns={['Plan Name', 'Price', 'Max Staff Accounts', 'Max Job Postings', 'Status', 'Actions']}
        toolbar={(
          <div className="subscription-table-toolbar">
            <label>
              <i className="fa-solid fa-arrow-up-wide-short"></i>
              <span>Sort by</span>
              <ScrollableSelect
                className="subscription-sort-select"
                ariaLabel="Sort subscription plans"
                value={ctrl.planSort}
                options={[
                  { value: 'price-asc', label: 'Price: Low to High' },
                  { value: 'price-desc', label: 'Price: High to Low' },
                  { value: 'newest', label: 'Time: Newest First' },
                  { value: 'oldest', label: 'Time: Oldest First' },
                ]}
                onChange={(nextValue) => {
                  ctrl.setPlanSort(nextValue as PlanSortOption)
                  ctrl.setPlanPage(1)
                }}
              />
            </label>
          </div>
        )}
        isLoading={ctrl.isLoadingPlans}
        error={ctrl.planListError}
        empty={ctrl.plans.length === 0}
        loadingMessage="Loading subscription plans..."
        emptyMessage="No subscription plans found."
        pagination={{
          label: `Showing ${ctrl.visiblePlanStart}-${ctrl.visiblePlanEnd} of ${ctrl.planTotalElements} Plan${ctrl.planTotalElements === 1 ? '' : 's'}`,
          currentPage: ctrl.planPage,
          pageCount: ctrl.planPageCount,
          pageItems: ctrl.planPageItems,
          onPageChange: ctrl.setPlanPage,
          ellipsisKeyPrefix: 'plan',
        }}
      >
        {ctrl.pagedPlans.map((plan) => {
          const isActive = plan.status.toLowerCase() === 'active'
          const tenantCount = ctrl.planTenantCounts[plan.id] ?? 0
          const deleteTooltip = ctrl.getPlanDeleteTooltip(tenantCount)

          return (
            <div
              className={`subscription-table-row subscription-table-data-row ${isActive ? '' : 'inactive-plan-row'}`}
              key={plan.id}
              role="button"
              tabIndex={0}
              onClick={() => ctrl.openPlanDetail(plan.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  ctrl.openPlanDetail(plan.id)
                }
              }}
            >
              <span className="table-name-tooltip" data-tooltip={plan.name} title={plan.name} tabIndex={0}>
                <strong>{plan.name}</strong>
              </span>
              <span className="subscription-price-cell">{plan.priceLabel || `$${formatCurrencyInput((plan.price ?? plan.monthlyPrice).toFixed(2))} /month`}</span>
              <span>{plan.staffAccountUnlimited ? 'Unlimited' : `${plan.maxStaffAccount} Accounts`}</span>
              <span>{plan.activeJobPostingUnlimited ? 'Unlimited' : `${plan.maxActiveJobPosting} Active`}</span>
              <em className={isActive ? 'active' : 'inactive'}>{isActive ? 'Active' : 'Inactive'}</em>
              <span className="subscription-table-actions">
                <button
                  type="button"
                  className="icon-tooltip"
                  aria-label={`Edit ${plan.name}`}
                  data-tooltip="Edit"
                  onClick={(event) => {
                    event.stopPropagation()
                    ctrl.openPlanEdit(plan.id)
                  }}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  className="icon-tooltip subscription-delete-action"
                  aria-label={`Delete ${plan.name}`}
                  data-tooltip={deleteTooltip}
                  title={tenantCount > 0 ? deleteTooltip : undefined}
                  disabled={ctrl.isDeletingPlan || tenantCount > 0}
                  onClick={(event) => {
                    event.stopPropagation()
                    ctrl.requestDeletePlan(plan)
                  }}
                >
                  <TrashIcon />
                </button>
              </span>
            </div>
          )
        })}
      </ListTable>

      {ctrl.deletePlanTarget && (
        <ConfirmActionModal
          isSubmitting={ctrl.isDeletingPlan}
          title="Confirm Action"
          message={(
            <>
              Are you sure you want to delete <span className="tenant-confirm-target-name">{ctrl.deletePlanTarget.name}</span>?
              <br />
              This action cannot be undone.
            </>
          )}
          cancelLabel="Cancel"
          confirmLabel="Delete"
          submittingLabel="Deleting..."
          onCancel={() => {
            if (!ctrl.isDeletingPlan) ctrl.setDeletePlanTarget(null)
          }}
          onConfirm={ctrl.confirmDeletePlan}
        />
      )}
    </div>
  )
}
