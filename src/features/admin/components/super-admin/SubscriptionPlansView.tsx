import { useEffect, useState, type FormEvent } from 'react'
import { ADMIN_LIST_PAGE_SIZE, adminApi } from '../../services/adminApi'
import type { AdminListParams, CreatePlanPayload, PlanDashboardStats, SubscriptionPlan, Tenant, UpdatePlanPayload } from '../../types/admin.types'
import { getAdminErrorMessage } from '../../utils/adminErrors'
import { formatFeatureLabel, formatPlanDate } from '../../utils/adminFormatters'
import { getSubscriptionPlanIdFromUrl, isSubscriptionPlanCreateUrl, isSubscriptionPlanEditUrl, updateSubscriptionPlanCreateUrl, updateSubscriptionPlanDetailUrl, updateSubscriptionPlanEditUrl, updateSuperAdminViewUrl } from '../../utils/adminRouteHelpers'
import { ConfirmActionModal } from '../shared/ConfirmActionModal'
import { AdminBreadcrumb } from '../shared/AdminBreadcrumb'
import { getListPageCount, getListTotalElements } from '../../utils/adminMappers'

const MAX_NAME_LENGTH = 50

const planFeatureDefaults = [
  {
    key: 'aiJdGenerator',
    code: 'AI_JD_GENERATOR',
    icon: 'fa-briefcase-medical',
    title: 'AI JD Generator',
    description: 'Auto-generate job descriptions with AI.',
    enabled: false,
  },
  {
    key: 'aiCvParsing',
    code: 'AI_CV_PARSING',
    icon: 'fa-file-code',
    title: 'AI CV Parsing',
    description: 'Extract data from resumes automatically.',
    enabled: false,
  },
  {
    key: 'chatbotScreening',
    code: 'CHATBOT_SCREENING',
    icon: 'fa-message',
    title: 'Chatbot Screening',
    description: 'Interactive AI screening for candidates.',
    enabled: false,
  },
  {
    key: 'dssAnalytics',
    code: 'DSS_ANALYTICS',
    icon: 'fa-chart-simple',
    title: 'DSS Analytics',
    description: 'Advanced Decision Support System data.',
    enabled: false,
  },
  {
    key: 'prioritySupport',
    code: 'PRIORITY_SUPPORT',
    icon: 'fa-headset',
    title: 'Priority Support',
    description: '24/7 dedicated account manager.',
    enabled: false,
  },
  {
    key: 'customBranding',
    code: 'CUSTOM_BRANDING',
    icon: 'fa-window-maximize',
    title: 'Custom Branding',
    description: 'White-label options for dashboards.',
    enabled: false,
  },
  {
    key: 'apiAccess',
    code: 'API_ACCESS',
    icon: 'fa-arrows-spin',
    title: 'API Access',
    description: 'Full access to JobFusion endpoints.',
    enabled: false,
  },
  {
    key: 'multiRegionSupport',
    code: 'MULTI_REGION_SUPPORT',
    icon: 'fa-earth-americas',
    title: 'Multi-Region Support',
    description: 'Manage hiring across multiple countries.',
    enabled: false,
  },
]

type CreatePlanFieldErrors = Partial<Record<
  'planName' | 'description' | 'monthlyPrice' | 'maxStaffAccount' | 'maxActiveJobPosting',
  string
>>

function isValidCreatePlanPrice(value: string) {
  const trimmedValue = value.trim()
  return /^\d+(\.\d{1,2})?$/.test(trimmedValue) && Number(trimmedValue) >= 0
}

function isValidCreatePlanLimit(value: string) {
  const trimmedValue = value.trim()
  return /^\d+$/.test(trimmedValue) && Number(trimmedValue) > 0
}

function normalizePlanNameForDuplicateCheck(value: string) {
  return value.trim().toLowerCase()
}

