import type { StaffAccountLimit, SubscriptionPlan, Tenant } from '../domain/tenantApi.types'

export type StaffQuotaState = {
  isStaffQuotaUnlimited: boolean
  maxStaffQuota: number
  staffAccountCount: number
  staffQuotaDescription: string
  staffQuotaPercent: number
  staffQuotaRingLabel: string
  staffQuotaSummary: string
}

export function buildStaffQuotaState({
  staffAccountLimit,
  staffAccountListLength,
  tenantDetail,
  tenantPlan,
}: {
  staffAccountLimit: StaffAccountLimit
  staffAccountListLength: number
  tenantDetail: Tenant | null
  tenantPlan: SubscriptionPlan | null
}): StaffQuotaState {
  const hasTenantQuota = Boolean(tenantDetail)
  const isStaffQuotaUnlimited = staffAccountLimit.unlimited ?? (
    Boolean(tenantDetail?.userQuotaUnlimited) ||
    Boolean(tenantPlan?.staffAccountUnlimited) ||
    (hasTenantQuota && (tenantDetail?.userQuotaLimit || 0) <= 0)
  )
  const staffAccountCount = staffAccountLimit.used ?? tenantDetail?.userQuotaUsed ?? staffAccountListLength
  const maxStaffQuota = isStaffQuotaUnlimited
    ? Math.max(staffAccountCount, 1)
    : staffAccountLimit.limit || tenantDetail?.userQuotaLimit || tenantPlan?.maxStaffAccount || 0
  const staffQuotaSummary = isStaffQuotaUnlimited ? 'Unlimited Seats' : `${staffAccountCount} / ${maxStaffQuota} Seats`
  const staffQuotaRingLabel = isStaffQuotaUnlimited ? String(staffAccountCount) : `${staffAccountCount}/${maxStaffQuota}`
  const staffQuotaPercent = isStaffQuotaUnlimited
    ? 100
    : Math.min(100, Math.max(0, Math.round((staffAccountCount / Math.max(maxStaffQuota, 1)) * 100)))
  const remainingStaffSeats = Math.max(0, maxStaffQuota - staffAccountCount)
  const staffQuotaDescription = isStaffQuotaUnlimited
    ? 'Your plan includes unlimited staff seats.'
    : `You have ${remainingStaffSeats} seat${remainingStaffSeats === 1 ? '' : 's'} available in your current plan. Optimize your team allocation now.`

  return {
    isStaffQuotaUnlimited,
    maxStaffQuota,
    staffAccountCount,
    staffQuotaDescription,
    staffQuotaPercent,
    staffQuotaRingLabel,
    staffQuotaSummary,
  }
}
