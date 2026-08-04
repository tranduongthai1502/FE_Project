export type SuperAdminView = 'dashboard' | 'tenant-management' | 'subscription-plans' | 'prompt-management' | 'settings'

const superAdminViews: SuperAdminView[] = ['dashboard', 'tenant-management', 'subscription-plans', 'prompt-management', 'settings']

export function getInitialSuperAdminView(pathname: string): SuperAdminView {
  const slug = pathname.replace(/^\/super-admin\/?/, '') || 'dashboard'
  const match = superAdminViews.find((view) => slug === view || slug.startsWith(`${view}/`))

  return match || 'dashboard'
}

export function getSuperAdminViewPath(view: SuperAdminView) {
  return `/super-admin/${view}`
}

export function getTenantDetailIdFromUrl(pathname: string) {
  const match = pathname.match(/^\/super-admin\/tenant-management\/([^/]+)$/)
  return match && match[1] !== 'create' ? decodeURIComponent(match[1]) : ''
}

export function isTenantCreateUrl(pathname: string) {
  return pathname === '/super-admin/tenant-management/create'
}

export function getTenantCreatePath() {
  return '/super-admin/tenant-management/create'
}

export function getTenantDetailPath(tenantId: string) {
  return `/super-admin/tenant-management/${encodeURIComponent(tenantId)}`
}

export function getSubscriptionPlanIdFromUrl(pathname: string) {
  const match = pathname.match(/^\/super-admin\/subscription-plans\/([^/]+)(?:\/edit)?$/)
  return match && match[1] !== 'create' ? decodeURIComponent(match[1]) : ''
}

export function isSubscriptionPlanCreateUrl(pathname: string) {
  return pathname === '/super-admin/subscription-plans/create'
}

export function isSubscriptionPlanEditUrl(pathname: string) {
  return /^\/super-admin\/subscription-plans\/[^/]+\/edit$/.test(pathname)
}

export function getSubscriptionPlanCreatePath() {
  return '/super-admin/subscription-plans/create'
}

export function getSubscriptionPlanDetailPath(planId: string) {
  return `/super-admin/subscription-plans/${encodeURIComponent(planId)}`
}

export function getSubscriptionPlanEditPath(planId: string) {
  return `/super-admin/subscription-plans/${encodeURIComponent(planId)}/edit`
}

export function isPromptCreateUrl(pathname: string) {
  return pathname === '/super-admin/prompt-management/create'
}

export function getPromptCreatePath() {
  return '/super-admin/prompt-management/create'
}
