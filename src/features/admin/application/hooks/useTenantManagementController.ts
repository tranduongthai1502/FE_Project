import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_LIST_PAGE_SIZE } from '../../infrastructure/adminApi'
import {
  useAdminTenants,
  useAdminTenantDashboardStats,
  useAdminSubscriptionPlans,
  useAdminTenantDetail,
  useAdminTenantUser,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
} from '../queryHooks/useAdminQueries'
import { adminQueryKeys } from '../queryHooks/adminQueryKeys'
import {
  PLAN_FILTER_LIST_SIZE,
  buildTenantListParams,
  duplicateCompanyNameMessage,
  emptyTenantForm,
  getCreateTenantFieldErrors,
  invalidTenantEmailMessage,
  isValidTenantAdminEmail,
  normalizeFilterValue,
  requiredTenantFieldMessage,
  tenantHasCompanyName,
  tenantMatchesPlanFilter,
  type TenantStatusFilter,
} from '../../infrastructure/tenantManagementService'
import type { CreateTenantForm, SubscriptionPlan, Tenant } from '../../domain/adminApi.types'
import { getErrorMessage as getAdminErrorMessage } from '@/core/utils/errors/errorMessages'
import { formatPlanDate } from '../helpers/adminFormatters'
import { getRemainingLabel, getTenantStatusMeta } from '../helpers/tenantDisplayUtils'
import { getInitialSuperAdminView, getSuperAdminViewPath, getTenantCreatePath, getTenantDetailIdFromUrl, getTenantDetailPath, isTenantCreateUrl } from '../../domain/superAdminRouteHelpers'
import { isHighestPricedPlan as checkHighestPricedPlan } from '../../domain/superAdminMetrics'
import { getCompactPageItems, getListPageCount, getListTotalElements } from '@/core/utils/pagination'
import { formatCurrencyInput } from '@/core/utils/currencyFormat'
import { buildTenantCreatePayload } from '../helpers/adminPayload'

