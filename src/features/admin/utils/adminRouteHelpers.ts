import type { SuperAdminView } from '../types/admin.types'

export const superAdminViewSlugs: Record<SuperAdminView, string> = {
  dashboard: 'dashboard',
  tenantManagement: 'tenant-management',
  subscriptionPlans: 'subscription-plans',
  promptManagement: 'prompt-management',
  settings: 'settings',
}

export function getInitialSuperAdminView(): SuperAdminView {
  const slug = window.location.pathname.replace(/^\/super-admin\/?/, '') || 'dashboard'
  const match = Object.entries(superAdminViewSlugs).find(([, value]) => slug === value || slug.startsWith(`${value}/`))

  return (match?.[0] as SuperAdminView | undefined) || 'dashboard'
}

export function updateSuperAdminViewUrl(view: SuperAdminView) {
  window.history.pushState(null, '', `/super-admin/${superAdminViewSlugs[view]}`)
}

export function getTenantDetailIdFromUrl() {
  const match = window.location.pathname.match(/^\/super-admin\/tenant-management\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : ''
}

export function updateTenantDetailUrl(tenantId: string) {
  window.history.pushState(null, '', `/super-admin/tenant-management/${encodeURIComponent(tenantId)}`)
}

export function getSubscriptionPlanIdFromUrl() {
  const match = window.location.pathname.match(/^\/super-admin\/subscription-plans\/([^/]+)(?:\/edit)?$/)
  return match ? decodeURIComponent(match[1]) : ''
}

export function isSubscriptionPlanEditUrl() {
  return /^\/super-admin\/subscription-plans\/[^/]+\/edit$/.test(window.location.pathname)
}

export function updateSubscriptionPlanDetailUrl(planId: string) {
  window.history.pushState(null, '', `/super-admin/subscription-plans/${encodeURIComponent(planId)}`)
}

export function updateSubscriptionPlanEditUrl(planId: string) {
  window.history.pushState(null, '', `/super-admin/subscription-plans/${encodeURIComponent(planId)}/edit`)
}
