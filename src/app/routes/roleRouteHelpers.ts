import type { RoleHomeView } from './route.types'

export const roleHomeViewSlugs: Record<RoleHomeView, string> = {
  dashboard: 'dashboard',
  jobs: 'jobs',
  settings: 'settings',
}

export function getInitialRoleHomeView(basePath: 'hr' | 'interviewer', pathname: string): RoleHomeView {
  const slug = pathname.replace(new RegExp(`^/${basePath}/?`), '') || 'dashboard'
  const match = Object.entries(roleHomeViewSlugs).find(([, value]) => slug === value || slug.startsWith(`${value}/`))

  return (match?.[0] as RoleHomeView | undefined) || 'dashboard'
}

export function getRoleHomeViewPath(basePath: 'hr' | 'interviewer', view: RoleHomeView) {
  return `/${basePath}/${roleHomeViewSlugs[view]}`
}