export function useTenantManagementController({
  onHome,
  triggerToast,
}: {
  onHome: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const tenantDetailSearchParams = new URLSearchParams(location.search)
  const initialTenantPage = Number(tenantDetailSearchParams.get('page') || 1)
  const initialTenantStatusFilter = tenantDetailSearchParams.get('status')
  const initialTenantPlanFilter = tenantDetailSearchParams.get('plan')
  const initialTenantSearchQuery = tenantDetailSearchParams.get('search') || ''

  const isInitialTenantStatus = (value: string | null): value is TenantStatusFilter => (
    value === 'all' || value === 'active' || value === 'inactive'
  )

  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>(() => (
    isTenantCreateUrl(location.pathname)
      ? 'create'
      : getTenantDetailIdFromUrl(location.pathname)
        ? 'detail'
        : 'list'
  ))
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(() => getTenantDetailIdFromUrl(location.pathname))
  const [tenantForm, setTenantForm] = useState<CreateTenantForm>(emptyTenantForm)
  const [tenantStatusFilter, setTenantStatusFilter] = useState<TenantStatusFilter>(isInitialTenantStatus(initialTenantStatusFilter) ? initialTenantStatusFilter : 'all')
  const [tenantPlanFilter, setTenantPlanFilter] = useState(() => initialTenantPlanFilter || '')
  const [tenantSearchQuery, setTenantSearchQuery] = useState(() => initialTenantSearchQuery)
  const [tenantPage, setTenantPage] = useState(() => Number.isFinite(initialTenantPage) ? Math.max(1, initialTenantPage) : 1)
  const [tenantError, setTenantError] = useState('')
  const [tenantFieldErrors, setTenantFieldErrors] = useState<Partial<Record<keyof CreateTenantForm, string>>>({})
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false)
  const [isCreateCancelConfirmOpen, setIsCreateCancelConfirmOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(() => isTenantCreateUrl(location.pathname))
  const [pendingTenantPlanId, setPendingTenantPlanId] = useState('')
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false)
  const [isPlanConfirmOpen, setIsPlanConfirmOpen] = useState(false)
  const [deleteTenantTarget, setDeleteTenantTarget] = useState<Tenant | null>(null)
  const [isUpdatingTenantStatus, setIsUpdatingTenantStatus] = useState(false)
  const [isUpdatingTenantPlan, setIsUpdatingTenantPlan] = useState(false)
  const [isDeletingTenant, setIsDeletingTenant] = useState(false)
  const [tenantDetailError, setTenantDetailError] = useState('')

  const isDetailViewActive = activeView === 'detail' && Boolean(selectedTenantId)
  const isListViewActive = activeView === 'list' && !isCreateModalOpen

  const createTenantMutation = useCreateTenant()
  const updateTenantMutation = useUpdateTenant()
  const deleteTenantMutation = useDeleteTenant()

  const listParams = useMemo(() => buildTenantListParams(
    tenantStatusFilter,
    tenantPlanFilter,
    tenantSearchQuery,
    tenantPage,
  ), [tenantStatusFilter, tenantPlanFilter, tenantSearchQuery, tenantPage])

  const plansQuery = useAdminSubscriptionPlans({ size: PLAN_FILTER_LIST_SIZE })
  const tenantListQuery = useAdminTenants({ ...listParams, enabled: isListViewActive })
  const tenantStatsQuery = useAdminTenantDashboardStats({ enabled: isListViewActive })
  const tenantDetailQuery = useAdminTenantDetail(selectedTenantId, { enabled: isDetailViewActive })
  const tenantUserQuery = useAdminTenantUser(selectedTenantId, { enabled: isDetailViewActive })

  const subscriptionPlans = plansQuery.data ?? []
  const fetchedTenants = tenantListQuery.data ?? []
  const fetchedTenantDetail = tenantDetailQuery.data ?? null
  const fetchedTenantAdminUser = tenantUserQuery.data ?? null

  const isLoadingPlans = plansQuery.isLoading
  const isLoadingTenants = tenantListQuery.isLoading || tenantListQuery.isFetching
  const isLoadingTenantDetail = tenantDetailQuery.isLoading || tenantDetailQuery.isFetching
  const tenantListError = tenantListQuery.error ? getAdminErrorMessage(tenantListQuery.error, 'Failed to load tenants.') : ''
  const tenantStatsAreLoading = tenantStatsQuery.isLoading || tenantStatsQuery.isFetching
  const metricsAreLoading = plansQuery.isLoading

  useEffect(() => {
    if (!isListViewActive) return

    const searchParams = new URLSearchParams()
    if (tenantStatusFilter !== 'all') searchParams.set('status', tenantStatusFilter)
    if (tenantPlanFilter) searchParams.set('plan', tenantPlanFilter)
    if (tenantSearchQuery.trim()) searchParams.set('search', tenantSearchQuery.trim())
    if (tenantPage > 1) searchParams.set('page', String(tenantPage))

    const nextSearch = searchParams.toString()
    const nextPath = `${getSuperAdminViewPath('tenant-management')}${nextSearch ? `?${nextSearch}` : ''}`
    const currentPath = `${location.pathname}${location.search}`

    if (currentPath !== nextPath) {
      navigate(nextPath, { replace: true })
    }
  }, [isListViewActive, location.pathname, location.search, navigate, tenantPage, tenantPlanFilter, tenantSearchQuery, tenantStatusFilter])

  useEffect(() => {
    const isCreateUrl = isTenantCreateUrl(location.pathname)
    const detailId = getTenantDetailIdFromUrl(location.pathname)

    if (isCreateUrl) {
      setIsCreateModalOpen(true)
      setActiveView('create')
      setSelectedTenantId(null)
      return
    }

    setIsCreateModalOpen(false)
    if (detailId) {
      setSelectedTenantId(detailId)
      setActiveView('detail')
      return
    }

    setSelectedTenantId(null)
    setActiveView('list')
  }, [location.pathname])

  const subscriptionPlansById = useMemo(() => {
    const map = new Map<string, SubscriptionPlan>()
    subscriptionPlans.forEach((plan) => map.set(plan.id, plan))
    return map
  }, [subscriptionPlans])

  const activePlansCount = useMemo(() => {
    return subscriptionPlans.filter((plan) => plan.status.toLowerCase() === 'active').length
  }, [subscriptionPlans])

  const planFilterOptions = useMemo(() => {
    return subscriptionPlans
      .filter((plan) => plan.status.toLowerCase() === 'active')
      .map((plan) => ({ value: plan.id, label: plan.name }))
  }, [subscriptionPlans])

  const selectedTenant = useMemo(() => {
    if (fetchedTenantDetail) return fetchedTenantDetail
    return fetchedTenants.find((tenant) => tenant.id === selectedTenantId) ?? null
  }, [fetchedTenantDetail, fetchedTenants, selectedTenantId])

  useEffect(() => {
    if (!selectedTenant) return
    const initialPlanId = selectedTenant.subscriptionPlanId ||
      subscriptionPlans.find((plan) => plan.name.toLowerCase() === selectedTenant.subscriptionPlan.toLowerCase())?.id ||
      ''
    setPendingTenantPlanId(initialPlanId)
    setTenantDetailError('')
  }, [selectedTenant, subscriptionPlans])

  const displayedTenants = useMemo(() => {
    return fetchedTenants.filter((tenant) => {
      const normalizedQuery = normalizeFilterValue(tenantSearchQuery)
      if (normalizedQuery) {
        const matchesName = tenant.name.toLowerCase().includes(normalizedQuery)
        const matchesEmail = (tenant.email || '').toLowerCase().includes(normalizedQuery)
        const matchesDomain = (tenant.domain || '').toLowerCase().includes(normalizedQuery)
        if (!matchesName && !matchesEmail && !matchesDomain) return false
      }
      return tenantMatchesPlanFilter(tenant, tenantPlanFilter, subscriptionPlansById)
    })
  }, [fetchedTenants, subscriptionPlansById, tenantPlanFilter, tenantSearchQuery])

  const tenantPageCount = useMemo(() => {
    return getListPageCount(displayedTenants, tenantPage, ADMIN_LIST_PAGE_SIZE)
  }, [displayedTenants, tenantPage])

  const paginatedTenants = displayedTenants

  const tenantTotalElements = useMemo(() => {
    return getListTotalElements(displayedTenants, displayedTenants.length)
  }, [displayedTenants])

  const tenantDisplayStart = displayedTenants.length === 0 ? 0 : (tenantPage - 1) * ADMIN_LIST_PAGE_SIZE + 1
  const tenantDisplayEnd = tenantDisplayStart === 0 ? 0 : Math.min(tenantTotalElements, tenantDisplayStart + paginatedTenants.length - 1)
  const tenantPageItems = useMemo(() => {
    return getCompactPageItems(tenantPage, tenantPageCount)
  }, [tenantPage, tenantPageCount])

  useEffect(() => {
    if (!isLoadingTenants && !tenantListError && displayedTenants.length === 0 && tenantPage > 1) {
      setTenantPage((page) => Math.max(1, page - 1))
    }
  }, [displayedTenants.length, isLoadingTenants, tenantListError, tenantPage])

  const activeSubscriptionPlan = useMemo(() => {
    if (!selectedTenant) return null
    if (selectedTenant.subscriptionPlanId && subscriptionPlansById.has(selectedTenant.subscriptionPlanId)) {
      return subscriptionPlansById.get(selectedTenant.subscriptionPlanId) ?? null
    }
    return subscriptionPlans.find((plan) => plan.name.toLowerCase() === selectedTenant.subscriptionPlan.toLowerCase()) ?? null
  }, [selectedTenant, subscriptionPlans, subscriptionPlansById])

  const hasSelectedDifferentPlan = useMemo(() => {
    if (!selectedTenant || !pendingTenantPlanId) return false
    if (selectedTenant.subscriptionPlanId) {
      return pendingTenantPlanId !== selectedTenant.subscriptionPlanId
    }
    const currentPlanId = subscriptionPlans.find((plan) => plan.name.toLowerCase() === selectedTenant.subscriptionPlan.toLowerCase())?.id
    return currentPlanId ? pendingTenantPlanId !== currentPlanId : true
  }, [pendingTenantPlanId, selectedTenant, subscriptionPlans])

  const updateTenantForm = (field: keyof CreateTenantForm, value: string) => {
    setTenantForm((current) => ({ ...current, [field]: value }))
    setTenantFieldErrors((current) => {
      if (!current[field]) return current
      const nextErrors = { ...current }
      delete nextErrors[field]
      return nextErrors
    })
  }

  const resetCreateTenantFormState = () => {
    setTenantForm(emptyTenantForm)
    setTenantError('')
    setTenantFieldErrors({})
    setIsCreateCancelConfirmOpen(false)
  }

  const resetCreateTenantPage = () => {
    resetCreateTenantFormState()
    setIsCreateModalOpen(false)
    setActiveView('list')
    navigate(getSuperAdminViewPath('tenant-management'))
  }

  const hasDraftTenantChanges = useMemo(() => {
    return Boolean(
      tenantForm.companyName.trim() ||
      tenantForm.domain.trim() ||
      tenantForm.industry.trim() ||
      tenantForm.region.trim() ||
      tenantForm.adminFullName.trim() ||
      tenantForm.adminEmail.trim() ||
      tenantForm.planId.trim(),
    )
  }, [tenantForm])

  const confirmCloseCreateModal = () => {
    if (isSubmittingTenant) return
    if (hasDraftTenantChanges) {
      setIsCreateCancelConfirmOpen(true)
      return
    }
    resetCreateTenantPage()
  }

  const requestResetCreateTenantPage = () => {
    if (isSubmittingTenant) return
    if (hasDraftTenantChanges) {
      setIsCreateCancelConfirmOpen(true)
      return
    }
    resetCreateTenantPage()
  }

  const goHomeFromCreateTenant = () => {
    if (isSubmittingTenant) return
    resetCreateTenantFormState()
    setIsCreateModalOpen(false)
    onHome()
  }

  const openCreateTenant = () => {
    resetCreateTenantFormState()
    setIsCreateModalOpen(true)
    setActiveView('create')
    navigate(getTenantCreatePath())
  }

  const openTenantDetail = (tenantId: string) => {
    setSelectedTenantId(tenantId)
    setActiveView('detail')
    navigate(getTenantDetailPath(tenantId))
  }

  const closeTenantDetail = () => {
    setSelectedTenantId(null)
    setActiveView('list')
    navigate(getSuperAdminViewPath('tenant-management'))
  }

  const selectTenantFilter = (status: TenantStatusFilter) => {
    setTenantStatusFilter(status)
    setTenantPage(1)
  }

  const selectPlanFilter = (planId: string) => {
    setTenantPlanFilter(planId)
    setTenantPage(1)
  }

  const handleCreateTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTenantError('')
    const fieldErrors = getCreateTenantFieldErrors(tenantForm)

    if (!tenantHasCompanyName(tenantForm, existingCompanyNamesRef.current)) {
      fieldErrors.companyName = duplicateCompanyNameMessage
    }

    if (!isValidTenantAdminEmail(tenantForm.adminEmail)) {
      fieldErrors.adminEmail = invalidTenantEmailMessage
    }

    setTenantFieldErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setIsSubmittingTenant(true)
    try {
      await createTenantMutation.mutateAsync(buildTenantCreatePayload(tenantForm))
      triggerToast?.('Tenant instance provisioned successfully.', 'success')
      resetCreateTenantPage()
    } catch (error) {
      setTenantError(getAdminErrorMessage(error, 'Failed to create tenant instance.'))
    } finally {
      setIsSubmittingTenant(false)
    }
  }

  const confirmUpdateTenantStatus = async () => {
    if (!selectedTenant) return
    const nextStatus = isTenantActive(selectedTenant) ? 'INACTIVE' : 'ACTIVE'

    setIsUpdatingTenantStatus(true)
    setTenantDetailError('')
    try {
      await updateTenantMutation.mutateAsync({ id: selectedTenant.id, payload: { status: nextStatus } })
      setIsStatusConfirmOpen(false)
      triggerToast?.(`Tenant status changed to ${nextStatus.toLowerCase()}.`, 'success')
    } catch (error) {
      setTenantDetailError(getAdminErrorMessage(error, 'Failed to update tenant status.'))
    } finally {
      setIsUpdatingTenantStatus(false)
    }
  }

  const confirmUpdateTenantPlan = async () => {
    if (!selectedTenant || !pendingTenantPlanId) return

    setIsUpdatingTenantPlan(true)
    setTenantDetailError('')
    try {
      await updateTenantMutation.mutateAsync({ id: selectedTenant.id, payload: { planId: pendingTenantPlanId } })
      setIsPlanConfirmOpen(false)
      triggerToast?.('Tenant subscription plan updated successfully.', 'success')
    } catch (error) {
      setTenantDetailError(getAdminErrorMessage(error, 'Failed to update tenant subscription plan.'))
    } finally {
      setIsUpdatingTenantPlan(false)
    }
  }

  const requestDeleteTenant = (tenant: Tenant) => {
    if (isTenantActive(tenant)) return
    setDeleteTenantTarget(tenant)
  }

  const confirmDeleteTenant = async () => {
    if (!deleteTenantTarget) return

    setIsDeletingTenant(true)
    setTenantDetailError('')
    try {
      await deleteTenantMutation.mutateAsync(deleteTenantTarget.id)
      if (selectedTenantId === deleteTenantTarget.id) {
        closeTenantDetail()
      }
      setDeleteTenantTarget(null)
      triggerToast?.('Tenant permanently deleted.', 'success')
    } catch (error) {
      setTenantDetailError(getAdminErrorMessage(error, 'Failed to delete tenant.'))
    } finally {
      setIsDeletingTenant(false)
    }
  }

  const existingCompanyNamesRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    existingCompanyNamesRef.current = new Set(fetchedTenants.map((tenant) => tenant.name.trim().toLowerCase()))
  }, [fetchedTenants])

  const isTenantActive = (tenant?: Tenant | null) => (tenant?.status || '').toLowerCase() === 'active'
  const tenantStatus = getTenantStatusMeta(selectedTenant?.status)
  const tenantAdminFullName = fetchedTenantAdminUser?.name || '-'
  const tenantAdminEmail = fetchedTenantAdminUser?.email || selectedTenant?.email || '-'
  const tenantAdminStatusMeta = getTenantStatusMeta(fetchedTenantAdminUser?.status || selectedTenant?.status)
  const tenantAdminActivatedDate = formatPlanDate(fetchedTenantAdminUser?.createdAt) || formatPlanDate(selectedTenant?.createdAt) || 'Oct 24, 2023'

  const tenantDomain = selectedTenant?.domain ? `${selectedTenant.domain}.jobfusion.ai` : '-'
  const tenantIndustry = selectedTenant?.industry || '-'
  const tenantRegion = selectedTenant?.region || 'VietNam'
  const tenantCreatedDate = formatPlanDate(selectedTenant?.createdAt) || 'Oct 24, 2023'
  const tenantStartDate = formatPlanDate(selectedTenant?.startDate || selectedTenant?.createdAt) || 'Oct 24, 2023'
  const tenantExpirationDate = formatPlanDate(selectedTenant?.expirationDate) || selectedTenant?.expirationDate || 'Nov 24, 2026'

  const staffLimit = selectedTenant?.userQuotaLimit || activeSubscriptionPlan?.maxStaffAccount || 0
  const staffUsed = selectedTenant?.userQuotaUsed || 0
  const hasUnlimitedStaffQuota = selectedTenant?.userQuotaUnlimited || (activeSubscriptionPlan ? activeSubscriptionPlan.staffAccountUnlimited : staffLimit <= 0)
  const staffUsagePercent = staffLimit > 0 ? Math.min(100, Math.round((staffUsed / staffLimit) * 100)) : 0

  const jobLimit = selectedTenant?.jobPostingQuotaLimit || activeSubscriptionPlan?.maxActiveJobPosting || 0
  const activeJobPostingUsed = selectedTenant?.activeJobPostingUsed || 0
  const hasUnlimitedJobQuota = selectedTenant?.jobPostingQuotaUnlimited || (activeSubscriptionPlan ? activeSubscriptionPlan.activeJobPostingUnlimited : jobLimit <= 0)
  const jobUsagePercent = jobLimit > 0 ? Math.min(100, Math.round((activeJobPostingUsed / jobLimit) * 100)) : 0

  const quotaLabel = hasUnlimitedStaffQuota ? 'Unlimited' : String(staffLimit)
  const monthlyBillingLabel = selectedTenant?.priceLabel || (activeSubscriptionPlan
    ? activeSubscriptionPlan.priceLabel || `$${formatCurrencyInput((activeSubscriptionPlan.price ?? activeSubscriptionPlan.monthlyPrice).toFixed(2))} /month`
    : '-')
  const daysRemainingLabel = selectedTenant?.daysRemaining != null ? `${selectedTenant.daysRemaining} days` : '182 days'

  const statusActionLabel = isTenantActive(selectedTenant) ? 'Deactivate' : 'Activate'
  const statusActionClassName = isTenantActive(selectedTenant) ? 'btn-tertiary' : 'btn-primary'
  const statusActionMessage = `Are you sure you want to ${isTenantActive(selectedTenant) ? 'deactivate' : 'activate'} ${selectedTenant?.name || 'this tenant'}?`
  const statusActionSubmittingLabel = isTenantActive(selectedTenant) ? 'Deactivating...' : 'Activating...'

  const requestChangeTenantPlan = () => {
    if (!hasSelectedDifferentPlan) return
    setIsPlanConfirmOpen(true)
  }

  const tenantStats = tenantStatsQuery.data
  const tenantStatsTotalRevenue = tenantStats?.totalRevenue ?? 0
  const tenantStatsActiveCount = tenantStats?.activeTenants ?? fetchedTenants.filter((tenant) => isTenantActive(tenant)).length
  const tenantStatsAverageUsage = tenantStats?.averageUsage ?? 0
  const tenantStatsChurnRate = tenantStats?.churnRate ?? 0

  const isHighestPricedPlan = (tenant: Tenant, tenantPlan?: SubscriptionPlan | null) => {
    const planName = tenantPlan?.name || tenant.subscriptionPlan
    return checkHighestPricedPlan(planName, subscriptionPlans)
  }

  return {
    onHome,
    triggerToast,
    activeView,
    selectedTenantId,
    selectedTenant,
    tenantForm,
    tenantStatusFilter,
    tenantPlanFilter,
    tenantSearchQuery,
    setTenantSearchQuery,
    tenantPage,
    setTenantPage,
    tenantError,
    tenantFieldErrors,
    isSubmittingTenant,
    isCreateCancelConfirmOpen,
    setIsCreateCancelConfirmOpen,
    isCreateModalOpen,
    pendingTenantPlanId,
    setPendingTenantPlanId,
    isStatusConfirmOpen,
    setIsStatusConfirmOpen,
    isPlanConfirmOpen,
    setIsPlanConfirmOpen,
    deleteTenantTarget,
    setDeleteTenantTarget,
    isUpdatingTenantStatus,
    isUpdatingTenantPlan,
    isDeletingTenant,
    tenantDetailError,
    subscriptionPlans,
    isLoadingPlans,
    isLoadingTenants,
    isLoadingTenantDetail,
    tenantListError,
    tenantStatsAreLoading,
    metricsAreLoading,
    planFilterOptions,
    displayedTenants,
    paginatedTenants,
    tenantPageCount,
    tenantTotalElements,
    tenantDisplayStart,
    tenantDisplayEnd,
    tenantPageItems,
    activeSubscriptionPlan,
    hasSelectedDifferentPlan,
    updateTenantForm,
    resetCreateTenantPage,
    confirmCloseCreateModal,
    requestResetCreateTenantPage,
    goHomeFromCreateTenant,
    openCreateTenant,
    openTenantDetail,
    closeTenantDetail,
    selectTenantFilter,
    selectPlanFilter,
    handleCreateTenant,
    confirmUpdateTenantStatus,
    confirmUpdateTenantPlan,
    requestDeleteTenant,
    confirmDeleteTenant,
    isTenantActive,
    tenantStatus,
    tenantAdminFullName,
    tenantAdminEmail,
    tenantAdminStatusMeta,
    tenantAdminActivatedDate,
    tenantDomain,
    tenantIndustry,
    tenantRegion,
    tenantCreatedDate,
    tenantStartDate,
    tenantExpirationDate,
    staffLimit,
    staffUsed,
    hasUnlimitedStaffQuota,
    staffUsagePercent,
    jobLimit,
    activeJobPostingUsed,
    hasUnlimitedJobQuota,
    jobUsagePercent,
    quotaLabel,
    monthlyBillingLabel,
    daysRemainingLabel,
    statusActionLabel,
    statusActionClassName,
    statusActionMessage,
    statusActionSubmittingLabel,
    requestChangeTenantPlan,
    tenantStatsTotalRevenue,
    tenantStatsActiveCount,
    tenantStatsAverageUsage,
    tenantStatsChurnRate,
    isHighestPricedPlan,
    getTenantPlan: (tenant: Tenant) => subscriptionPlansById.get(tenant.subscriptionPlanId || '') || subscriptionPlans.find((plan) => plan.name.toLowerCase() === tenant.subscriptionPlan.toLowerCase()),
  }
}

export type TenantManagementController = ReturnType<typeof useTenantManagementController>
