import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_LIST_PAGE_SIZE, adminApi } from '../../infrastructure/adminApi'
import { useDeletePlan } from '../queryHooks/useAdminQueries'
import type { PlanDashboardStats, SubscriptionPlan, Tenant } from '../../domain/adminApi.types'
import {
  buildPlanListParams,
  buildTopTierPlanParams,
  formatStatNumber,
  getHighestPricedActivePlan,
  isActiveSubscriptionPlan,
  sortSubscriptionPlans,
  type PlanSortOption,
} from '../../infrastructure/subscriptionPlansService'
import { getErrorMessage as getAdminErrorMessage } from '@/core/utils/errors/errorMessages'
import {
  getSubscriptionPlanCreatePath,
  getSubscriptionPlanDetailPath,
  getSubscriptionPlanEditPath,
  getSubscriptionPlanIdFromUrl,
  getSuperAdminViewPath,
  isSubscriptionPlanCreateUrl,
  isSubscriptionPlanEditUrl,
} from '../../domain/superAdminRouteHelpers'
import { getCompactPageItems, getListPageCount, getListTotalElements } from '@/core/utils/pagination'

export function useSubscriptionPlansController({
  onHome,
  triggerToast,
}: {
  onHome: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const deletePlanMutation = useDeletePlan()

  const initialPlanListSearchParams = new URLSearchParams(location.search)
  const initialPlanPage = Number(initialPlanListSearchParams.get('page') || 1)
  const initialSubscriberPage = Number(initialPlanListSearchParams.get('subscriberPage') || 1)
  const initialPlanSort = initialPlanListSearchParams.get('sort')
  const isInitialPlanSort = (value: string | null): value is PlanSortOption => (
    value === 'price-asc' || value === 'price-desc' || value === 'newest' || value === 'oldest'
  )

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
  const [planPage, setPlanPage] = useState(() => Number.isFinite(initialPlanPage) ? Math.max(1, initialPlanPage) : 1)
  const [planPageCount, setPlanPageCount] = useState(1)
  const [planSort, setPlanSort] = useState<PlanSortOption>(isInitialPlanSort(initialPlanSort) ? initialPlanSort : 'newest')
  const [subscriberPage, setSubscriberPage] = useState(() => Number.isFinite(initialSubscriberPage) ? Math.max(1, initialSubscriberPage) : 1)
  const [subscriberPageCount, setSubscriberPageCount] = useState(1)
  const [subscriberTotalCount, setSubscriberTotalCount] = useState(0)

  useEffect(() => {
    if (activeView !== 'list') return

    const searchParams = new URLSearchParams()
    if (planSort !== 'newest') searchParams.set('sort', planSort)
    if (planPage > 1) searchParams.set('page', String(planPage))

    const nextSearch = searchParams.toString()
    const nextPath = `${getSuperAdminViewPath('subscription-plans')}${nextSearch ? `?${nextSearch}` : ''}`
    const currentPath = `${location.pathname}${location.search}`

    if (currentPath !== nextPath) {
      navigate(nextPath, { replace: true })
    }
  }, [activeView, location.pathname, location.search, navigate, planPage, planSort])

  useEffect(() => {
    if (activeView !== 'detail' || !selectedPlanId) return

    const searchParams = new URLSearchParams()
    if (subscriberPage > 1) searchParams.set('subscriberPage', String(subscriberPage))

    const nextSearch = searchParams.toString()
    const nextPath = `${getSubscriptionPlanDetailPath(selectedPlanId)}${nextSearch ? `?${nextSearch}` : ''}`
    const currentPath = `${location.pathname}${location.search}`

    if (currentPath !== nextPath) {
      navigate(nextPath, { replace: true })
    }
  }, [activeView, location.pathname, location.search, navigate, selectedPlanId, subscriberPage])

  useEffect(() => {
    if (activeView !== 'list') return

    let isActive = true
    adminApi.getPlanDashboardStats()
      .then((stats) => {
        if (isActive) setPlanStats(stats)
      })
      .catch(() => {
        if (isActive) setPlanStats({})
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
        if (isActive) setTopTierPlan(getHighestPricedActivePlan(items))
      })
      .catch(() => {
        if (isActive) setTopTierPlan(null)
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
        if (isActive) setIsLoadingPlans(false)
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
        if (isActive) setSelectedPlanDetail(plan)
      })
      .catch((error) => {
        if (isActive) {
          setSelectedPlanDetail(null)
          setPlanDetailError(getAdminErrorMessage(error, 'Failed to load subscription plan.'))
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingPlanDetail(false)
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
    navigate(getSuperAdminViewPath('subscription-plans'))
    setRefreshPlansKey((value) => value + 1)
  }

  const closePlanDetail = () => {
    setSelectedPlanId('')
    setActiveView('list')
    navigate(getSuperAdminViewPath('subscription-plans'))
  }

  const openPlanList = () => {
    setSelectedPlanId('')
    setActiveView('list')
    navigate(getSuperAdminViewPath('subscription-plans'))
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
      await deletePlanMutation.mutateAsync(deletePlanTarget.id)
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

  return {
    onHome,
    triggerToast,
    activeView,
    setActiveView,
    selectedPlanId,
    selectedPlanDetail,
    plans,
    tenants,
    isLoadingPlans,
    planListError,
    isLoadingPlanDetail,
    planDetailError,
    deletePlanTarget,
    isDeletingPlan,
    planTenantCounts,
    planPage,
    planPageCount,
    planSort,
    subscriberPage,
    subscriberPageCount,
    subscriberTotalCount,

    // Calculated Dashboard Metrics
    planStatsActivePlans,
    planStatsTopTierName,
    planStatsMonthlyRevenueLabel,
    planStatsRenewalRateLabel,
    pagedPlans,
    planTotalElements,
    visiblePlanStart,
    visiblePlanEnd,
    planPageItems,

    // Navigation & Handlers
    handlePlanCreated,
    closePlanDetail,
    openPlanList,
    openPlanCreate,
    openPlanDetail,
    openPlanEdit,
    requestDeletePlan,
    getPlanDeleteTooltip,
    confirmDeletePlan,
    setPlanSort,
    setPlanPage,
    setSubscriberPage,
    setDeletePlanTarget,
    setRefreshPlansKey,
  }
}
