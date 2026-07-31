import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_LIST_PAGE_SIZE, adminApi } from '../../infrastructure/adminApi'
import type { CreatePlanPayload, PlanDashboardStats, SubscriptionPlan, Tenant, UpdatePlanPayload } from '@/core/api/api.types'
import {
  buildPlanListParams,
  buildTopTierPlanParams,
  formatStatNumber,
  getHighestPricedActivePlan,
  getPlanFeatureState,
  getSubscriptionPlanFieldErrors,
  getSubscriptionPlanUsagePercent,
  getTenantJobUsage,
  hasDuplicatePlanName,
  hasFeatureChanges,
  isActiveSubscriptionPlan,
  planFeatureDefaults,
  sortSubscriptionPlans,
  type CreatePlanFieldErrors,
  type PlanSortOption,
} from '../../infrastructure/subscriptionPlansService'
import { getErrorMessage as getAdminErrorMessage } from '@/core/errors/errorMessages'
import { formatFeatureLabel, formatPlanDate } from '../../application/adminFormatters'
import { getSubscriptionPlanCreatePath, getSubscriptionPlanDetailPath, getSubscriptionPlanEditPath, getSubscriptionPlanIdFromUrl, getSuperAdminViewPath, isSubscriptionPlanCreateUrl, isSubscriptionPlanEditUrl } from '@/features/admin/domain/superAdminRouteHelpers'
import { ConfirmActionModal } from '@/core/components/common/ConfirmActionModal'
import { Breadcrumb } from '@/core/components/common/Breadcrumb'
import { MetricCard } from '@/core/components/common/MetricCard'
import { ScrollableSelect } from '@/core/components/common/ScrollableSelect'
import { getCompactPageItems, getListPageCount, getListTotalElements } from '@/core/utils/pagination'
import { formatCurrencyInput, parseCurrencyInput } from '@/core/utils/currencyFormat'
import {
  FIELD_LENGTH_LIMITS,
  validatePositiveNumberOrUnlimited,
  validateRequiredPlanName,
  validateRequiredPrice,
  validateRequiredShortDescription,
  validationErrorMessages,
} from '@/core/api/axiosErrorHandler'

const planNumberFieldMaxLength = 50
const planDescriptionMaxLength = 500
const billingCycleOptions = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'SIX_MONTHLY', label: '6 Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
]

function getPlanMaxLengthMessage(label: string, maxLength: number) {
  return `${label} must be ${maxLength} characters or less.`
}

function isPlanMaxLengthError(message?: string) {
  return Boolean(message?.includes('characters or less.'))
}

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

