import type { CreateTenantPayload } from '../domain/adminApi.types'

export type TenantFormFieldErrors = Partial<Record<keyof CreateTenantPayload | 'name' | 'subscriptionPlanId' | 'subscriptionPlan', string>>

export function validateTenantForm(payload: Partial<CreateTenantPayload>): { isValid: boolean; errors: TenantFormFieldErrors } {
  const errors: TenantFormFieldErrors = {}

  const tenantName = payload.name ?? payload.companyName
  if (!tenantName || !tenantName.trim()) {
    errors.name = 'Company/Tenant name is required.'
    errors.companyName = 'Company/Tenant name is required.'
  }

  if (!payload.adminEmail || !payload.adminEmail.trim()) {
    errors.adminEmail = 'Admin email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.adminEmail.trim())) {
    errors.adminEmail = 'Invalid email address format.'
  }

  const planVal = payload.planId ?? payload.subscriptionPlanId ?? payload.subscriptionPlan
  if (!planVal || !planVal.trim()) {
    errors.planId = 'Subscription plan is required.'
    errors.subscriptionPlanId = 'Subscription plan is required.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
