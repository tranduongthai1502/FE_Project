import { describe, expect, it } from 'vitest'
import { calculateAdminDashboardMetrics, isHighestPricedPlan } from '@/features/admin/domain/superAdminMetrics'
import { isTenantExpiringSoon, getTenantStatusBadgeClass, isActiveTenant } from '@/features/admin/domain/tenantRules'
import { isEnterprisePlan, calculateAnnualDiscountPercent, formatPlanPriceDisplay } from '@/features/admin/domain/subscriptionPlanRules'
import { validateTenantForm } from '@/features/admin/application/tenantFormValidation'
import { validatePlanForm } from '@/features/admin/application/planFormValidation'
import type { SubscriptionPlan, Tenant } from '@/features/admin/domain/adminApi.types'

describe('superAdminMetrics', () => {
  const mockPlans: SubscriptionPlan[] = [
    { id: 'plan-1', name: 'Basic', code: 'BASIC', monthlyPrice: 100, yearlyPrice: 1000, maxStaffAccount: 10, staffAccountUnlimited: false, features: [], active: true, recommended: false },
    { id: 'plan-2', name: 'Enterprise', code: 'ENTERPRISE', monthlyPrice: 500, yearlyPrice: 5000, maxStaffAccount: 100, staffAccountUnlimited: true, features: [], active: true, recommended: true },
  ]

  const mockTenants: Tenant[] = [
    {
      id: 't-1',
      name: 'Acme Corp',
      code: 'ACME',
      status: 'Active',
      subscriptionPlan: 'Basic',
      subscriptionPlanId: 'plan-1',
      expirationDate: '2026-08-20T00:00:00Z',
      userQuotaLimit: 10,
      userQuotaUsed: 5,
      userQuotaUnlimited: false,
      adminEmail: 'admin@acme.com',
      createdAt: '2026-01-01',
    },
    {
      id: 't-2',
      name: 'Stark Ind',
      code: 'STARK',
      status: 'Active',
      subscriptionPlan: 'Enterprise',
      subscriptionPlanId: 'plan-2',
      expirationDate: '2026-12-31T00:00:00Z',
      userQuotaLimit: 100,
      userQuotaUsed: 50,
      userQuotaUnlimited: true,
      adminEmail: 'tony@stark.com',
      createdAt: '2026-01-01',
    },
    {
      id: 't-3',
      name: 'Wayne Ent',
      code: 'WAYNE',
      status: 'Inactive',
      subscriptionPlan: 'Basic',
      subscriptionPlanId: 'plan-1',
      expirationDate: '2026-05-01T00:00:00Z',
      userQuotaLimit: 10,
      userQuotaUsed: 0,
      userQuotaUnlimited: false,
      adminEmail: 'bruce@wayne.com',
      createdAt: '2026-01-01',
    },
  ]

  it('should calculate active tenants, MRR, and expiring counts correctly', () => {
    const fixedNow = Date.parse('2026-08-04T08:00:00Z')
    const metrics = calculateAdminDashboardMetrics(mockTenants, mockPlans, fixedNow)

    expect(metrics.activeTenantsCount).toBe(2)
    expect(metrics.expiringTenantCount).toBe(1)
    expect(metrics.monthlyRecurringRevenue).toBe(700)
    expect(metrics.tenantCountsByPlan['Basic']).toBe(2)
    expect(metrics.tenantCountsByPlan['Enterprise']).toBe(1)
  })

  it('should identify highest priced plan correctly', () => {
    expect(isHighestPricedPlan('Enterprise', mockPlans)).toBe(true)
    expect(isHighestPricedPlan('Basic', mockPlans)).toBe(false)
  })
})

describe('tenantRules', () => {
  const fixedNow = Date.parse('2026-08-04T08:00:00Z')

  it('should check if tenant is expiring soon within threshold', () => {
    expect(isTenantExpiringSoon('2026-08-20T00:00:00Z', 30, fixedNow)).toBe(true)
    expect(isTenantExpiringSoon('2026-11-01T00:00:00Z', 30, fixedNow)).toBe(false)
  })

  it('should check tenant active status and badge class', () => {
    expect(isActiveTenant({ status: 'Active' })).toBe(true)
    expect(isActiveTenant({ status: 'INACTIVE' })).toBe(false)
    expect(getTenantStatusBadgeClass('Active')).toBe('active')
    expect(getTenantStatusBadgeClass('Suspended')).toBe('suspended')
    expect(getTenantStatusBadgeClass('Inactive')).toBe('inactive')
  })
})

describe('subscriptionPlanRules', () => {
  it('should identify Enterprise plan by code or name', () => {
    expect(isEnterprisePlan({ code: 'ENTERPRISE_V1', name: 'Plan' })).toBe(true)
    expect(isEnterprisePlan({ code: 'BASIC', name: 'Basic Plan' })).toBe(false)
  })

  it('should calculate annual discount percentage correctly', () => {
    // 100/mo = 1200/yr. Yearly price 1000 => discount = (200/1200)*100 = 17%
    expect(calculateAnnualDiscountPercent(100, 1000)).toBe(17)
    expect(calculateAnnualDiscountPercent(100, 1200)).toBe(0)
  })

  it('should format plan price display correctly', () => {
    expect(formatPlanPriceDisplay(500)).toBe('$500')
    expect(formatPlanPriceDisplay(0)).toBe('$0')
  })
})

describe('adminFormValidations', () => {
  it('should validate tenant form accurately', () => {
    const invalidRes = validateTenantForm({ name: '', adminEmail: 'invalid' })
    expect(invalidRes.isValid).toBe(false)
    expect(invalidRes.errors.name).toBeDefined()
    expect(invalidRes.errors.adminEmail).toBe('Invalid email address format.')

    const validRes = validateTenantForm({ name: 'Acme', adminEmail: 'admin@acme.com', subscriptionPlanId: 'p1' })
    expect(validRes.isValid).toBe(true)
    expect(validRes.errors).toEqual({})
  })

  it('should validate plan form accurately', () => {
    const invalidRes = validatePlanForm({ name: '  ', monthlyPrice: -10, yearlyPrice: 0 })
    expect(invalidRes.isValid).toBe(false)
    expect(invalidRes.errors.name).toBeDefined()
    expect(invalidRes.errors.monthlyPrice).toBeDefined()

    const validRes = validatePlanForm({ name: 'Pro Plan', monthlyPrice: 199, yearlyPrice: 1990 })
    expect(validRes.isValid).toBe(true)
  })
})