function CreatePlanView({
  onBack,
  onHome,
  onCreated,
  existingPlans,
  triggerToast,
}: {
  onBack: () => void
  onHome: () => void
  onCreated: () => void
  existingPlans: SubscriptionPlan[]
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const [planName, setPlanName] = useState('')
  const [description, setDescription] = useState('')
  const [billingCycle, setBillingCycle] = useState('MONTHLY')
  const [monthlyPrice, setMonthlyPrice] = useState('')
  const [maxStaffAccount, setMaxStaffAccount] = useState('')
  const [maxActiveJobPosting, setMaxActiveJobPosting] = useState('')
  const [features, setFeatures] = useState(planFeatureDefaults)
  const [isStaffUnlimited, setIsStaffUnlimited] = useState(false)
  const [isJobsUnlimited, setIsJobsUnlimited] = useState(false)
  const [planError, setPlanError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<CreatePlanFieldErrors>({})
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  const updateLimitedPlanField = (
    field: keyof CreatePlanFieldErrors,
    value: string,
    maxLength: number,
    label: string,
    setter: (nextValue: string) => void,
    formatter?: (nextValue: string) => string,
  ) => {
    const isOverMaxLength = value.length > maxLength
    const nextValue = isOverMaxLength ? value.slice(0, maxLength) : value
    setter(formatter ? formatter(nextValue) : nextValue)
    setFieldErrors((current) => {
      if (isOverMaxLength) {
        return {
          ...current,
          [field]: getPlanMaxLengthMessage(label, maxLength),
        }
      }
      if (!current[field]) return current
      return { ...current, [field]: '' }
    })
  }

  const toggleFeature = (key: string) => {
    setFeatures((current) => current.map((feature) => (
      feature.key === key ? { ...feature, enabled: !feature.enabled } : feature
    )))
    if (planError === 'Please enable at least one feature for this plan.') {
      setPlanError('')
    }
  }

  const handleCreatePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPlanError('')
    const nextFieldErrors: CreatePlanFieldErrors = {}
    const planDetailsAreEmpty = !planName.trim() &&
      !description.trim() &&
      !monthlyPrice.trim() &&
      !maxStaffAccount.trim() &&
      !maxActiveJobPosting.trim() &&
      !isStaffUnlimited &&
      !isJobsUnlimited

    if (planDetailsAreEmpty) {
      setFieldErrors({
        planName: validationErrorMessages.planNameRequired,
        description: validationErrorMessages.shortDescriptionRequired,
        monthlyPrice: validationErrorMessages.validPriceRequired,
        maxStaffAccount: validationErrorMessages.positiveNumberOrUnlimitedRequired,
        maxActiveJobPosting: validationErrorMessages.positiveNumberOrUnlimitedRequired,
      })
      return
    }

    const planNameError = validateRequiredPlanName(planName, hasDuplicatePlanName(existingPlans, planName))
    if (planNameError) nextFieldErrors.planName = planNameError

    const descriptionError = validateRequiredShortDescription(description)
    if (descriptionError) nextFieldErrors.description = descriptionError

    const monthlyPriceError = validateRequiredPrice(monthlyPrice)
    if (monthlyPriceError) nextFieldErrors.monthlyPrice = monthlyPriceError

    const staffLimitError = validatePositiveNumberOrUnlimited(maxStaffAccount, isStaffUnlimited)
    if (staffLimitError) nextFieldErrors.maxStaffAccount = staffLimitError

    const jobLimitError = validatePositiveNumberOrUnlimited(maxActiveJobPosting, isJobsUnlimited)
    if (jobLimitError) nextFieldErrors.maxActiveJobPosting = jobLimitError

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    if (!features.some((feature) => feature.enabled)) {
      const message = 'Please enable at least one feature for this plan.'
      setPlanError(message)
      return
    }

    await confirmCreatePlan()
  }

  const confirmCreatePlan = async () => {
    const payload: CreatePlanPayload = {
      "name": planName,
      "description": description,
      "billingCycle": billingCycle,
      "price": parseCurrencyInput(monthlyPrice),
      "maxStaffAccount": isStaffUnlimited ? null : Number(maxStaffAccount || 0),
      "staffAccountUnlimited": isStaffUnlimited,
      "maxActiveJobPosting": isJobsUnlimited ? null : Number(maxActiveJobPosting || 0),
      "activeJobPostingUnlimited": isJobsUnlimited,
      "status": 'ACTIVE',
      "features": features.map((feature) => ({
        "key": feature.code,
        "status": feature.enabled ? 'ACTIVE' : 'INACTIVE',
      })),
    }

    setIsSavingPlan(true)
    try {
      await adminApi.createPlan(payload)
      triggerToast?.('Subscription plan created successfully', 'success')
      onCreated()
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Failed to create subscription plan.')
      const nextFieldErrors = getSubscriptionPlanFieldErrors(error, message)
      setFieldErrors(nextFieldErrors)
      setPlanError(Object.keys(nextFieldErrors).length > 0 ? '' : message)
    } finally {
      setIsSavingPlan(false)
    }
  }

  const hasDraftChanges = Boolean(
    planName.trim() ||
    description.trim() ||
    billingCycle !== 'MONTHLY' ||
    monthlyPrice.trim() ||
    maxStaffAccount.trim() ||
    maxActiveJobPosting.trim() ||
    isStaffUnlimited ||
    isJobsUnlimited ||
    hasFeatureChanges(features),
  )

  const handleCancelCreatePlan = () => {
    if (isSavingPlan) return
    if (hasDraftChanges) {
      setIsCancelConfirmOpen(true)
      return
    }

    onBack()
  }

  return (
    <form className="role-content create-plan-content" onSubmit={handleCreatePlan} noValidate>
      <Breadcrumb
        className="create-plan-breadcrumb"
        items={[
          { label: 'Home', onClick: onHome },
          { label: 'Subscription Plans', onClick: onBack },
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
                className={fieldErrors.planName ? 'has-error' : ''}
                value={planName}
                onChange={(event) => {
                  updateLimitedPlanField('planName', event.target.value, FIELD_LENGTH_LIMITS.defaultText, 'Plan name', setPlanName)
                }}
                placeholder="Plan Name"
                required
              />
            {fieldErrors.planName && <small className="create-plan-field-error">{fieldErrors.planName}</small>}
          </label>

          <label>
            <span>Price <span className="required-mark">*</span></span>
            <div className="plan-price-row">
              <select
                value={billingCycle}
                onChange={(event) => setBillingCycle(event.target.value)}
                aria-label="Billing cycle"
              >
                {billingCycleOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
              <div className={`price-input ${fieldErrors.monthlyPrice ? 'has-error' : ''}`}>
                <span>$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monthlyPrice}
                  onChange={(event) => {
                    updateLimitedPlanField('monthlyPrice', event.target.value, planNumberFieldMaxLength, 'Price', setMonthlyPrice, formatCurrencyInput)
                  }}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            {fieldErrors.monthlyPrice && <small className="create-plan-field-error">{fieldErrors.monthlyPrice}</small>}
          </label>

          <label className="description-field">
            <span>Short Description <span className="required-mark">*</span></span>
            <textarea
              className={fieldErrors.description ? 'has-error' : ''}
              value={description}
              onChange={(event) => {
                updateLimitedPlanField('description', event.target.value, planDescriptionMaxLength, 'Description', setDescription)
              }}
              placeholder="Short Description"
              required
            />
            {fieldErrors.description && <small className="create-plan-field-error">{fieldErrors.description}</small>}
          </label>

          <div className="limit-fields">
            <label>
              <span>Max Staff Accounts <span className="required-mark">*</span></span>
              <div className={`limit-input ${isStaffUnlimited ? 'unlimited-selected' : ''} ${fieldErrors.maxStaffAccount ? 'has-error' : ''}`}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={maxStaffAccount}
                  onChange={(event) => {
                    updateLimitedPlanField('maxStaffAccount', event.target.value, planNumberFieldMaxLength, 'Max staff accounts', setMaxStaffAccount)
                  }}
                  placeholder="0"
                  disabled={isStaffUnlimited}
                  required={!isStaffUnlimited}
                />
                <button
                  type="button"
                  className={`mini-toggle ${isStaffUnlimited ? 'active' : ''}`}
                  onClick={() => {
                    setIsStaffUnlimited((value) => !value)
                    if (fieldErrors.maxStaffAccount) setFieldErrors((current) => ({ ...current, maxStaffAccount: '' }))
                  }}
                  aria-pressed={isStaffUnlimited}
                >
                  <span />
                </button>
                <em>Unlimited</em>
              </div>
              {fieldErrors.maxStaffAccount && <small className="create-plan-field-error">{fieldErrors.maxStaffAccount}</small>}
            </label>

            <label>
              <span>Max Active Job Postings <span className="required-mark">*</span></span>
              <div className={`limit-input ${isJobsUnlimited ? 'unlimited-selected' : ''} ${fieldErrors.maxActiveJobPosting ? 'has-error' : ''}`}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={maxActiveJobPosting}
                  onChange={(event) => {
                    updateLimitedPlanField('maxActiveJobPosting', event.target.value, planNumberFieldMaxLength, 'Max active job postings', setMaxActiveJobPosting)
                  }}
                  placeholder="0"
                  disabled={isJobsUnlimited}
                  required={!isJobsUnlimited}
                />
                <button
                  type="button"
                  className={`mini-toggle ${isJobsUnlimited ? 'active' : ''}`}
                  onClick={() => {
                    setIsJobsUnlimited((value) => !value)
                    if (fieldErrors.maxActiveJobPosting) setFieldErrors((current) => ({ ...current, maxActiveJobPosting: '' }))
                  }}
                  aria-pressed={isJobsUnlimited}
                >
                  <span />
                </button>
                <em>Unlimited</em>
              </div>
              {fieldErrors.maxActiveJobPosting && <small className="create-plan-field-error">{fieldErrors.maxActiveJobPosting}</small>}
            </label>
          </div>
        </div>
      </section>

      <section className="create-plan-card">
        <h2><i className="fa-solid fa-wand-magic-sparkles"></i> Feature Permissions</h2>
        <div className="create-plan-divider" />

        <div className="feature-permission-grid">
          {features.map((feature) => (
            <article className="feature-permission-card" key={feature.key}>
              <div className="feature-icon"><i className={`fa-solid ${feature.icon}`}></i></div>
              <button
                type="button"
                className={`feature-toggle ${feature.enabled ? 'active' : ''}`}
                onClick={() => toggleFeature(feature.key)}
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
        {planError && <p className="create-plan-error feature-permission-error">{planError}</p>}
      </section>

      <footer className="create-plan-actions">
        <button type="button" onClick={handleCancelCreatePlan} disabled={isSavingPlan}>Cancel</button>
        <button type="submit" disabled={isSavingPlan}>{isSavingPlan ? 'Saving...' : 'Save'}</button>
      </footer>

      {isCancelConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={false}
          title="Confirm Action"
          message="Are you sure you want to cancel? Your changes will not be saved."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => setIsCancelConfirmOpen(false)}
          onConfirm={onBack}
        />
      )}
    </form>
  )
}

function EditPlanDetailView({
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
  const [planName, setPlanName] = useState(plan.name)
  const [description, setDescription] = useState(plan.description)
  const [billingCycle, setBillingCycle] = useState(plan.billingCycle || 'MONTHLY')
  const [monthlyPrice, setMonthlyPrice] = useState(formatCurrencyInput(plan.monthlyPrice.toFixed(2)))
  const [maxStaffAccount, setMaxStaffAccount] = useState(plan.maxStaffAccount == null ? '' : String(plan.maxStaffAccount))
  const [maxActiveJobPosting, setMaxActiveJobPosting] = useState(plan.maxActiveJobPosting == null ? '' : String(plan.maxActiveJobPosting))
  const [features, setFeatures] = useState(() => getPlanFeatureState(plan))
  const [isStaffUnlimited, setIsStaffUnlimited] = useState(plan.staffAccountUnlimited)
  const [isJobsUnlimited, setIsJobsUnlimited] = useState(plan.activeJobPostingUnlimited)
  const [isActive, setIsActive] = useState(plan.status.toLowerCase() === 'active')
  const [planError, setPlanError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<CreatePlanFieldErrors>({})
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false)
  const [isRetireConfirmOpen, setIsRetireConfirmOpen] = useState(false)

  const updateLimitedPlanField = (
    field: keyof CreatePlanFieldErrors,
    value: string,
    maxLength: number,
    label: string,
    setter: (nextValue: string) => void,
    formatter?: (nextValue: string) => string,
  ) => {
    const isOverMaxLength = value.length > maxLength
    const nextValue = isOverMaxLength ? value.slice(0, maxLength) : value
    setter(formatter ? formatter(nextValue) : nextValue)
    setFieldErrors((current) => {
      if (isOverMaxLength) {
        return {
          ...current,
          [field]: getPlanMaxLengthMessage(label, maxLength),
        }
      }
      if (!current[field]) return current
      return { ...current, [field]: '' }
    })
  }

  const toggleFeature = (key: string) => {
    setFeatures((current) => current.map((feature) => (
      feature.key === key ? { ...feature, enabled: !feature.enabled } : feature
    )))
    if (planError === 'Please enable at least one feature for this plan.') {
      setPlanError('')
    }
  }

  const handleSavePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPlanError('')
    const nextFieldErrors: CreatePlanFieldErrors = {}
    const generalConfigurationIsEmpty = !planName.trim() &&
      !description.trim() &&
      !monthlyPrice.trim()

    if (generalConfigurationIsEmpty) {
      setFieldErrors({
        planName: validationErrorMessages.planNameRequired,
        description: validationErrorMessages.shortDescriptionRequired,
      })
      return
    }

    const planNameError = validateRequiredPlanName(planName, hasDuplicatePlanName(existingPlans, planName, plan.id))
    if (planNameError) nextFieldErrors.planName = planNameError
    else if (isPlanMaxLengthError(fieldErrors.planName)) nextFieldErrors.planName = fieldErrors.planName

    const descriptionError = validateRequiredShortDescription(description)
    if (descriptionError) nextFieldErrors.description = descriptionError
    else if (isPlanMaxLengthError(fieldErrors.description)) nextFieldErrors.description = fieldErrors.description

    const monthlyPriceError = validateRequiredPrice(monthlyPrice)
    if (monthlyPriceError) nextFieldErrors.monthlyPrice = monthlyPriceError
    else if (isPlanMaxLengthError(fieldErrors.monthlyPrice)) nextFieldErrors.monthlyPrice = fieldErrors.monthlyPrice

    const staffLimitError = validatePositiveNumberOrUnlimited(maxStaffAccount, isStaffUnlimited)
    if (staffLimitError) nextFieldErrors.maxStaffAccount = staffLimitError
    else if (isPlanMaxLengthError(fieldErrors.maxStaffAccount)) nextFieldErrors.maxStaffAccount = fieldErrors.maxStaffAccount

    const jobLimitError = validatePositiveNumberOrUnlimited(maxActiveJobPosting, isJobsUnlimited)
    if (jobLimitError) nextFieldErrors.maxActiveJobPosting = jobLimitError
    else if (isPlanMaxLengthError(fieldErrors.maxActiveJobPosting)) nextFieldErrors.maxActiveJobPosting = fieldErrors.maxActiveJobPosting

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    if (!features.some((feature) => feature.enabled)) {
      const message = 'Please enable at least one feature for this plan.'
      setPlanError(message)
      return
    }

    if (isActive && assignedTenantCount > 0) {
      setIsSaveConfirmOpen(true)
      return
    }

    await confirmSavePlan()
  }

  const confirmSavePlan = async () => {
    const payload: UpdatePlanPayload = {
      "name": planName,
      "description": description,
      "billingCycle": billingCycle,
      "price": parseCurrencyInput(monthlyPrice),
      "maxStaffAccount": isStaffUnlimited ? null : Number(maxStaffAccount || 0),
      "staffAccountUnlimited": isStaffUnlimited,
      "maxActiveJobPosting": isJobsUnlimited ? null : Number(maxActiveJobPosting || 0),
      "activeJobPostingUnlimited": isJobsUnlimited,
      "status": isActive ? 'ACTIVE' : 'INACTIVE',
      "features": features.map((feature) => ({
        "key": feature.code,
        "status": feature.enabled ? 'ACTIVE' : 'INACTIVE',
      })),
    }

    setIsSavingPlan(true)
    try {
      await adminApi.updatePlan(plan.id, payload)
      setIsSaveConfirmOpen(false)
      triggerToast?.('Subscription plan updated successfully.', 'success')
      onSaved()
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Failed to update subscription plan.')
      const nextFieldErrors = getSubscriptionPlanFieldErrors(error, message)
      setIsSaveConfirmOpen(false)
      setFieldErrors(nextFieldErrors)
      setPlanError(Object.keys(nextFieldErrors).length > 0 ? '' : message)
    } finally {
      setIsSavingPlan(false)
    }
  }

  const initialFeatures = getPlanFeatureState(plan)
  const hasDraftChanges = Boolean(
    planName !== plan.name ||
    description !== plan.description ||
    billingCycle !== (plan.billingCycle || 'MONTHLY') ||
    parseCurrencyInput(monthlyPrice) !== plan.monthlyPrice ||
    maxStaffAccount !== (plan.maxStaffAccount == null ? '' : String(plan.maxStaffAccount)) ||
    maxActiveJobPosting !== (plan.maxActiveJobPosting == null ? '' : String(plan.maxActiveJobPosting)) ||
    isStaffUnlimited !== plan.staffAccountUnlimited ||
    isJobsUnlimited !== plan.activeJobPostingUnlimited ||
    isActive !== (plan.status.toLowerCase() === 'active') ||
    features.some((feature, index) => feature.enabled !== initialFeatures[index]?.enabled),
  )

  const handleCancelEditPlan = () => {
    if (isSavingPlan) return
    if (hasDraftChanges) {
      setIsCancelConfirmOpen(true)
      return
    }

    onBack()
  }

  const handleActiveStatusToggle = () => {
    if (!isActive) {
      setIsActive(true)
      return
    }

    if (activeAssignedTenantCount > 0) {
      setIsRetireConfirmOpen(true)
      return
    }

    setIsActive(false)
  }

  const activeTenantLabel = `${activeAssignedTenantCount} active tenant${activeAssignedTenantCount === 1 ? '' : 's'}`

  return (
    <form className="role-content edit-plan-content" onSubmit={handleSavePlan} noValidate>
      <Breadcrumb
        className="create-plan-breadcrumb"
        items={[
          { label: 'Home', onClick: onHome },
          { label: 'Subscription Plans', onClick: onPlans },
          { label: 'Plan Detail', onClick: onBack },
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
                  className={fieldErrors.planName ? 'has-error' : ''}
                  value={planName}
                  onChange={(event) => {
                    updateLimitedPlanField('planName', event.target.value, FIELD_LENGTH_LIMITS.defaultText, 'Plan name', setPlanName)
                  }}
                  required
                />
                {fieldErrors.planName && <small className="create-plan-field-error">{fieldErrors.planName}</small>}
              </label>
              <label>
                <span>Short Description</span>
                <input
                  className={fieldErrors.description ? 'has-error' : ''}
                  value={description}
                  onChange={(event) => {
                    updateLimitedPlanField('description', event.target.value, planDescriptionMaxLength, 'Description', setDescription)
                  }}
                  required
                />
                {fieldErrors.description && <small className="create-plan-field-error">{fieldErrors.description}</small>}
              </label>
              <div className="edit-price-status-row">
                <label>
                  <span>Price</span>
                  <div className="plan-price-row">
                    <select
                      value={billingCycle}
                      onChange={(event) => setBillingCycle(event.target.value)}
                      aria-label="Billing cycle"
                    >
                      {billingCycleOptions.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className={`price-input edit-monthly-price-input ${fieldErrors.monthlyPrice ? 'has-error' : ''}`}>
                      <span>$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={monthlyPrice}
                        onChange={(event) => {
                          updateLimitedPlanField('monthlyPrice', event.target.value, planNumberFieldMaxLength, 'Price', setMonthlyPrice, formatCurrencyInput)
                        }}
                        required
                      />
                    </div>
                  </div>
                  {fieldErrors.monthlyPrice && <small className="create-plan-field-error">{fieldErrors.monthlyPrice}</small>}
                </label>
                <button type="button" className={`mini-toggle ${isActive ? 'active' : ''}`} onClick={handleActiveStatusToggle} aria-pressed={isActive}>
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
                {isStaffUnlimited ? (
                  <span className="edit-resource-limit-placeholder" aria-hidden="true" />
                ) : (
                  <input
                    className={fieldErrors.maxStaffAccount ? 'has-error' : ''}
                    type="number"
                    min="0"
                    value={maxStaffAccount}
                    onChange={(event) => {
                      updateLimitedPlanField('maxStaffAccount', event.target.value, planNumberFieldMaxLength, 'Max staff accounts', setMaxStaffAccount)
                    }}
                  />
                )}
                <button
                  type="button"
                  className={`mini-toggle ${isStaffUnlimited ? 'active' : ''}`}
                  onClick={() => {
                    setIsStaffUnlimited((value) => !value)
                    if (fieldErrors.maxStaffAccount) setFieldErrors((current) => ({ ...current, maxStaffAccount: '' }))
                  }}
                  aria-pressed={isStaffUnlimited}
                >
                  <span />
                </button>
                <em>Unlimited</em>
                {fieldErrors.maxStaffAccount && <small className="create-plan-field-error edit-resource-error">{fieldErrors.maxStaffAccount}</small>}
              </article>
              <article>
                <i className="fa-solid fa-briefcase"></i>
                <div>
                  <strong>Max Active Job Postings</strong>
                  <p>Concurrent open roles allowed per tenant</p>
                </div>
                {isJobsUnlimited ? (
                  <span className="edit-resource-limit-placeholder" aria-hidden="true" />
                ) : (
                  <input
                    className={fieldErrors.maxActiveJobPosting ? 'has-error' : ''}
                    type="number"
                    min="0"
                    value={maxActiveJobPosting}
                    onChange={(event) => {
                      updateLimitedPlanField('maxActiveJobPosting', event.target.value, planNumberFieldMaxLength, 'Max active job postings', setMaxActiveJobPosting)
                    }}
                  />
                )}
                <button
                  type="button"
                  className={`mini-toggle ${isJobsUnlimited ? 'active' : ''}`}
                  onClick={() => {
                    setIsJobsUnlimited((value) => !value)
                    if (fieldErrors.maxActiveJobPosting) setFieldErrors((current) => ({ ...current, maxActiveJobPosting: '' }))
                  }}
                  aria-pressed={isJobsUnlimited}
                >
                  <span />
                </button>
                <em>Unlimited</em>
                {fieldErrors.maxActiveJobPosting && <small className="create-plan-field-error edit-resource-error">{fieldErrors.maxActiveJobPosting}</small>}
              </article>
            </div>
          </section>
        </div>

        <section className="create-plan-card edit-plan-card edit-feature-panel">
          <h2><i className="fa-solid fa-bolt"></i> Plan Features <small>AI ENABLED</small></h2>
          <div className="create-plan-divider" />
          <div className="edit-feature-list">
            {features.map((feature) => (
              <article key={feature.key}>
                <span><i className={`fa-solid ${feature.icon}`}></i>{feature.title}</span>
                <button type="button" className={`feature-toggle ${feature.enabled ? 'active' : ''}`} onClick={() => toggleFeature(feature.key)} aria-pressed={feature.enabled} aria-label={`Toggle ${feature.title}`}>
                  <span />
                </button>
              </article>
            ))}
          </div>
          {planError && <p className="create-plan-error feature-permission-error">{planError}</p>}
        </section>
      </div>

      <footer className="create-plan-actions edit-plan-actions">
        <p><i className="fa-solid fa-circle-info"></i> Last modified by Super Admin on {formatPlanDate(plan.createdAt) || 'Oct 24, 2023'}</p>
        <button type="button" onClick={handleCancelEditPlan} disabled={isSavingPlan}>Cancel</button>
        <button type="submit" disabled={isSavingPlan}>{isSavingPlan ? 'Saving...' : 'Save Changes'}</button>
      </footer>

      {isCancelConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={false}
          title="Confirm Action"
          message="Are you sure you want to cancel? Your changes will not be saved."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => setIsCancelConfirmOpen(false)}
          onConfirm={onBack}
        />
      )}

      {isSaveConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={isSavingPlan}
          title="Confirm Action"
          message="Tenants currently in a paid billing cycle will keep their existing pricing and resource limits until their next renewal; the changes will apply starting each tenant's next cycle."
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => {
            if (!isSavingPlan) setIsSaveConfirmOpen(false)
          }}
          onConfirm={confirmSavePlan}
        />
      )}

      {isRetireConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={false}
          title="Confirm Action"
          message={`This plan still has ${activeTenantLabel}. Retiring this plan will not remove them from the plan, but new tenants will no longer be able to subscribe to it.`}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={() => setIsRetireConfirmOpen(false)}
          onConfirm={() => {
            setIsActive(false)
            setIsRetireConfirmOpen(false)
          }}
        />
      )}
    </form>
  )
}

export function SubscriptionPlansView({ onHome, triggerToast }: { onHome: () => void; triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail' | 'edit'>(() => (
    isSubscriptionPlanCreateUrl(location.pathname)
      ? 'create'
      : getSubscriptionPlanIdFromUrl(location.pathname)
        ? (isSubscriptionPlanEditUrl(location.pathname) ? 'edit' : 'detail')
        : 'list'
  ))
  const [selectedPlanId, setSelectedPlanId] = useState(() => getSubscriptionPlanIdFromUrl(location.pathname))
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<SubscriptionPlan | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [topTierPlan, setTopTierPlan] = useState<SubscriptionPlan | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [planStats, setPlanStats] = useState<PlanDashboardStats>({})
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [planListError, setPlanListError] = useState('')
  const [isLoadingPlanDetail, setIsLoadingPlanDetail] = useState(false)
  const [planDetailError, setPlanDetailError] = useState('')
  const [deletePlanTarget, setDeletePlanTarget] = useState<SubscriptionPlan | null>(null)
  const [isDeletingPlan, setIsDeletingPlan] = useState(false)
  const [planTenantCounts, setPlanTenantCounts] = useState<Record<string, number>>({})
  const [refreshPlansKey, setRefreshPlansKey] = useState(0)
  const [planPage, setPlanPage] = useState(1)
  const [planPageCount, setPlanPageCount] = useState(1)
  const [planSort, setPlanSort] = useState<PlanSortOption>('newest')
  const [subscriberPage, setSubscriberPage] = useState(1)
  const [subscriberPageCount, setSubscriberPageCount] = useState(1)
  const [subscriberTotalCount, setSubscriberTotalCount] = useState(0)

  useEffect(() => {
    if (activeView !== 'list') return

    let isActive = true

    adminApi.getPlanDashboardStats()
      .then((stats) => {
        if (isActive) {
          setPlanStats(stats)
        }
      })
      .catch(() => {
        if (isActive) {
          setPlanStats({})
        }
      })

    return () => {
      isActive = false
    }
  }, [activeView, refreshPlansKey])

  useEffect(() => {
    if (activeView !== 'list') return

    let isActive = true

    adminApi.getSubscriptionPlans(buildTopTierPlanParams())
      .then((items) => {
        if (isActive) {
          setTopTierPlan(getHighestPricedActivePlan(items))
        }
      })
      .catch(() => {
        if (isActive) {
          setTopTierPlan(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [activeView, refreshPlansKey])

  useEffect(() => {
    if (activeView !== 'list') return

    let isActive = true
    setIsLoadingPlans(true)
    setPlanListError('')

    adminApi.getSubscriptionPlans(buildPlanListParams(planSort, planPage))
      .then((items) => {
        if (isActive) {
          setPlans(items)
          setPlanPageCount(getListPageCount(items, planPage, ADMIN_LIST_PAGE_SIZE))
        }
      })
      .catch((error) => {
        if (isActive) {
          setPlanListError(getAdminErrorMessage(error, 'Failed to load subscription plans.'))
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingPlans(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [activeView, planPage, planSort, refreshPlansKey])

  useEffect(() => {
    if (activeView !== 'list' || plans.length === 0) {
      if (activeView !== 'list') setPlanTenantCounts({})
      return
    }

    let isActive = true

    Promise.all(plans.map(async (plan) => {
      try {
        const tenantItems = await adminApi.getTenants({
          sortField: 'companyName',
          filters: { planId: plan.id },
          sortBy: 'ASC',
          page: 1,
          size: 1,
        })

        return [plan.id, getListTotalElements(tenantItems, tenantItems.length)] as const
      } catch {
        return [plan.id, 0] as const
      }
    })).then((entries) => {
      if (!isActive) return
      setPlanTenantCounts(Object.fromEntries(entries))
    })

    return () => {
      isActive = false
    }
  }, [activeView, plans])

  useEffect(() => {
    if ((activeView !== 'detail' && activeView !== 'edit') || !selectedPlanId) {
      setSelectedPlanDetail(null)
      setPlanDetailError('')
      return
    }

    let isActive = true
    setIsLoadingPlanDetail(true)
    setPlanDetailError('')

    adminApi.getPlanById(selectedPlanId)
      .then((plan) => {
        if (isActive) {
          setSelectedPlanDetail(plan)
        }
      })
      .catch((error) => {
        if (isActive) {
          setSelectedPlanDetail(null)
          setPlanDetailError(getAdminErrorMessage(error, 'Failed to load subscription plan.'))
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingPlanDetail(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [activeView, refreshPlansKey, selectedPlanId])

  useEffect(() => {
    if ((activeView !== 'detail' && activeView !== 'edit') || !selectedPlanId) {
      setTenants([])
      setSubscriberPage(1)
      setSubscriberPageCount(1)
      setSubscriberTotalCount(0)
      return
    }

    let isActive = true

    adminApi.getTenants({
      sortField: 'companyName',
      filters: { planId: selectedPlanId },
      sortBy: 'ASC',
      page: subscriberPage,
      size: ADMIN_LIST_PAGE_SIZE,
    })
      .then((tenantItems) => {
        if (isActive) {
          setTenants(tenantItems)
          setSubscriberPageCount(getListPageCount(tenantItems, subscriberPage, ADMIN_LIST_PAGE_SIZE))
          setSubscriberTotalCount(getListTotalElements(tenantItems, tenantItems.length))
        }
      })
      .catch(() => {
        if (isActive) {
          setTenants([])
          setSubscriberPageCount(1)
          setSubscriberTotalCount(0)
        }
      })

    return () => {
      isActive = false
    }
  }, [activeView, refreshPlansKey, selectedPlanId, subscriberPage])

  useEffect(() => {
    const planId = getSubscriptionPlanIdFromUrl(location.pathname)
    setSelectedPlanId(planId)
    setActiveView(
      isSubscriptionPlanCreateUrl(location.pathname)
        ? 'create'
        : planId
          ? (isSubscriptionPlanEditUrl(location.pathname) ? 'edit' : 'detail')
          : 'list',
    )
  }, [location.pathname])

  const activePlansCount = plans.filter(isActiveSubscriptionPlan).length
  const topTierFallback = getHighestPricedActivePlan(plans)
  const topTier = topTierPlan || topTierFallback
  const planStatsActivePlans = planStats.activePlans ?? activePlansCount
  const planStatsTopTierName = planStats.topTierName || topTier?.name || '-'
  const planStatsMonthlyRevenueLabel = `$${(planStats.monthlyActivePlanRevenue ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
  const planStatsRenewalRateLabel = planStats.renewalRate !== undefined ? `${formatStatNumber(planStats.renewalRate)}%` : '-'
  const sortedPlans = sortSubscriptionPlans(plans, planSort)
  const safePlanPage = planPage
  const pagedPlans = sortedPlans
  const planTotalElements = getListTotalElements(plans, plans.length)
  const visiblePlanStart = sortedPlans.length === 0 ? 0 : (safePlanPage - 1) * ADMIN_LIST_PAGE_SIZE + 1
  const visiblePlanEnd = visiblePlanStart === 0 ? 0 : Math.min(planTotalElements, visiblePlanStart + pagedPlans.length - 1)
  const planPageItems = getCompactPageItems(safePlanPage, planPageCount)
  useEffect(() => {
    if (!isLoadingPlans && !planListError && plans.length === 0 && planPage > 1) {
      setPlanPage((page) => Math.max(1, page - 1))
    }
  }, [isLoadingPlans, planListError, planPage, plans.length])

  const handlePlanCreated = () => {
    setActiveView('list')
    setSelectedPlanId('')
    navigate(getSuperAdminViewPath('subscriptionPlans'))
    setRefreshPlansKey((value) => value + 1)
  }

  const closePlanDetail = () => {
    setSelectedPlanId('')
    setActiveView('list')
    navigate(getSuperAdminViewPath('subscriptionPlans'))
  }

  const openPlanList = () => {
    setSelectedPlanId('')
    setActiveView('list')
    navigate(getSuperAdminViewPath('subscriptionPlans'))
  }

  const openPlanCreate = () => {
    setSelectedPlanId('')
    setActiveView('create')
    navigate(getSubscriptionPlanCreatePath())
  }

  const openPlanDetail = (planId: string) => {
    setSelectedPlanId(planId)
    setSubscriberPage(1)
    setActiveView('detail')
    navigate(getSubscriptionPlanDetailPath(planId))
  }

  const openPlanEdit = (planId: string) => {
    setSelectedPlanId(planId)
    setSubscriberPage(1)
    setActiveView('edit')
    navigate(getSubscriptionPlanEditPath(planId))
  }

  const requestDeletePlan = (plan: SubscriptionPlan) => {
    const tenantCount = selectedPlanId === plan.id ? subscriberTotalCount : (planTenantCounts[plan.id] ?? 0)
    if (tenantCount > 0) return
    setDeletePlanTarget(plan)
  }
  const getPlanDeleteTooltip = (tenantCount: number) => (
    tenantCount > 0
      ? `Không thể xóa gói này vì hiện có ${tenantCount} tenant đang sử dụng.`
      : 'Delete'
  )

  const confirmDeletePlan = async () => {
    if (!deletePlanTarget) return

    setIsDeletingPlan(true)
    setPlanListError('')

    try {
      await adminApi.deletePlan(deletePlanTarget.id)
      setPlans((currentPlans) => currentPlans.filter((plan) => plan.id !== deletePlanTarget.id))
      setSelectedPlanDetail((plan) => plan?.id === deletePlanTarget.id ? null : plan)
      if (selectedPlanId === deletePlanTarget.id) {
        openPlanList()
      }
      setDeletePlanTarget(null)
      setRefreshPlansKey((value) => value + 1)
      triggerToast?.('Subscription plan deleted successfully.', 'success')
    } catch (error) {
      setPlanListError(getAdminErrorMessage(error, 'Failed to delete subscription plan.'))
    } finally {
      setIsDeletingPlan(false)
    }
  }

  if (activeView === 'create') {
    return <CreatePlanView onBack={() => {
      setActiveView('list')
      navigate(getSuperAdminViewPath('subscriptionPlans'))
    }} onHome={onHome} onCreated={handlePlanCreated} existingPlans={plans} triggerToast={triggerToast} />
  }

  if (activeView === 'detail') {
    const selectedPlan = selectedPlanDetail
    const matchingTenants = selectedPlan ? tenants : []
    const enabledFeatures = selectedPlan?.features.filter((feature) => isActivePlanFeatureStatus(feature.status)) || []
    const selectedPlanTenantCount = subscriberTotalCount
    const selectedPlanDeleteTooltip = getPlanDeleteTooltip(selectedPlanTenantCount)

    return (
      <div className="role-content subscription-plan-detail-content">
        <Breadcrumb
          items={[
            { label: 'Home', onClick: onHome },
            { label: 'Subscription Plans', onClick: closePlanDetail },
            { label: 'Plan Detail' },
          ]}
        />

        {isLoadingPlanDetail ? (
          <div className="subscription-table-state">Loading plan details...</div>
        ) : planDetailError ? (
          <div className="subscription-table-state error">{planDetailError}</div>
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
                  onClick={() => requestDeletePlan(selectedPlan)}
                  disabled={isDeletingPlan || selectedPlanTenantCount > 0}
                >
                  Delete
                </button>
                <button type="button" onClick={() => openPlanEdit(selectedPlan.id)}>Edit</button>
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
                    <span>Showing {matchingTenants.length} of {subscriberTotalCount} subscribers</span>
                    <div>
                      <button type="button" className="icon-tooltip" data-tooltip="Previous page" disabled={subscriberPage === 1} onClick={() => setSubscriberPage((page) => Math.max(1, page - 1))}><i className="fa-solid fa-chevron-left"></i></button>
                      {Array.from({ length: subscriberPageCount }, (_, index) => index + 1).map((page) => (
                        <button type="button" className={subscriberPage === page ? 'active' : ''} key={page} onClick={() => setSubscriberPage(page)}>{page}</button>
                      ))}
                      <button type="button" className="icon-tooltip" data-tooltip="Next page" disabled={subscriberPage === subscriberPageCount} onClick={() => setSubscriberPage((page) => Math.min(subscriberPageCount, page + 1))}><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                  </footer>
                  </div>
                )}
              </div>
            </section>

            {deletePlanTarget && (
              <ConfirmActionModal
                isSubmitting={isDeletingPlan}
                title="Confirm Action"
                message={(
                  <>
                    Are you sure you want to delete <span className="tenant-confirm-target-name">{deletePlanTarget.name}</span>?
                    <br />
                    This action cannot be undone.
                  </>
                )}
                cancelLabel="Cancel"
                confirmLabel="Delete"
                submittingLabel="Deleting..."
                onCancel={() => {
                  if (!isDeletingPlan) setDeletePlanTarget(null)
                }}
                onConfirm={confirmDeletePlan}
              />
            )}
          </>
        )}
      </div>
    )
  }

  if (activeView === 'edit') {
    const selectedPlan = selectedPlanDetail
    const assignedTenantCount = subscriberTotalCount
    const activeAssignedTenantCount = tenants.filter((tenant) => tenant.status.toLowerCase() === 'active').length

    if (isLoadingPlanDetail) {
      return (
      <div className="role-content subscription-plan-detail-content">
        <div className="subscription-table-state">Loading plan details...</div>
      </div>
    )
    }

    if (planDetailError || !selectedPlan) {
      return (
        <div className="role-content subscription-plan-detail-content">
          <div className={`subscription-table-state ${planDetailError ? 'error' : ''}`}>
            {planDetailError || 'Plan not found.'}
          </div>
        </div>
      )
    }

    return (
      <EditPlanDetailView
        plan={selectedPlan}
        onHome={onHome}
        onPlans={openPlanList}
        existingPlans={plans}
        assignedTenantCount={assignedTenantCount}
        activeAssignedTenantCount={activeAssignedTenantCount}
        onBack={() => {
          setActiveView('detail')
          navigate(getSubscriptionPlanDetailPath(selectedPlan.id))
        }}
        onSaved={() => {
          setRefreshPlansKey((value) => value + 1)
          setActiveView('detail')
          navigate(getSubscriptionPlanDetailPath(selectedPlan.id))
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
        <button type="button" onClick={openPlanCreate}>Create New Plan</button>
      </div>

      <div className="role-metrics subscription-plan-metrics">
        <MetricCard
          className="subscription-plan-card"
          icon="fa-layer-group"
          label="Active Plans"
          value={planStatsActivePlans}
        />
        <MetricCard
          className="subscription-plan-card"
          icon="fa-crown"
          label="Top Tier"
          value={planStatsTopTierName}
        />
        <MetricCard
          className="subscription-plan-card"
          icon="fa-money-bill-trend-up"
          label="Monthly Active Plan Revenue"
          value={planStatsMonthlyRevenueLabel}
        />
        <MetricCard
          className="subscription-plan-card recommendation"
          icon="fa-rotate"
          label="Renewal Rate"
          value={planStatsRenewalRateLabel}
        />
      </div>

      <section className="subscription-table-card">
        <div className="subscription-table-toolbar">
          <label>
            <i className="fa-solid fa-arrow-up-wide-short"></i>
            <span>Sort by</span>
            <ScrollableSelect
              className="subscription-sort-select"
              ariaLabel="Sort subscription plans"
              value={planSort}
              options={[
                { value: 'price-asc', label: 'Price: Low to High' },
                { value: 'price-desc', label: 'Price: High to Low' },
                { value: 'newest', label: 'Time: Newest First' },
                { value: 'oldest', label: 'Time: Oldest First' },
              ]}
              onChange={(nextValue) => {
                setPlanSort(nextValue as PlanSortOption)
                setPlanPage(1)
              }}
            />
          </label>
        </div>

        <div className="subscription-table-row subscription-table-head">
          <span>Plan Name</span>
          <span>Price</span>
          <span>Max Staff Accounts</span>
          <span>Max Job Postings</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {isLoadingPlans ? (
          <div className="subscription-table-state">Loading subscription plans...</div>
        ) : planListError ? (
          <div className="subscription-table-state error">{planListError}</div>
        ) : plans.length === 0 ? (
          <div className="subscription-table-state">No subscription plans found.</div>
        ) : (
          <div className="subscription-table-body">
            {pagedPlans.map((plan) => {
              const isActive = plan.status.toLowerCase() === 'active'
              const tenantCount = planTenantCounts[plan.id] ?? 0
              const deleteTooltip = getPlanDeleteTooltip(tenantCount)

              return (
                <div
                  className={`subscription-table-row subscription-table-data-row ${isActive ? '' : 'inactive-plan-row'}`}
                  key={plan.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPlanDetail(plan.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openPlanDetail(plan.id)
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
                        openPlanEdit(plan.id)
                      }}
                    >
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M8.75 21.25V16.25L21.25 3.75L26.25 8.75L13.75 21.25H8.75Z" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3.75 26.25H26.25" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17.5 7.5L22.5 12.5" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-tooltip subscription-delete-action"
                      aria-label={`Delete ${plan.name}`}
                      data-tooltip={deleteTooltip}
                      title={tenantCount > 0 ? deleteTooltip : undefined}
                      disabled={isDeletingPlan || tenantCount > 0}
                      onClick={(event) => {
                        event.stopPropagation()
                        requestDeletePlan(plan)
                      }}
                    >
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M7.5 23.75C7.5 24.413 7.76339 25.0489 8.23223 25.5178C8.70107 25.9866 9.33696 26.25 10 26.25H20C20.663 26.25 21.2989 25.9866 21.7678 25.5178C22.2366 25.0489 22.5 24.413 22.5 23.75V8.75H7.5V23.75ZM10 11.25H20V23.75H10V11.25ZM19.375 5L18.125 3.75H11.875L10.625 5H6.25V7.5H23.75V5H19.375Z" fill="#565E74" />
                      </svg>
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <footer>
          <span>Showing {visiblePlanStart}-{visiblePlanEnd} of {planTotalElements} Plan{planTotalElements === 1 ? '' : 's'}</span>
          <div>
              <button type="button" className="icon-tooltip" data-tooltip="Previous page" disabled={safePlanPage === 1} onClick={() => setPlanPage((page) => Math.max(1, page - 1))}><i className="fa-solid fa-chevron-left"></i></button>
            {planPageItems.map((item, index) => (
              item === 'ellipsis' ? (
                <span className="pagination-ellipsis" key={`plan-ellipsis-${index}`}>...</span>
              ) : (
                <button
                  type="button"
                  className={safePlanPage === item ? 'active' : ''}
                  key={item}
                  onClick={() => setPlanPage(item)}
                >
                  {item}
                </button>
              )
            ))}
            <button type="button" className="icon-tooltip" data-tooltip="Next page" disabled={safePlanPage === planPageCount} onClick={() => setPlanPage((page) => Math.min(planPageCount, page + 1))}><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </footer>
      </section>

      {deletePlanTarget && (
        <ConfirmActionModal
          isSubmitting={isDeletingPlan}
          title="Confirm Action"
          message={(
            <>
              Are you sure you want to delete <span className="tenant-confirm-target-name">{deletePlanTarget.name}</span>?
              <br />
              This action cannot be undone.
            </>
          )}
          cancelLabel="Cancel"
          confirmLabel="Delete"
          submittingLabel="Deleting..."
          onCancel={() => {
            if (!isDeletingPlan) setDeletePlanTarget(null)
          }}
          onConfirm={confirmDeletePlan}
        />
      )}
    </div>
  )
}