function hasDuplicatePlanName(plans: SubscriptionPlan[], planName: string, ignoredPlanId?: string) {
  const normalizedPlanName = normalizePlanNameForDuplicateCheck(planName)
  if (!normalizedPlanName) return false

  return plans.some((plan) => (
    plan.id !== ignoredPlanId &&
    normalizePlanNameForDuplicateCheck(plan.name) === normalizedPlanName
  ))
}

function hasFeatureChanges(features: typeof planFeatureDefaults) {
  return features.some((feature, index) => feature.enabled !== planFeatureDefaults[index]?.enabled)
}

type PlanSortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest'

type PlanListFilterValues = {
  search?: string
  name?: string
  description?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'DISABLED'
}

function buildPlanListFilters(values: PlanListFilterValues = {}) {
  const filters: Record<string, unknown> = {}
  const search = values.search?.trim()
  const name = values.name?.trim()
  const description = values.description?.trim()

  if (search) filters.search = search
  if (name) filters.name = name
  if (description) filters.description = description
  if (values.status) filters.status = values.status

  return filters
}

function buildPlanListParams(sort: PlanSortOption, page: number): AdminListParams {
  const filters = buildPlanListFilters()

  if (sort === 'price-asc') {
    return { sortField: 'monthlyPrice', sortBy: 'ASC', filters, page, size: ADMIN_LIST_PAGE_SIZE }
  }

  if (sort === 'price-desc') {
    return { sortField: 'monthlyPrice', sortBy: 'DESC', filters, page, size: ADMIN_LIST_PAGE_SIZE }
  }

  if (sort === 'oldest') {
    return { sortField: 'createdAt', sortBy: 'ASC', filters, page, size: ADMIN_LIST_PAGE_SIZE }
  }

  return { sortField: 'createdAt', sortBy: 'DESC', filters, page, size: ADMIN_LIST_PAGE_SIZE }
}

function getUsagePercent(used: number, limit: number) {
  if (limit <= 0) return 100
  return Math.min(100, Math.round((used / limit) * 100))
}

