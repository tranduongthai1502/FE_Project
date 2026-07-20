import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { ADMIN_LIST_PAGE_SIZE, adminApi } from '../../services/adminApi'
import type { AdminListParams, CreateTenantForm, SubscriptionPlan, Tenant, TenantAdminUser } from '../../types/admin.types'
import { formatPlanDate } from '../../utils/adminFormatters'
import { getTenantDetailIdFromUrl, isTenantCreateUrl, updateSuperAdminViewUrl, updateTenantCreateUrl, updateTenantDetailUrl } from '../../utils/adminRouteHelpers'
import { ConfirmActionModal } from '../shared/ConfirmActionModal'
import { CreateTenantPage } from '../shared/CreateTenantPage'
import { MetricCard } from '../shared/MetricCard'
import styles from './TenantManagementView.module.css'
import { getAdminErrorMessage } from '../../utils/adminErrors'

type TenantStatusFilter = 'all' | 'active' | 'inactive'

function getTenantStatusMeta(statusValue: string) {
  const normalized = statusValue.trim().toLowerCase()
  const isActive = normalized === 'active' || normalized === 'activated' || normalized === 'enabled'
  const isPending = normalized === 'pending' || normalized === 'invited' || normalized === 'waiting_activation'
  const isInactive =
    normalized === 'inactive' ||
    normalized === 'in_active' ||
    normalized === 'not_active' ||
    normalized === 'not active' ||
    normalized === 'disabled' ||
    normalized === 'deactivated' ||
    normalized === 'suspended'

  if (isActive) {
    return { className: 'active', label: 'Active', isActive: true }
  }

  if (isPending) {
    return { className: 'pending', label: 'Pending', isActive: false }
  }

  if (isInactive) {
    return { className: 'inactive', label: 'Inactive', isActive: false }
  }

  return {
    className: 'inactive',
    label: statusValue ? statusValue.trim() : 'Inactive',
    isActive: false,
  }
}

function formatTenantDate(value?: string) {
  return value ? formatPlanDate(value) || value : '-'
}

function getDaysRemainingLabel(expirationDate?: string) {
  if (!expirationDate || expirationDate === '-') return '-'

  const expirationTime = Date.parse(expirationDate)
  if (Number.isNaN(expirationTime)) return '-'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysRemaining = Math.ceil((expirationTime - today.getTime()) / 86_400_000)
  return `${Math.max(0, daysRemaining)} Day${Math.max(0, daysRemaining) === 1 ? '' : 's'}`
}

function normalizeFilterValue(value?: string) {
  return String(value || '').trim().toLowerCase()
}

function tenantMatchesPlanFilter(tenant: Tenant, selectedPlanId: string, selectedPlan?: SubscriptionPlan) {
  if (!selectedPlanId) return true

  const selectedId = normalizeFilterValue(selectedPlanId)
  const selectedName = normalizeFilterValue(selectedPlan?.name)
  const tenantPlanId = normalizeFilterValue(tenant.subscriptionPlanId)
  const tenantPlanName = normalizeFilterValue(tenant.subscriptionPlanDetail?.name || tenant.subscriptionPlan)

  return (
    tenantPlanId === selectedId ||
    tenantPlanName === selectedId ||
    Boolean(selectedName && (tenantPlanName === selectedName || tenantPlanId === selectedName))
  )
}

function getUsagePercent(used: number, limit: number) {
  if (limit <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)))
}

function getRemainingLabel(remaining: number, noun: string, unlimited = false) {
  if (unlimited) return `Unlimited ${noun} available`
  return `${Math.max(0, remaining)} ${noun} ${Math.max(0, remaining) === 1 ? 'available' : 'available'}`
}

const emptyTenantForm: CreateTenantForm = {
  companyName: '',
  domain: '',
  industry: '',
  region: '',
  planId: '',
  adminFullName: '',
  adminEmail: '',
}

