import type { CreateTenantFieldErrors, CreateTenantForm } from '../../domain/adminApi.types'
import { validationErrorMessages } from '@/core/api/axiosErrorHandler'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateTenantForm(form: CreateTenantForm): CreateTenantFieldErrors {
  const errors: CreateTenantFieldErrors = {}

  if (!form.companyName.trim()) {
    errors.companyName = validationErrorMessages.companyNameRequired
  }

  if (!form.planId.trim()) {
    errors.planId = validationErrorMessages.subscriptionPlanRequired
  }

  if (!form.domain.trim()) {
    errors.domain = validationErrorMessages.domainRequired
  }

  if (!form.industry.trim()) {
    errors.industry = validationErrorMessages.industryRequired
  }

  if (!form.region.trim()) {
    errors.region = validationErrorMessages.regionRequired
  }

  if (!form.adminFullName.trim()) {
    errors.adminFullName = validationErrorMessages.adminFullNameRequired
  }

  if (!form.adminEmail.trim()) {
    errors.adminEmail = validationErrorMessages.adminEmailRequired
  } else if (!emailRegex.test(form.adminEmail.trim())) {
    errors.adminEmail = validationErrorMessages.invalidAdminEmail
  }

  return errors
}
