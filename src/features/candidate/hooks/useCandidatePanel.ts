import { useEffect, useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { CandidatePanel } from '../types/candidate.types'

export function getCandidatePanelFromPath(pathname: string): CandidatePanel {
  return pathname === '/candidate/change-password' ? 'changePassword' : 'dashboard'
}

export function getCandidatePanelPath(panel: CandidatePanel) {
  return panel === 'changePassword' ? '/candidate/change-password' : '/candidate'
}

export function useCandidatePanel(pathname: string, navigate: NavigateFunction) {
  const [activePanel, setActivePanel] = useState<CandidatePanel>(() => getCandidatePanelFromPath(pathname))

  useEffect(() => {
    setActivePanel(getCandidatePanelFromPath(pathname))
  }, [pathname])

  const selectPanel = (panel: CandidatePanel) => {
    setActivePanel(panel)
    const nextPath = getCandidatePanelPath(panel)
    if (window.location.pathname !== nextPath) {
      navigate(nextPath)
    }
  }

  return {
    activePanel,
    selectPanel,
  }
}
