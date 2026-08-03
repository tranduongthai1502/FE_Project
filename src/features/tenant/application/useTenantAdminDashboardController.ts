import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildNavigation } from '@/core/hooks/navigation'
import { tenantNav } from '../presentation/components/tenantNavigation'
import type { TenantAdminView } from '@/features/tenant/presentation/pages/tenantAdmin.types'
import type { ActivityLog, StaffMember, UserStatus, Tenant, SubscriptionPlan } from '@/features/tenant/domain/tenantApi.types'
import { getInitialTenantAdminView, getTenantAdminStaffIdFromUrl, getTenantAdminViewPath } from '@/features/tenant/domain/tenantAdminRouteHelpers'
import { getStoredDashboardUser } from '@/features/auth'
import { tenantAdminApi } from '../infrastructure/tenantAdminApi'
import { getErrorMessage as getAdminErrorMessage, inactiveUserActionMessage, isInactiveUserActionError } from '@/core/utils/errors/errorMessages'
import { isStoredCurrentUserInactive } from '@/features/auth/application/authAccess'
import { shouldToastHttpError } from '@/core/utils/httpStatusManager'
import { getListPageCount } from '@/core/utils/pagination'
import { getStoredRequirePasswordChange } from '@/core/api/authStorage'
import { ACTIVITY_LOG_PAGE_SIZE, getDefaultActivityDateRange } from '../domain/tenantActivityDates'
import { inactiveTenantActionMessage, passwordChangeRequiredMessage } from './tenantAdminMessages'
import { downloadBlob, getDownloadFilename } from './tenantDownload'
import { buildStaffListFilters } from './tenantStaffFilters'
import { getStaffFormFieldErrors, type StaffFormFieldErrors } from './tenantStaffFormValidation'
import { isInactiveTenantStatus, normalizeStaffMember, type StaffAccountLimit } from './tenantStaffNormalizers'
import { clearSelectedStaff, getStoredSelectedStaff, getStoredTenantId, saveSelectedStaff } from './tenantStaffStorage'
import { loadTenantWorkspaceData } from './tenantWorkspaceLoader'
export function useTenantAdminDashboardController({ triggerToast }: { triggerToast?: (message: string, type?: 'success' | 'error') => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isPasswordChangeRequired] = useState(() => getStoredRequirePasswordChange())
  const [user] = useState(() => getStoredDashboardUser())
  const [activeView, setActiveView] = useState<TenantAdminView>(() => (
    getStoredRequirePasswordChange() ? 'settings' : getInitialTenantAdminView(location.pathname)
  ))
  const [tenantId] = useState(() => getStoredTenantId())
  const [tenantDetail, setTenantDetail] = useState<Tenant | null>(null)
  const [tenantPlan, setTenantPlan] = useState<SubscriptionPlan | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState(() => getTenantAdminStaffIdFromUrl(location.pathname))
  const [viewResetKeys, setViewResetKeys] = useState<Record<TenantAdminView, number>>({
    dashboard: 0,
    jobs: 0,
    settings: 0,
    staffManagement: 0,
    staffCreate: 0,
    staffEdit: 0,
    staffDetail: 0,
    staffActivityLog: 0,
  })
  const changeView = (view: TenantAdminView, staffId?: string) => {
    if (isPasswordChangeRequired && view !== 'settings') {
      setActiveView('settings')
      navigate(getTenantAdminViewPath('settings'))
      triggerToast?.(passwordChangeRequiredMessage, 'error')
      return
    }

    setActiveView(view)
    setSelectedStaffId(staffId || '')
    navigate(getTenantAdminViewPath(view, staffId))
  }
  const reloadViewFromSidebar = (view: TenantAdminView) => {
    if (isPasswordChangeRequired && view !== 'settings') {
      setActiveView('settings')
      navigate(getTenantAdminViewPath('settings'))
      triggerToast?.(passwordChangeRequiredMessage, 'error')
      return
    }

    setStaffFormFieldErrors({})
    setActiveView(view)
    setSelectedStaffId('')
    navigate(getTenantAdminViewPath(view))
    setViewResetKeys((current) => ({
      ...current,
      [view]: current[view] + 1,
    }))
    setRefreshKey((current) => current + 1)
  }
  const navItems = buildNavigation(tenantNav, activeView, reloadViewFromSidebar).map((item) => (
    isPasswordChangeRequired && item.label !== 'Settings'
      ? {
          ...item,
          onClick: () => {
            setActiveView('settings')
            navigate(getTenantAdminViewPath('settings'))
            triggerToast?.(passwordChangeRequiredMessage, 'error')
          },
        }
      : item
  ))

  const loadStaffDetail = useCallback((detailStaffId: string, fallbackStaff?: StaffMember, options: { syncSelectedStaffId?: boolean } = {}) => {
    if (!detailStaffId) return () => {}

    let isActive = true
    if (options.syncSelectedStaffId && detailStaffId !== selectedStaffId) {
      setSelectedStaffId(detailStaffId)
    }
    setStaffDetailError('')
    setIsLoadingStaffDetail(true)

    tenantAdminApi.getUserById(detailStaffId)
      .then((staffDetail) => {
        if (!isActive) return

        const normalizedStaffDetail = normalizeStaffMember(staffDetail)
        setSelectedStaff((currentStaff) => {
          const fallback = fallbackStaff || currentStaff
          const nextStaff: StaffMember = {
            id: detailStaffId,
            email: normalizedStaffDetail?.email || fallback?.email || '',
            fullName: normalizedStaffDetail?.fullName || fallback?.fullName || 'Staff Member',
            status: normalizedStaffDetail?.status || fallback?.status || 'DISABLED',
            userRole: normalizedStaffDetail?.userRole || fallback?.userRole || '',
            employeeCode: normalizedStaffDetail?.employeeCode || fallback?.employeeCode,
            phone: normalizedStaffDetail?.phone || fallback?.phone,
            createdAt: normalizedStaffDetail?.createdAt || fallback?.createdAt,
            activatedAt: normalizedStaffDetail?.activatedAt || fallback?.activatedAt,
            lastLoginAt: normalizedStaffDetail?.lastLoginAt || fallback?.lastLoginAt,
            lastLoginLocation: normalizedStaffDetail?.lastLoginLocation || fallback?.lastLoginLocation,
            lastLoginIp: normalizedStaffDetail?.lastLoginIp || fallback?.lastLoginIp,
          }

          saveSelectedStaff(nextStaff)
          return nextStaff
        })
      })
      .catch((error) => {
        if (isActive) {
          setStaffDetailError('Error loading staff details. Please try again.')
          if (shouldToastHttpError(error)) {
            triggerToast?.(getAdminErrorMessage(error, 'Error loading staff details. Please try again.'), 'error')
          }
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingStaffDetail(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [selectedStaffId, triggerToast])

  useEffect(() => {
    if (isPasswordChangeRequired) {
      setActiveView('settings')
      if (location.pathname !== getTenantAdminViewPath('settings')) {
        navigate(getTenantAdminViewPath('settings'), { replace: true })
      }
    }
  }, [isPasswordChangeRequired, location.pathname, navigate])

  useEffect(() => {
    if (isPasswordChangeRequired) {
      return
    }

    const nextView = getInitialTenantAdminView(location.pathname)
    const nextStaffId = getTenantAdminStaffIdFromUrl(location.pathname)

    setActiveView((currentView) => currentView === nextView ? currentView : nextView)
    setSelectedStaffId((currentStaffId) => currentStaffId === nextStaffId ? currentStaffId : nextStaffId)
  }, [isPasswordChangeRequired, location.pathname])

  // CRUD Staff States
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [staffAccountList, setStaffAccountList] = useState<StaffMember[]>([])
  const [staffAccountLimit, setStaffAccountLimit] = useState<StaffAccountLimit>({})
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [isLoadingTenantDetail, setIsLoadingTenantDetail] = useState(false)
  const [isLoadingStaffDetail, setIsLoadingStaffDetail] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [staffDetailError, setStaffDetailError] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(() => getStoredSelectedStaff())
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [activityLogPage, setActivityLogPage] = useState(1)
  const [activityLogPageCount, setActivityLogPageCount] = useState(1)
  const [activityEventTypeFilter, setActivityEventTypeFilter] = useState('')
  const [activityStartDateFilter, setActivityStartDateFilter] = useState(() => getDefaultActivityDateRange().startDate)
  const [activityEndDateFilter, setActivityEndDateFilter] = useState(() => getDefaultActivityDateRange().endDate)
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [isClearingActivityLogs, setIsClearingActivityLogs] = useState(false)
  const [isExportingActivityLogs, setIsExportingActivityLogs] = useState(false)
  const [activityError, setActivityError] = useState('')
  
  // Modals & Save states
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<StaffMember | null>(null)
  const [statusConfirmStaff, setStatusConfirmStaff] = useState<StaffMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const initialStaffListSearchParams = new URLSearchParams(location.search)
  const initialStaffPage = Number(initialStaffListSearchParams.get('page') || 1)
  const [staffPage, setStaffPage] = useState(() => Number.isFinite(initialStaffPage) ? Math.max(1, initialStaffPage) : 1)
  const [staffPageCount, setStaffPageCount] = useState(1)
  const [staffRoleFilter, setStaffRoleFilter] = useState(initialStaffListSearchParams.get('role') || 'all')
  const [staffStatusFilter, setStaffStatusFilter] = useState(initialStaffListSearchParams.get('status') || 'all')
  const [staffSearchQuery, setStaffSearchQuery] = useState(initialStaffListSearchParams.get('search') || '')
  const [debouncedStaffSearchQuery, setDebouncedStaffSearchQuery] = useState(initialStaffListSearchParams.get('search') || '')
  const [isActionLocked, setIsActionLocked] = useState(() => isStoredCurrentUserInactive())
  const [staffFormFieldErrors, setStaffFormFieldErrors] = useState<StaffFormFieldErrors>({})
  const didMountStaffListFilters = useRef(false)

  const shouldLoadTenantWorkspace =
    activeView === 'dashboard' ||
    activeView === 'staffManagement' ||
    activeView === 'staffCreate' ||
    activeView === 'staffEdit' ||
    activeView === 'staffDetail' ||
    activeView === 'staffActivityLog'

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedStaffSearchQuery(staffSearchQuery.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [staffSearchQuery])

  useEffect(() => {
    if (activeView !== 'staffManagement') return

    const searchParams = new URLSearchParams()
    if (staffRoleFilter !== 'all') searchParams.set('role', staffRoleFilter)
    if (staffStatusFilter !== 'all') searchParams.set('status', staffStatusFilter)
    if (debouncedStaffSearchQuery.trim()) searchParams.set('search', debouncedStaffSearchQuery.trim())
    if (staffPage > 1) searchParams.set('page', String(staffPage))

    const nextSearch = searchParams.toString()
    const nextPath = `${getTenantAdminViewPath('staffManagement')}${nextSearch ? `?${nextSearch}` : ''}`
    const currentPath = `${location.pathname}${location.search}`

    if (currentPath !== nextPath) {
      navigate(nextPath, { replace: true })
    }
  }, [activeView, debouncedStaffSearchQuery, location.pathname, location.search, navigate, staffPage, staffRoleFilter, staffStatusFilter])

  useEffect(() => {
    if (!didMountStaffListFilters.current) {
      didMountStaffListFilters.current = true
      return
    }

    setStaffPage(1)
  }, [staffRoleFilter, staffStatusFilter, debouncedStaffSearchQuery])

  const staffListFilters = useMemo(() => buildStaffListFilters({
    search: debouncedStaffSearchQuery,
    userRole: staffRoleFilter === 'all'
      ? undefined
      : staffRoleFilter === 'hr'
        ? 'HR'
        : 'Interviewer',
    status: staffStatusFilter === 'all'
      ? undefined
      : staffStatusFilter === 'activated'
        ? 'ACTIVE'
        : 'DISABLED',
  }), [debouncedStaffSearchQuery, staffRoleFilter, staffStatusFilter])

  // API load tenant workspace data
  useEffect(() => {
    if (!shouldLoadTenantWorkspace) {
      return
    }

    let isActive = true
    setIsLoadingStaff(true)
    setIsLoadingTenantDetail(Boolean(tenantId))
    setStaffError('')

    loadTenantWorkspaceData(tenantId, staffPage, staffListFilters)
      .then((data) => {
        if (!isActive) return
        setStaffList(data.staffList)
        setStaffPageCount(data.staffPageCount)
        setStaffAccountLimit(data.staffAccountLimit)
        setTenantDetail(data.tenantDetail)
        setTenantPlan(data.tenantPlan)
      })
      .catch((error) => {
        if (!isActive) return
        setStaffError(getAdminErrorMessage(error, 'Failed to load staff accounts.'))
        setStaffAccountLimit({})
        setTenantDetail(null)
        setTenantPlan(null)
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingStaff(false)
          setIsLoadingTenantDetail(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [shouldLoadTenantWorkspace, refreshKey, staffPage, tenantId, staffListFilters])

  useEffect(() => {
    const routeView = getInitialTenantAdminView(location.pathname)
    const urlStaffId = getTenantAdminStaffIdFromUrl(location.pathname)
    const detailStaffId = selectedStaffId || urlStaffId || selectedStaff?.id || ''
    const shouldLoadStaffDetail =
      activeView === 'staffDetail' ||
      activeView === 'staffEdit' ||
      activeView === 'staffActivityLog' ||
      routeView === 'staffDetail' ||
      routeView === 'staffEdit' ||
      routeView === 'staffActivityLog'

    if (!detailStaffId || !shouldLoadStaffDetail) {
      return
    }

    if (selectedStaff?.id === detailStaffId) {
      return
    }

    return loadStaffDetail(detailStaffId, undefined, { syncSelectedStaffId: true })
  }, [activeView, location.pathname, loadStaffDetail, selectedStaffId, selectedStaff?.id, triggerToast])

  useEffect(() => {
    if (activeView !== 'staffDetail' && activeView !== 'staffActivityLog') {
      return
    }

    const staffUserId = selectedStaff?.id
    if (!staffUserId) {
      setRecentActivities([])
      setActivityLogs([])
      setActivityLogPageCount(1)
      setActivityError('')
      return
    }

    let isActive = true
    const isLogListView = activeView === 'staffActivityLog'
    const activityFilterEntries = {
      ...(tenantId ? { tenantId } : {}),
      userId: staffUserId,
      ...(isLogListView && activityEventTypeFilter ? { eventType: activityEventTypeFilter } : {}),
      ...(isLogListView && activityStartDateFilter ? { startDate: new Date(`${activityStartDateFilter}T00:00:00`).toISOString() } : {}),
      ...(isLogListView && activityEndDateFilter ? { endDate: new Date(`${activityEndDateFilter}T23:59:59`).toISOString() } : {}),
    }
    const activityFilters = Object.keys(activityFilterEntries).length > 0 ? activityFilterEntries : null
    setIsLoadingActivities(true)
    setActivityError('')

    tenantAdminApi.getActivityLogs({
      sortField: 'createdAt',
      filters: activityFilters,
      sortBy: 'DESC',
      page: isLogListView ? activityLogPage : 1,
      size: isLogListView ? ACTIVITY_LOG_PAGE_SIZE : 4,
    })
      .then((items) => {
        if (isActive) {
          if (isLogListView) {
            setActivityLogs(items)
            setActivityLogPageCount(getListPageCount(items, activityLogPage, ACTIVITY_LOG_PAGE_SIZE))
          } else {
            setRecentActivities(items.slice(0, 4))
          }
        }
      })
      .catch((error) => {
        if (isActive) {
          if (isLogListView) {
            setActivityLogs([])
            setActivityLogPageCount(1)
          } else {
            setRecentActivities([])
          }
          setActivityError(getAdminErrorMessage(error, 'Failed to load activity logs.'))
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingActivities(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [activeView, activityEndDateFilter, activityEventTypeFilter, activityLogPage, activityStartDateFilter, refreshKey, selectedStaff?.id, tenantId])

  const hasTenantQuota = Boolean(tenantDetail)
  const isStaffQuotaUnlimited = staffAccountLimit.unlimited ?? (Boolean(tenantDetail?.userQuotaUnlimited) || Boolean(tenantPlan?.staffAccountUnlimited) || (hasTenantQuota && (tenantDetail?.userQuotaLimit || 0) <= 0))
  const staffAccountCount = staffAccountLimit.used ?? tenantDetail?.userQuotaUsed ?? staffAccountList.length
  const maxStaffQuota = isStaffQuotaUnlimited
    ? Math.max(staffAccountCount, 1)
    : staffAccountLimit.limit || tenantDetail?.userQuotaLimit || tenantPlan?.maxStaffAccount || 0
  const staffQuotaSummary = isStaffQuotaUnlimited ? 'Unlimited Seats' : `${staffAccountCount} / ${maxStaffQuota} Seats`
  const staffQuotaRingLabel = isStaffQuotaUnlimited ? String(staffAccountCount) : `${staffAccountCount}/${maxStaffQuota}`
  const staffQuotaPercent = isStaffQuotaUnlimited
    ? 100
    : Math.min(100, Math.max(0, Math.round((staffAccountCount / Math.max(maxStaffQuota, 1)) * 100)))
  const remainingStaffSeats = Math.max(0, maxStaffQuota - staffAccountCount)
  const staffQuotaDescription = isStaffQuotaUnlimited
    ? 'Your plan includes unlimited staff seats.'
    : `You have ${remainingStaffSeats} seat${remainingStaffSeats === 1 ? '' : 's'} available in your current plan. Optimize your team allocation now.`
  const isTenantInactive = isInactiveTenantStatus(tenantDetail?.status)
  const detailRouteStaffId = selectedStaffId || getTenantAdminStaffIdFromUrl(location.pathname)
  const selectedStaffMatchesDetailRoute = !detailRouteStaffId || selectedStaff?.id === detailRouteStaffId

  const guardTenantActive = () => {
    if (isActionLocked) {
      triggerToast?.(inactiveUserActionMessage, 'error')
      return false
    }

    if (!isTenantInactive) return true

    triggerToast?.(inactiveTenantActionMessage, 'error')
    return false
  }

  const handleActionError = (error: unknown, fallbackMessage: string) => {
    if (isInactiveUserActionError(error)) {
      setIsActionLocked(true)
    }

    triggerToast?.(getAdminErrorMessage(error, fallbackMessage), 'error')
  }

  // Handlers
  const handleCreateStaffSubmit = async (payload: { fullName: string; email: string; role: string[]; status?: UserStatus }) => {
    if (!guardTenantActive()) return

    setStaffFormFieldErrors({})
    setIsSaving(true)
    try {
      await tenantAdminApi.createStaff({
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
        ...(payload.status ? { status: payload.status } : {}),
        ...(tenantId ? { tenantId } : {}),
      })
      triggerToast?.('Staff account created successfully.', 'success')
      setStaffPage(1)
      setStaffRoleFilter('all')
      setStaffStatusFilter('all')
      setStaffSearchQuery('')
      setDebouncedStaffSearchQuery('')
      setRefreshKey(prev => prev + 1)
      changeView('staffManagement')
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Error system. Please try again.')
      const fieldErrors = getStaffFormFieldErrors(error, message)

      if (Object.keys(fieldErrors).length > 0) {
        setStaffFormFieldErrors(fieldErrors)
      } else if (isInactiveUserActionError(error) || shouldToastHttpError(error)) {
        handleActionError(error, 'Error system. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateStaffSubmit = async (payload: { fullName: string; email: string; role: string[]; status: UserStatus }) => {
    if (!selectedStaff) return
    if (!guardTenantActive()) return

    setStaffFormFieldErrors({})
    setIsSaving(true)
    try {
      await tenantAdminApi.updateStaff(selectedStaff.id, {
        fullName: payload.fullName,
        email: payload.email,
        role: payload.role,
        status: payload.status,
        ...(tenantId ? { tenantId } : {}),
      })
      triggerToast?.('Staff account updated successfully.', 'success')
      
      setSelectedStaff(prev => {
        if (!prev) return null
        const nextStaff = {
          ...prev,
          fullName: payload.fullName,
          userRole: payload.role.join(', '),
          status: payload.status,
        }
        saveSelectedStaff(nextStaff)
        return nextStaff
      })
      setStaffList((currentStaffList) => currentStaffList.map((staff) => (
        staff.id === selectedStaff.id
          ? {
            ...staff,
            fullName: payload.fullName,
            userRole: payload.role.join(', '),
            status: payload.status,
          }
          : staff
      )))
      setStaffAccountList((currentStaffList) => currentStaffList.map((staff) => (
        staff.id === selectedStaff.id
          ? {
            ...staff,
            fullName: payload.fullName,
            userRole: payload.role.join(', '),
            status: payload.status,
          }
          : staff
      )))

      setRefreshKey(prev => prev + 1)
      changeView('staffDetail', selectedStaff.id)
    } catch (error) {
      const message = getAdminErrorMessage(error, 'Error system. Please try again.')
      const fieldErrors = getStaffFormFieldErrors(error, message)

      if (Object.keys(fieldErrors).length > 0) {
        setStaffFormFieldErrors(fieldErrors)
      } else if (isInactiveUserActionError(error) || shouldToastHttpError(error)) {
        handleActionError(error, 'Error system. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStaffConfirm = async () => {
    if (!deleteConfirmStaff) return
    if (!guardTenantActive()) {
      setDeleteConfirmStaff(null)
      return
    }

    setIsDeleting(true)
    try {
      await tenantAdminApi.deleteStaff(deleteConfirmStaff.id)
      triggerToast?.('Account permanently deleted.', 'success')
      setDeleteConfirmStaff(null)
      
      if (selectedStaff?.id === deleteConfirmStaff.id) {
        clearSelectedStaff()
        setSelectedStaff(null)
        changeView('staffManagement')
      }
      
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      if (isInactiveUserActionError(error) || shouldToastHttpError(error)) {
        handleActionError(error, 'Error system. Please try again.')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClearActivityLogs = async () => {
    if (!selectedStaff) return
    if (!guardTenantActive()) return

    setIsClearingActivityLogs(true)
    try {
      await tenantAdminApi.deleteStaffActivityLogs(selectedStaff.id)
      triggerToast?.('Activity logs cleared successfully.', 'success')
      const defaultActivityDateRange = getDefaultActivityDateRange()
      setActivityEventTypeFilter('')
      setActivityStartDateFilter(defaultActivityDateRange.startDate)
      setActivityEndDateFilter(defaultActivityDateRange.endDate)
      setActivityLogPage(1)
      setActivityLogs([])
      setRecentActivities([])
      setActivityLogPageCount(1)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      if (isInactiveUserActionError(error) || shouldToastHttpError(error)) {
        handleActionError(error, 'Failed to clear activity logs.')
      }
    } finally {
      setIsClearingActivityLogs(false)
    }
  }

  const handleExportActivityLogs = async () => {
    if (!selectedStaff?.id) return

    setIsExportingActivityLogs(true)
    try {
      const response = await tenantAdminApi.exportStaffActivityLogs(selectedStaff.id)
      const filename = getDownloadFilename(
        response.headers?.['content-disposition'],
        `staff-activity-log-${selectedStaff.employeeCode || selectedStaff.id}.xlsx`,
      )
      downloadBlob(response.data, filename)
      triggerToast?.('Activity logs exported successfully.', 'success')
    } catch (error) {
      if (shouldToastHttpError(error)) {
        handleActionError(error, 'Failed to export activity logs.')
      }
    } finally {
      setIsExportingActivityLogs(false)
    }
  }

  const handleToggleStatus = async (staff: StaffMember) => {
    if (!guardTenantActive()) {
      setStatusConfirmStaff(null)
      return
    }

    const nextStatus: UserStatus = staff.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const roles = staff.userRole ? staff.userRole.split(', ').map(r => r.trim() === 'HR' ? 'HR' : 'Interviewer') : ['HR']
    
    setIsSaving(true)
    try {
      await tenantAdminApi.updateStaff(staff.id, {
        fullName: staff.fullName,
        email: staff.email,
        role: roles,
        status: nextStatus,
        ...(tenantId ? { tenantId } : {}),
      })
      triggerToast?.(
        nextStatus === 'ACTIVE'
          ? `Account activated successfully. ${staff.fullName} can now log in.`
          : `Account deactivated successfully. ${staff.fullName} no longer has access.`,
        'success',
      )
      setStatusConfirmStaff(null)
      
      setSelectedStaff(prev => {
        if (!prev) return null
        const nextStaff = { ...prev, status: nextStatus }
        saveSelectedStaff(nextStaff)
        return nextStaff
      })
      setStaffList((currentStaffList) => currentStaffList.map((currentStaff) => (
        currentStaff.id === staff.id ? { ...currentStaff, status: nextStatus } : currentStaff
      )))
      setStaffAccountList((currentStaffList) => currentStaffList.map((currentStaff) => (
        currentStaff.id === staff.id ? { ...currentStaff, status: nextStatus } : currentStaff
      )))
      
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      if (isInactiveUserActionError(error) || shouldToastHttpError(error)) {
        handleActionError(error, 'Error system. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }


  return {
    activeView,
    activityEndDateFilter,
    activityError,
    activityEventTypeFilter,
    activityLogPage,
    activityLogPageCount,
    activityLogs,
    activityStartDateFilter,
    changeView,
    deleteConfirmStaff,
    detailRouteStaffId,
    guardTenantActive,
    handleClearActivityLogs,
    handleCreateStaffSubmit,
    handleDeleteStaffConfirm,
    handleExportActivityLogs,
    handleToggleStatus,
    handleUpdateStaffSubmit,
    isActionLocked,
    isClearingActivityLogs,
    isDeleting,
    isExportingActivityLogs,
    isLoadingActivities,
    isLoadingStaff,
    isLoadingStaffDetail,
    isLoadingTenantDetail,
    isPasswordChangeRequired,
    isSaving,
    isStaffQuotaUnlimited,
    loadStaffDetail,
    maxStaffQuota,
    navItems,
    recentActivities,
    selectedStaff,
    selectedStaffMatchesDetailRoute,
    setActivityEndDateFilter,
    setActivityEventTypeFilter,
    setActivityLogPage,
    setDeleteConfirmStaff,
    setSelectedStaff,
    setStaffFormFieldErrors,
    setStaffPage,
    setStaffRoleFilter,
    setStaffSearchQuery,
    setStaffStatusFilter,
    setStatusConfirmStaff,
    staffAccountCount,
    staffAccountList,
    staffError,
    staffFormFieldErrors,
    staffList,
    staffPage,
    staffPageCount,
    staffQuotaDescription,
    staffQuotaPercent,
    staffQuotaRingLabel,
    staffQuotaSummary,
    staffRoleFilter,
    staffSearchQuery,
    staffStatusFilter,
    staffDetailError,
    statusConfirmStaff,
    user,
    viewResetKeys,
  }
}
