import type { CreatePlanPayload } from '../domain/adminApi.types'

export type PlanFormFieldErrors = Partial<Record<keyof CreatePlanPayload | 'price' | 'monthlyPrice' | 'yearlyPrice', string>>

export function validatePlanForm(payload: Partial<CreatePlanPayload>): { isValid: boolean; errors: PlanFormFieldErrors } {
  const errors: PlanFormFieldErrors = {}

  if (!payload.name || !payload.name.trim()) {
    errors.name = 'Plan name is required.'
  }

  const priceVal = payload.monthlyPrice ?? payload.price
  if (priceVal === undefined || priceVal === null || priceVal < 0) {
    errors.monthlyPrice = 'Monthly price must be a non-negative number.'
    errors.price = 'Price must be a non-negative number.'
  }

  if (payload.yearlyPrice !== undefined && payload.yearlyPrice !== null && payload.yearlyPrice < 0) {
    errors.yearlyPrice = 'Yearly price must be a non-negative number.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