function getDerivedJobUsage(index: number, plan: SubscriptionPlan) {
  const limit = plan.activeJobPostingUnlimited ? 50 : Math.max(1, plan.maxActiveJobPosting)
  const usageRatios = [0.24, 0.96, 0.16, 0.64, 0.42, 0.78]
  const used = Math.max(1, Math.round(limit * usageRatios[index % usageRatios.length]))
  return { used, limit, percent: getUsagePercent(used, limit) }
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
        planName: 'Please fill in plan name.',
        description: 'Please fill in short description.',
        monthlyPrice: 'Please enter a valid price.',
        maxStaffAccount: 'Please enter a number greater than 0 or select Unlimited.',
        maxActiveJobPosting: 'Please enter a number greater than 0 or select Unlimited.',
      })
      return
    }

    if (!planName.trim()) {
      nextFieldErrors.planName = 'Please fill in plan name.'
    } else if (hasDuplicatePlanName(existingPlans, planName)) {
      nextFieldErrors.planName = 'A plan with this name already exists. Please choose a different name.'
    }

    if (!description.trim()) {
      nextFieldErrors.description = 'Please fill in short description.'
    }

    if (!isValidCreatePlanPrice(monthlyPrice)) {
      nextFieldErrors.monthlyPrice = 'Please enter a valid price.'
    }

    if (!isStaffUnlimited && !isValidCreatePlanLimit(maxStaffAccount)) {
      nextFieldErrors.maxStaffAccount = 'Please enter a number greater than 0 or select Unlimited.'
    }

    if (!isJobsUnlimited && !isValidCreatePlanLimit(maxActiveJobPosting)) {
      nextFieldErrors.maxActiveJobPosting = 'Please enter a number greater than 0 or select Unlimited.'
    }

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
      "monthlyPrice": Number(monthlyPrice || 0),
      "maxStaffAccount": isStaffUnlimited ? null : Number(maxStaffAccount || 0),
      "staffAccountUnlimited": isStaffUnlimited,
      "maxActiveJobPosting": isJobsUnlimited ? null : Number(maxActiveJobPosting || 0),
      "activeJobPostingUnlimited": isJobsUnlimited,
      "features": features.map((feature) => ({
        "key": feature.code,
        "status": feature.enabled ? 'ENABLED' : 'DISABLED',
      })),
    }

    setIsSavingPlan(true)
    try {
      await adminApi.createPlan(payload)
      triggerToast?.('Subscription plan created successfully', 'success')
      onCreated()
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Failed to create subscription plan.')
      setPlanError(message)
    } finally {
      setIsSavingPlan(false)
    }
  }

  const hasDraftChanges = Boolean(
    planName.trim() ||
    description.trim() ||
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
      <AdminBreadcrumb
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
                setPlanName(event.target.value.slice(0, MAX_NAME_LENGTH))
                if (fieldErrors.planName) setFieldErrors((current) => ({ ...current, planName: '' }))
              }}
              placeholder="Plan Name"
              maxLength={MAX_NAME_LENGTH}
              required
            />
            {fieldErrors.planName && <small className="create-plan-field-error">{fieldErrors.planName}</small>}
          </label>

          <label>
            <span>Monthly Price <span className="required-mark">*</span></span>
            <div className={`price-input ${fieldErrors.monthlyPrice ? 'has-error' : ''}`}>
              <span>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={monthlyPrice}
                onChange={(event) => {
                  setMonthlyPrice(event.target.value)
                  if (fieldErrors.monthlyPrice) setFieldErrors((current) => ({ ...current, monthlyPrice: '' }))
                }}
                placeholder="0.00"
                required
              />
            </div>
            {fieldErrors.monthlyPrice && <small className="create-plan-field-error">{fieldErrors.monthlyPrice}</small>}
          </label>

          <label className="description-field">
            <span>Short Description <span className="required-mark">*</span></span>
            <textarea
              className={fieldErrors.description ? 'has-error' : ''}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                if (fieldErrors.description) setFieldErrors((current) => ({ ...current, description: '' }))
              }}
              placeholder="Short Description"
              maxLength={1000}
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
                    setMaxStaffAccount(event.target.value)
                    if (fieldErrors.maxStaffAccount) setFieldErrors((current) => ({ ...current, maxStaffAccount: '' }))
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
                    setMaxActiveJobPosting(event.target.value)
                    if (fieldErrors.maxActiveJobPosting) setFieldErrors((current) => ({ ...current, maxActiveJobPosting: '' }))
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

