import { HrDashboard } from './hr/HrDashboard'
import { InterviewerDashboard } from './interviewer/InterviewerDashboard'
import { SuperAdminDashboard } from './super-admin/SuperAdminDashboard'
import { TenantAdminDashboard } from './tenant/TenantAdminDashboard'

type RoleDashboardPageProps = {
  role: 'superAdmin' | 'tenantAdmin' | 'hr' | 'interviewer'
  onLogout: () => void
  triggerToast?: (message: string, type?: 'success' | 'error') => void
}






export function RoleDashboardPage({ role, onLogout, triggerToast }: RoleDashboardPageProps) {
  if (role === 'superAdmin') return <SuperAdminDashboard onLogout={onLogout} triggerToast={triggerToast} />
  if (role === 'tenantAdmin') return <TenantAdminDashboard onLogout={onLogout} triggerToast={triggerToast} />
  if (role === 'interviewer') return <InterviewerDashboard onLogout={onLogout} triggerToast={triggerToast} />
  return <HrDashboard onLogout={onLogout} triggerToast={triggerToast} />
}
