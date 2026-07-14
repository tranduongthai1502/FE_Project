import { useEffect, useState, type FormEvent } from 'react'
import { adminApi } from '../../services/adminApi'
import type { CreatePlanPayload, SubscriptionPlan, Tenant, UpdatePlanPayload } from '../../types/admin.types'
import { formatFeatureLabel, formatPlanDate } from '../../utils/adminFormatters'
import { getSubscriptionPlanIdFromUrl, isSubscriptionPlanCreateUrl, isSubscriptionPlanEditUrl, updateSubscriptionPlanCreateUrl, updateSubscriptionPlanDetailUrl, updateSubscriptionPlanEditUrl, updateSuperAdminViewUrl } from '../../utils/adminRouteHelpers'
import { ConfirmActionModal } from '../shared/ConfirmActionModal'

const planFeatureDefaults = [
  {
    key: 'aiJdGenerator',
    code: 'AI_JD_GENERATOR',
    icon: 'fa-briefcase-medical',
    title: 'AI JD Generator',
    description: 'Auto-generate job descriptions with AI.',
    enabled: true,
  },
  {
    key: 'aiCvParsing',
    code: 'AI_CV_PARSING',
    icon: 'fa-file-code',
    title: 'AI CV Parsing',
    description: 'Extract data from resumes automatically.',
    enabled: true,
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
    enabled: true,
  },
  {
    key: 'prioritySupport',
    code: 'PRIORITY_SUPPORT',
    icon: 'fa-headset',
    title: 'Priority Support',
    description: '24/7 dedicated account manager.',
    enabled: true,
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
    enabled: true,
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
  return /^\d+$/.test(trimmedValue) && Number(trimmedValue) >= 0
}

function hasFeatureChanges(features: typeof planFeatureDefaults) {
  return features.some((feature, index) => feature.enabled !== planFeatureDefaults[index]?.enabled)
}

type PlanSortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest'

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
  const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false)
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
    if (!planName.trim()) {
      nextFieldErrors.planName = 'Please fill in all required fields.'
    } else if (existingPlans.some((plan) => plan.name.trim().toLowerCase() === planName.trim().toLowerCase())) {
      nextFieldErrors.planName = 'A plan with this name already exists. Please choose a different name.'
    }

    if (!description.trim()) {
      nextFieldErrors.description = 'Please fill in all required fields.'
    }

    if (!isValidCreatePlanPrice(monthlyPrice)) {
      nextFieldErrors.monthlyPrice = 'Please enter a valid price.'
    }

    if (!isStaffUnlimited && !isValidCreatePlanLimit(maxStaffAccount)) {
      nextFieldErrors.maxStaffAccount = 'Please enter a valid number or select Unlimited.'
    }

    if (!isJobsUnlimited && !isValidCreatePlanLimit(maxActiveJobPosting)) {
      nextFieldErrors.maxActiveJobPosting = 'Please enter a valid number or select Unlimited.'
    }

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    if (!features.some((feature) => feature.enabled)) {
      setPlanError('Please enable at least one feature for this plan.')
      return
    }

    setIsCreateConfirmOpen(true)
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
      setIsCreateConfirmOpen(false)
      triggerToast?.('Subscription plan saved successfully', 'success')
      onCreated()
    } catch (error) {
      setIsCreateConfirmOpen(false)
      setPlanError(error instanceof Error ? error.message : 'Create plan failed')
      triggerToast?.('Error system. Please try again.', 'error')
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
      <div className="tenant-breadcrumb create-plan-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <button type="button" onClick={onHome}>Home</button>
        <i className="fa-solid fa-chevron-right"></i>
        <button type="button" onClick={onBack}>Subscription Plans</button>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Create New Plan</strong>
      </div>

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
                setPlanName(event.target.value)
                if (fieldErrors.planName) setFieldErrors((current) => ({ ...current, planName: '' }))
              }}
              placeholder="Plan Name"
              maxLength={255}
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

        {planError === 'Please enable at least one feature for this plan.' && (
          <p className="create-plan-error feature-permission-error">{planError}</p>
        )}
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
      </section>

      {planError && planError !== 'Please enable at least one feature for this plan.' && <p className="create-plan-error">{planError}</p>}

      <footer className="create-plan-actions">
        <button type="button" onClick={handleCancelCreatePlan} disabled={isSavingPlan}>Cancel</button>
        <button type="submit" disabled={isSavingPlan}>{isSavingPlan ? 'Saving...' : 'Save'}</button>
      </footer>

      {isCreateConfirmOpen && (
        <ConfirmActionModal
          isSubmitting={isSavingPlan}
          onCancel={() => {
            if (!isSavingPlan) setIsCreateConfirmOpen(false)
          }}
          onConfirm={confirmCreatePlan}
        />
      )}

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
  triggerToast,
}: {
  plan: SubscriptionPlan
  onBack: () => void
  onHome: () => void
  onPlans: () => void
  onSaved: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const [planName, setPlanName] = useState(plan.name)
  const [description, setDescription] = useState(plan.description)
  const [monthlyPrice, setMonthlyPrice] = useState(plan.monthlyPrice.toFixed(2))
  const [maxStaffAccount, setMaxStaffAccount] = useState(String(plan.maxStaffAccount || ''))
  const [maxActiveJobPosting, setMaxActiveJobPosting] = useState(String(plan.maxActiveJobPosting || ''))
  const [features, setFeatures] = useState(() => getPlanFeatureState(plan))
  const [isStaffUnlimited, setIsStaffUnlimited] = useState(plan.staffAccountUnlimited)
  const [isJobsUnlimited, setIsJobsUnlimited] = useState(plan.activeJobPostingUnlimited)
  const [isActive, setIsActive] = useState(plan.status.toLowerCase() === 'active')
  const [planError, setPlanError] = useState('')
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  const toggleFeature = (key: string) => {
    setFeatures((current) => current.map((feature) => (
      feature.key === key ? { ...feature, enabled: !feature.enabled } : feature
    )))
  }

  const handleSavePlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPlanError('')

    if (!planName.trim() || !description.trim() || !monthlyPrice.trim()) {
      setPlanError('Please fill in all required fields.')
      return
    }

    if (!isStaffUnlimited && !maxStaffAccount.trim()) {
      setPlanError('Please enter max staff accounts or enable unlimited.')
      return
    }

    if (!isJobsUnlimited && !maxActiveJobPosting.trim()) {
      setPlanError('Please enter max active job postings or enable unlimited.')
      return
    }

    const payload: UpdatePlanPayload = {
      "name": planName,
      "description": description,
      "monthlyPrice": Number(monthlyPrice || 0),
      "maxStaffAccount": isStaffUnlimited ? null : Number(maxStaffAccount || 0),
      "staffAccountUnlimited": isStaffUnlimited,
      "maxActiveJobPosting": isJobsUnlimited ? null : Number(maxActiveJobPosting || 0),
      "activeJobPostingUnlimited": isJobsUnlimited,
      "status": isActive ? 'ACTIVE' : 'INACTIVE',
      "features": features.map((feature) => ({
        "key": feature.code,
        "status": feature.enabled ? 'ENABLED' : 'DISABLED',
      })),
    }

    setIsSavingPlan(true)
    try {
      await adminApi.updatePlan(plan.id, payload)
      triggerToast?.('Subscription plan updated successfully', 'success')
      onSaved()
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : 'Update plan failed')
      triggerToast?.('Error system. Please try again.', 'error')
    } finally {
      setIsSavingPlan(false)
    }
  }

  const initialFeatures = getPlanFeatureState(plan)
  const hasDraftChanges = Boolean(
    planName !== plan.name ||
    description !== plan.description ||
    monthlyPrice !== plan.monthlyPrice.toFixed(2) ||
    maxStaffAccount !== String(plan.maxStaffAccount || '') ||
    maxActiveJobPosting !== String(plan.maxActiveJobPosting || '') ||
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

  return (
    <form className="role-content edit-plan-content" onSubmit={handleSavePlan}>
      <div className="tenant-breadcrumb create-plan-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <button type="button" onClick={onHome}>Home</button>
        <i className="fa-solid fa-chevron-right"></i>
        <button type="button" onClick={onPlans}>Subscription Plans</button>
        <i className="fa-solid fa-chevron-right"></i>
        <button type="button" onClick={onBack}>Plan Detail</button>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Edit Plan</strong>
      </div>

      <div className="edit-plan-layout">
        <div className="edit-plan-main">
          <section className="create-plan-card edit-plan-card">
            <h2><i className="fa-solid fa-list-check"></i> General Configuration</h2>
            <div className="create-plan-divider" />
            <div className="edit-plan-general-grid">
              <label>
                <span>Plan Name <span className="required-mark">*</span></span>
                <input value={planName} onChange={(event) => setPlanName(event.target.value)} required />
              </label>
              <label>
                <span>Short Tagline <span className="required-mark">*</span></span>
                <input value={description} onChange={(event) => setDescription(event.target.value)} required />
              </label>
              <div className="edit-price-status-row">
                <label>
                  <span>Monthly Price (USD) <span className="required-mark">*</span></span>
                  <div className="price-input">
                    <span>$</span>
                    <input type="number" min="0" step="0.01" value={monthlyPrice} onChange={(event) => setMonthlyPrice(event.target.value)} required />
                  </div>
                </label>
                <button type="button" className={`mini-toggle ${isActive ? 'active' : ''}`} onClick={() => setIsActive((value) => !value)} aria-pressed={isActive}>
                  <span />
                </button>
                <strong>Active Status</strong>
              </div>
            </div>
            {planError && <p className="create-plan-error">{planError}</p>}
          </section>

          <section className="create-plan-card edit-plan-card">
            <h2><i className="fa-solid fa-chart-simple"></i> Resource Limits</h2>
            <div className="create-plan-divider" />
            <div className="edit-resource-list">
              <article>
                <i className="fa-solid fa-id-card-clip"></i>
                <div>
                  <strong>Max Staff Accounts <span className="required-mark">*</span></strong>
                  <p>Number of administrative users allowed</p>
                </div>
                <input type="number" min="0" value={maxStaffAccount} onChange={(event) => setMaxStaffAccount(event.target.value)} disabled={isStaffUnlimited} />
                <button type="button" className={`mini-toggle ${isStaffUnlimited ? 'active' : ''}`} onClick={() => setIsStaffUnlimited((value) => !value)} aria-pressed={isStaffUnlimited}>
                  <span />
                </button>
                <em>Unlimited</em>
              </article>
              <article>
                <i className="fa-solid fa-briefcase"></i>
                <div>
                  <strong>Max Active Job Postings <span className="required-mark">*</span></strong>
                  <p>Concurrent open roles allowed per tenant</p>
                </div>
                <input type="number" min="0" value={maxActiveJobPosting} onChange={(event) => setMaxActiveJobPosting(event.target.value)} disabled={isJobsUnlimited} />
                <button type="button" className={`mini-toggle ${isJobsUnlimited ? 'active' : ''}`} onClick={() => setIsJobsUnlimited((value) => !value)} aria-pressed={isJobsUnlimited}>
                  <span />
                </button>
                <em>Unlimited</em>
              </article>
            </div>
          </section>
        </div>

        <section className="create-plan-card edit-plan-card edit-feature-panel">
          <h2><i className="fa-solid fa-bolt"></i> Plan Features <small>AI ENABLED</small></h2>
          <div className="edit-feature-list">
            {features.map((feature) => (
              <article key={feature.key} className={feature.enabled ? '' : 'disabled'}>
                <span><i className={`fa-solid ${feature.icon}`}></i>{feature.title}</span>
                <button type="button" className={`feature-toggle ${feature.enabled ? 'active' : ''}`} onClick={() => toggleFeature(feature.key)} aria-pressed={feature.enabled} aria-label={`Toggle ${feature.title}`}>
                  <span />
                </button>
              </article>
            ))}
          </div>
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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [planListError, setPlanListError] = useState('')
  const [refreshPlansKey, setRefreshPlansKey] = useState(0)
  const [planPage, setPlanPage] = useState(1)
  const [planSort, setPlanSort] = useState<PlanSortOption>('newest')

  useEffect(() => {
    if (activeView !== 'list' && activeView !== 'detail' && activeView !== 'edit' && activeView !== 'create') return

    let isActive = true
    setIsLoadingPlans(true)
    setPlanListError('')

    adminApi.getSubscriptionPlans()
      .then((items) => {
        if (isActive) {
          setPlans(items)
        }
      })
      .catch((error) => {
        if (isActive) {
          setPlanListError(error instanceof Error ? error.message : 'Load subscription plans failed')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingPlans(false)
        }
      })

    adminApi.getTenants()
      .then((tenantItems) => {
        if (isActive) {
          setTenants(tenantItems)
        }
      })
      .catch(() => {
        if (isActive) {
          setTenants([])
        }
      })

    return () => {
      isActive = false
    }
  }, [activeView, refreshPlansKey])

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

  useEffect(() => {
    setPlanPage(1)
  }, [plans.length])

  const activePlansCount = plans.filter((plan) => plan.status.toLowerCase() === 'active').length
  const topTier = plans.reduce<SubscriptionPlan | null>((current, plan) => (
    !current || plan.monthlyPrice > current.monthlyPrice ? plan : current
  ), null)
  const averageRevenue = plans.length
    ? Math.round(plans.reduce((total, plan) => total + plan.monthlyPrice, 0) / plans.length)
    : 0
  const sortedPlans = [...plans].sort((firstPlan, secondPlan) => {
    if (planSort === 'price-asc') return firstPlan.monthlyPrice - secondPlan.monthlyPrice
    if (planSort === 'price-desc') return secondPlan.monthlyPrice - firstPlan.monthlyPrice

    const firstTime = new Date(firstPlan.createdAt).getTime() || 0
    const secondTime = new Date(secondPlan.createdAt).getTime() || 0
    return planSort === 'newest' ? secondTime - firstTime : firstTime - secondTime
  })
  const planPageSize = 8
  const planPageCount = Math.max(1, Math.ceil(sortedPlans.length / planPageSize))
  const safePlanPage = Math.min(planPage, planPageCount)
  const pagedPlans = sortedPlans.slice((safePlanPage - 1) * planPageSize, safePlanPage * planPageSize)
  const visiblePlanStart = sortedPlans.length === 0 ? 0 : (safePlanPage - 1) * planPageSize + 1
  const visiblePlanEnd = Math.min(safePlanPage * planPageSize, sortedPlans.length)
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
    setActiveView('detail')
    updateSubscriptionPlanDetailUrl(planId)
  }

  const openPlanEdit = (planId: string) => {
    setSelectedPlanId(planId)
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
    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId)
    const matchingTenants = selectedPlan
      ? tenants.filter((tenant) => (
        tenant.subscriptionPlanId === selectedPlan.id ||
        tenant.subscriptionPlan.toLowerCase() === selectedPlan.name.toLowerCase()
      ))
      : []

    return (
      <div className="role-content subscription-plan-detail-content">
        <div className="tenant-breadcrumb">
          <i className="fa-solid fa-house"></i>
          <button type="button" onClick={onHome}>Home</button>
          <i className="fa-solid fa-chevron-right"></i>
          <button type="button" onClick={closePlanDetail}>Subscription Plans</button>
          <i className="fa-solid fa-chevron-right"></i>
          <strong>Plan Detail</strong>
        </div>

        {isLoadingPlans ? (
          <div className="subscription-table-state">Loading plan details...</div>
        ) : planListError ? (
          <div className="subscription-table-state error">{planListError}</div>
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
                <p>{selectedPlan.description || 'Manage configuration and monitor active subscribers for this subscription plan.'}</p>
              </div>
              <div className="plan-detail-title-actions">
                <button type="button" onClick={() => openPlanEdit(selectedPlan.id)}>Edit</button>
              </div>
            </div>

            <section className="plan-detail-card plan-configuration-card">
              <h2>Plan Configuration</h2>
              <div className="plan-config-grid">
                <div>
                  <span>Tagline</span>
                  <strong>{selectedPlan.description || '-'}</strong>
                </div>
                <div>
                  <span>Base Price</span>
                  <strong className="price">{selectedPlan.priceLabel || `$${selectedPlan.monthlyPrice.toFixed(2)} / mo`}</strong>
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
                    {selectedPlan.features.length > 0 ? (
                      selectedPlan.features.map((feature) => (
                        <em key={feature.key} className={feature.status.toLowerCase() === 'enabled' ? 'enabled' : 'disabled'}>
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

            <section className="plan-detail-card active-subscribers-card">
              <div className="plan-detail-card-head">
                <h2>Active Subscribers</h2>
                <div>
                  <i className="fa-solid fa-filter"></i>
                  <i className="fa-solid fa-download"></i>
                </div>
              </div>

              {matchingTenants.length === 0 ? (
                <div className="plan-no-tenants">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>No tenants found.</span>
                </div>
              ) : (
                <div className="plan-tenant-list">
                  {matchingTenants.map((tenant) => (
                    <div className="plan-tenant-row" key={tenant.id}>
                      <strong>{tenant.name}</strong>
                      <span>{tenant.status}</span>
                      <span>{tenant.userQuotaUsed}/{tenant.userQuotaLimit || 'Unlimited'} users</span>
                      <span>{tenant.expirationDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    )
  }

  if (activeView === 'edit') {
    const selectedPlan = plans.find((plan) => plan.id === selectedPlanId)

    if (isLoadingPlans) {
      return (
      <div className="role-content subscription-plan-detail-content">
        <div className="subscription-table-state">Loading plan details...</div>
      </div>
    )
    }

    if (planListError || !selectedPlan) {
      return (
        <div className="role-content subscription-plan-detail-content">
          <div className={`subscription-table-state ${planListError ? 'error' : ''}`}>
            {planListError || 'Plan not found.'}
          </div>
        </div>
      )
    }

    return (
      <EditPlanDetailView
        plan={selectedPlan}
        onHome={onHome}
        onPlans={openPlanList}
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
      <div className="tenant-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <button type="button" onClick={onHome}>Home</button>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Subscription Plans</strong>
      </div>

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
          <strong>{activePlansCount}</strong>
          <em><i className="fa-solid fa-arrow-trend-up"></i> {plans.length} total plans</em>
        </article>
        <article className="role-metric subscription-plan-card">
          <small>Top Tier</small>
          <strong>{topTier?.name || '-'}</strong>
          <p><i className="fa-solid fa-users"></i> {topTier?.staffAccountUnlimited ? 'Unlimited' : `${topTier?.maxStaffAccount || 0} staff`} accounts</p>
        </article>
        <article className="role-metric subscription-plan-card">
          <small>Monthly Active Plan Revenue</small>
          <strong>${averageRevenue}</strong>
          <p><i className="fa-solid fa-wand-magic-sparkles"></i> Tier Optimization: High</p>
        </article>
        <article className="role-metric subscription-plan-card recommendation">
          <small>Renewal Rate</small>
          <p>Adjust Starter pricing for better conversion.</p>
          <a href="#insights">View insights <i className="fa-solid fa-arrow-right"></i></a>
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
                  <span className="subscription-price-cell">{plan.priceLabel || `$${plan.monthlyPrice.toFixed(2)} / mo`}</span>
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