function getPlanFeatureState(plan?: SubscriptionPlan) {
  const featureStatusByKey = new Map((plan?.features || []).map((feature) => [
    feature.key.toUpperCase(),
    feature.status.toUpperCase(),
  ]))

  return planFeatureDefaults.map((feature) => {
    const status = featureStatusByKey.get(feature.code)
    return {
      ...feature,
      enabled: status ? status === 'ENABLED' : feature.enabled,
    }
  })
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
  const [monthlyPrice, setMonthlyPrice] = useState(plan.monthlyPrice.toFixed(2))
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
      setFieldErrors({ planName: 'Please fill in plan name.', description: 'Please fill in short description.' })
      return
    }

    if (!planName.trim()) {
      nextFieldErrors.planName = 'Please fill in plan name.'
    } else if (hasDuplicatePlanName(existingPlans, planName, plan.id)) {
      nextFieldErrors.planName = 'A plan with this name already exists. Please choose a different name.'
    }

    if (!description.trim()) {
      nextFieldErrors.description = 'Please fill in short description.'
    }

    if (!isValidCreatePlanPrice(monthlyPrice)) {
      nextFieldErrors.monthlyPrice = 'Please enter a valid price.'
    }

    if (!isStaffUnlimited && !isValidCreatePlanLimit(maxStaffAccount)) {
      nextFieldErrors.maxStaffAccount = 'Please enter a number greater than 0 or select Unlimited.'
    }

    if (!isJobsUnlimited && !isValidCreatePlanLimit(maxActiveJobPosting)) {
      nextFieldErrors.maxActiveJobPosting = 'Please enter a number greater than 0 or select Unlimited.'
    }

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    if (!features.some((feature) => feature.enabled)) {
      const message = 'Please enable at least one feature for this plan.'
      setPlanError(message)
      return
    }

    setIsSaveConfirmOpen(true)
  }

  const confirmSavePlan = async () => {
    const payload: UpdatePlanPayload = {
      "name": planName,
      "description": description,
      "monthlyPrice": Number(monthlyPrice || 0),
      "maxStaffAccount": isStaffUnlimited ? null : Number(maxStaffAccount || 0),
      "staffAccountUnlimited": isStaffUnlimited,
      "maxActiveJobPosting": isJobsUnlimited ? null : Number(maxActiveJobPosting || 0),
      "activeJobPostingUnlimited": isJobsUnlimited,
      "status": isActive ? 'ACTIVE' : 'DISABLED',
      "features": features.map((feature) => ({
        "key": feature.code,
        "status": feature.enabled ? 'ENABLED' : 'DISABLED',
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
      setIsSaveConfirmOpen(false)
      setPlanError(message)
    } finally {
      setIsSavingPlan(false)
    }
  }

  const initialFeatures = getPlanFeatureState(plan)
  const hasDraftChanges = Boolean(
    planName !== plan.name ||
    description !== plan.description ||
    monthlyPrice !== plan.monthlyPrice.toFixed(2) ||
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
  const assignedTenantLabel = `${assignedTenantCount} tenant${assignedTenantCount === 1 ? '' : 's'}`

  return (
    <form className="role-content edit-plan-content" onSubmit={handleSavePlan} noValidate>
      <AdminBreadcrumb
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
                    setPlanName(event.target.value.slice(0, MAX_NAME_LENGTH))
                    if (fieldErrors.planName) setFieldErrors((current) => ({ ...current, planName: '' }))
                  }}
                  maxLength={MAX_NAME_LENGTH}
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
                    setDescription(event.target.value)
                    if (fieldErrors.description) setFieldErrors((current) => ({ ...current, description: '' }))
                  }}
                  required
                />
                {fieldErrors.description && <small className="create-plan-field-error">{fieldErrors.description}</small>}
              </label>
              <div className="edit-price-status-row">
                <label>
                  <span>Monthly Price (USD)</span>
                  <div className={`price-input edit-monthly-price-input ${fieldErrors.monthlyPrice ? 'has-error' : ''}`}>
                    <span>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={monthlyPrice}
                      onChange={(event) => {
                        setMonthlyPrice(event.target.value)
                        if (fieldErrors.monthlyPrice) setFieldErrors((current) => ({ ...current, monthlyPrice: '' }))
                      }}
                      required
                    />
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
                      setMaxStaffAccount(event.target.value)
                      if (fieldErrors.maxStaffAccount) setFieldErrors((current) => ({ ...current, maxStaffAccount: '' }))
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
                      setMaxActiveJobPosting(event.target.value)
                      if (fieldErrors.maxActiveJobPosting) setFieldErrors((current) => ({ ...current, maxActiveJobPosting: '' }))
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
          message={`This plan is currently assigned to ${assignedTenantLabel}. Saving changes will immediately update their resource limits and pricing.`}
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
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail' | 'edit'>(() => (
    isSubscriptionPlanCreateUrl()
      ? 'create'
      : getSubscriptionPlanIdFromUrl()
        ? (isSubscriptionPlanEditUrl() ? 'edit' : 'detail')
        : 'list'
  ))
  const [selectedPlanId, setSelectedPlanId] = useState(() => getSubscriptionPlanIdFromUrl())
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<SubscriptionPlan | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [planStats, setPlanStats] = useState<PlanDashboardStats>({})
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [planListError, setPlanListError] = useState('')
  const [isLoadingPlanDetail, setIsLoadingPlanDetail] = useState(false)
  const [planDetailError, setPlanDetailError] = useState('')
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
    if (activeView !== 'detail' || !selectedPlanId) {
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
    const handlePopState = () => {
      const planId = getSubscriptionPlanIdFromUrl()
      setSelectedPlanId(planId)
      setActiveView(
        isSubscriptionPlanCreateUrl()
          ? 'create'
          : planId
            ? (isSubscriptionPlanEditUrl() ? 'edit' : 'detail')
            : 'list',
      )
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const activePlansCount = plans.filter((plan) => plan.status.toLowerCase() === 'active').length
  const topTier = plans.reduce<SubscriptionPlan | null>((current, plan) => (
    !current || plan.monthlyPrice > current.monthlyPrice ? plan : current
  ), null)
  const planStatsActivePlans = planStats.activePlans ?? activePlansCount
  const planStatsTotalPlans = planStats.totalPlans ?? getListTotalElements(plans, plans.length)
  const planStatsTopTierName = planStats.topTierName || topTier?.name || '-'
  const planStatsTopTierStaffLabel = planStats.topTierStaffAccountUnlimited ?? topTier?.staffAccountUnlimited
    ? 'Unlimited'
    : `${planStats.topTierMaxStaffAccount ?? topTier?.maxStaffAccount ?? 0} staff`
  const planStatsMonthlyRevenueLabel = `$${(planStats.monthlyActivePlanRevenue ?? 0).toFixed(2)}`
  const planStatsMonthlyTrendLabel = planStats.monthlyRevenueTrendPercent !== undefined
    ? `${planStats.monthlyRevenueTrendPercent >= 0 ? '+' : ''}${planStats.monthlyRevenueTrendPercent}% from last month.`
    : '-'
  const planStatsRenewalRateLabel = planStats.renewalRate !== undefined ? `${planStats.renewalRate}%` : '-'
  const planStatsRenewalTrendLabel = planStats.renewalRateTrendPercent !== undefined
    ? `${planStats.renewalRateTrendPercent >= 0 ? '+' : ''}${planStats.renewalRateTrendPercent}% vs target`
    : '-'
  const sortedPlans = plans
  const safePlanPage = planPage
  const pagedPlans = sortedPlans
  const visiblePlanStart = sortedPlans.length === 0 ? 0 : (safePlanPage - 1) * ADMIN_LIST_PAGE_SIZE + 1
  const visiblePlanEnd = visiblePlanStart === 0 ? 0 : visiblePlanStart + sortedPlans.length - 1
  useEffect(() => {
    if (!isLoadingPlans && !planListError && plans.length === 0 && planPage > 1) {
      setPlanPage((page) => Math.max(1, page - 1))
    }
  }, [isLoadingPlans, planListError, planPage, plans.length])

  const handlePlanCreated = () => {
    setActiveView('list')
    setSelectedPlanId('')
    updateSuperAdminViewUrl('subscriptionPlans')
    setRefreshPlansKey((value) => value + 1)
  }

  const closePlanDetail = () => {
    setSelectedPlanId('')
    setActiveView('list')
    updateSuperAdminViewUrl('subscriptionPlans')
  }

  const openPlanList = () => {
    setSelectedPlanId('')
    setActiveView('list')
    updateSuperAdminViewUrl('subscriptionPlans')
  }

  const openPlanCreate = () => {
    setSelectedPlanId('')
    setActiveView('create')
    updateSubscriptionPlanCreateUrl()
  }

  const openPlanDetail = (planId: string) => {
    setSelectedPlanId(planId)
    setSubscriberPage(1)
    setActiveView('detail')
    updateSubscriptionPlanDetailUrl(planId)
  }

  const openPlanEdit = (planId: string) => {
    setSelectedPlanId(planId)
    setSubscriberPage(1)
    setActiveView('edit')
    updateSubscriptionPlanEditUrl(planId)
  }

  if (activeView === 'create') {
    return <CreatePlanView onBack={() => {
      setActiveView('list')
      updateSuperAdminViewUrl('subscriptionPlans')
    }} onHome={onHome} onCreated={handlePlanCreated} existingPlans={plans} triggerToast={triggerToast} />
  }

  if (activeView === 'detail') {
    const selectedPlan = selectedPlanDetail
    const matchingTenants = selectedPlan ? tenants : []
    const enabledFeatures = selectedPlan?.features.filter((feature) => feature.status.toLowerCase() === 'enabled') || []

    return (
      <div className="role-content subscription-plan-detail-content">
        <AdminBreadcrumb
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
                <button type="button" onClick={() => openPlanEdit(selectedPlan.id)}>Edit</button>
              </div>
            </div>

            <section className="plan-detail-card plan-configuration-card">
              <h2>Plan Configuration</h2>
              <div className="plan-config-grid">
                <div>
                  <span>Short Description</span>
                  <strong>{selectedPlan.description || '-'}</strong>
                </div>
                <div>
                  <span>Base Price</span>
                  <strong className="price">{selectedPlan.priceLabel || `$${selectedPlan.monthlyPrice.toFixed(2)} / month`}</strong>
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
                          {formatFeatureLabel(feature.key)}
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

                  {matchingTenants.map((tenant, index) => {
                    const staffLimit = tenant.userQuotaLimit || selectedPlan.maxStaffAccount || 0
                    const staffPercent = getUsagePercent(tenant.userQuotaUsed, staffLimit)
                    const jobUsage = getDerivedJobUsage(index, selectedPlan)
                    const status = tenant.status.toLowerCase()
                    const statusLabel = status.includes('expir') ? 'Expiring' : status === 'active' ? 'Active' : 'Inactive'
                    const statusClassName = statusLabel.toLowerCase()

                    return (
                      <div className="plan-subscriber-row" key={tenant.id}>
                        <strong>{tenant.name}</strong>
                        <code>{tenant.domain || '-'}</code>
                        <div className="subscriber-usage-cell">
                          <span><b>{tenant.userQuotaUsed}/{staffLimit || 'Unlimited'}</b><small>{staffPercent}%</small></span>
                          <i><em style={{ width: `${staffPercent}%` }} /></i>
                        </div>
                        <div className="subscriber-usage-cell">
                          <span><b>{jobUsage.used}/{jobUsage.limit}</b><small>{jobUsage.percent}%</small></span>
                          <i><em style={{ width: `${jobUsage.percent}%` }} /></i>
                        </div>
                        <span>{formatPlanDate(tenant.expirationDate) || tenant.expirationDate || '-'}</span>
                        <em className={statusClassName}>{statusLabel}</em>
                      </div>
                    )
                  })}

                  <footer>
                    <span>Showing {matchingTenants.length} of {subscriberTotalCount} subscribers</span>
                    <div>
                      <button type="button" disabled={subscriberPage === 1} onClick={() => setSubscriberPage((page) => Math.max(1, page - 1))}><i className="fa-solid fa-chevron-left"></i></button>
                      {Array.from({ length: subscriberPageCount }, (_, index) => index + 1).map((page) => (
                        <button type="button" className={subscriberPage === page ? 'active' : ''} key={page} onClick={() => setSubscriberPage(page)}>{page}</button>
                      ))}
                      <button type="button" disabled={subscriberPage === subscriberPageCount} onClick={() => setSubscriberPage((page) => Math.min(subscriberPageCount, page + 1))}><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                  </footer>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    )
  }

  if (activeView === 'edit') {
    const selectedPlan = selectedPlanDetail
    const assignedTenantCount = 0
    const activeAssignedTenantCount = 0

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
          updateSubscriptionPlanDetailUrl(selectedPlan.id)
        }}
        onSaved={() => {
          setRefreshPlansKey((value) => value + 1)
          setActiveView('detail')
          updateSubscriptionPlanDetailUrl(selectedPlan.id)
        }}
        triggerToast={triggerToast}
      />
    )
  }

  return (
    <div className="role-content subscription-plans-content">
      <AdminBreadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Subscription Plans' }]} />

      <div className="subscription-title-row">
        <div>
          <h1>Subscription Plans</h1>
          <p>Manage tier configurations and global recruitment limits for platform customers.</p>
        </div>
        <button type="button" onClick={openPlanCreate}>Create New Plan</button>
      </div>

      <div className="role-metrics subscription-plan-metrics">
        <article className="role-metric subscription-plan-card">
          <small>Active Plans</small>
          <strong>{planStatsActivePlans}</strong>
          <em><i className="fa-solid fa-arrow-trend-up"></i> {planStatsTotalPlans} total plans</em>
        </article>
        <article className="role-metric subscription-plan-card">
          <small>Top Tier</small>
          <strong>{planStatsTopTierName}</strong>
          <p><i className="fa-solid fa-users"></i> {planStatsTopTierStaffLabel} accounts</p>
        </article>
        <article className="role-metric subscription-plan-card">
          <small>Monthly Active Plan Revenue</small>
          <strong>{planStatsMonthlyRevenueLabel}</strong>
          <p><i className="fa-solid fa-arrow-trend-up"></i> {planStatsMonthlyTrendLabel}</p>
        </article>
        <article className="role-metric subscription-plan-card recommendation">
          <small>Renewal Rate</small>
          <strong>{planStatsRenewalRateLabel}</strong>
          <p><i className="fa-solid fa-arrow-trend-up"></i> {planStatsRenewalTrendLabel}</p>
        </article>
      </div>

      <section className="subscription-table-card">
        <div className="subscription-table-toolbar">
          <label>
            <i className="fa-solid fa-arrow-up-wide-short"></i>
            <span>Sort by</span>
            <select
              value={planSort}
              onChange={(event) => {
                setPlanSort(event.target.value as PlanSortOption)
                setPlanPage(1)
              }}
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Time: Newest First</option>
              <option value="oldest">Time: Oldest First</option>
            </select>
          </label>
        </div>

        <div className="subscription-table-row subscription-table-head">
          <span>Plan Name</span>
          <span>Monthly Price</span>
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
                  <strong>{plan.name}</strong>
                  <span className="subscription-price-cell">{plan.priceLabel || `$${plan.monthlyPrice.toFixed(2)} / month`}</span>
                  <span>{plan.staffAccountUnlimited ? 'Unlimited' : `${plan.maxStaffAccount} Accounts`}</span>
                  <span>{plan.activeJobPostingUnlimited ? 'Unlimited' : `${plan.maxActiveJobPosting} Active`}</span>
                  <em className={isActive ? 'active' : 'inactive'}>{isActive ? 'Active' : 'Inactive'}</em>
                  <span className="subscription-table-actions">
                    <button
                      type="button"
                      aria-label={`Edit ${plan.name}`}
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
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <footer>
          <span>Showing {visiblePlanStart}-{visiblePlanEnd} of {plans.length} plan{plans.length === 1 ? '' : 's'}</span>
          <div>
            <button type="button" disabled={safePlanPage === 1} onClick={() => setPlanPage((page) => Math.max(1, page - 1))}><i className="fa-solid fa-chevron-left"></i></button>
            {Array.from({ length: planPageCount }, (_, index) => (
              <button
                type="button"
                className={safePlanPage === index + 1 ? 'active' : ''}
                key={index + 1}
                onClick={() => setPlanPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button type="button" disabled={safePlanPage === planPageCount} onClick={() => setPlanPage((page) => Math.min(planPageCount, page + 1))}><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </footer>
      </section>
    </div>
  )
}
