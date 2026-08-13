import { ADMIN_LIST_PAGE_SIZE } from './adminApi'
import type { AdminListParams } from '@/core/api/api.types'
import type { SubscriptionPlan, Tenant } from '@/features/admin/domain/adminApi.types'
import {
  getBackendErrorMessage,
  getErrorCode,
  getErrorRawMessage,
  validationErrorMessages,
} from '@/core/api/axiosErrorHandler'
import { planFeatureDefaults, type PlanFeatureState } from '../domain/subscriptionPlanFeatures'

export const TOP_TIER_PLAN_LIST_SIZE = 1000

export type CreatePlanFieldErrors = Partial<Record<
  'planName' | 'description' | 'monthlyPrice' | 'maxStaffAccount' | 'maxActiveJobPosting',
  string
>>

export type PlanSortOption = 'price-asc' | 'price-desc' | 'newest' | 'oldest'

export type PlanListFilterValues = {
  search?: string
  name?: string
  description?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'DISABLED'
}

export function normalizePlanNameForDuplicateCheck(value: string) {
  return value.trim().toLowerCase()
}

export function hasDuplicatePlanName(plans: SubscriptionPlan[], planName: string, ignoredPlanId?: string) {
  const normalizedPlanName = normalizePlanNameForDuplicateCheck(planName)
  if (!normalizedPlanName) return false

  return plans.some((plan) => (
    plan.id !== ignoredPlanId &&
    normalizePlanNameForDuplicateCheck(plan.name) === normalizedPlanName
  ))
}

export function hasFeatureChanges(features: PlanFeatureState) {
  return features.some((feature, index) => feature.enabled !== planFeatureDefaults[index]?.enabled)
}

export function buildPlanListFilters(values: PlanListFilterValues = {}) {
  const filters: Record<string, unknown> = {}
  const search = values.search?.trim()
  const name = values.name?.trim()
  const description = values.description?.trim()

  if (search) filters.search = search
  if (name) filters.name = name
  if (description) filters.description = description
  if (values.status) filters.status = values.status

  return filters
}

export function buildPlanListParams(sort: PlanSortOption, page: number): AdminListParams {
  const filters = buildPlanListFilters()

  if (sort === 'price-asc') {
    return { sortField: 'price', sortBy: 'ASC', filters, page, size: ADMIN_LIST_PAGE_SIZE }
  }

  if (sort === 'price-desc') {
    return { sortField: 'price', sortBy: 'DESC', filters, page, size: ADMIN_LIST_PAGE_SIZE }
  }

  if (sort === 'oldest') {
    return { sortField: 'createdAt', sortBy: 'ASC', filters, page, size: ADMIN_LIST_PAGE_SIZE }
  }

  return { sortField: 'createdAt', sortBy: 'DESC', filters, page, size: ADMIN_LIST_PAGE_SIZE }
}

function comparePlanCreatedAt(left: SubscriptionPlan, right: SubscriptionPlan) {
  const leftTime = Date.parse(left.createdAt || '')
  const rightTime = Date.parse(right.createdAt || '')
  return (Number.isNaN(leftTime) ? 0 : leftTime) - (Number.isNaN(rightTime) ? 0 : rightTime)
}

export function sortSubscriptionPlans(plans: SubscriptionPlan[], sort: PlanSortOption) {
  return [...plans].sort((left, right) => {
    if (sort === 'price-asc') return left.monthlyPrice - right.monthlyPrice
    if (sort === 'price-desc') return right.monthlyPrice - left.monthlyPrice
    if (sort === 'oldest') return comparePlanCreatedAt(left, right)
    return comparePlanCreatedAt(right, left)
  })
}

export function getSubscriptionPlanUsagePercent(used: number, limit: number) {
  if (limit <= 0) return 100
  return Math.min(100, Math.round((used / limit) * 100))
}

export function formatStatNumber(value: number) {
  return Number(value.toFixed(2)).toLocaleString()
}

export function isActiveSubscriptionPlan(plan: SubscriptionPlan) {
  const normalizedStatus = plan.status.trim().toLowerCase()
  return normalizedStatus === 'active' || normalizedStatus === 'activated' || normalizedStatus === 'enabled'
}

export function buildTopTierPlanParams(): AdminListParams {
  return {
    sortField: 'price',
    filters: { status: 'ACTIVE' },
    sortBy: 'DESC',
    page: 1,
    size: TOP_TIER_PLAN_LIST_SIZE,
  }
}

export function getHighestPricedActivePlan(plans: SubscriptionPlan[]) {
  return plans.filter(isActiveSubscriptionPlan).reduce<SubscriptionPlan | null>((current, plan) => (
    !current || plan.monthlyPrice > current.monthlyPrice ? plan : current
  ), null)
}

export function getTenantJobUsage(tenant: Tenant, plan: SubscriptionPlan) {
  const isUnlimited = tenant.activeJobPostingUnlimited || plan.activeJobPostingUnlimited
  const tenantLimit = tenant.activeJobPostingLimit ?? 0
  const planLimit = plan.maxActiveJobPosting ?? 0
  const limit = isUnlimited ? 0 : Math.max(1, tenantLimit || planLimit)
  const used = Math.max(0, tenant.activeJobPostingUsed ?? 0)

  return {
    used,
    limit,
    isUnlimited,
    percent: isUnlimited ? 100 : getSubscriptionPlanUsagePercent(used, limit),
  }
}

export function getPlanFeatureState(plan?: SubscriptionPlan) {
  const featureStatusByKey = new Map((plan?.features || []).map((feature) => [
    feature.key.toUpperCase(),
    feature.status.toUpperCase(),
  ]))

  return planFeatureDefaults.map((feature) => {
    const status = featureStatusByKey.get(feature.code)
    return {
      ...feature,
      enabled: status ? ['ACTIVE', 'ENABLED', 'TRUE'].includes(status) : feature.enabled,
    }
  })
}

export function getSubscriptionPlanFieldErrors(error: unknown, message: string): CreatePlanFieldErrors {
  return isDuplicateSubscriptionPlanNameError(error, message)
    ? { planName: validationErrorMessages.duplicatePlanName }
    : {}
}

function normalizeErrorText(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function isDuplicateSubscriptionPlanNameError(error: unknown, message: string) {
  const code = normalizeErrorText(getErrorCode(error))
  const backendMessage = normalizeErrorText(getBackendErrorMessage(error))
  const rawMessage = normalizeErrorText(getErrorRawMessage(error))
  const displayMessage = normalizeErrorText(message)
  const combinedMessage = [backendMessage, rawMessage, displayMessage].join(' ')

  if ([
    'plan already exists',
    'subscription plan already exists',
    'duplicate plan name',
    'duplicate subscription plan name',
    'plan name already exists',
    'subscription plan name already exists',
  ].includes(code)) {
    return true
  }

  const mentionsPlanName = /\b(subscription\s+)?plan\s+name\b/.test(combinedMessage) || /\bsubscription\s+plan\b/.test(combinedMessage)
  const mentionsDuplicate = /\bduplicate\b/.test(combinedMessage) || /\balready exists?\b/.test(combinedMessage)

  return mentionsPlanName && mentionsDuplicate
}
