import type { SubscriptionPlan } from '@/features/admin/domain/adminApi.types'
import {
  billingCycleOptions,
  planDescriptionMaxLength,
  planNumberFieldMaxLength,
} from '@/features/admin/application/hooks/useCreatePlanController'
import { useEditPlanDetailController } from '@/features/admin/application/hooks/useEditPlanDetailController'
import { formatPlanDate } from '@/features/admin/application/helpers/adminFormatters'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { formatCurrencyInput } from '@/core/utils/currencyFormat'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'

export function EditPlanDetailView({
  plan,
  onBack,
  onHome,
  onPlans,
  onSaved,
  existingPlans,
  assignedTenantCount,
  activeAssignedTenantCount,
  triggerToast,
}: {
  plan: SubscriptionPlan
  onBack: () => void
  onHome: () => void
  onPlans: () => void
  onSaved: () => void
  existingPlans: SubscriptionPlan[]
  assignedTenantCount: number
  activeAssignedTenantCount: number
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const ctrl = useEditPlanDetailController({
    plan,
    onBack,
    onHome,
    onPlans,
    onSaved,
    existingPlans,
    assignedTenantCount,
    activeAssignedTenantCount,
    triggerToast,
  })

  return (
    <form className="role-content edit-plan-content" onSubmit={ctrl.handleSavePlan} noValidate>
      <Breadcrumb
        className="create-plan-breadcrumb"
        items={[
          { label: 'Home', onClick: ctrl.onHome },
          { label: 'Subscription Plans', onClick: ctrl.onPlans },
          { label: 'Plan Detail', onClick: ctrl.onBack },
          { label: 'Edit Plan' },
        ]}
      />

      <div className="edit-plan-layout">
        <div className="edit-plan-main">
          <section className="create-plan-card edit-plan-card">
            <h2><i className="fa-solid fa-list-check"></i> General Configuration</h2>
            <div className="create-plan-divider" />
            <div className="edit-plan-general-grid">
              <label>
                <span>Plan Name</span>
                <input
                  className={ctrl.fieldErrors.planName ? 'has-error' : ''}
                  value={ctrl.planName}
                  onChange={(event) => {
                    ctrl.updateLimitedPlanField('planName', event.target.value, FIELD_LENGTH_LIMITS.defaultText, 'Plan name', ctrl.setPlanName)
                  }}
                  required
                />
                {ctrl.fieldErrors.planName && <small className="create-plan-field-error">{ctrl.fieldErrors.planName}</small>}
              </label>
              <label>
                <span>Short Description</span>
                <input
                  className={ctrl.fieldErrors.description ? 'has-error' : ''}
                  value={ctrl.description}
                  onChange={(event) => {
                    ctrl.updateLimitedPlanField('description', event.target.value, planDescriptionMaxLength, 'Description', ctrl.setDescription)
                  }}
                  required
                />
                {ctrl.fieldErrors.description && <small className="create-plan-field-error">{ctrl.fieldErrors.description}</small>}
              </label>
              <div className="edit-price-status-row">
                <label>
                  <span>Price</span>
                  <div className="plan-price-row">
                    <select
                      value={ctrl.billingCycle}
                      onChange={(event) => ctrl.setBillingCycle(event.target.value)}
                      aria-label="Billing cycle"
                    >
                      {billingCycleOptions.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className={`price-input edit-monthly-price-input ${ctrl.fieldErrors.monthlyPrice ? 'has-error' : ''}`}>
                      <span>$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={ctrl.monthlyPrice}
                        onChange={(event) => {
                          ctrl.updateLimitedPlanField('monthlyPrice', event.target.value, planNumberFieldMaxLength, 'Price', ctrl.setMonthlyPrice, formatCurrencyInput)
                        }}
                        required
                      />
                    </div>
                  </div>
                  {ctrl.fieldErrors.monthlyPrice && <small className="create-plan-field-error">{ctrl.fieldErrors.monthlyPrice}</small>}
                </label>
                <button type="button" className={`mini-toggle ${ctrl.isActive ? 'active' : ''}`} onClick={ctrl.handleActiveStatusToggle} aria-pressed={ctrl.isActive}>
                  <span />
                </button>
                <strong>Active Status</strong>
              </div>
            </div>
          </section>

          <section className="create-plan-card edit-plan-card">
            <h2><i className="fa-solid fa-chart-simple"></i> Resource Limits</h2>
            <div className="create-plan-divider" />
            <div className="edit-resource-list">
              <article>
                <i className="fa-solid fa-id-card-clip"></i>
                <div>
                  <strong>Max Staff Accounts</strong>
                  <p>Number of administrative users allowed</p>
                </div>
                {ctrl.isStaffUnlimited ? (
                  <span className="edit-resource-limit-placeholder" aria-hidden="true" />
                ) : (
                  <input
                    className={ctrl.fieldErrors.maxStaffAccount ? 'has-error' : ''}
                    type="number"
                    min="0"
                    value={ctrl.maxStaffAccount}
                    onChange={(event) => {
                      ctrl.updateLimitedPlanField('maxStaffAccount', event.target.value, planNumberFieldMaxLength, 'Max staff accounts', ctrl.setMaxStaffAccount)
                    }}
                  />
                )}
                <button
                  type="button"
                  className={`mini-toggle ${ctrl.isStaffUnlimited ? 'active' : ''}`}
                  onClick={() => {
                    ctrl.setIsStaffUnlimited((value) => !value)
                    if (ctrl.fieldErrors.maxStaffAccount) ctrl.setFieldErrors((current) => ({ ...current, maxStaffAccount: '' }))
                  }}
                  aria-pressed={ctrl.isStaffUnlimited}
                >
                  <span />
                </button>
                <em>Unlimited</em>
                {ctrl.fieldErrors.maxStaffAccount && <small className="create-plan-field-error edit-resource-error">{ctrl.fieldErrors.maxStaffAccount}</small>}
              </article>
              <article>
                <i className="fa-solid fa-briefcase"></i>
                <div>
                  <strong>Max Active Job Postings</strong>
                  <p>Concurrent open roles allowed per tenant</p>
                </div>
                {ctrl.isJobsUnlimited ? (
                  <span className="edit-resource-limit-placeholder" aria-hidden="true" />
                ) : (
                  <input
                    className={ctrl.fieldErrors.maxActiveJobPosting ? 'has-error' : ''}
                    type="number"
                    min="0"
                    value={ctrl.maxActiveJobPosting}
                    onChange={(event) => {
                      ctrl.updateLimitedPlanField('maxActiveJobPosting', event.target.value, planNumberFieldMaxLength, 'Max active job postings', ctrl.setMaxActiveJobPosting)
                    }}
                  />
                )}
                <button
                  type="button"
                  className={`mini-toggle ${ctrl.isJobsUnlimited ? 'active' : ''}`}
                  onClick={() => {
                    ctrl.setIsJobsUnlimited((value) => !value)
                    if (ctrl.fieldErrors.maxActiveJobPosting) ctrl.setFieldErrors((current) => ({ ...current, maxActiveJobPosting: '' }))
                  }}
                  aria-pressed={ctrl.isJobsUnlimited}
                >
                  <span />
                </button>
                <em>Unlimited</em>
                {ctrl.fieldErrors.maxActiveJobPosting && <small className="create-plan-field-error edit-resource-error">{ctrl.fieldErrors.maxActiveJobPosting}</small>}
              </article>
            </div>
          </section>
        </div>

        <section className="create-plan-card edit-plan-card edit-feature-panel">
          <h2><i className="fa-solid fa-bolt"></i> Plan Features <small>AI ENABLED</small></h2>
          <div className="create-plan-divider" />
          <div className="edit-feature-list">
            {ctrl.features.map((feature) => (
              <article key={feature.key}>
                <span><i className={`fa-solid ${feature.icon}`}></i>{feature.title}</span>
                <button type="button" className={`feature-toggle ${feature.enabled ? 'active' : ''}`} onClick={() => ctrl.toggleFeature(feature.key)} aria-pressed={feature.enabled} aria-label={`Toggle ${feature.title}`}>
                  <span />
                </button>
              </article>
            ))}
          </div>
          {ctrl.planError && <p className="create-plan-error feature-permission-error">{ctrl.planError}</p>}
        </section>
      </div>

      <footer className="create-plan-actions edit-plan-actions">
        <p><i className="fa-solid fa-circle-info"></i> Last modified by Super Admin on {formatPlanDate(ctrl.plan.createdAt) || 'Oct 24, 2023'}</p>
        <button type="button" onClick={ctrl.handleCancelEditPlan} disabled={ctrl.isSavingPlan}>Cancel</button>
        <button type="submit" disabled={ctrl.isSavingPlan}>{ctrl.isSavingPlan ? 'Saving...' : 'Save Changes'}</button>
      </footer>

      {ctrl.isCancelConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={false}
          title="Confirm Action"
          message="Are you sure you want to cancel? Your changes will not be saved."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => ctrl.setIsCancelConfirmOpen(false)}
          onConfirm={ctrl.onBack}
        />
      )}

      {ctrl.isSaveConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={ctrl.isSavingPlan}
          title="Confirm Action"
          message="Tenants currently in a paid billing cycle will keep their existing pricing and resource limits until their next renewal; the changes will apply starting each tenant's next cycle."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => {
            if (!ctrl.isSavingPlan) ctrl.setIsSaveConfirmOpen(false)
          }}
          onConfirm={ctrl.confirmSavePlan}
        />
      )}

      {ctrl.isRetireConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={false}
          title="Confirm Action"
          message={`This plan still has ${ctrl.activeTenantLabel}. Retiring this plan will not remove them from the plan, but new tenants will no longer be able to subscribe to it.`}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => ctrl.setIsRetireConfirmOpen(false)}
          onConfirm={() => {
            ctrl.setIsActive(false)
            ctrl.setIsRetireConfirmOpen(false)
          }}
        />
      )}
    </form>
  )
}
