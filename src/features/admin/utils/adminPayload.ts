import type { CreatePlanPayload, CreateTenantPayload, UpdateTenantPayload } from '../types/admin.types'

export function buildPlanPayload(payload: CreatePlanPayload) {
  const monthlyPrice = Number(payload.monthlyPrice)
  const maxStaffAccount = Number(payload.maxStaffAccount)
  const maxActiveJobPosting = Number(payload.maxActiveJobPosting)

  return {
    "name": payload.name.trim(),
    "description": payload.description.trim(),
    "monthlyPrice": Number.isFinite(monthlyPrice) ? monthlyPrice : 0,
    "maxStaffAccount": Number.isFinite(maxStaffAccount) ? maxStaffAccount : 0,
    "staffAccountUnlimited": Boolean(payload.staffAccountUnlimited),
    "maxActiveJobPosting": Number.isFinite(maxActiveJobPosting) ? maxActiveJobPosting : 0,
    "activeJobPostingUnlimited": Boolean(payload.activeJobPostingUnlimited),
    "features": payload.features.map((feature) => ({
      "key": String(feature.key),
      "status": String(feature.status),
    })),
  }
}

export function buildTenantCreatePayload(payload: CreateTenantPayload) {
  const tenantSlug = payload.domain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')

  return {
    "companyName": payload.companyName.trim(),
    "domain": tenantSlug,
    "planId": payload.planId,
    "adminFullName": payload.adminFullName.trim(),
    "adminEmail": payload.adminEmail.trim(),
  }
}

export function buildTenantUpdatePayload(payload: UpdateTenantPayload) {
  return {
    "companyName": payload.companyName.trim(),
    "domain": payload.domain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    "industry": payload.industry.trim(),
    "region": payload.region.trim(),
    "status": payload.status.trim().toUpperCase() || 'ACTIVE',
    "planId": payload.planId,
  }
}
