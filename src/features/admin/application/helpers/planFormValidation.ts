import type { CreatePlanFieldErrors, CreatePlanForm } from '../../domain/adminApi.types'
import { validationErrorMessages } from '@/core/api/axiosErrorHandler'
import { parseCurrencyInput } from '@/core/utils/currencyFormat'

export function validatePlanForm(form: CreatePlanForm): CreatePlanFieldErrors {
  const errors: CreatePlanFieldErrors = {}

  if (!form.name.trim()) {
    errors.planName = validationErrorMessages.planNameRequired
  }

  if (!form.description.trim()) {
    errors.description = validationErrorMessages.shortDescriptionRequired
  }

  const priceNum = parseCurrencyInput(form.monthlyPrice)
  if (Number.isNaN(priceNum) || priceNum < 0) {
    errors.monthlyPrice = validationErrorMessages.validPriceRequired
  }

  if (!form.staffAccountUnlimited) {
    const staffNum = Number(form.maxStaffAccount)
    if (!form.maxStaffAccount.trim() || Number.isNaN(staffNum) || staffNum <= 0) {
      errors.maxStaffAccount = validationErrorMessages.positiveNumberOrUnlimitedRequired
    }
  }

  if (!form.activeJobPostingUnlimited) {
    const jobsNum = Number(form.maxActiveJobPosting)
    if (!form.maxActiveJobPosting.trim() || Number.isNaN(jobsNum) || jobsNum <= 0) {
      errors.maxActiveJobPosting = validationErrorMessages.positiveNumberOrUnlimitedRequired
    }
  }

  return errors
}
