import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_LIST_PAGE_SIZE, adminApi } from '../../infrastructure/adminApi'
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
import type { CreateTenantForm, SubscriptionPlan, Tenant, TenantAdminUser, TenantDashboardStats } from '@/features/admin/domain/adminApi.types'
import { formatPlanDate } from '../../application/adminFormatters'
import {
  addDaysToDate,
  formatDashboardPercent,
  formatTenantDate,
  getDaysRemainingLabel,
  getRemainingLabel,
  getTenantStatusMeta,
  getUsagePercent,
} from '../../application/tenantDisplayUtils'
import { getSuperAdminViewPath, getTenantCreatePath, getTenantDetailIdFromUrl, getTenantDetailPath, isTenantCreateUrl } from '@/features/admin/domain/superAdminRouteHelpers'
import { ConfirmActionModal } from '@/core/components/ConfirmActionModal'
import { EditIcon, TrashIcon } from '@/core/components/Icons'
import { CreateTenantPage, type CreateTenantFieldErrors } from './CreateTenantPage'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { ListTable } from '@/core/components/ListTable'
import { SearchInput } from '@/core/components/SearchInput'
import { ScrollableSelect } from '@/core/components/ScrollableSelect'
import styles from './TenantManagementView.module.css'
import { getErrorMessage as getAdminErrorMessage } from '@/core/utils/errors/errorMessages'
import { getCompactPageItems, getListPageCount, getListTotalElements } from '@/core/utils/pagination'
import { formatCurrencyInput } from '@/core/utils/currencyFormat'
import { FIELD_LENGTH_LIMITS } from '@/core/api/axiosErrorHandler'
import { addRequiredFieldErrors, buildMaxLengthMessage } from '@/core/utils/errors/fieldErrorUtils'

