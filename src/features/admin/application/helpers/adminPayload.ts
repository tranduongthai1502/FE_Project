import type { CreatePlanForm, CreatePlanPayload, CreateTenantForm, CreateTenantPayload, SubscriptionPlan, Tenant, UpdatePlanPayload, UpdateTenantPayload } from '../../domain/adminApi.types'
import { parseCurrencyInput } from '@/core/utils/currencyFormat'

export function buildTenantCreatePayload(form: CreateTenantForm): CreateTenantPayload {
  return {
    companyName: form.companyName.trim(),
    domain: form.domain.trim().toLowerCase(),
    industry: form.industry.trim(),
    region: form.region.trim(),
    planId: form.planId,
    adminFullName: form.adminFullName.trim(),
    adminEmail: form.adminEmail.trim().toLowerCase(),
  }
}

export function buildTenantUpdatePayloadFromTenant(tenant: Tenant, overrides: Partial<UpdateTenantPayload> = {}): UpdateTenantPayload {
  return {
    companyName: tenant.name,
    domain: tenant.domain || '',
    industry: tenant.industry || '',
    region: tenant.region || '',
    planId: tenant.subscriptionPlanId || '',
    adminEmail: tenant.adminEmail || '',
    adminFullName: tenant.adminFullName || '',
    status: tenant.status,
    ...overrides,
  }
}

export function buildTenantStatusPayload(tenant: Tenant, status: 'ACTIVE' | 'INACTIVE'): UpdateTenantPayload {
  return buildTenantUpdatePayloadFromTenant(tenant, { status })
}

export function buildTenantPlanPayload(tenant: Tenant, planId: string): UpdateTenantPayload {
  return buildTenantUpdatePayloadFromTenant(tenant, { planId })
}

export function buildTenantUpdatePayload(payload: UpdateTenantPayload): UpdateTenantPayload {
  return payload
}

export function buildPlanPayload(form: CreatePlanForm): CreatePlanPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    billingCycle: form.billingCycle,
    price: parseCurrencyInput(form.monthlyPrice),
    maxStaffAccount: form.staffAccountUnlimited ? null : Number(form.maxStaffAccount || 0),
    staffAccountUnlimited: form.staffAccountUnlimited,
    maxActiveJobPosting: form.activeJobPostingUnlimited ? null : Number(form.maxActiveJobPosting || 0),
    activeJobPostingUnlimited: form.activeJobPostingUnlimited,
    status: form.status || 'ACTIVE',
    features: form.features.map((feature) => ({
      key: feature.key,
      status: feature.enabled ? 'ACTIVE' : 'INACTIVE',
    })),
  }
}

export function buildUpdatePlanPayload(form: Partial<CreatePlanForm>, currentPlan: SubscriptionPlan): UpdatePlanPayload {
  const isStaffUnlimited = form.staffAccountUnlimited ?? currentPlan.staffAccountUnlimited
  const isJobsUnlimited = form.activeJobPostingUnlimited ?? currentPlan.activeJobPostingUnlimited

  return {
    name: form.name !== undefined ? form.name.trim() : currentPlan.name,
    description: form.description !== undefined ? form.description.trim() : currentPlan.description,
    billingCycle: form.billingCycle ?? currentPlan.billingCycle ?? 'MONTHLY',
    price: form.monthlyPrice !== undefined ? parseCurrencyInput(form.monthlyPrice) : currentPlan.monthlyPrice,
    maxStaffAccount: isStaffUnlimited ? null : Number(form.maxStaffAccount ?? currentPlan.maxStaffAccount ?? 0),
    staffAccountUnlimited: isStaffUnlimited,
    maxActiveJobPosting: isJobsUnlimited ? null : Number(form.maxActiveJobPosting ?? currentPlan.maxActiveJobPosting ?? 0),
    activeJobPostingUnlimited: isJobsUnlimited,
    status: form.status ?? currentPlan.status,
    features: form.features
      ? form.features.map((feature) => ({ key: feature.key, status: feature.enabled ? 'ACTIVE' : 'INACTIVE' }))
      : currentPlan.features,
  }
}

export function buildPlanUpdatePayload(payload: UpdatePlanPayload): UpdatePlanPayload {
  return payload
}
