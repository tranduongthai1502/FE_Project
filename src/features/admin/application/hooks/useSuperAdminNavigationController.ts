import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildNavigation } from '@/core/hooks/navigation'
import { getInitialSuperAdminView, getSuperAdminViewPath, getTenantCreatePath, getTenantDetailPath, type SuperAdminView } from '../../domain/superAdminRouteHelpers'
import { getStoredDashboardUser } from '@/features/auth'
import { superNav } from '../../presentation/components/superAdminNavigation'

export function useSuperAdminNavigationController() {
  const location = useLocation()
  const navigate = useNavigate()

  const [activeView, setActiveView] = useState<SuperAdminView>(() => (
    getInitialSuperAdminView(location.pathname)
  ))

  const [user] = useState(() => getStoredDashboardUser())

  const [viewResetKeys, setViewResetKeys] = useState<Record<SuperAdminView, number>>({
    dashboard: 0,
    'tenant-management': 0,
    'subscription-plans': 0,
    'prompt-management': 0,
    settings: 0,
  })

  useEffect(() => {
    setActiveView(getInitialSuperAdminView(location.pathname))
  }, [location.pathname])

  const selectView = (view: SuperAdminView) => {
    setActiveView(view)
    navigate(getSuperAdminViewPath(view))
  }

  const resetToViewRoot = (view: SuperAdminView) => {
    setActiveView(view)
    navigate(getSuperAdminViewPath(view))
    setViewResetKeys((current) => ({
      ...current,
      [view]: current[view] + 1,
    }))
  }

  const openTenantCreate = () => {
    setActiveView('tenant-management')
    navigate(getTenantCreatePath())
  }

  const openTenantDetail = (tenantId: string) => {
    setActiveView('tenant-management')
    navigate(getTenantDetailPath(tenantId))
  }

  const navItems = buildNavigation(superNav, activeView, resetToViewRoot)

  return {
    activeView,
    setActiveView,
    user,
    viewResetKeys,
    selectView,
    resetToViewRoot,
    openTenantCreate,
    openTenantDetail,
    navItems,
  }
}
