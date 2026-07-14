import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { adminApi } from '../../services/adminApi'
import type { CreateTenantForm, SubscriptionPlan, Tenant } from '../../types/admin.types'
import { formatPlanDate } from '../../utils/adminFormatters'
import { getTenantDetailIdFromUrl, isTenantCreateUrl, updateSuperAdminViewUrl, updateTenantCreateUrl, updateTenantDetailUrl } from '../../utils/adminRouteHelpers'
import { ConfirmActionModal } from '../shared/ConfirmActionModal'
import { CreateTenantPage } from '../shared/CreateTenantPage'
import { MetricCard } from '../shared/MetricCard'

type TenantStatusFilter = 'all' | 'active' | 'inactive' | 'plan'

const emptyTenantForm: CreateTenantForm = {
  companyName: '',
  domain: '',
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
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [tenantError, setTenantError] = useState('')
  const [tenantListError, setTenantListError] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantStatusFilter, setTenantStatusFilter] = useState<TenantStatusFilter>('all')
  const [tenantPlanFilter, setTenantPlanFilter] = useState('')
  const [tenantSearchQuery, setTenantSearchQuery] = useState('')
  const [refreshTenantsKey, setRefreshTenantsKey] = useState(0)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
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

  const closeCreateModal = () => {
    if (isSubmittingTenant) return
    setIsCancelConfirmOpen(true)
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
    tenantForm.adminFullName.trim() ||
    tenantForm.adminEmail.trim(),
  )

  const requestCloseCreateModal = () => {
    if (isSubmittingTenant) return
    if (hasTenantDraftChanges) {
      setIsCreateCancelConfirmOpen(true)
      return
    }

    closeCreateModal()
  }

  const handleCreateTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTenantError('')

    if (!tenantForm.planId) {
      setTenantError('Please select a subscription plan.')
      return
    }

    await confirmCreateTenant()
  }

  const confirmCreateTenant = async () => {
    setIsSubmittingTenant(true)

    try {
      await adminApi.createTenant(tenantForm)
      setTenantForm(emptyTenantForm)
      setIsCreateModalOpen(false)
      updateSuperAdminViewUrl('tenantManagement')
      setRefreshTenantsKey((value) => value + 1)
      triggerToast?.('Tenant create successfully. Activation email send to Tenant Admin', 'success')
    } catch (error) {
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
  const selectTenantFilter = (filter: TenantStatusFilter) => {
    setTenantStatusFilter(filter)
    if (filter !== 'plan') {
      setTenantPlanFilter('')
    } else if (!tenantPlanFilter && planFilterOptions[0]) {
      setTenantPlanFilter(planFilterOptions[0].value)
    }
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
          onSubmit={handleCreateTenant}
        />

        {isCancelConfirmOpen && (
          <ConfirmActionModal
            isSubmitting={false}
            title="Discard Changes"
            message="Are you sure you want to cancel? Your changes will not be saved."
            onCancel={() => setIsCancelConfirmOpen(false)}
            onConfirm={confirmCloseCreateModal}
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
            onConfirm={closeCreateModal}
          />
        )}
      </>
    )
  }

  if (activeView === 'detail') {
    const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId)
    const selectedPlan = selectedTenant ? getTenantPlan(selectedTenant) : undefined
    const isActive = selectedTenant?.status.toLowerCase() === 'active'
    const quotaLabel = selectedTenant
      ? selectedTenant.userQuotaLimit > 0
        ? `${selectedTenant.userQuotaUsed}/${selectedTenant.userQuotaLimit}`
        : String(selectedTenant.userQuotaUsed)
      : '-'

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
              <button type="button">Deactivate Tenant</button>
            </div>

            <div className="tenant-detail-grid">
              <section className="tenant-detail-card tenant-company-card">
                <header>
                  <span><i className="fa-regular fa-building"></i></span>
                  <h2>Company Information</h2>
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </header>
                <div className="tenant-detail-info-grid">
                  <div><small>Company Name</small><strong>{selectedTenant.name}</strong></div>
                  <div><small>Domain</small><strong>{selectedTenant.id}</strong></div>
                  <div><small>Industry</small><strong>-</strong></div>
                  <div><small>Company Size</small><strong>{quotaLabel} Employees</strong></div>
                  <div><small>Created Date</small><strong>-</strong></div>
                  <div><small>Region</small><strong>-</strong></div>
                </div>
              </section>

              <section className="tenant-detail-empty-card">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <strong>No tenants found.</strong>
              </section>

              <section className="tenant-detail-card tenant-subscription-card">
                <header>
                  <span><i className="fa-regular fa-id-badge"></i></span>
                  <h2>Subscription Plan</h2>
                </header>
                <strong className="tenant-plan-heading">{selectedPlan?.name || selectedTenant.subscriptionPlan || '-'}</strong>
                <small className="tenant-plan-tier">{selectedPlan?.description || '-'}</small>
                <div className="tenant-subscription-metrics">
                  <div><small>Monthly Billing</small><strong>{selectedPlan ? `$${selectedPlan.monthlyPrice.toLocaleString()}` : '-'}</strong></div>
                  <div><small>Days Remaining</small><strong>{selectedTenant.expirationDate}</strong></div>
                </div>
                <div className="tenant-subscription-lines">
                  <span>Start Date <strong>-</strong></span>
                  <span>ExpirationDate <strong>{selectedTenant.expirationDate}</strong></span>
                  <span>Renewal Cycle <strong>Annual</strong></span>
                  <span>Trailing <strong>Enabled</strong></span>
                </div>
              </section>

              <section className="tenant-detail-card tenant-admin-card">
                <header>
                  <span><i className="fa-regular fa-calendar-check"></i></span>
                  <h2>Tenant Admin</h2>
                </header>
                <div className="tenant-admin-layout">
                  <div className="tenant-admin-avatar"><i className="fa-regular fa-user"></i><b /></div>
                  <div><small>Full Name</small><strong>-</strong></div>
                  <div><small>Email Address</small><strong>-</strong></div>
                  <div><small>Current Status</small><em className={isActive ? 'active' : 'inactive'}>{selectedTenant.status}</em></div>
                  <div><small>Activated Date</small><strong>-</strong></div>
                </div>
              </section>
            </div>
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
          <button type="button" className={tenantStatusFilter === 'plan' ? 'active' : ''} onClick={() => selectTenantFilter('plan')}>Filter by Plan</button>
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
        {tenantStatusFilter === 'plan' && (
          <label className="tenant-plan-filter">
            <span>Plan</span>
            <select value={tenantPlanFilter} onChange={(event) => setTenantPlanFilter(event.target.value)}>
              {planFilterOptions.length === 0 ? (
                <option value="">No plans</option>
              ) : (
                planFilterOptions.map((plan) => (
                  <option value={plan.value} key={plan.value}>{plan.label}</option>
                ))
              )}
            </select>
          </label>
        )}
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
          filteredTenants.map((tenant) => {
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
                <span className="tenant-plan-name">{tenantPlan?.name || tenant.subscriptionPlan || '-'}</span>
                <span className="tenant-expiration-date">{expirationDateLabel}</span>
                <span className={`tenant-quota ${hasUnlimitedQuota ? 'unlimited' : ''}`}>
                  {!hasUnlimitedQuota && <i><b style={{ width: `${quotaPercent}%` }} /></i>}
                  <strong>{hasUnlimitedQuota ? 'Unlimited' : `${tenant.userQuotaUsed}/${tenant.userQuotaLimit}`}</strong>
                </span>
                <em className={isActive ? 'active' : 'inactive'}>{isActive ? 'Active' : tenant.status}</em>
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
          <span>Showing {filteredTenants.length} of {tenants.length} Tenant{tenants.length === 1 ? '' : 's'}</span>
          <div>
            <button type="button" disabled><i className="fa-solid fa-chevron-left"></i></button>
            <button type="button" className="active">1</button>
            <button type="button" disabled><i className="fa-solid fa-chevron-right"></i></button>
          </div>
        </footer>
      </section>
    </div>
  )
}
