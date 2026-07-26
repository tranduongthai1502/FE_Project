import { ADMIN_LIST_PAGE_SIZE } from './adminApi'
import type { AdminListParams, SubscriptionPlan } from '@/services/api/api.types'
import {
  getBackendErrorMessage,
  getErrorCode,
  getErrorRawMessage,
  validationErrorMessages,
} from '@/services/api/axiosErrorHandler'

export const TOP_TIER_PLAN_LIST_SIZE = 1000

export const planFeatureDefaults = [
  {
    key: 'aiJdGenerator',
    code: 'AI_JD_GENERATOR',
    icon: 'fa-briefcase-medical',
    title: 'AI JD Generator',
    description: 'Auto-generate job descriptions with AI.',
    enabled: false,
  },
  {
    key: 'aiCvParsing',
    code: 'AI_CV_PARSING',
    icon: 'fa-file-code',
    title: 'AI CV Parsing',
    description: 'Extract data from resumes automatically.',
    enabled: false,
  },
  {
    key: 'chatbotScreening',
    code: 'CHATBOT_SCREENING',
    icon: 'fa-message',
    title: 'Chatbot Screening',
    description: 'Interactive AI screening for candidates.',
    enabled: false,
  },
  {
    key: 'dssAnalytics',
    code: 'DSS_ANALYTICS',
    icon: 'fa-chart-simple',
    title: 'DSS Analytics',
    description: 'Advanced Decision Support System data.',
    enabled: false,
  },
  {
    key: 'prioritySupport',
    code: 'PRIORITY_SUPPORT',
    icon: 'fa-headset',
    title: 'Priority Support',
    description: '24/7 dedicated account manager.',
    enabled: false,
  },
  {
    key: 'customBranding',
    code: 'CUSTOM_BRANDING',
    icon: 'fa-window-maximize',
    title: 'Custom Branding',
    description: 'White-label options for dashboards.',
    enabled: false,
  },
  {
    key: 'apiAccess',
    code: 'API_ACCESS',
    icon: 'fa-arrows-spin',
    title: 'API Access',
    description: 'Full access to JobFusion endpoints.',
    enabled: false,
  },
  {
    key: 'multiRegionSupport',
    code: 'MULTI_REGION_SUPPORT',
    icon: 'fa-earth-americas',
    title: 'Multi-Region Support',
    description: 'Manage hiring across multiple countries.',
    enabled: false,
  },
]

export type PlanFeatureState = typeof planFeatureDefaults

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
    return { sortField: 'monthlyPrice', sortBy: 'ASC', filters, page, size: ADMIN_LIST_PAGE_SIZE }
  }

  if (sort === 'price-desc') {
    return { sortField: 'monthlyPrice', sortBy: 'DESC', filters, page, size: ADMIN_LIST_PAGE_SIZE }
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
    sortField: 'monthlyPrice',
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

export function getDerivedJobUsage(index: number, plan: SubscriptionPlan) {
  const isUnlimited = plan.activeJobPostingUnlimited
  const limit = isUnlimited ? 0 : Math.max(1, plan.maxActiveJobPosting)
  const progressLimit = isUnlimited ? 50 : limit
  const usageRatios = [0.24, 0.96, 0.16, 0.64, 0.42, 0.78]
  const used = Math.max(1, Math.round(progressLimit * usageRatios[index % usageRatios.length]))
  return { used, limit, isUnlimited, percent: isUnlimited ? 100 : getSubscriptionPlanUsagePercent(used, limit) }
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
      enabled: status ? status === 'ENABLED' : feature.enabled,
    }
  })
}

export function getSubscriptionPlanFieldErrors(error: unknown, message: string): CreatePlanFieldErrors {
  const rawErrorText = [
    getErrorCode(error),
    getBackendErrorMessage(error),
    getErrorRawMessage(error),
    message,
  ].join(' ').toLowerCase()

  if (
    rawErrorText.includes('plan') ||
    rawErrorText.includes('name') ||
    rawErrorText.includes('duplicate') ||
    rawErrorText.includes('already exist')
  ) {
    return { planName: validationErrorMessages.duplicatePlanName }
  }

  return {}
}
