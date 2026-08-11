import type { CreateTenantFieldErrors, CreateTenantForm } from '../../domain/adminApi.types'
import { validationErrorMessages } from '@/core/api/axiosErrorHandler'
import { z } from 'zod'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const tenantFormSchema = z.object({
  companyName: z.string().trim().min(1, validationErrorMessages.companyNameRequired),
  planId: z.string().trim().min(1, validationErrorMessages.subscriptionPlanRequired),
  domain: z.string().trim().min(1, validationErrorMessages.domainRequired),
  industry: z.string().trim().min(1, validationErrorMessages.industryRequired),
  region: z.string().trim().min(1, validationErrorMessages.regionRequired),
  adminFullName: z.string().trim().min(1, validationErrorMessages.adminFullNameRequired),
  adminEmail: z
    .string()
    .trim()
    .min(1, validationErrorMessages.adminEmailRequired)
    .regex(emailRegex, validationErrorMessages.invalidAdminEmail),
})

export function validateTenantForm(form: CreateTenantForm): CreateTenantFieldErrors {
  const errors: CreateTenantFieldErrors = {}
  const result = tenantFormSchema.safeParse(form)

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof CreateTenantForm | undefined
      if (field && !errors[field]) {
        errors[field] = issue.message
      }
    })
  }

  return errors
}
