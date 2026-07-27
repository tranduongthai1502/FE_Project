import type { ReactElement } from 'react'
import { Route } from 'react-router-dom'
import { SuperAdminDashboard } from '@/features/admin'
import { CandidatePortalPage } from '@/features/candidate'
import { HrDashboard } from '@/features/hr'
import { InterviewerDashboard } from '@/features/interviewer'
import { TenantAdminDashboard } from '@/features/tenant'
import type { AppPage } from './RouteConfig'

type RoleRoutesProps = {
  onLogout: () => void
  protect: (page: AppPage, element: ReactElement) => ReactElement
  triggerToast: (message: string, type?: 'success' | 'error') => void
}

export function RoleRoutes({ onLogout, protect, triggerToast }: RoleRoutesProps) {
  return (
    <>
      <Route
        path="/candidate/*"
        element={protect('candidate', <CandidatePortalPage onLogout={onLogout} triggerToast={triggerToast} />)}
      />
      <Route
        path="/tenant-admin/*"
        element={protect('tenantAdmin', <TenantAdminDashboard onLogout={onLogout} triggerToast={triggerToast} />)}
      />
      <Route
        path="/super-admin/*"
        element={protect('superAdmin', <SuperAdminDashboard onLogout={onLogout} triggerToast={triggerToast} />)}
      />
      <Route
        path="/hr/*"
        element={protect('hr', <HrDashboard onLogout={onLogout} triggerToast={triggerToast} />)}
      />
      <Route
        path="/interviewer/*"
        element={protect('interviewer', <InterviewerDashboard onLogout={onLogout} triggerToast={triggerToast} />)}
      />
    </>
  )
}
