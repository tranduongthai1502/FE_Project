import type { TenantManagementController } from '@/features/admin/application/hooks/useTenantManagementController'
import { getRemainingLabel } from '@/features/admin/application/helpers/tenantDisplayUtils'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { ScrollableSelect } from '@/core/components/ScrollableSelect'
import styles from '../../pages/TenantManagementView.module.css'

export function TenantDetailView({
  ctrl,
  onHome,
}: {
  ctrl: TenantManagementController
  onHome: () => void
}) {
  return (
    <div className="role-content tenant-detail-content">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: onHome },
          { label: 'Tenant Management', onClick: ctrl.closeTenantDetail },
          { label: 'Tenant detail' },
        ]}
      />

      {ctrl.isLoadingTenants || ctrl.isLoadingTenantDetail ? (
        <div className="tenant-list-table-state">Loading tenant details...</div>
      ) : ctrl.tenantDetailError || ctrl.tenantListError ? (
        <div className="tenant-list-table-state error">{ctrl.tenantDetailError || ctrl.tenantListError}</div>
      ) : !ctrl.selectedTenant ? (
        <div className="tenant-list-table-state">Tenant not found.</div>
      ) : (
        <>
          <div className="tenant-detail-title-row">
            <div>
              <h1>{ctrl.selectedTenant.name}</h1>
              <em className={ctrl.tenantStatus.className}>{ctrl.tenantStatus.label}</em>
            </div>
            <div className="tenant-detail-actions">
              <button
                type="button"
                className="tenant-detail-delete-button icon-tooltip"
                data-tooltip={ctrl.isTenantActive(ctrl.selectedTenant) ? 'Deactivate this tenant before deleting it.' : 'Delete'}
                title={ctrl.isTenantActive(ctrl.selectedTenant) ? 'Deactivate this tenant before deleting it.' : undefined}
                onClick={() => ctrl.requestDeleteTenant(ctrl.selectedTenant!)}
                disabled={ctrl.isDeletingTenant || ctrl.isTenantActive(ctrl.selectedTenant)}
              >
                Delete
              </button>
              <button
                type="button"
                className={ctrl.statusActionClassName}
                onClick={() => ctrl.setIsStatusConfirmOpen(true)}
                disabled={ctrl.isUpdatingTenantStatus}
              >
                {ctrl.statusActionLabel}
              </button>
            </div>
          </div>

          <div className="tenant-detail-grid">
            <section className="tenant-detail-card tenant-company-card">
              <header>
                <span><i className="fa-regular fa-building"></i></span>
                <h2>Company Information</h2>
              </header>
              <div className="tenant-detail-info-grid">
                <div><small>Company Name</small><strong className="tenant-company-name-value">{ctrl.selectedTenant.name}</strong></div>
                <div><small>Domain</small><strong className="tenant-domain-link">{ctrl.tenantDomain} <i className="fa-solid fa-arrow-up-right-from-square"></i></strong></div>
                <div><small>Industry</small><strong>{ctrl.tenantIndustry}</strong></div>
                <div><small>Company Size</small><strong><i className="fa-solid fa-users"></i> {ctrl.quotaLabel} Employees</strong></div>
                <div><small>Created Date</small><strong>{ctrl.tenantCreatedDate}</strong></div>
                <div><small>Region</small><strong>{ctrl.tenantRegion}</strong></div>
              </div>
            </section>

            <section className="tenant-detail-card tenant-resource-card">
              <header>
                <span><i className="fa-regular fa-chart-bar"></i></span>
                <h2>Resource Usage</h2>
              </header>
              <div className="tenant-resource-list">
                <article>
                  <div>
                    <span>Staff Accounts</span>
                    <strong>{ctrl.hasUnlimitedStaffQuota ? `${ctrl.staffUsed} / Unlimited` : `${ctrl.staffUsed} / ${ctrl.staffLimit}`}</strong>
                  </div>
                  <i className="tenant-resource-bar staff"><b style={{ width: `${ctrl.hasUnlimitedStaffQuota ? 100 : ctrl.staffUsagePercent}%` }} /></i>
                  <small>{getRemainingLabel(ctrl.staffLimit - ctrl.staffUsed, 'seats', ctrl.hasUnlimitedStaffQuota)}</small>
                </article>
                <article>
                  <div>
                    <span>Active Job Postings</span>
                    <strong>{ctrl.hasUnlimitedJobQuota ? `${ctrl.activeJobPostingUsed} / Unlimited` : `${ctrl.activeJobPostingUsed} / ${ctrl.jobLimit}`}</strong>
                  </div>
                  <i className="tenant-resource-bar jobs"><b style={{ width: `${ctrl.hasUnlimitedJobQuota ? 100 : ctrl.jobUsagePercent}%` }} /></i>
                  <small>{ctrl.hasUnlimitedJobQuota ? 'Unlimited slots available' : `${Math.max(0, ctrl.jobLimit - ctrl.activeJobPostingUsed)} slots remaining`}</small>
                </article>
              </div>
            </section>

            <section className="tenant-detail-card tenant-subscription-card">
              <header>
                <span><i className="fa-regular fa-id-badge"></i></span>
                <div className="tenant-plan-title-stack">
                  <h2>Subscription Plan</h2>
                  <strong>{ctrl.activeSubscriptionPlan?.name || ctrl.selectedTenant.subscriptionPlan || '-'}</strong>
                </div>
                <ScrollableSelect
                  className="tenant-plan-picker"
                  ariaLabel="Select subscription plan"
                  value={ctrl.pendingTenantPlanId}
                  disabled={ctrl.isUpdatingTenantPlan || ctrl.subscriptionPlans.length === 0}
                  placeholder="Select plan"
                  options={ctrl.subscriptionPlans
                    .filter((plan) => plan.status.toLowerCase() === 'active')
                    .map((plan) => ({ value: plan.id, label: plan.name }))}
                  onChange={(nextValue) => ctrl.setPendingTenantPlanId(nextValue)}
                />
                <button type="button" onClick={ctrl.requestChangeTenantPlan} disabled={!ctrl.hasSelectedDifferentPlan || ctrl.isUpdatingTenantPlan}>
                  Change Plan
                </button>
              </header>
              <div className="tenant-subscription-metrics">
                <div><small>Monthly Billing</small><strong>{ctrl.monthlyBillingLabel}</strong></div>
                <div><small>Days Remaining</small><strong><i className="fa-regular fa-calendar-check"></i> {ctrl.daysRemainingLabel}</strong></div>
              </div>
              <div className="tenant-subscription-lines">
                <span>Start Date <strong>{ctrl.tenantStartDate}</strong></span>
                <span>Expiration Date <strong>{ctrl.tenantExpirationDate}</strong></span>
              </div>
            </section>

            <section className={`tenant-detail-card ${styles.tenantAdminCard}`}>
              <header>
                <span><i className="fa-regular fa-calendar-check"></i></span>
                <h2>Tenant Admin</h2>
              </header>
              <div className={styles.tenantAdminLayout}>
                <div className={styles.tenantAdminAvatar}><i className="fa-regular fa-user"></i></div>
                <div><small>Full Name</small><strong>{ctrl.tenantAdminFullName}</strong></div>
                <div><small>Email Address</small><strong>{ctrl.tenantAdminEmail}</strong></div>
                <div><small>Current Status</small><em className={styles[ctrl.tenantAdminStatusMeta.className]}>{ctrl.tenantAdminStatusMeta.label}</em></div>
                <div><small>Activated Date</small><strong>{ctrl.tenantAdminActivatedDate}</strong></div>
              </div>
            </section>
          </div>

          {ctrl.isStatusConfirmOpen && (
            <ConfirmActionModal
              isSubmitting={ctrl.isUpdatingTenantStatus}
              title="Confirm Action"
              message={ctrl.statusActionMessage}
              cancelLabel="Cancel"
              confirmLabel="Confirm"
              submittingLabel={ctrl.statusActionSubmittingLabel}
              onCancel={() => ctrl.setIsStatusConfirmOpen(false)}
              onConfirm={ctrl.confirmUpdateTenantStatus}
            />
          )}

          {ctrl.isPlanConfirmOpen && (
            <ConfirmActionModal
              isSubmitting={ctrl.isUpdatingTenantPlan}
              title="Confirm Action"
              message={`Are you sure you want to change the subscription plan for ${ctrl.selectedTenant.name} to ${ctrl.activeSubscriptionPlan?.name || 'the selected plan'}?`}
              cancelLabel="Cancel"
              confirmLabel="Confirm"
              submittingLabel="Updating..."
              onCancel={() => {
                if (!ctrl.isUpdatingTenantPlan) ctrl.setIsPlanConfirmOpen(false)
              }}
              onConfirm={ctrl.confirmUpdateTenantPlan}
            />
          )}

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
        </>
      )}
    </div>
  )
}
