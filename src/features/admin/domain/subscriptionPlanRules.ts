import type { SubscriptionPlan } from './adminApi.types'

export function isEnterprisePlan(plan: Pick<SubscriptionPlan, 'code' | 'name'>): boolean {
  const code = (plan.code || '').toLowerCase()
  const name = (plan.name || '').toLowerCase()
  return code.includes('enterprise') || name.includes('enterprise')
}

export function calculateAnnualDiscountPercent(monthlyPrice: number, yearlyPrice: number): number {
  if (!monthlyPrice || monthlyPrice <= 0 || !yearlyPrice || yearlyPrice <= 0) return 0
  const totalMonthlyForYear = monthlyPrice * 12
  if (yearlyPrice >= totalMonthlyForYear) return 0
  
  const discount = ((totalMonthlyForYear - yearlyPrice) / totalMonthlyForYear) * 100
  return Math.round(discount)
}

export function formatPlanPriceDisplay(price: number, currency = '$'): string {
  if (price === undefined || price === null || Number.isNaN(price)) return `${currency}0`
  return `${currency}${price.toLocaleString()}`
}
