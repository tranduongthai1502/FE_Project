import type { CreatePlanPayload, CreateTenantPayload, UpdatePlanPayload, UpdateTenantPayload } from '@/features/admin/domain/adminApi.types'

function normalizeResourceStatus(status?: string) {
  const normalizedStatus = String(status || '').trim().toUpperCase()

  if (!normalizedStatus) return 'ACTIVE'
  if (normalizedStatus === 'DISABLED') return 'INACTIVE'
  return normalizedStatus
}

function normalizeFeatureStatus(status?: string) {
  const normalizedStatus = String(status || '').trim().toUpperCase()

  if (normalizedStatus === 'INACTIVE' || normalizedStatus === 'DISABLED' || normalizedStatus === 'FALSE') {
    return 'INACTIVE'
  }

  return 'ACTIVE'
}

export function buildPlanPayload(payload: CreatePlanPayload & { status?: string }) {
  const price = Number(payload.price)
  const maxStaffAccount = payload.maxStaffAccount === null ? null : Number(payload.maxStaffAccount)
  const maxActiveJobPosting = payload.maxActiveJobPosting === null ? null : Number(payload.maxActiveJobPosting)

  const normalizedMaxStaff = payload.staffAccountUnlimited
    ? null
    : Number.isFinite(maxStaffAccount) && maxStaffAccount && maxStaffAccount >= 1
      ? maxStaffAccount
      : 1

  const normalizedMaxJobs = payload.activeJobPostingUnlimited
    ? null
    : Number.isFinite(maxActiveJobPosting) && maxActiveJobPosting && maxActiveJobPosting >= 1
      ? maxActiveJobPosting
      : 1

  return {
    "name": payload.name.trim(),
    "description": payload.description.trim(),
    "billingCycle": payload.billingCycle || 'MONTHLY',
    "price": Number.isFinite(price) ? price : 0,
    "maxStaffAccount": normalizedMaxStaff,
    "staffAccountUnlimited": Boolean(payload.staffAccountUnlimited),
    "maxActiveJobPosting": normalizedMaxJobs,
    "activeJobPostingUnlimited": Boolean(payload.activeJobPostingUnlimited),
    "features": payload.features.map((feature) => ({
      "key": String(feature.key),
      "status": normalizeFeatureStatus(feature.status),
    })),
    "status": normalizeResourceStatus(payload.status),
  }
}

export function buildPlanUpdatePayload(payload: UpdatePlanPayload) {
  return buildPlanPayload(payload)
}

export function buildTenantCreatePayload(payload: CreateTenantPayload) {
  const tenantSlug = payload.domain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')

  return {
    "companyName": payload.companyName.trim(),
    "domain": tenantSlug,
    "industry": payload.industry.trim(),
    "region": payload.region.trim(),
    "planId": payload.planId,
    "adminFullName": payload.adminFullName.trim(),
    "adminEmail": payload.adminEmail.trim(),
    "status": 'INACTIVE',
  }
}

export function buildTenantUpdatePayload(payload: UpdateTenantPayload) {
  return {
    "companyName": payload.companyName.trim(),
    "domain": payload.domain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    "industry": payload.industry.trim(),
    "region": payload.region.trim(),
    "status": normalizeResourceStatus(payload.status),
    "planId": payload.planId,
    "adminFullName": payload.adminFullName.trim(),
    "adminEmail": payload.adminEmail.trim(),
  }
}
