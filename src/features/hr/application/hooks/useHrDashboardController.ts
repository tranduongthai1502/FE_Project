import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildNavigation } from '@/core/hooks/navigation'
import { hrNav } from '@/features/hr/presentation/components/hrNavigation'
import type { RoleHomeView } from '../../domain/roleHome.types'
import { getActiveHrView, hrPathByView } from '../../domain/hrRoutePaths'
import { getStoredDashboardUser, isStoredCurrentUserInactive } from '@/features/auth'
import { getStoredRequirePasswordChange } from '@/core/api/authStorage'

export function useHrDashboardController({
  triggerToast,
}: {
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}) {
  const location = useLocation()
  const navigate = useNavigate()

  const [isPasswordChangeRequired] = useState(() => getStoredRequirePasswordChange())
  const [user] = useState(() => getStoredDashboardUser())
  const [activeView, setActiveView] = useState<RoleHomeView>(() => (
    getStoredRequirePasswordChange() ? 'settings' : getActiveHrView(location.pathname)
  ))

  const [viewResetKeys, setViewResetKeys] = useState<Record<RoleHomeView, number>>({
    dashboard: 0,
    jobs: 0,
    candidates: 0,
    interviews: 0,
    settings: 0,
  })

  const selectView = (view: RoleHomeView) => {
    if (isPasswordChangeRequired && view !== 'settings') {
      setActiveView('settings')
      navigate(hrPathByView.settings)
      triggerToast?.('Please change your password before using this workspace.', 'error')
      return
    }

    setActiveView(view)
    navigate(hrPathByView[view])
  }

  const reloadViewFromSidebar = (view: RoleHomeView) => {
    if (isPasswordChangeRequired && view !== 'settings') {
      setActiveView('settings')
      navigate(hrPathByView.settings)
      triggerToast?.('Please change your password before using this workspace.', 'error')
      return
    }

    setActiveView(view)
    navigate(hrPathByView[view])
    if (view === 'jobs') {
      window.sessionStorage.removeItem('jobfusion.hr.jobFormRefreshView')
    }
    setViewResetKeys((current) => ({
      ...current,
      [view]: current[view] + 1,
    }))
  }

  const navItems = buildNavigation(hrNav, activeView, reloadViewFromSidebar).map((item) => (
    isPasswordChangeRequired && item.label !== 'Settings'
      ? {
          ...item,
          onClick: () => {
            setActiveView('settings')
            navigate(hrPathByView.settings)
            triggerToast?.('Please change your password before using this workspace.', 'error')
          },
        }
      : item
  ))

  const isActionLocked = isStoredCurrentUserInactive()

  useEffect(() => {
    if (isPasswordChangeRequired) {
      setActiveView('settings')
      if (location.pathname !== hrPathByView.settings) {
        navigate(hrPathByView.settings, { replace: true })
      }
      return
    }

    setActiveView(getActiveHrView(location.pathname))
  }, [isPasswordChangeRequired, location.pathname, navigate])

  return {
    isPasswordChangeRequired,
    user,
    activeView,
    viewResetKeys,
    selectView,
    reloadViewFromSidebar,
    navItems,
    isActionLocked,
  }
}
