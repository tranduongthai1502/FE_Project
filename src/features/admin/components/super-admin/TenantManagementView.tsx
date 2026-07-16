import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { adminApi } from '../../services/adminApi'
import type { CreateTenantForm, SubscriptionPlan, Tenant } from '../../types/admin.types'
import { formatPlanDate } from '../../utils/adminFormatters'
import { getTenantDetailIdFromUrl, isTenantCreateUrl, updateSuperAdminViewUrl, updateTenantCreateUrl, updateTenantDetailUrl } from '../../utils/adminRouteHelpers'
import { ConfirmActionModal } from '../shared/ConfirmActionModal'
import { CreateTenantPage } from '../shared/CreateTenantPage'
import { MetricCard } from '../shared/MetricCard'
import styles from './TenantManagementView.module.css'

type TenantStatusFilter = 'all' | 'active' | 'inactive' | 'plan'

const emptyTenantForm: CreateTenantForm = {
  companyName: '',
  domain: '',
  industry: '',
  region: '',
  planId: '',
  adminFullName: '',
  adminEmail: '',
}

export function TenantManagementView({ triggerToast }: { triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const [activeView, setActiveView] = useState<'list' | 'detail'>(() => (
    getTenantDetailIdFromUrl() ? 'detail' : 'list'
  ))
  const [selectedTenantId, setSelectedTenantId] = useState(() => getTenantDetailIdFromUrl())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(() => isTenantCreateUrl())
  const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false)
  const [isCreateCancelConfirmOpen, setIsCreateCancelConfirmOpen] = useState(false)
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false)
  const [isPlanConfirmOpen, setIsPlanConfirmOpen] = useState(false)
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false)
  const [isUpdatingTenantStatus, setIsUpdatingTenantStatus] = useState(false)
  const [isUpdatingTenantPlan, setIsUpdatingTenantPlan] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [tenantError, setTenantError] = useState('')
  const [tenantListError, setTenantListError] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantStatusFilter, setTenantStatusFilter] = useState<TenantStatusFilter>('all')
  const [tenantPlanFilter, setTenantPlanFilter] = useState('')
  const [tenantSearchQuery, setTenantSearchQuery] = useState('')
  const [tenantPage, setTenantPage] = useState(1)
  const [refreshTenantsKey, setRefreshTenantsKey] = useState(0)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [pendingTenantPlanId, setPendingTenantPlanId] = useState('')
  const [tenantForm, setTenantForm] = useState<CreateTenantForm>(emptyTenantForm)

  useEffect(() => {
    let isActive = true
    setIsLoadingTenants(true)
    setTenantListError('')

    adminApi.getTenants()
      .then((items) => {
        if (isActive) {
          setTenants(items)
        }
      })
      .catch((error) => {
        if (isActive) {
          setTenantListError(error instanceof Error ? error.message : 'Load tenants failed')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingTenants(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [refreshTenantsKey])

  useEffect(() => {
    let isActive = true
    setIsLoadingPlans(true)

    adminApi.getSubscriptionPlans()
      .then((plans) => {
        if (isActive) {
          setSubscriptionPlans(plans)
        }
      })
      .catch(() => {
        if (isActive) {
          setSubscriptionPlans([])
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
  }, [])

  useEffect(() => {
    if (!isCreateModalOpen || subscriptionPlans.length > 0) return

    let isActive = true
    setIsLoadingPlans(true)
    setTenantError('')

    adminApi.getSubscriptionPlans()
      .then((plans) => {
        if (!isActive) return
        setSubscriptionPlans(plans)
        setTenantForm((current) => ({
          ...current,
          planId: current.planId || plans[0]?.id || '',
        }))
        if (plans.length === 0) {
          setTenantError('No subscription plans found.')
        }
      })
      .catch((error) => {
        if (!isActive) return
        setTenantError(error instanceof Error ? error.message : 'Load subscription plans failed')
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingPlans(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [isCreateModalOpen, subscriptionPlans.length])

  useEffect(() => {
    const handlePopState = () => {
      const tenantId = getTenantDetailIdFromUrl()
      setSelectedTenantId(tenantId)
      setActiveView(tenantId ? 'detail' : 'list')
      setIsCreateModalOpen(isTenantCreateUrl())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const updateTenantForm = (field: keyof CreateTenantForm, value: string) => {
    setTenantError('')
    setTenantForm((current) => ({ ...current, [field]: value }))
  }

  const confirmCloseCreateModal = () => {
    setIsCreateModalOpen(false)
    setIsCreateConfirmOpen(false)
    setIsCreateCancelConfirmOpen(false)
    setTenantError('')
    setTenantForm(emptyTenantForm)
    updateSuperAdminViewUrl('tenantManagement')
  }

  const hasTenantDraftChanges = Boolean(
    tenantForm.companyName.trim() ||
    tenantForm.domain.trim() ||
    tenantForm.industry.trim() ||
    tenantForm.region.trim() ||
    tenantForm.adminFullName.trim() ||
    tenantForm.adminEmail.trim(),
  )

  const requestCloseCreateModal = () => {
    if (isSubmittingTenant) return
    if (hasTenantDraftChanges) {
      setIsCreateCancelConfirmOpen(true)
      return
    }

    confirmCloseCreateModal()
  }

  const handleCreateTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTenantError('')

    if (!tenantForm.companyName.trim() || !tenantForm.domain.trim() || !tenantForm.industry.trim() || !tenantForm.region.trim() || !tenantForm.planId || !tenantForm.adminFullName.trim() || !tenantForm.adminEmail.trim()) {
      setTenantError('Please fill in all required fields.')
      return
    }

    setIsCreateConfirmOpen(true)
  }

  const confirmCreateTenant = async () => {
    setIsSubmittingTenant(true)

    try {
      await adminApi.createTenant(tenantForm)
      setTenantForm(emptyTenantForm)
      setIsCreateModalOpen(false)
      setIsCreateConfirmOpen(false)
      updateSuperAdminViewUrl('tenantManagement')
      setRefreshTenantsKey((value) => value + 1)
      triggerToast?.('Tenant create successfully. Activation email send to Tenant Admin', 'success')
    } catch (error) {
      setIsCreateConfirmOpen(false)
      setTenantError(error instanceof Error ? error.message : 'Create tenant failed')
      triggerToast?.('Error system. Please try again', 'error')
    } finally {
      setIsSubmittingTenant(false)
    }
  }

  const activeTenantCount = useMemo(() => (
    tenants.filter((tenant) => tenant.status.toLowerCase() === 'active').length
  ), [tenants])
  const inactiveTenantCount = tenants.length - activeTenantCount
  const planById = useMemo(() => (
    new Map(subscriptionPlans.map((plan) => [plan.id, plan]))
  ), [subscriptionPlans])
  const planByName = useMemo(() => (
    new Map(subscriptionPlans.map((plan) => [plan.name.toLowerCase(), plan]))
  ), [subscriptionPlans])
  const highestMonthlyPrice = useMemo(() => (
    Math.max(0, ...subscriptionPlans.map((plan) => plan.monthlyPrice || 0))
  ), [subscriptionPlans])
  const highestPlanIds = useMemo(() => (
    new Set(
      subscriptionPlans
        .filter((plan) => plan.monthlyPrice > 0 && plan.monthlyPrice === highestMonthlyPrice)
        .map((plan) => plan.id),
    )
  ), [highestMonthlyPrice, subscriptionPlans])
  const highestPlanNames = useMemo(() => (
    new Set(
      subscriptionPlans
        .filter((plan) => plan.monthlyPrice > 0 && plan.monthlyPrice === highestMonthlyPrice)
        .map((plan) => plan.name.toLowerCase()),
    )
  ), [highestMonthlyPrice, subscriptionPlans])
  const totalRevenue = useMemo(() => (
    tenants.reduce((total, tenant) => {
      const plan = tenant.subscriptionPlanId
        ? planById.get(tenant.subscriptionPlanId)
        : planByName.get(tenant.subscriptionPlan.toLowerCase())

      return total + (plan?.monthlyPrice || 0)
    }, 0)
  ), [planById, planByName, tenants])
  const metricsAreLoading = isLoadingTenants || isLoadingPlans
  const getTenantPlan = (tenant: Tenant) => (
    tenant.subscriptionPlanId
      ? planById.get(tenant.subscriptionPlanId)
      : planByName.get(tenant.subscriptionPlan.toLowerCase())
  )
  const selectedTenant = useMemo(() => (
    tenants.find((tenant) => tenant.id === selectedTenantId)
  ), [selectedTenantId, tenants])
  const selectedTenantPlan = selectedTenant ? getTenantPlan(selectedTenant) : undefined

  useEffect(() => {
    if (activeView !== 'detail' || !selectedTenant) {
      setPendingTenantPlanId('')
      return
    }

    setPendingTenantPlanId(selectedTenant.subscriptionPlanId || selectedTenantPlan?.id || '')
  }, [activeView, selectedTenant, selectedTenantPlan?.id])

  const isHighestPricedPlan = (tenant: Tenant, plan?: SubscriptionPlan) => {
    if (plan) {
      return highestPlanIds.has(plan.id)
    }

    return highestPlanNames.has(tenant.subscriptionPlan.toLowerCase())
  }
  const getTenantAdminPayload = (tenant: Tenant) => ({
    adminFullName: tenant.adminFullName || 'Tenant Admin',
    adminEmail: tenant.adminEmail || `admin@${tenant.domain || 'tenant'}.com`,
  })
  const planFilterOptions = useMemo(() => {
    const optionsByKey = new Map<string, string>()

    subscriptionPlans.forEach((plan) => {
      optionsByKey.set(plan.id, plan.name)
    })

    tenants.forEach((tenant) => {
      const plan = getTenantPlan(tenant)
      const key = plan?.id || tenant.subscriptionPlan
      const label = plan?.name || tenant.subscriptionPlan

      if (key && label && label !== '-') {
        optionsByKey.set(key, label)
      }
    })

    return Array.from(optionsByKey.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label))
  }, [planById, planByName, subscriptionPlans, tenants])
  const filteredTenants = useMemo(() => {
    const normalizedSearch = tenantSearchQuery.trim().toLowerCase()

    return tenants.filter((tenant) => {
      const plan = getTenantPlan(tenant)
      const planName = plan?.name || tenant.subscriptionPlan || ''
      const planKey = plan?.id || tenant.subscriptionPlan
      const status = tenant.status.toLowerCase()
      const matchesStatus =
        tenantStatusFilter === 'all' ||
        tenantStatusFilter === 'plan' ||
        (tenantStatusFilter === 'active' && status === 'active') ||
        (tenantStatusFilter === 'inactive' && status !== 'active')
      const matchesPlan = tenantStatusFilter !== 'plan' || !tenantPlanFilter || planKey === tenantPlanFilter
      const matchesSearch = !normalizedSearch || [
        tenant.name,
        tenant.domain || '',
        tenant.id,
        planName,
        tenant.status,
      ].some((value) => value.toLowerCase().includes(normalizedSearch))

      return matchesStatus && matchesPlan && matchesSearch
    })
  }, [planById, planByName, tenantPlanFilter, tenantSearchQuery, tenantStatusFilter, tenants])
  const tenantsPerPage = 5
  const tenantPageCount = Math.max(1, Math.ceil(filteredTenants.length / tenantsPerPage))
  const currentTenantPage = Math.min(tenantPage, tenantPageCount)
  const paginatedTenants = filteredTenants.slice(
    (currentTenantPage - 1) * tenantsPerPage,
    currentTenantPage * tenantsPerPage,
  )
  const tenantDisplayStart = filteredTenants.length === 0 ? 0 : ((currentTenantPage - 1) * tenantsPerPage) + 1
  const tenantDisplayEnd = Math.min(currentTenantPage * tenantsPerPage, filteredTenants.length)

  useEffect(() => {
    setTenantPage(1)
  }, [tenantPlanFilter, tenantSearchQuery, tenantStatusFilter, tenants.length])

  const selectTenantFilter = (filter: TenantStatusFilter) => {
    setTenantStatusFilter(filter)
    if (filter !== 'plan') {
      setTenantPlanFilter('')
    } else if (!tenantPlanFilter && planFilterOptions[0]) {
      setTenantPlanFilter(planFilterOptions[0].value)
    }
  }
  const selectPlanFilter = (planValue: string) => {
    if (!planValue) {
      selectTenantFilter('all')
      return
    }

    setTenantStatusFilter('plan')
    setTenantPlanFilter(planValue)
  }
  const openTenantDetail = (tenantId: string) => {
    setIsCreateModalOpen(false)
    setSelectedTenantId(tenantId)
    setActiveView('detail')
    updateTenantDetailUrl(tenantId)
  }
  const closeTenantDetail = () => {
    setSelectedTenantId('')
    setActiveView('list')
    updateSuperAdminViewUrl('tenantManagement')
  }
  const openCreateTenant = () => {
    setSelectedTenantId('')
    setActiveView('list')
    setIsCreateModalOpen(true)
    updateTenantCreateUrl()
  }
  const confirmUpdateTenantStatus = async () => {
    const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId)
    if (!selectedTenant) return

    const selectedPlan = getTenantPlan(selectedTenant)
    const nextStatus = selectedTenant.status.toLowerCase() === 'active' ? 'DISABLED' : 'ACTIVE'
    const planId = selectedTenant.subscriptionPlanId || selectedPlan?.id || ''

    setIsUpdatingTenantStatus(true)
    setTenantListError('')

    try {
      const tenantAdminPayload = getTenantAdminPayload(selectedTenant)
      await adminApi.updateTenant(selectedTenant.id, {
        companyName: selectedTenant.name,
        domain: selectedTenant.domain || selectedTenant.id,
        industry: selectedTenant.industry || 'Media & Advertising',
        region: selectedTenant.region || 'VietNam',
        status: nextStatus,
        planId,
        ...tenantAdminPayload,
      })
      setIsStatusConfirmOpen(false)
      setRefreshTenantsKey((value) => value + 1)
      triggerToast?.(
        nextStatus === 'DISABLED' ? 'Tenant admin account disabled successfully.' : 'Tenant admin account activated successfully.',
        'success',
      )
    } catch (error) {
      setTenantListError(error instanceof Error ? error.message : 'Update tenant status failed')
      triggerToast?.('Error system. Please try again', 'error')
    } finally {
      setIsUpdatingTenantStatus(false)
    }
  }
  const requestChangeTenantPlan = () => {
    if (!selectedTenant || !pendingTenantPlanId) return

    const currentPlanId = selectedTenant.subscriptionPlanId || selectedTenantPlan?.id || ''
    if (pendingTenantPlanId === currentPlanId) {
      return
    }

    setIsPlanConfirmOpen(true)
  }
  const confirmUpdateTenantPlan = async () => {
    if (!selectedTenant || !pendingTenantPlanId) return

    setIsUpdatingTenantPlan(true)
    setTenantListError('')

    try {
      const tenantAdminPayload = getTenantAdminPayload(selectedTenant)
      await adminApi.updateTenant(selectedTenant.id, {
        companyName: selectedTenant.name,
        domain: selectedTenant.domain || selectedTenant.id,
        industry: selectedTenant.industry || 'Media & Advertising',
        region: selectedTenant.region || 'VietNam',
        status: selectedTenant.status,
        planId: pendingTenantPlanId,
        ...tenantAdminPayload,
      })
      setIsPlanConfirmOpen(false)
      setRefreshTenantsKey((value) => value + 1)
      triggerToast?.('Subscription plan updated successfully.', 'success')
    } catch (error) {
      setTenantListError(error instanceof Error ? error.message : 'Update subscription plan failed')
      triggerToast?.('Error system. Please try again', 'error')
    } finally {
      setIsUpdatingTenantPlan(false)
    }
  }

  if (isCreateModalOpen) {
    return (
      <>
        <CreateTenantPage
          form={tenantForm}
          error={tenantError}
          plans={subscriptionPlans}
          isLoadingPlans={isLoadingPlans}
          isSubmitting={isSubmittingTenant}
          onChange={updateTenantForm}
          onClose={requestCloseCreateModal}
          onBackToList={requestCloseCreateModal}
          onSubmit={handleCreateTenant}
        />

        {isCreateConfirmOpen && (
          <ConfirmActionModal
            isSubmitting={isSubmittingTenant}
            title="Confirm Action"
            message="Are you sure you want to proceed? This action will create a new tenant."
            cancelLabel="Cancel"
            confirmLabel="Confirm"
            onCancel={() => setIsCreateConfirmOpen(false)}
            onConfirm={confirmCreateTenant}
          />
        )}

        {isCreateCancelConfirmOpen && (
          <ConfirmActionModal
            isSubmitting={false}
            title="Confirm Action"
            message="Are you sure you want to cancel? Your changes will not be saved."
            cancelLabel="Cancel"
            confirmLabel="Confirm"
            onCancel={() => setIsCreateCancelConfirmOpen(false)}
            onConfirm={confirmCloseCreateModal}
          />
        )}
      </>
    )
  }

  if (activeView === 'detail') {
    const selectedPlan = selectedTenantPlan
    const nextSelectedPlan = pendingTenantPlanId ? planById.get(pendingTenantPlanId) : undefined
    const currentPlanId = selectedTenant?.subscriptionPlanId || selectedPlan?.id || ''
    const hasSelectedDifferentPlan = Boolean(pendingTenantPlanId && pendingTenantPlanId !== currentPlanId)
    const isActive = selectedTenant?.status.toLowerCase() === 'active'
    const quotaLabel = selectedTenant
      ? selectedTenant.userQuotaLimit > 0
        ? `${selectedTenant.userQuotaUsed}/${selectedTenant.userQuotaLimit}`
        : String(selectedTenant.userQuotaUsed)
      : '-'
    const tenantDomain = selectedTenant?.domain ? `${selectedTenant.domain}.jobfusion.ai` : selectedTenant?.id || '-'
    const tenantIndustry = selectedTenant?.industry || 'Media & Advertising'
    const tenantRegion = selectedTenant?.region || 'VietNam'
    const tenantExpirationDate = selectedTenant ? formatPlanDate(selectedTenant.expirationDate) || selectedTenant.expirationDate : '-'
    const tenantCreatedDate = tenantExpirationDate !== '-' ? tenantExpirationDate : '-'
    const tenantAdminFullName = selectedTenant ? getTenantAdminPayload(selectedTenant).adminFullName : '-'
    const tenantAdminEmail = selectedTenant ? getTenantAdminPayload(selectedTenant).adminEmail : '-'

    return (
      <div className="role-content tenant-detail-content">
        <div className="tenant-breadcrumb">
          <i className="fa-solid fa-house"></i>
          <span>Home</span>
          <i className="fa-solid fa-chevron-right"></i>
          <button type="button" onClick={closeTenantDetail}>Tenant Management</button>
          <i className="fa-solid fa-chevron-right"></i>
          <strong>Tenant detail</strong>
        </div>

        {isLoadingTenants ? (
          <div className="tenant-list-table-state">Loading tenant details...</div>
        ) : tenantListError ? (
          <div className="tenant-list-table-state error">{tenantListError}</div>
        ) : !selectedTenant ? (
          <div className="tenant-list-table-state">Tenant not found.</div>
        ) : (
          <>
            <div className="tenant-detail-title-row">
              <div>
                <h1>{selectedTenant.name}</h1>
                <em className={isActive ? 'active' : 'inactive'}>{selectedTenant.status}</em>
              </div>
              <button type="button" onClick={() => setIsStatusConfirmOpen(true)} disabled={isUpdatingTenantStatus}>
                {isActive ? 'Deactivate Tenant' : 'Activate Tenant'}
              </button>
            </div>

            <div className="tenant-detail-grid">
              <section className="tenant-detail-card tenant-company-card">
                <header>
                  <span><i className="fa-regular fa-building"></i></span>
                  <h2>Company Information</h2>
                </header>
                <div className="tenant-detail-info-grid">
                  <div><small>Company Name</small><strong className="tenant-company-name-value">{selectedTenant.name}</strong></div>
                  <div><small>Domain</small><strong className="tenant-domain-link">{tenantDomain} <i className="fa-solid fa-arrow-up-right-from-square"></i></strong></div>
                  <div><small>Industry</small><strong>{tenantIndustry}</strong></div>
                  <div><small>Company Size</small><strong><i className="fa-solid fa-users"></i> {quotaLabel} Employees</strong></div>
                  <div><small>Created Date</small><strong>{tenantCreatedDate}</strong></div>
                  <div><small>Region</small><strong>{tenantRegion}</strong></div>
                </div>
              </section>

              <section className="tenant-detail-empty-card">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <strong>Usage data temporarily unavailable.</strong>
              </section>

              <section className="tenant-detail-card tenant-subscription-card">
                <header>
                  <span><i className="fa-regular fa-id-badge"></i></span>
                  <h2>Subscription Plan</h2>
                  <label className="tenant-plan-picker">
                    <i className="fa-solid fa-chevron-down tenant-plan-chevron"></i>
                    <select
                      aria-label="Select subscription plan"
                      value={pendingTenantPlanId}
                      onChange={(event) => setPendingTenantPlanId(event.target.value)}
                      disabled={isUpdatingTenantPlan || subscriptionPlans.length === 0}
                    >
                      {subscriptionPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={requestChangeTenantPlan} disabled={!hasSelectedDifferentPlan || isUpdatingTenantPlan}>
                    Change Plan
                  </button>
                </header>
                <strong className="tenant-plan-heading">{nextSelectedPlan?.name || selectedPlan?.name || selectedTenant.subscriptionPlan || '-'}</strong>
                <div className="tenant-subscription-metrics">
                  <div><small>Monthly Billing</small><strong>{(nextSelectedPlan || selectedPlan) ? `$${(nextSelectedPlan || selectedPlan)!.monthlyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</strong></div>
                  <div><small>Days Remaining</small><strong><i className="fa-regular fa-calendar-check"></i> 365 Days</strong></div>
                </div>
                <div className="tenant-subscription-lines">
                  <span>Start Date <strong>{tenantCreatedDate}</strong></span>
                  <span>ExpirationDate <strong>{tenantExpirationDate}</strong></span>
                </div>
              </section>

              <section className={`tenant-detail-card ${styles.tenantAdminCard}`}>
                <header>
                  <span><i className="fa-regular fa-calendar-check"></i></span>
                  <h2>Tenant Admin</h2>
                </header>
                <div className={styles.tenantAdminLayout}>
                  <div className={styles.tenantAdminAvatar}><i className="fa-regular fa-user"></i><b /></div>
                  <div><small>Full Name</small><strong>{tenantAdminFullName}</strong></div>
                  <div><small>Email Address</small><strong>{tenantAdminEmail}</strong></div>
                  <div><small>Current Status</small><em className={isActive ? styles.active : styles.inactive}>{selectedTenant.status}</em></div>
                  <div><small>Activated Date</small><strong>{tenantCreatedDate}</strong></div>
                </div>
              </section>
            </div>

            {isStatusConfirmOpen && (
              <ConfirmActionModal
                isSubmitting={isUpdatingTenantStatus}
                title="Confirm Action"
                message={`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this tenant admin account?`}
                cancelLabel="Cancel"
                confirmLabel="Confirm"
                submittingLabel={isActive ? 'Deactivating...' : 'Activating...'}
                onCancel={() => setIsStatusConfirmOpen(false)}
                onConfirm={confirmUpdateTenantStatus}
              />
            )}

            {isPlanConfirmOpen && (
              <ConfirmActionModal
                isSubmitting={isUpdatingTenantPlan}
                title="Confirm Action"
                message={`Are you sure you want to change the subscription plan for ${selectedTenant.name} to ${nextSelectedPlan?.name || 'the selected plan'}?`}
                cancelLabel="Cancel"
                confirmLabel="Confirm"
                submittingLabel="Updating..."
                onCancel={() => {
                  if (!isUpdatingTenantPlan) setIsPlanConfirmOpen(false)
                }}
                onConfirm={confirmUpdateTenantPlan}
              />
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="role-content tenant-management-content">
      <div className="tenant-breadcrumb">
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
        <i className="fa-solid fa-chevron-right"></i>
        <strong>Tenant Management</strong>
      </div>

      <section className="tenant-filter-card">
        <div className="tenant-filter-tabs">
          <button type="button" className={tenantStatusFilter === 'all' ? 'active' : ''} onClick={() => selectTenantFilter('all')}>All Tenants</button>
          <button type="button" className={tenantStatusFilter === 'active' ? 'active' : ''} onClick={() => selectTenantFilter('active')}>Active</button>
          <button type="button" className={tenantStatusFilter === 'inactive' ? 'active' : ''} onClick={() => selectTenantFilter('inactive')}>Inactive</button>
          <label className={`tenant-plan-filter-tab ${tenantStatusFilter === 'plan' ? 'active' : ''}`}>
            <select
              value={tenantStatusFilter === 'plan' ? tenantPlanFilter : ''}
              onChange={(event) => selectPlanFilter(event.target.value)}
              aria-label="Filter by plan"
            >
              <option value="">Filter by Plan</option>
              {planFilterOptions.map((plan) => (
                <option value={plan.value} key={plan.value}>{plan.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="tenant-filter-search">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="search"
            value={tenantSearchQuery}
            onChange={(event) => setTenantSearchQuery(event.target.value)}
            placeholder="Search tenants, plans, status..."
            aria-label="Tenant search"
          />
        </div>
        <button type="button" className="tenant-create-btn" onClick={openCreateTenant}>
          Create New Tenant
        </button>
      </section>

      <div className="role-metrics tenant-management-metrics">
        <MetricCard icon="fa-arrow-trend-up" label="Total Revenue" value={metricsAreLoading ? '...' : `$${totalRevenue.toLocaleString()}`} />
        <MetricCard icon="fa-building" label="Active Tenants" value={isLoadingTenants ? '...' : String(activeTenantCount)} />
        <MetricCard icon="fa-circle-notch" label="Total Tenants" value={isLoadingTenants ? '...' : String(tenants.length)} />
        <MetricCard icon="fa-triangle-exclamation" label="Inactive Tenants" value={isLoadingTenants ? '...' : String(inactiveTenantCount)} />
      </div>

      <section className="tenant-list-table-card">
        <div className="tenant-list-table-row tenant-list-table-head">
          <span>Full Name</span>
          <span>Subscription Plan</span>
          <span>Expiration Date</span>
          <span>User Quota</span>
          <span>Status</span>
          <span>Actions</span>
        </div>



        {isLoadingTenants ? (
          <div className="tenant-list-table-state">Loading tenants...</div>
        ) : tenantListError ? (
          <div className="tenant-list-table-state error">{tenantListError}</div>
        ) : filteredTenants.length === 0 ? (
          <div className="tenant-list-table-state">No tenants found.</div>
        ) : (
          paginatedTenants.map((tenant) => {
            const isActive = tenant.status.toLowerCase() === 'active'
            const tenantPlan = getTenantPlan(tenant)
            const hasUnlimitedQuota = tenantPlan ? tenantPlan.staffAccountUnlimited : tenant.userQuotaLimit <= 0
            const quotaPercent = tenant.userQuotaLimit > 0
              ? Math.min(100, Math.round((tenant.userQuotaUsed / tenant.userQuotaLimit) * 100))
              : 0
            const expirationDateLabel = formatPlanDate(tenant.expirationDate) || tenant.expirationDate || '-'

            return (
              <div className="tenant-list-table-row" key={tenant.id}>
                <strong>{tenant.name}</strong>
                <span className={`tenant-plan-name ${isHighestPricedPlan(tenant, tenantPlan) ? 'premium-plan' : ''}`}>
                  {tenantPlan?.name || tenant.subscriptionPlan || '-'}
                </span>
                <span className="tenant-expiration-date">{expirationDateLabel}</span>
                <span className={`tenant-quota ${hasUnlimitedQuota ? 'unlimited' : ''}`}>
                  {!hasUnlimitedQuota && <i><b style={{ width: `${quotaPercent}%` }} /></i>}
                  <strong>{hasUnlimitedQuota ? 'Unlimited' : `${tenant.userQuotaUsed}/${tenant.userQuotaLimit}`}</strong>
                </span>
                <em className={isActive ? 'active' : 'inactive'}>{isActive ? 'Active' : 'Inactive'}</em>
                <button type="button" aria-label={`View ${tenant.name}`} onClick={() => openTenantDetail(tenant.id)}>
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M8.75 21.25V16.25L21.25 3.75L26.25 8.75L13.75 21.25H8.75Z" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3.75 26.25H26.25" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17.5 7.5L22.5 12.5" stroke="#565E74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )
          })
        )}

        <footer>
          <span>Showing {tenantDisplayStart}-{tenantDisplayEnd} of {filteredTenants.length} Tenant{filteredTenants.length === 1 ? '' : 's'}</span>
          <div>
            <button type="button" disabled={currentTenantPage === 1} onClick={() => setTenantPage((page) => Math.max(1, page - 1))}><i className="fa-solid fa-chevron-left"></i></button>
            {Array.from({ length: tenantPageCount }, (_, index) => index + 1).map((page) => (
              <button type="button" className={page === currentTenantPage ? 'active' : ''} key={page} onClick={() => setTenantPage(page)}>{page}</button>
            ))}
            <button type="button" disabled={currentTenantPage === tenantPageCount} onClick={() => setTenantPage((page) => Math.min(tenantPageCount, page + 1))}><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </footer>
      </section>
    </div>
  )
}
