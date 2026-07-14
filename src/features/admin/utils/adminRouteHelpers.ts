import type { SuperAdminView, TenantAdminView } from '../types/admin.types'

export const tenantAdminViewSlugs: Record<TenantAdminView, string> = {
  dashboard: 'dashboard',
  staffManagement: 'staff-management',
  staffCreate: 'staff-management/create',
  settings: 'settings',
}

export function getInitialTenantAdminView(): TenantAdminView {
  const slug = window.location.pathname.replace(/^\/tenant-admin\/?/, '') || 'dashboard'
  const match = Object.entries(tenantAdminViewSlugs)
    .sort(([, first], [, second]) => second.length - first.length)
    .find(([, value]) => slug === value || slug.startsWith(`${value}/`))

  return (match?.[0] as TenantAdminView | undefined) || 'dashboard'
}

export function updateTenantAdminViewUrl(view: TenantAdminView) {
  window.history.pushState(null, '', `/tenant-admin/${tenantAdminViewSlugs[view]}`)
}

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
  return match && match[1] !== 'create' ? decodeURIComponent(match[1]) : ''
}

export function isTenantCreateUrl() {
  return window.location.pathname === '/super-admin/tenant-management/create'
}

export function updateTenantCreateUrl() {
  window.history.pushState(null, '', '/super-admin/tenant-management/create')
}

export function updateTenantDetailUrl(tenantId: string) {
  window.history.pushState(null, '', `/super-admin/tenant-management/${encodeURIComponent(tenantId)}`)
}

export function getSubscriptionPlanIdFromUrl() {
  const match = window.location.pathname.match(/^\/super-admin\/subscription-plans\/([^/]+)(?:\/edit)?$/)
  return match && match[1] !== 'create' ? decodeURIComponent(match[1]) : ''
}

export function isSubscriptionPlanCreateUrl() {
  return window.location.pathname === '/super-admin/subscription-plans/create'
}

export function isSubscriptionPlanEditUrl() {
  return /^\/super-admin\/subscription-plans\/[^/]+\/edit$/.test(window.location.pathname)
}

export function updateSubscriptionPlanCreateUrl() {
  window.history.pushState(null, '', '/super-admin/subscription-plans/create')
}

export function updateSubscriptionPlanDetailUrl(planId: string) {
  window.history.pushState(null, '', `/super-admin/subscription-plans/${encodeURIComponent(planId)}`)
}

export function updateSubscriptionPlanEditUrl(planId: string) {
  window.history.pushState(null, '', `/super-admin/subscription-plans/${encodeURIComponent(planId)}/edit`)
}

export function isPromptCreateUrl() {
  return window.location.pathname === '/super-admin/prompt-management/create'
}

export function updatePromptCreateUrl() {
  window.history.pushState(null, '', '/super-admin/prompt-management/create')
}
