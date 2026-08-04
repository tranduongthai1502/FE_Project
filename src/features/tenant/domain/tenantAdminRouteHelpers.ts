import type { TenantAdminView } from './tenantAdmin.types'

export const tenantAdminViewSlugs: Record<TenantAdminView, string> = {
  dashboard: 'dashboard',
  staffManagement: 'staff-management',
  staffCreate: 'staff-management/create',
  staffEdit: 'staff-management',
  staffDetail: 'staff-management',
  staffActivityLog: 'staff-management',
  settings: 'settings',
  jobs: 'jobs',
}

export function getInitialTenantAdminView(pathname: string): TenantAdminView {
  const slug = pathname.replace(/^\/tenant-admin\/?/, '') || 'dashboard'
  if (/^staff-management\/create$/.test(slug)) return 'staffCreate'
  if (/^staff-management\/[^/]+\/edit$/.test(slug)) return 'staffEdit'
  if (/^staff-management\/[^/]+\/activity-log$/.test(slug)) return 'staffActivityLog'
  if (/^staff-management\/[^/]+$/.test(slug)) return 'staffDetail'

  const match = Object.entries(tenantAdminViewSlugs)
    .sort(([, first], [, second]) => second.length - first.length)
    .find(([, value]) => slug === value || slug.startsWith(`${value}/`))

  return (match?.[0] as TenantAdminView | undefined) || 'dashboard'
}

export function getTenantAdminStaffIdFromUrl(pathname: string) {
  const match = pathname.match(/^\/tenant-admin\/staff-management\/([^/]+)(?:\/(?:edit|activity-log))?$/)
  return match ? decodeURIComponent(match[1]) : ''
}

export function getTenantAdminViewPath(view: TenantAdminView, id?: string) {
  if (id && view === 'staffDetail') {
    return `/tenant-admin/staff-management/${encodeURIComponent(id)}`
  }

  if (id && view === 'staffEdit') {
    return `/tenant-admin/staff-management/${encodeURIComponent(id)}/edit`
  }

  if (id && view === 'staffActivityLog') {
    return `/tenant-admin/staff-management/${encodeURIComponent(id)}/activity-log`
  }

  return `/tenant-admin/${tenantAdminViewSlugs[view]}`
}
