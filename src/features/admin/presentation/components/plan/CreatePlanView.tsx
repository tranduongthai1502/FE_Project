import {
  billingCycleOptions,
  planDescriptionMaxLength,
  planNumberFieldMaxLength,
  useCreatePlanController,
} from '@/features/admin/application/hooks/useCreatePlanController'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { formatCurrencyInput } from '@/core/utils/currencyFormat'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'

export function CreatePlanView({
  onBack,
  onHome,
  onCreated,
  triggerToast,
}: {
  onBack: () => void
  onHome: () => void
  onCreated: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const ctrl = useCreatePlanController({
    onBack,
    onHome,
    onCreated,
    triggerToast,
  })

  return (
    <form className="role-content create-plan-content" onSubmit={ctrl.handleCreatePlan} noValidate>
      <Breadcrumb
        className="create-plan-breadcrumb"
        items={[
          { label: 'Home', onClick: ctrl.onHome },
          { label: 'Subscription Plans', onClick: ctrl.onBack },
          { label: 'Create New Plan' },
        ]}
      />

      <header className="create-plan-title">
        <h1>Create New Plan</h1>
        <p>Configure a new subscription tier and define its features and limitations to match specific enterprise requirements.</p>
      </header>

      <section className="create-plan-card">
        <h2><i className="fa-regular fa-file-lines"></i> Plan Details</h2>
        <div className="create-plan-divider" />

        <div className="create-plan-details-grid">
          <label>
            <span>Plan Name <span className="required-mark">*</span></span>
            <input
              className={ctrl.fieldErrors.planName ? 'has-error' : ''}
              value={ctrl.planName}
              onChange={(event) => {
                ctrl.updateLimitedPlanField('planName', event.target.value, FIELD_LENGTH_LIMITS.defaultText, 'Plan name', ctrl.setPlanName)
              }}
              onBlur={() => ctrl.validatePlanField('planName')}
              placeholder="Plan Name"
              required
            />
            {ctrl.fieldErrors.planName && <small className="create-plan-field-error">{ctrl.fieldErrors.planName}</small>}
          </label>

          <label>
            <span>Price <span className="required-mark">*</span></span>
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
              <div className={`price-input ${ctrl.fieldErrors.monthlyPrice ? 'has-error' : ''}`}>
                <span>$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={ctrl.monthlyPrice}
                  onChange={(event) => {
                    ctrl.updateLimitedPlanField('monthlyPrice', event.target.value, planNumberFieldMaxLength, 'Price', ctrl.setMonthlyPrice, formatCurrencyInput)
                  }}
                  onBlur={() => ctrl.validatePlanField('monthlyPrice')}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            {ctrl.fieldErrors.monthlyPrice && <small className="create-plan-field-error">{ctrl.fieldErrors.monthlyPrice}</small>}
          </label>

          <label className="description-field">
            <span>Short Description <span className="required-mark">*</span></span>
            <textarea
              className={ctrl.fieldErrors.description ? 'has-error' : ''}
              value={ctrl.description}
              onChange={(event) => {
                ctrl.updateLimitedPlanField('description', event.target.value, planDescriptionMaxLength, 'Description', ctrl.setDescription)
              }}
              onBlur={() => ctrl.validatePlanField('description')}
              placeholder="Short Description"
              required
            />
            {ctrl.fieldErrors.description && <small className="create-plan-field-error">{ctrl.fieldErrors.description}</small>}
          </label>

          <div className="limit-fields">
            <label>
              <span>Max Staff Accounts <span className="required-mark">*</span></span>
              <div className={`limit-input ${ctrl.isStaffUnlimited ? 'unlimited-selected' : ''} ${ctrl.fieldErrors.maxStaffAccount ? 'has-error' : ''}`}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={ctrl.maxStaffAccount}
                  onChange={(event) => {
                    ctrl.updateLimitedPlanField('maxStaffAccount', event.target.value, planNumberFieldMaxLength, 'Max staff accounts', ctrl.setMaxStaffAccount)
                  }}
                  onBlur={() => ctrl.validatePlanField('maxStaffAccount')}
                  placeholder="0"
                  disabled={ctrl.isStaffUnlimited}
                  required={!ctrl.isStaffUnlimited}
                />
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
              </div>
              {ctrl.fieldErrors.maxStaffAccount && <small className="create-plan-field-error">{ctrl.fieldErrors.maxStaffAccount}</small>}
            </label>

            <label>
              <span>Max Active Job Postings <span className="required-mark">*</span></span>
              <div className={`limit-input ${ctrl.isJobsUnlimited ? 'unlimited-selected' : ''} ${ctrl.fieldErrors.maxActiveJobPosting ? 'has-error' : ''}`}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={ctrl.maxActiveJobPosting}
                  onChange={(event) => {
                    ctrl.updateLimitedPlanField('maxActiveJobPosting', event.target.value, planNumberFieldMaxLength, 'Max active job postings', ctrl.setMaxActiveJobPosting)
                  }}
                  onBlur={() => ctrl.validatePlanField('maxActiveJobPosting')}
                  placeholder="0"
                  disabled={ctrl.isJobsUnlimited}
                  required={!ctrl.isJobsUnlimited}
                />
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
              </div>
              {ctrl.fieldErrors.maxActiveJobPosting && <small className="create-plan-field-error">{ctrl.fieldErrors.maxActiveJobPosting}</small>}
            </label>
          </div>
        </div>
      </section>

      <section className="create-plan-card">
        <h2><i className="fa-solid fa-wand-magic-sparkles"></i> Feature Permissions</h2>
        <div className="create-plan-divider" />

        <div className="feature-permission-grid">
          {ctrl.features.map((feature) => (
            <article className="feature-permission-card" key={feature.key}>
              <div className="feature-icon"><i className={`fa-solid ${feature.icon}`}></i></div>
              <button
                type="button"
                className={`feature-toggle ${feature.enabled ? 'active' : ''}`}
                onClick={() => ctrl.toggleFeature(feature.key)}
                aria-pressed={feature.enabled}
                aria-label={`Toggle ${feature.title}`}
              >
                <span />
              </button>
              <strong>{feature.title}</strong>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
        {ctrl.planError && <p className="create-plan-error feature-permission-error">{ctrl.planError}</p>}
      </section>

      <footer className="create-plan-actions">
        <button type="button" onClick={ctrl.handleCancelCreatePlan} disabled={ctrl.isSavingPlan}>Cancel</button>
        <button type="submit" disabled={ctrl.isSavingPlan}>{ctrl.isSavingPlan ? 'Saving...' : 'Save'}</button>
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
    </form>
  )
}