function buildTenantListParams(
  statusFilter: TenantStatusFilter,
  planFilter: string,
  searchQuery: string,
  page: number,
): AdminListParams {
  const filters: Record<string, unknown> = {}
  const keyword = searchQuery.trim()
  void planFilter

  if (statusFilter === 'active') {
    filters.status = 'ACTIVE'
  }

  if (statusFilter === 'inactive') {
    filters.status = 'INACTIVE'
  }

  if (keyword) {
    filters.keyword = keyword
  }

  return {
    sortField: 'companyName',
    filters,
    sortBy: 'ASC',
    page,
    size: ADMIN_LIST_PAGE_SIZE,
  }
}

export function TenantManagementView({
  onHome,
  triggerToast,
}: {
  onHome: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const [activeView, setActiveView] = useState<'list' | 'detail'>(() => (
    getTenantDetailIdFromUrl() ? 'detail' : 'list'
  ))
  const [selectedTenantId, setSelectedTenantId] = useState(() => getTenantDetailIdFromUrl())
  const [tenantDetail, setTenantDetail] = useState<Tenant | null>(null)
  const [tenantAdminUser, setTenantAdminUser] = useState<TenantAdminUser | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(() => isTenantCreateUrl())
  const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false)
  const [isCreateCancelConfirmOpen, setIsCreateCancelConfirmOpen] = useState(false)
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false)
  const [isPlanConfirmOpen, setIsPlanConfirmOpen] = useState(false)
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false)
  const [isUpdatingTenantStatus, setIsUpdatingTenantStatus] = useState(false)
  const [isUpdatingTenantPlan, setIsUpdatingTenantPlan] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [isLoadingTenantDetail, setIsLoadingTenantDetail] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [tenantError, setTenantError] = useState('')
  const [tenantListError, setTenantListError] = useState('')
  const [tenantDetailError, setTenantDetailError] = useState('')
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

    const listParams = buildTenantListParams(tenantStatusFilter, tenantPlanFilter, tenantSearchQuery, tenantPage)

    adminApi.getTenants(listParams)
      .then((items) => {
        if (isActive) {
          setTenants(items)
        }
      })
      .catch((error) => {
        if (isActive) {
          setTenantListError(getAdminErrorMessage(error, 'Failed to load tenants.'))
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
  }, [refreshTenantsKey, tenantPage, tenantPlanFilter, tenantSearchQuery, tenantStatusFilter])

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
        setTenantError(getAdminErrorMessage(error, 'Failed to load subscription plans.'))
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
    if (activeView !== 'detail' || !selectedTenantId) {
      setTenantDetail(null)
      setTenantAdminUser(null)
      setTenantDetailError('')
      return
    }

    let isActive = true
    setIsLoadingTenantDetail(true)
    setTenantDetailError('')
    setTenantAdminUser(null)

    const fetchTenantDetail = async () => {
      try {
        const tenant = await adminApi.getTenantById(selectedTenantId)
        if (!isActive) return

        setTenantDetail(tenant)
        setTenants((current) => {
          const existingIndex = current.findIndex((item) => item.id === tenant.id)
          if (existingIndex === -1) return [tenant, ...current]

          const next = [...current]
          next[existingIndex] = tenant
          return next
        })

        if (!tenant.adminUserId) return

        try {
          const user = await adminApi.getUserById(tenant.adminUserId)
          if (isActive) {
            setTenantAdminUser(user)
          }
        } catch {
          if (isActive) {
            setTenantAdminUser(null)
          }
        }
      } catch (error) {
        if (isActive) {
          setTenantDetailError(getAdminErrorMessage(error, 'Failed to load tenant details.'))
        }
      } finally {
        if (isActive) {
          setIsLoadingTenantDetail(false)
        }
      }
    }

    fetchTenantDetail()

    return () => {
      isActive = false
    }
  }, [activeView, selectedTenantId])

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
      const message = 'Please fill in all required fields.'
      setTenantError(message)
      return
    }

    setIsCreateConfirmOpen(true)
  }

  const confirmCreateTenant = async () => {
    setIsSubmittingTenant(true)

    try {
      const createdTenant = await adminApi.createTenant(tenantForm)
      if (createdTenant?.id && getTenantStatusMeta(createdTenant.status).isActive) {
        await adminApi.updateTenant(createdTenant.id, {
          companyName: tenantForm.companyName,
          domain: tenantForm.domain,
          industry: tenantForm.industry,
          region: tenantForm.region,
          status: 'INACTIVE',
          planId: tenantForm.planId,
          adminFullName: tenantForm.adminFullName,
          adminEmail: tenantForm.adminEmail,
        })
      }
      if (createdTenant) {
        setTenants((currentTenants) => {
          const inactiveTenant = { ...createdTenant, status: 'INACTIVE' }
          return [inactiveTenant, ...currentTenants.filter((tenant) => tenant.id !== inactiveTenant.id)]
        })
      }
      setTenantForm(emptyTenantForm)
      setIsCreateModalOpen(false)
      setIsCreateConfirmOpen(false)
      updateSuperAdminViewUrl('tenantManagement')
      setRefreshTenantsKey((value) => value + 1)
      triggerToast?.('Tenant create successfully. Activation email send to Tenant Admin', 'success')
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Failed to create tenant.')
      setIsCreateConfirmOpen(false)
      setTenantError(message)
    } finally {
      setIsSubmittingTenant(false)
    }
  }

  const activeTenantCount = useMemo(() => (
    tenants.filter((tenant) => getTenantStatusMeta(tenant.status).isActive).length
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
    tenantDetail?.id === selectedTenantId
      ? tenantDetail
      : tenants.find((tenant) => tenant.id === selectedTenantId)
  ), [selectedTenantId, tenantDetail, tenants])
  const selectedTenantListPlan = selectedTenant ? getTenantPlan(selectedTenant) : undefined
  const selectedTenantNestedPlan = selectedTenant?.subscriptionPlanDetail
  const selectedTenantPlan = selectedTenantNestedPlan || selectedTenantListPlan

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

    return Array.from(optionsByKey.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label))
  }, [subscriptionPlans])
  const filteredTenants = useMemo(() => {
    const selectedPlan = tenantPlanFilter ? planById.get(tenantPlanFilter) : undefined
    const normalizedSearch = normalizeFilterValue(tenantSearchQuery)

    return tenants.filter((tenant) => {
      const status = getTenantStatusMeta(tenant.status)
      const tenantPlan = tenant.subscriptionPlanId
        ? planById.get(tenant.subscriptionPlanId)
        : planByName.get(tenant.subscriptionPlan.toLowerCase())
      const planName = tenantPlan?.name || tenant.subscriptionPlan || ''
      const matchesStatus =
        tenantStatusFilter === 'all' ||
        (tenantStatusFilter === 'active' && status.isActive) ||
        (tenantStatusFilter === 'inactive' && !status.isActive)
      const matchesPlan =
        !tenantPlanFilter ||
        tenantMatchesPlanFilter(tenant, tenantPlanFilter, selectedPlan)
      const matchesSearch =
        !normalizedSearch ||
        normalizeFilterValue(tenant.name).includes(normalizedSearch) ||
        normalizeFilterValue(tenant.domain).includes(normalizedSearch) ||
        normalizeFilterValue(planName).includes(normalizedSearch) ||
        normalizeFilterValue(status.label).includes(normalizedSearch)

      return matchesStatus && matchesPlan && matchesSearch
    })
  }, [planById, planByName, tenantPlanFilter, tenantSearchQuery, tenantStatusFilter, tenants])
  const tenantPageCount = tenantPage + (filteredTenants.length === ADMIN_LIST_PAGE_SIZE ? 1 : 0)
  const currentTenantPage = tenantPage
  const paginatedTenants = filteredTenants
  const tenantDisplayStart = filteredTenants.length === 0 ? 0 : ((currentTenantPage - 1) * ADMIN_LIST_PAGE_SIZE) + 1
  const tenantDisplayEnd = tenantDisplayStart === 0 ? 0 : tenantDisplayStart + filteredTenants.length - 1

  useEffect(() => {
    setTenantPage(1)
  }, [tenantPlanFilter, tenantSearchQuery, tenantStatusFilter])

  const selectTenantFilter = (filter: TenantStatusFilter) => {
    setTenantStatusFilter(filter)
  }
  const selectPlanFilter = (planValue: string) => {
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
    const currentTenant = selectedTenant || tenants.find((tenant) => tenant.id === selectedTenantId)
    if (!currentTenant) return

    const selectedPlan = getTenantPlan(currentTenant)
    const currentTenantStatus = getTenantStatusMeta(currentTenant.status)
    if (currentTenantStatus.className === 'pending') return

    const nextStatus = currentTenantStatus.isActive ? 'INACTIVE' : 'ACTIVE'
    const planId = currentTenant.subscriptionPlanId || selectedPlan?.id || ''

    setIsUpdatingTenantStatus(true)
    setTenantListError('')

    try {
      const tenantAdminPayload = getTenantAdminPayload(currentTenant)
      await adminApi.updateTenant(currentTenant.id, {
        companyName: currentTenant.name,
        domain: currentTenant.domain || currentTenant.id,
        industry: currentTenant.industry || 'Media & Advertising',
        region: currentTenant.region || 'VietNam',
        status: nextStatus,
        planId,
        ...tenantAdminPayload,
      })
      setTenantDetail((tenant) => tenant?.id === currentTenant.id ? { ...tenant, status: nextStatus } : tenant)
      setTenants((currentTenants) => currentTenants.map((tenant) => (
        tenant.id === currentTenant.id ? { ...tenant, status: nextStatus } : tenant
      )))
      setIsStatusConfirmOpen(false)
      setRefreshTenantsKey((value) => value + 1)
      triggerToast?.(`Tenant ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`, 'success')
    } catch (error) {
      setTenantListError(getAdminErrorMessage(error, 'Failed to update tenant status.'))
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
      setTenantListError(getAdminErrorMessage(error, 'Failed to update subscription plan.'))
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
    const tenantStatus = getTenantStatusMeta(selectedTenant?.status || '')
    const isActive = tenantStatus.isActive
    const activeSubscriptionPlan = nextSelectedPlan || selectedPlan
    const hasUnlimitedStaffQuota = Boolean(activeSubscriptionPlan?.staffAccountUnlimited)
    const hasUnlimitedJobQuota = Boolean(activeSubscriptionPlan?.activeJobPostingUnlimited)
    const staffLimit = hasUnlimitedStaffQuota
      ? 0
      : selectedTenant?.userQuotaLimit || activeSubscriptionPlan?.maxStaffAccount || 0
    const staffUsed = selectedTenant?.userQuotaUsed || 0
    const staffUsagePercent = getUsagePercent(staffUsed, staffLimit)
    const jobLimit = hasUnlimitedJobQuota
      ? 0
      : selectedTenant?.activeJobPostingLimit || activeSubscriptionPlan?.maxActiveJobPosting || 0
    const activeJobPostingUsed = selectedTenant?.activeJobPostingUsed || 0
    const jobUsagePercent = getUsagePercent(activeJobPostingUsed, jobLimit)
    const efficiencyScore = selectedTenant?.efficiencyScore
    const efficiencyScoreLabel = typeof efficiencyScore === 'number' ? `${Math.round(efficiencyScore)}%` : '-'
    const efficiencyProgress = typeof efficiencyScore === 'number' ? Math.min(100, Math.max(0, Math.round(efficiencyScore))) : 0
    const quotaLabel = selectedTenant
      ? hasUnlimitedStaffQuota
        ? 'Unlimited'
        : staffLimit > 0
        ? `${staffUsed}/${staffLimit}`
        : String(staffUsed)
      : '-'
    const tenantDomain = selectedTenant?.domain ? `${selectedTenant.domain}.jobfusion.ai` : selectedTenant?.id || '-'
    const tenantIndustry = selectedTenant?.industry || 'Media & Advertising'
    const tenantRegion = selectedTenant?.region || 'VietNam'
    const tenantExpirationDate = selectedTenant ? formatTenantDate(selectedTenant.expirationDate) : '-'
    const tenantStartDate = selectedTenant ? formatTenantDate(selectedTenant.startDate || selectedTenant.createdAt) : '-'
    const tenantCreatedDate = selectedTenant ? formatTenantDate(selectedTenant.createdAt) : '-'
    const monthlyBillingLabel = activeSubscriptionPlan
      ? activeSubscriptionPlan.priceLabel || `$${activeSubscriptionPlan.monthlyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo`
      : '-'
    const daysRemainingLabel = getDaysRemainingLabel(selectedTenant?.expirationDate)
    const tenantAdminFullName = tenantAdminUser?.fullName || (selectedTenant ? getTenantAdminPayload(selectedTenant).adminFullName : '-')
    const tenantAdminEmail = tenantAdminUser?.email || (selectedTenant ? getTenantAdminPayload(selectedTenant).adminEmail : '-')
    const tenantAdminStatus = selectedTenant?.status || tenantAdminUser?.status || '-'
    const tenantAdminStatusMeta = getTenantStatusMeta(tenantAdminStatus)
    const tenantAdminActivatedDate = formatPlanDate(tenantAdminUser?.createdAt || '') || tenantAdminUser?.createdAt || tenantCreatedDate
    const canUpdateTenantStatus = tenantStatus.className !== 'pending'
    const statusActionLabel = isActive
      ? 'Inactive'
      : tenantStatus.className === 'pending'
        ? 'Pending Activation'
        : 'Active'
    const statusActionClassName = isActive ? 'status-deactivate' : 'status-activate'
    const statusActionMessage = isActive
      ? 'Are you sure you want to deactivate this tenant?'
      : 'Are you sure you want to activate this tenant?'
    const statusActionSubmittingLabel = isActive ? 'Deactivating...' : 'Activating...'

    return (
      <div className="role-content tenant-detail-content">
        <div className="tenant-breadcrumb">
          <i className="fa-solid fa-house"></i>
          <button type="button" onClick={onHome}>Home</button>
          <span className="breadcrumb-separator">/</span>
          <button type="button" onClick={closeTenantDetail}>Tenant Management</button>
          <span className="breadcrumb-separator">/</span>
          <strong>Tenant detail</strong>
        </div>

        {isLoadingTenants || isLoadingTenantDetail ? (
          <div className="tenant-list-table-state">Loading tenant details...</div>
        ) : tenantDetailError || tenantListError ? (
          <div className="tenant-list-table-state error">{tenantDetailError || tenantListError}</div>
        ) : !selectedTenant ? (
          <div className="tenant-list-table-state">Tenant not found.</div>
        ) : (
          <>
            <div className="tenant-detail-title-row">
              <div>
                <h1>{selectedTenant.name}</h1>
                <em className={tenantStatus.className}>{tenantStatus.label}</em>
              </div>
              <button
                type="button"
                className={statusActionClassName}
                onClick={() => canUpdateTenantStatus && setIsStatusConfirmOpen(true)}
                disabled={!canUpdateTenantStatus || isUpdatingTenantStatus}
              >
                {statusActionLabel}
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

              <section className="tenant-detail-card tenant-resource-card">
                <header>
                  <span><i className="fa-regular fa-chart-bar"></i></span>
                  <h2>Resource Usage</h2>
                </header>
                <div className="tenant-resource-list">
                  <article>
                    <div>
                      <span>Staff Accounts</span>
                      <strong>{hasUnlimitedStaffQuota ? `${staffUsed} / Unlimited` : `${staffUsed} / ${staffLimit}`}</strong>
                    </div>
                    <i className="tenant-resource-bar staff"><b style={{ width: `${hasUnlimitedStaffQuota ? 100 : staffUsagePercent}%` }} /></i>
                    <small>{getRemainingLabel(staffLimit - staffUsed, 'seats', hasUnlimitedStaffQuota)}</small>
                  </article>
                  <article>
                    <div>
                      <span>Active Job Postings</span>
                      <strong>{hasUnlimitedJobQuota ? `${activeJobPostingUsed} / Unlimited` : `${activeJobPostingUsed} / ${jobLimit}`}</strong>
                    </div>
                    <i className="tenant-resource-bar jobs"><b style={{ width: `${hasUnlimitedJobQuota ? 100 : jobUsagePercent}%` }} /></i>
                    <small>{hasUnlimitedJobQuota ? 'Unlimited slots available' : `${Math.max(0, jobLimit - activeJobPostingUsed)} slots remaining`}</small>
                  </article>
                  <article className="tenant-efficiency-row">
                    <span>Efficiency Score</span>
                    <strong style={{ '--tenant-efficiency': `${efficiencyProgress}%` } as CSSProperties}>
                      <i></i>
                      {efficiencyScoreLabel}
                    </strong>
                  </article>
                </div>
              </section>

              <section className="tenant-detail-card tenant-subscription-card">
                <header>
                  <span><i className="fa-regular fa-id-badge"></i></span>
                  <div className="tenant-plan-title-stack">
                    <h2>Subscription Plan</h2>
                    <strong>{activeSubscriptionPlan?.name || selectedTenant.subscriptionPlan || '-'}</strong>
                  </div>
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
                <div className="tenant-subscription-metrics">
                  <div><small>Monthly Billing</small><strong>{monthlyBillingLabel}</strong></div>
                  <div><small>Days Remaining</small><strong><i className="fa-regular fa-calendar-check"></i> {daysRemainingLabel}</strong></div>
                </div>
                <div className="tenant-subscription-lines">
                  <span>Start Date <strong>{tenantStartDate}</strong></span>
                  <span>Expiration Date <strong>{tenantExpirationDate}</strong></span>
                </div>
              </section>

              <section className={`tenant-detail-card ${styles.tenantAdminCard}`}>
                <header>
                  <span><i className="fa-regular fa-calendar-check"></i></span>
                  <h2>Tenant Admin</h2>
                </header>
                <div className={styles.tenantAdminLayout}>
                  <div className={styles.tenantAdminAvatar}><i className="fa-regular fa-user"></i></div>
                  <div><small>Full Name</small><strong>{tenantAdminFullName}</strong></div>
                  <div><small>Email Address</small><strong>{tenantAdminEmail}</strong></div>
                  <div><small>Current Status</small><em className={styles[tenantAdminStatusMeta.className]}>{tenantAdminStatusMeta.label}</em></div>
                  <div><small>Activated Date</small><strong>{tenantAdminActivatedDate}</strong></div>
                </div>
              </section>
            </div>

            {isStatusConfirmOpen && (
              <ConfirmActionModal
                isSubmitting={isUpdatingTenantStatus}
                title="Confirm Action"
                message={statusActionMessage}
                cancelLabel="Cancel"
                confirmLabel="Confirm"
                submittingLabel={statusActionSubmittingLabel}
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
        <button type="button" onClick={onHome}>Home</button>
        <span className="breadcrumb-separator">/</span>
        <strong>Tenant Management</strong>
      </div>

      <section className="tenant-filter-card">
        <div className="tenant-filter-tabs">
          <button type="button" className={tenantStatusFilter === 'all' ? 'active' : ''} onClick={() => selectTenantFilter('all')}>All Tenants</button>
          <button type="button" className={tenantStatusFilter === 'active' ? 'active' : ''} onClick={() => selectTenantFilter('active')}>Active</button>
          <button type="button" className={tenantStatusFilter === 'inactive' ? 'active' : ''} onClick={() => selectTenantFilter('inactive')}>Inactive</button>
          <label className={`tenant-plan-filter-tab ${tenantPlanFilter ? 'active' : ''}`}>
            <select
              value={tenantPlanFilter}
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
            const status = getTenantStatusMeta(tenant.status)
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
                <em className={status.className}>{status.label}</em>
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
