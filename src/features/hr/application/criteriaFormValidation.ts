import type { JobCriteriaPayload } from '../domain/hrApi.types'
import { MAX_CRITERIA_COUNT } from '../domain/jobCriteriaRules'

export type CriteriaItemErrors = Partial<Record<keyof JobCriteriaPayload, string>>

export function validateCriteriaList(items: JobCriteriaPayload[]): { isValid: boolean; errors: Record<number, CriteriaItemErrors>; globalError?: string } {
  const errors: Record<number, CriteriaItemErrors> = {}

  if (items.length > MAX_CRITERIA_COUNT) {
    return {
      isValid: false,
      errors,
      globalError: `Maximum of ${MAX_CRITERIA_COUNT} criteria allowed.`,
    }
  }

  items.forEach((item, index) => {
    const itemErrors: CriteriaItemErrors = {}

    if (!item.name || !item.name.trim()) {
      itemErrors.name = 'Criteria name is required.'
    }

    if (item.weight === undefined || item.weight === null || item.weight < 0 || item.weight > 100) {
      itemErrors.weight = 'Weight must be between 0 and 100.'
    }

    if (Object.keys(itemErrors).length > 0) {
      errors[index] = itemErrors
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