export function TenantManagementView({
  onHome,
  triggerToast,
}: {
  onHome: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeView, setActiveView] = useState<'list' | 'detail'>(() => (
    getTenantDetailIdFromUrl(location.pathname) ? 'detail' : 'list'
  ))
  const [selectedTenantId, setSelectedTenantId] = useState(() => getTenantDetailIdFromUrl(location.pathname))
  const [tenantDetail, setTenantDetail] = useState<Tenant | null>(null)
  const [tenantAdminUser, setTenantAdminUser] = useState<TenantAdminUser | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(() => isTenantCreateUrl(location.pathname))
  const [isCreateCancelConfirmOpen, setIsCreateCancelConfirmOpen] = useState(false)
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false)
  const [isPlanConfirmOpen, setIsPlanConfirmOpen] = useState(false)
  const [deleteTenantTarget, setDeleteTenantTarget] = useState<Tenant | null>(null)
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false)
  const [isUpdatingTenantStatus, setIsUpdatingTenantStatus] = useState(false)
  const [isUpdatingTenantPlan, setIsUpdatingTenantPlan] = useState(false)
  const [isDeletingTenant, setIsDeletingTenant] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [isLoadingTenantStats, setIsLoadingTenantStats] = useState(false)
  const [isLoadingTenantDetail, setIsLoadingTenantDetail] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [tenantError, setTenantError] = useState('')
  const [tenantFieldErrors, setTenantFieldErrors] = useState<CreateTenantFieldErrors>({})
  const [tenantListError, setTenantListError] = useState('')
  const [tenantDetailError, setTenantDetailError] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantStats, setTenantStats] = useState<TenantDashboardStats | null>(null)
  const initialTenantListSearchParams = new URLSearchParams(location.search)
  const initialTenantStatus = initialTenantListSearchParams.get('status')?.toUpperCase()
  const [tenantStatusFilter, setTenantStatusFilter] = useState<TenantStatusFilter>(
    initialTenantStatus === 'ACTIVE'
      ? 'active'
      : initialTenantStatus === 'INACTIVE'
        ? 'inactive'
        : 'all',
  )
  const [tenantPlanFilter, setTenantPlanFilter] = useState(initialTenantListSearchParams.get('planId') || '')
  const [tenantSearchQuery, setTenantSearchQuery] = useState(initialTenantListSearchParams.get('search') || '')
  const [tenantPage, setTenantPage] = useState(() => {
    const page = Number(initialTenantListSearchParams.get('page') || 1)
    return Number.isFinite(page) ? Math.max(1, page) : 1
  })
  const [tenantPageCount, setTenantPageCount] = useState(1)
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([])
  const [pendingTenantPlanId, setPendingTenantPlanId] = useState('')
  const [tenantForm, setTenantForm] = useState<CreateTenantForm>(emptyTenantForm)
  const didMountTenantListFilters = useRef(false)

  const tenantListParams = useMemo(
    () => buildTenantListParams(tenantStatusFilter, tenantPlanFilter, tenantSearchQuery, tenantPage),
    [tenantPage, tenantPlanFilter, tenantSearchQuery, tenantStatusFilter],
  )
  const shouldLoadPlans = activeView === 'list' || activeView === 'detail' || isCreateModalOpen

  const tenantsQuery = useQuery({
    queryKey: ['admin', 'tenants', tenantListParams],
    queryFn: () => adminApi.getTenants(tenantListParams),
  })
  const tenantStatsQuery = useQuery({
    queryKey: ['admin', 'tenant-dashboard-stats'],
    queryFn: adminApi.getTenantDashboardStats,
  })
  const plansQuery = useQuery({
    queryKey: ['admin', 'subscription-plans', { page: 1, size: PLAN_FILTER_LIST_SIZE }],
    queryFn: () => adminApi.getSubscriptionPlans({ page: 1, size: PLAN_FILTER_LIST_SIZE }),
    enabled: shouldLoadPlans,
  })
  const tenantDetailQuery = useQuery({
    queryKey: ['admin', 'tenant-detail', selectedTenantId],
    queryFn: () => adminApi.getTenantById(selectedTenantId || ''),
    enabled: activeView === 'detail' && Boolean(selectedTenantId),
  })
  const tenantAdminUserQuery = useQuery({
    queryKey: ['admin', 'tenant-admin-user', tenantDetailQuery.data?.adminUserId],
    queryFn: () => adminApi.getUserById(tenantDetailQuery.data?.adminUserId || ''),
    enabled: Boolean(tenantDetailQuery.data?.adminUserId),
  })
  const invalidateTenantQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'tenant-dashboard-stats'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'tenant-detail'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'tenant-admin-user'] })
  }

  useEffect(() => {
    setIsLoadingTenants(tenantsQuery.isLoading || tenantsQuery.isFetching)
    if (tenantsQuery.data) {
      setTenants(tenantsQuery.data)
      setTenantPageCount(getListPageCount(tenantsQuery.data, tenantPage, ADMIN_LIST_PAGE_SIZE))
    }
    setTenantListError(tenantsQuery.error ? getAdminErrorMessage(tenantsQuery.error, 'Failed to load tenants.') : '')
  }, [tenantPage, tenantsQuery.data, tenantsQuery.error, tenantsQuery.isFetching, tenantsQuery.isLoading])

  useEffect(() => {
    setIsLoadingTenantStats(tenantStatsQuery.isLoading || tenantStatsQuery.isFetching)
    setTenantStats(tenantStatsQuery.data ?? null)
  }, [tenantStatsQuery.data, tenantStatsQuery.isFetching, tenantStatsQuery.isLoading])

  useEffect(() => {
    setIsLoadingPlans(plansQuery.isLoading || plansQuery.isFetching)
    if (plansQuery.data) {
      setSubscriptionPlans(plansQuery.data)
      if (isCreateModalOpen && plansQuery.data.length === 0) {
        setTenantError('No subscription plans found.')
      }
    }
    if (isCreateModalOpen && plansQuery.error) {
      setTenantError(getAdminErrorMessage(plansQuery.error, 'Failed to load subscription plans.'))
    }
  }, [isCreateModalOpen, plansQuery.data, plansQuery.error, plansQuery.isFetching, plansQuery.isLoading])

  useEffect(() => {
    const isLoadingDetail = tenantDetailQuery.isLoading || tenantDetailQuery.isFetching || tenantAdminUserQuery.isLoading || tenantAdminUserQuery.isFetching
    setIsLoadingTenantDetail(isLoadingDetail)

    if (activeView !== 'detail' || !selectedTenantId) {
      setTenantDetail(null)
      setTenantAdminUser(null)
      setTenantDetailError('')
      return
    }

    if (tenantDetailQuery.data) {
      setTenantDetail(tenantDetailQuery.data)
      setTenants((current) => {
        const existingIndex = current.findIndex((item) => item.id === tenantDetailQuery.data.id)
        if (existingIndex === -1) return [tenantDetailQuery.data, ...current]

        const next = [...current]
        next[existingIndex] = tenantDetailQuery.data
        return next
      })
      setTenantDetailError('')
    }

    setTenantAdminUser(tenantAdminUserQuery.data ?? null)
    if (tenantDetailQuery.error) {
      setTenantDetailError(getAdminErrorMessage(tenantDetailQuery.error, 'Failed to load tenant details.'))
    }
  }, [
    activeView,
    selectedTenantId,
    tenantAdminUserQuery.data,
    tenantAdminUserQuery.isFetching,
    tenantAdminUserQuery.isLoading,
    tenantDetailQuery.data,
    tenantDetailQuery.error,
    tenantDetailQuery.isFetching,
    tenantDetailQuery.isLoading,
  ])

  useEffect(() => {
    const tenantId = getTenantDetailIdFromUrl(location.pathname)
    setSelectedTenantId(tenantId)
    setActiveView(tenantId ? 'detail' : 'list')
    setIsCreateModalOpen(isTenantCreateUrl(location.pathname))
  }, [location.pathname])

  const getTenantFieldMaxLength = (field: keyof CreateTenantForm) => (
    field === 'domain' ? 50 : FIELD_LENGTH_LIMITS.defaultText
  )
  const getTenantFieldMaxLengthMessage = (field: keyof CreateTenantForm) => (
    buildMaxLengthMessage(field === 'domain' ? 'Domain' : 'This field', getTenantFieldMaxLength(field))
  )
  const updateTenantForm = (field: keyof CreateTenantForm, value: string) => {
    const maxLength = getTenantFieldMaxLength(field)
    const isOverMaxLength = value.length > maxLength
    const nextValue = isOverMaxLength ? value.slice(0, maxLength) : value
    setTenantError('')
    setTenantFieldErrors((current) => {
      if (isOverMaxLength) {
        return {
          ...current,
          [field]: getTenantFieldMaxLengthMessage(field),
        }
      }
      if (!current[field]) return current
      const { [field]: _removed, ...nextErrors } = current
      return nextErrors
    })
    setTenantForm((current) => ({ ...current, [field]: nextValue }))
  }

  const resetCreateTenantForm = () => {
    setTenantError('')
    setTenantFieldErrors({})
    setTenantForm(emptyTenantForm)
  }

  const resetCreateTenantPage = () => {
    if (isSubmittingTenant) return

    setIsCreateCancelConfirmOpen(false)
    setIsCreateModalOpen(true)
    resetCreateTenantForm()
    if (!isTenantCreateUrl(location.pathname)) {
      navigate(getTenantCreatePath())
    }
  }

  const confirmCloseCreateModal = () => {
    setIsCreateModalOpen(false)
    setIsCreateCancelConfirmOpen(false)
    resetCreateTenantForm()
    navigate(getSuperAdminViewPath('tenant-management'))
  }

  const goHomeFromCreateTenant = () => {
    setIsCreateModalOpen(false)
    setIsCreateCancelConfirmOpen(false)
    resetCreateTenantForm()
    onHome()
  }

  const hasTenantDraftChanges = Boolean(
    tenantForm.companyName.trim() ||
    tenantForm.domain.trim() ||
    tenantForm.industry.trim() ||
    tenantForm.region.trim() ||
    tenantForm.adminFullName.trim() ||
    tenantForm.adminEmail.trim(),
  )

  const requestResetCreateTenantPage = () => {
    if (isSubmittingTenant) return

    if (hasTenantDraftChanges) {
      setIsCreateCancelConfirmOpen(true)
      return
    }

    resetCreateTenantPage()
  }

  const handleCreateTenant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTenantError('')
    const nextFieldErrors: CreateTenantFieldErrors = {}

    if (!tenantForm.companyName.trim()) {
      nextFieldErrors.companyName = requiredTenantFieldMessage
    } else if (tenantHasCompanyName(tenants, tenantForm.companyName)) {
      nextFieldErrors.companyName = duplicateCompanyNameMessage
    }
    addRequiredFieldErrors(
      tenantForm,
      ['planId', 'domain', 'industry', 'region', 'adminFullName'],
      nextFieldErrors,
      requiredTenantFieldMessage,
    )
    if (!tenantForm.adminEmail.trim()) {
      nextFieldErrors.adminEmail = requiredTenantFieldMessage
    } else if (!isValidTenantAdminEmail(tenantForm.adminEmail)) {
      nextFieldErrors.adminEmail = invalidTenantEmailMessage
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setTenantFieldErrors(nextFieldErrors)
      return
    }

    setTenantFieldErrors({})
    setIsSubmittingTenant(true)

    try {
      const createdTenant = await adminApi.createTenant(tenantForm)
      if (createdTenant) {
        setTenants((currentTenants) => {
          return [createdTenant, ...currentTenants.filter((tenant) => tenant.id !== createdTenant.id)]
        })
      }
      setTenantForm(emptyTenantForm)
      setTenantFieldErrors({})
      setIsCreateModalOpen(false)
      setTenantStatusFilter('all')
      setTenantPlanFilter('')
      setTenantSearchQuery('')
      setTenantPage(1)
      navigate(getSuperAdminViewPath('tenant-management'))
      invalidateTenantQueries()
      triggerToast?.('Tenant create successfully. Activation email send to Tenant Admin', 'success')
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Error system. Please try again.')
      const fieldErrors = getCreateTenantFieldErrors(error, message)
      triggerToast?.(message, 'error')
      setTenantFieldErrors(fieldErrors)
      setTenantError(Object.keys(fieldErrors).length > 0 ? '' : message)
    } finally {
      setIsSubmittingTenant(false)
    }
  }

  const activeTenantCount = useMemo(() => (
    tenants.filter((tenant) => getTenantStatusMeta(tenant.status).isActive).length
  ), [tenants])
  const planById = useMemo(() => (
    new Map(subscriptionPlans.map((plan) => [plan.id, plan]))
  ), [subscriptionPlans])
  const planByName = useMemo(() => (
    new Map(subscriptionPlans.map((plan) => [plan.name.toLowerCase(), plan]))
  ), [subscriptionPlans])
  const tenantListPlans = useMemo(() => (
    tenants
      .map((tenant) => tenant.subscriptionPlanDetail)
      .filter((plan): plan is SubscriptionPlan => Boolean(plan))
  ), [tenants])
  const highestMonthlyPrice = useMemo(() => (
    Math.max(0, ...tenantListPlans.map((plan) => plan.monthlyPrice || 0))
  ), [tenantListPlans])
  const highestPlanIds = useMemo(() => (
    new Set(
      tenantListPlans
        .filter((plan) => plan.monthlyPrice > 0 && plan.monthlyPrice === highestMonthlyPrice)
        .map((plan) => plan.id),
    )
  ), [highestMonthlyPrice, tenantListPlans])
  const highestPlanNames = useMemo(() => (
    new Set(
      tenantListPlans
        .filter((plan) => plan.monthlyPrice > 0 && plan.monthlyPrice === highestMonthlyPrice)
        .map((plan) => plan.name.toLowerCase()),
    )
  ), [highestMonthlyPrice, tenantListPlans])
  const totalRevenue = useMemo(() => (
    tenants.reduce((total, tenant) => {
      const plan = tenant.subscriptionPlanDetail

      return total + (plan?.monthlyPrice || 0)
    }, 0)
  ), [tenants])
  const tenantStatsTotalRevenue = tenantStats?.totalRevenue ?? totalRevenue
  const tenantStatsActiveCount = tenantStats?.activeTenants ?? activeTenantCount
  const tenantStatsAverageUsage = tenantStats?.averageUsage
  const tenantStatsChurnRate = tenantStats?.churnRate
  const metricsAreLoading = isLoadingTenants || isLoadingPlans
  const tenantStatsAreLoading = isLoadingTenantStats && !tenantStats
  const getTenantPlan = (tenant: Tenant) => (
    tenant.subscriptionPlanDetail ||
    (tenant.subscriptionPlanId
      ? planById.get(tenant.subscriptionPlanId)
      : planByName.get(tenant.subscriptionPlan.toLowerCase()))
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
    const options: Array<{ value: string; label: string }> = []
    const optionLabels = new Set<string>()

    const addPlanOption = (value?: string, label?: string) => {
      const cleanLabel = String(label || '').trim()
      const cleanValue = String(value || cleanLabel).trim()
      const normalizedLabel = normalizeFilterValue(cleanLabel)

      if (!cleanLabel || !cleanValue || optionLabels.has(normalizedLabel)) return

      optionLabels.add(normalizedLabel)
      options.push({ value: cleanValue, label: cleanLabel })
    }

    subscriptionPlans.forEach((plan) => {
      addPlanOption(plan.id, plan.name)
    })

    return options
      .sort((left, right) => left.label.localeCompare(right.label))
  }, [subscriptionPlans])
  const selectedPlanFilter = subscriptionPlans.find((plan) => plan.id === tenantPlanFilter)
  const displayedTenants = tenants.filter((tenant) => (
    tenantMatchesPlanFilter(tenant, tenantPlanFilter, selectedPlanFilter)
  ))
  const currentTenantPage = tenantPage
  const paginatedTenants = displayedTenants
  const tenantTotalElements = getListTotalElements(tenants, displayedTenants.length)
  const tenantDisplayStart = displayedTenants.length === 0 ? 0 : ((currentTenantPage - 1) * ADMIN_LIST_PAGE_SIZE) + 1
  const tenantDisplayEnd = tenantDisplayStart === 0 ? 0 : Math.min(tenantTotalElements, tenantDisplayStart + paginatedTenants.length - 1)
  const tenantPageItems = getCompactPageItems(currentTenantPage, tenantPageCount)

  useEffect(() => {
    if (activeView !== 'list' || isCreateModalOpen) return

    const searchParams = new URLSearchParams()
    if (tenantStatusFilter === 'active') searchParams.set('status', 'ACTIVE')
    if (tenantStatusFilter === 'inactive') searchParams.set('status', 'INACTIVE')
    if (tenantSearchQuery.trim()) searchParams.set('search', tenantSearchQuery.trim())
    if (tenantPlanFilter.trim()) searchParams.set('planId', tenantPlanFilter.trim())
    if (tenantPage > 1) searchParams.set('page', String(tenantPage))

    const nextSearch = searchParams.toString()
    const nextPath = `${getSuperAdminViewPath('tenant-management')}${nextSearch ? `?${nextSearch}` : ''}`
    const currentPath = `${location.pathname}${location.search}`

    if (currentPath !== nextPath) {
      navigate(nextPath, { replace: true })
    }
  }, [activeView, isCreateModalOpen, location.pathname, location.search, navigate, tenantPage, tenantPlanFilter, tenantSearchQuery, tenantStatusFilter])

  useEffect(() => {
    if (!didMountTenantListFilters.current) {
      didMountTenantListFilters.current = true
      return
    }

    setTenantPage(1)
  }, [tenantPlanFilter, tenantSearchQuery, tenantStatusFilter])

  useEffect(() => {
    if (!isLoadingTenants && !tenantListError && tenants.length === 0 && tenantPage > 1) {
      setTenantPage((page) => Math.max(1, page - 1))
    }
  }, [isLoadingTenants, tenantListError, tenantPage, tenants.length])

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
    navigate(getTenantDetailPath(tenantId))
  }
  const closeTenantDetail = () => {
    setSelectedTenantId('')
    setActiveView('list')
    navigate(getSuperAdminViewPath('tenant-management'))
  }
  const isTenantActive = (tenant: Tenant) => getTenantStatusMeta(tenant.status).className === 'active'
  const requestDeleteTenant = (tenant: Tenant) => {
    if (isTenantActive(tenant)) return
    setDeleteTenantTarget(tenant)
  }
  const confirmDeleteTenant = async () => {
    if (!deleteTenantTarget) return

    setIsDeletingTenant(true)
    setTenantListError('')

    try {
      await adminApi.deleteTenant(deleteTenantTarget.id)
      setTenants((currentTenants) => currentTenants.filter((tenant) => tenant.id !== deleteTenantTarget.id))
      setTenantDetail((tenant) => tenant?.id === deleteTenantTarget.id ? null : tenant)
      closeTenantDetail()
      setDeleteTenantTarget(null)
      invalidateTenantQueries()
      triggerToast?.('Tenant permanently deleted.', 'success')
    } catch {
      setTenantListError('Error system. Please try again.')
    } finally {
      setIsDeletingTenant(false)
    }
  }
  const openCreateTenant = () => {
    setSelectedTenantId('')
    setActiveView('list')
    setTenantError('')
    setTenantFieldErrors({})
    setIsCreateModalOpen(true)
    navigate(getTenantCreatePath())
  }
  const confirmUpdateTenantStatus = async () => {
    const currentTenant = selectedTenant || tenants.find((tenant) => tenant.id === selectedTenantId)
    if (!currentTenant) return

    const selectedPlan = getTenantPlan(currentTenant)
    const currentTenantStatus = getTenantStatusMeta(currentTenant.status)

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
      const activatedAt = nextStatus === 'ACTIVE' ? new Date().toISOString() : tenantAdminUser?.activatedAt
      setTenantDetail((tenant) => tenant?.id === currentTenant.id ? { ...tenant, status: nextStatus } : tenant)
      setTenants((currentTenants) => currentTenants.map((tenant) => (
        tenant.id === currentTenant.id ? { ...tenant, status: nextStatus } : tenant
      )))
      setTenantAdminUser((user) => user ? { ...user, status: nextStatus, activatedAt } : user)
      setIsStatusConfirmOpen(false)
      invalidateTenantQueries()
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

    const nextPlan = planById.get(pendingTenantPlanId)
    if (!nextPlan) return

    const activeUsers = selectedTenant.userQuotaUsed || 0
    const activeJobPostings = selectedTenant.activeJobPostingUsed || 0
    const maxUsers = nextPlan.staffAccountUnlimited ? Number.POSITIVE_INFINITY : nextPlan.maxStaffAccount
    const maxJobPostings = nextPlan.activeJobPostingUnlimited ? Number.POSITIVE_INFINITY : nextPlan.maxActiveJobPosting
    const exceedsUserLimit = activeUsers > maxUsers
    const exceedsJobPostingLimit = activeJobPostings > maxJobPostings

    if (exceedsUserLimit || exceedsJobPostingLimit) {
      const maxUsersLabel = nextPlan.staffAccountUnlimited ? 'Unlimited' : String(nextPlan.maxStaffAccount)
      const maxJobPostingsLabel = nextPlan.activeJobPostingUnlimited ? 'Unlimited' : String(nextPlan.maxActiveJobPosting)
      const message = `This tenant currently has ${activeUsers} active users / ${activeJobPostings} job postings, which exceeds the selected plan limits (${maxUsersLabel}/${maxJobPostingsLabel}). Please choose a higher plan or reduce usage before changing the plan.`
      setPendingTenantPlanId(currentPlanId)
      setTenantListError('')
      triggerToast?.(message, 'error')
      return
    }

    setTenantListError('')
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
      const nextPlan = subscriptionPlans.find((plan) => plan.id === pendingTenantPlanId)
      const planChangedAt = new Date().toISOString()
      const nextTenant = {
        ...selectedTenant,
        startDate: planChangedAt,
        subscriptionPlanId: pendingTenantPlanId,
        subscriptionPlanDetail: nextPlan || selectedTenant.subscriptionPlanDetail,
        subscriptionPlan: nextPlan?.name || selectedTenant.subscriptionPlan,
        userQuotaLimit: nextPlan?.staffAccountUnlimited ? 0 : (nextPlan?.maxStaffAccount ?? selectedTenant.userQuotaLimit),
        userQuotaUnlimited: nextPlan?.staffAccountUnlimited ?? selectedTenant.userQuotaUnlimited,
        activeJobPostingLimit: nextPlan?.activeJobPostingUnlimited ? 0 : (nextPlan?.maxActiveJobPosting ?? selectedTenant.activeJobPostingLimit),
        activeJobPostingUnlimited: nextPlan?.activeJobPostingUnlimited ?? selectedTenant.activeJobPostingUnlimited,
      }
      setTenantDetail((tenant) => tenant?.id === selectedTenant.id ? nextTenant : tenant)
      setTenants((currentTenants) => currentTenants.map((tenant) => (
        tenant.id === selectedTenant.id ? nextTenant : tenant
      )))
      setIsPlanConfirmOpen(false)
      invalidateTenantQueries()
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
          fieldErrors={tenantFieldErrors}
          plans={subscriptionPlans}
          isLoadingPlans={isLoadingPlans}
          isSubmitting={isSubmittingTenant}
          onChange={updateTenantForm}
          onClose={requestResetCreateTenantPage}
          onGoHome={goHomeFromCreateTenant}
          onBackToList={confirmCloseCreateModal}
          onSubmit={handleCreateTenant}
        />

        {isCreateCancelConfirmOpen && (
          <ConfirmActionModal
            isSubmitting={false}
            title="Confirm Action"
            message="Are you sure you want to cancel? Your changes will not be saved."
            cancelLabel="Cancel"
            confirmLabel="Confirm"
            onCancel={() => setIsCreateCancelConfirmOpen(false)}
            onConfirm={resetCreateTenantPage}
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
    const isPreviewingPlanChange = Boolean(nextSelectedPlan && hasSelectedDifferentPlan)
    const hasUnlimitedStaffQuota = Boolean(activeSubscriptionPlan?.staffAccountUnlimited)
    const hasUnlimitedJobQuota = Boolean(activeSubscriptionPlan?.activeJobPostingUnlimited)
    const staffLimit = hasUnlimitedStaffQuota
      ? 0
      : isPreviewingPlanChange
        ? activeSubscriptionPlan?.maxStaffAccount || 0
        : selectedTenant?.userQuotaLimit || activeSubscriptionPlan?.maxStaffAccount || 0
    const staffUsed = selectedTenant?.userQuotaUsed || 0
    const staffUsagePercent = getUsagePercent(staffUsed, staffLimit)
    const jobLimit = hasUnlimitedJobQuota
      ? 0
      : isPreviewingPlanChange
        ? activeSubscriptionPlan?.maxActiveJobPosting || 0
        : selectedTenant?.activeJobPostingLimit || activeSubscriptionPlan?.maxActiveJobPosting || 0
    const activeJobPostingUsed = selectedTenant?.activeJobPostingUsed || 0
    const jobUsagePercent = getUsagePercent(activeJobPostingUsed, jobLimit)
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
    const subscriptionStartDate = selectedTenant?.startDate || selectedTenant?.createdAt
    const billingCycle = String(activeSubscriptionPlan?.billingCycle || selectedTenant?.billingCycle || '').trim().toUpperCase()
    const expirationDaysToAdd = billingCycle === 'YEARLY'
      ? 365
      : billingCycle === 'SIX_MONTHLY' || billingCycle === '6_MONTHLY'
        ? 149
        : 29
    const subscriptionExpirationDate = addDaysToDate(subscriptionStartDate, expirationDaysToAdd)
    const tenantExpirationDate = formatTenantDate(subscriptionExpirationDate)
    const tenantStartDate = formatTenantDate(subscriptionStartDate)
    const tenantCreatedDate = selectedTenant ? formatTenantDate(selectedTenant.createdAt) : '-'
    const monthlyBillingLabel = activeSubscriptionPlan
      ? activeSubscriptionPlan.priceLabel || `$${formatCurrencyInput((activeSubscriptionPlan.price ?? activeSubscriptionPlan.monthlyPrice).toFixed(2))} /month`
      : '-'
    const daysRemainingLabel = getDaysRemainingLabel(subscriptionExpirationDate)
    const tenantAdminFullName = tenantAdminUser?.fullName || (selectedTenant ? getTenantAdminPayload(selectedTenant).adminFullName : '-')
    const tenantAdminEmail = tenantAdminUser?.email || (selectedTenant ? getTenantAdminPayload(selectedTenant).adminEmail : '-')
    const tenantAdminStatus = selectedTenant?.status || tenantAdminUser?.status || '-'
    const tenantAdminStatusMeta = getTenantStatusMeta(tenantAdminStatus)
    const tenantAdminActivatedDate = formatPlanDate(tenantAdminUser?.activatedAt || tenantAdminUser?.createdAt || '') || tenantAdminUser?.activatedAt || tenantAdminUser?.createdAt || tenantCreatedDate
    const statusActionLabel = isActive
      ? 'Deactivate Tenant'
      : 'Activate Tenant'
    const statusActionClassName = isActive ? 'status-deactivate' : 'status-activate'
    const statusActionMessage = isActive
      ? 'Are you sure you want to deactivate this tenant?'
      : 'Are you sure you want to activate this tenant?'
    const statusActionSubmittingLabel = isActive ? 'Deactivating...' : 'Activating...'

    return (
      <div className="role-content tenant-detail-content">
        <Breadcrumb
          items={[
            { label: 'Home', onClick: onHome },
            { label: 'Tenant Management', onClick: closeTenantDetail },
            { label: 'Tenant detail' },
          ]}
        />

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
              <div className="tenant-detail-actions">
                <button
                  type="button"
                  className="tenant-detail-delete-button icon-tooltip"
                  data-tooltip={isTenantActive(selectedTenant) ? 'Deactivate this tenant before deleting it.' : 'Delete'}
                  title={isTenantActive(selectedTenant) ? 'Deactivate this tenant before deleting it.' : undefined}
                  onClick={() => requestDeleteTenant(selectedTenant)}
                  disabled={isDeletingTenant || isTenantActive(selectedTenant)}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className={statusActionClassName}
                  onClick={() => setIsStatusConfirmOpen(true)}
                  disabled={isUpdatingTenantStatus}
                >
                  {statusActionLabel}
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
                </div>
              </section>

              <section className="tenant-detail-card tenant-subscription-card">
                <header>
                  <span><i className="fa-regular fa-id-badge"></i></span>
                  <div className="tenant-plan-title-stack">
                    <h2>Subscription Plan</h2>
                    <strong>{activeSubscriptionPlan?.name || selectedTenant.subscriptionPlan || '-'}</strong>
                  </div>
                  <ScrollableSelect
                    className="tenant-plan-picker"
                    ariaLabel="Select subscription plan"
                    value={pendingTenantPlanId}
                    disabled={isUpdatingTenantPlan || subscriptionPlans.length === 0}
                    placeholder="Select plan"
                    options={subscriptionPlans
                      .filter((plan) => plan.status.toLowerCase() === 'active')
                      .map((plan) => ({ value: plan.id, label: plan.name }))}
                    onChange={(nextValue) => {
                      setTenantListError('')
                      setPendingTenantPlanId(nextValue)
                    }}
                  />
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

            {deleteTenantTarget && (
              <ConfirmActionModal
                isSubmitting={isDeletingTenant}
                title="Confirm Action"
                message={`Are you sure you want to permanently delete ${deleteTenantTarget.name}? This action cannot be undone.`}
                cancelLabel="Cancel"
                confirmLabel="Confirm"
                submittingLabel="Deleting..."
                onCancel={() => {
                  if (!isDeletingTenant) setDeleteTenantTarget(null)
                }}
                onConfirm={confirmDeleteTenant}
              />
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="role-content tenant-management-content">
      <Breadcrumb items={[{ label: 'Home', onClick: onHome }, { label: 'Tenant Management' }]} />

      <section className="tenant-filter-card">
        <div className="tenant-filter-tabs">
          <button type="button" className={tenantStatusFilter === 'all' ? 'active' : ''} onClick={() => selectTenantFilter('all')}>All Tenants</button>
          <button type="button" className={tenantStatusFilter === 'active' ? 'active' : ''} onClick={() => selectTenantFilter('active')}>Active</button>
          <button type="button" className={tenantStatusFilter === 'inactive' ? 'active' : ''} onClick={() => selectTenantFilter('inactive')}>Inactive</button>
          <ScrollableSelect
            className={`tenant-plan-filter-tab ${tenantPlanFilter ? 'active' : ''}`}
            value={tenantPlanFilter}
            ariaLabel="Filter by plan"
            placeholder="Filter by Plan"
            options={[
              { value: '', label: 'Filter by Plan' },
              ...planFilterOptions.map((plan) => ({ value: plan.value, label: plan.label })),
            ]}
            onChange={selectPlanFilter}
          />
        </div>
        <SearchInput
          className="tenant-filter-search"
          value={tenantSearchQuery}
          onChange={(event) => setTenantSearchQuery(event.target.value)}
          placeholder="Search tenant name"
          ariaLabel="Tenant search"
        />
        <button type="button" className="tenant-create-btn" onClick={openCreateTenant}>
          Create New Tenant
        </button>
      </section>

      <div className="tenant-management-metrics">
        <article className="tenant-management-metric-card">
          <div>
            <small>Monthly Active Plan Revenue</small>
            <strong>{(metricsAreLoading || tenantStatsAreLoading) ? '...' : `$${tenantStatsTotalRevenue.toLocaleString()}`}</strong>
          </div>
          <span className="metric-icon-success"><i className="fa-solid fa-arrow-trend-up"></i></span>
        </article>
        <article className="tenant-management-metric-card">
          <div>
            <small>Active Tenants</small>
            <strong>{tenantStatsAreLoading ? '...' : String(tenantStatsActiveCount)}</strong>
          </div>
          <span className="metric-icon-primary"><i className="fa-solid fa-table-cells-large"></i></span>
        </article>
        <article className="tenant-management-metric-card">
          <div>
            <small>Average Usage</small>
            <strong>{tenantStatsAreLoading ? '...' : formatDashboardPercent(tenantStatsAverageUsage)}</strong>
          </div>
          <span className="metric-icon-warning"><i className="fa-solid fa-circle-notch"></i></span>
        </article>
        <article className="tenant-management-metric-card">
          <div>
            <small>Churn Rate</small>
            <strong>{tenantStatsAreLoading ? '...' : formatDashboardPercent(tenantStatsChurnRate)}</strong>
          </div>
          <span className="metric-icon-danger"><i className="fa-solid fa-triangle-exclamation"></i></span>
        </article>
      </div>

      <ListTable
        cardClassName="tenant-list-table-card"
        rowClassName="tenant-list-table-row"
        headClassName="tenant-list-table-head"
        stateClassName="tenant-list-table-state"
        columns={['Full Name', 'Subscription Plan', 'Price', 'Expiration Date', 'User Quota', 'Status', 'Actions']}
        isLoading={isLoadingTenants}
        error={tenantListError}
        empty={displayedTenants.length === 0}
        loadingMessage="Loading tenants..."
        emptyMessage="No tenants found."
        pagination={{
          label: `Showing ${tenantDisplayStart}-${tenantDisplayEnd} of ${tenantTotalElements} Tenant${tenantTotalElements === 1 ? '' : 's'}`,
          currentPage: currentTenantPage,
          pageCount: tenantPageCount,
          pageItems: tenantPageItems,
          onPageChange: setTenantPage,
          ellipsisKeyPrefix: 'tenant',
        }}
      >
        {paginatedTenants.map((tenant) => {
            const status = getTenantStatusMeta(tenant.status)
            const tenantPlan = getTenantPlan(tenant)
            const hasUnlimitedQuota = tenant.userQuotaUnlimited || (tenantPlan ? tenantPlan.staffAccountUnlimited : tenant.userQuotaLimit <= 0)
            const quotaPercent = tenant.userQuotaLimit > 0
              ? Math.min(100, Math.round((tenant.userQuotaUsed / tenant.userQuotaLimit) * 100))
              : 0
            const expirationDateLabel = formatPlanDate(tenant.expirationDate) || tenant.expirationDate || '-'
            const monthlyPriceLabel = tenant.priceLabel || (tenantPlan
              ? tenantPlan.priceLabel || `$${formatCurrencyInput((tenantPlan.price ?? tenantPlan.monthlyPrice).toFixed(2))} /month`
              : '-')
            const handleOpenTenantDetail = () => openTenantDetail(tenant.id)

            return (
              <div
                className="tenant-list-table-row tenant-list-table-row-clickable"
                key={tenant.id}
                role="button"
                tabIndex={0}
                onClick={handleOpenTenantDetail}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleOpenTenantDetail()
                  }
                }}
              >
                <span className="table-name-tooltip" data-tooltip={tenant.name} title={tenant.name} tabIndex={0}>
                  <strong>{tenant.name}</strong>
                </span>
                <span className={`tenant-plan-name ${isHighestPricedPlan(tenant, tenantPlan) ? 'premium-plan' : ''}`}>
                  {tenantPlan?.name || tenant.subscriptionPlan || '-'}
                </span>
                <span className="tenant-monthly-price">{monthlyPriceLabel}</span>
                <span className="tenant-expiration-date">{expirationDateLabel}</span>
                <span className={`tenant-quota ${hasUnlimitedQuota ? 'unlimited' : ''}`}>
                  {!hasUnlimitedQuota && <i><b style={{ width: `${quotaPercent}%` }} /></i>}
                  <strong>{hasUnlimitedQuota ? 'Unlimited' : `${tenant.userQuotaUsed}/${tenant.userQuotaLimit}`}</strong>
                </span>
                <em className={status.className}>{status.label}</em>
                <span className="tenant-row-actions">
                  <button
                    type="button"
                    className="icon-tooltip"
                    aria-label={`View ${tenant.name}`}
                    data-tooltip="Detail"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleOpenTenantDetail()
                    }}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-tooltip tenant-delete-action"
                    aria-label={`Delete ${tenant.name}`}
                    data-tooltip={isTenantActive(tenant) ? 'Deactivate this tenant before deleting it.' : 'Delete'}
                    title={isTenantActive(tenant) ? 'Deactivate this tenant before deleting it.' : undefined}
                    disabled={isDeletingTenant || isTenantActive(tenant)}
                    onClick={(event) => {
                      event.stopPropagation()
                      requestDeleteTenant(tenant)
                    }}
                  >
                    <TrashIcon />
                  </button>
                </span>
              </div>
            )
          })}
      </ListTable>

      {deleteTenantTarget && (
        <ConfirmActionModal
          isSubmitting={isDeletingTenant}
          title="Confirm Action"
          message={`Are you sure you want to permanently delete ${deleteTenantTarget.name}? This action cannot be undone.`}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          submittingLabel="Deleting..."
          onCancel={() => {
            if (!isDeletingTenant) setDeleteTenantTarget(null)
          }}
          onConfirm={confirmDeleteTenant}
        />
      )}
    </div>
  )
}
