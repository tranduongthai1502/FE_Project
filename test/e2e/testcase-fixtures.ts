import type { Page, Route } from '@playwright/test'

export const plans = [
  {
    id: 'plan-basic',
    name: 'Basic',
    description: 'Starter plan',
    monthlyPrice: 29,
    yearlyPrice: 290,
    maxStaffAccount: 10,
    maxActiveJobPosting: 5,
    staffAccountUnlimited: false,
    activeJobPostingUnlimited: false,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    features: [],
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    description: 'Growth plan',
    monthlyPrice: 99,
    yearlyPrice: 990,
    maxStaffAccount: 100,
    maxActiveJobPosting: 50,
    staffAccountUnlimited: false,
    activeJobPostingUnlimited: false,
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    features: [],
  },
]

export const tenants = [
  {
    id: 'tenant-kvu',
    companyName: 'KVU Talent',
    domain: 'kvu',
    industry: 'Technology',
    region: 'Vietnam',
    subscriptionPlanId: 'plan-premium',
    subscriptionPlanName: 'Premium',
    planName: 'Premium',
    monthlyPrice: 99,
    expirationDate: '2026-12-31',
    userQuotaUsed: 12,
    userQuotaLimit: 100,
    status: 'ACTIVE',
    adminUserId: 'admin-kvu',
    adminFullName: 'Kvu Admin',
    adminEmail: 'admin@kvu.test',
  },
  {
    id: 'tenant-alpha',
    companyName: 'Alpha Talent',
    domain: 'alpha',
    industry: 'Finance',
    region: 'Singapore',
    subscriptionPlanId: 'plan-basic',
    subscriptionPlanName: 'Basic',
    planName: 'Basic',
    monthlyPrice: 29,
    expirationDate: '2026-10-20',
    userQuotaUsed: 4,
    userQuotaLimit: 10,
    status: 'INACTIVE',
    adminUserId: 'admin-alpha',
    adminFullName: 'Alpha Admin',
    adminEmail: 'admin@alpha.test',
  },
]

export const jobs = [
  {
    id: 'job-senior-ai',
    title: 'Senior AI Engineer',
    department: 'Engineering',
    level: 'Senior',
    employmentType: 'FULL_TIME',
    locationType: 'OFFICE',
    location: 'Da Nang',
    applicationDeadline: '2026-12-31',
    description: 'Build AI products.',
    requirements: 'React, TypeScript, ML basics',
    benefits: 'Health insurance',
    salaryMin: 1000,
    salaryMax: 2000,
    status: 'OPEN',
    applicantCount: 8,
    createdAt: '2026-08-01T00:00:00Z',
  },
]

export const criteria = [
  {
    id: 'criteria-arch',
    jobId: 'job-senior-ai',
    criterionName: 'System Architecture',
    name: 'System Architecture',
    description: 'Design scalable services.',
    category: 'Technical Skills',
    weight: 60,
    sortOrder: 1,
  },
  {
    id: 'criteria-team',
    jobId: 'job-senior-ai',
    criterionName: 'Team Collaboration',
    name: 'Team Collaboration',
    description: 'Work effectively with teammates.',
    category: 'Soft Skills',
    weight: 40,
    sortOrder: 2,
  },
]

export async function seedRoleSession(page: Page, role: 'superAdmin' | 'hr' | 'candidate') {
  await page.addInitScript((userRole) => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('jobfusion_auth_page', userRole)
    window.localStorage.setItem('access_token', `fake-${userRole}-access-token`)
    window.localStorage.setItem('refresh_token', `fake-${userRole}-refresh-token`)
    window.localStorage.setItem('user_info', JSON.stringify({
      id: `${userRole}-user`,
      fullName: userRole === 'hr' ? 'Alex Thompson' : 'Test User',
      email: `${userRole}@jobfusion.test`,
      role: userRole,
      userRole,
    }))
  }, role)
}

export function ok(data: unknown = {}) {
  return JSON.stringify({ success: true, data })
}

export async function fulfillJson(route: Route, data: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: typeof data === 'string' ? data : JSON.stringify(data),
  })
}

export async function mockTenantManagementApis(page: Page) {
  await page.route('**/api/dashboard/stats/tenant', (route) => fulfillJson(route, {
    success: true,
    data: {
      totalTenants: tenants.length,
      activeTenants: 1,
      inactiveTenants: 1,
      totalRevenue: 128,
      averageUsage: 45,
      churnRate: 5,
    },
  }))

  await page.route('**/api/plan/list', (route) => fulfillJson(route, {
    content: plans,
    totalElements: plans.length,
    totalPages: 1,
  }))

  await page.route('**/api/tenant/list', async (route) => {
    const body = route.request().postDataJSON() as any
    const filters = body?.filters || {}
    const search = String(filters.search || filters.companyName || filters.name || body?.search || body?.keyword || '').toLowerCase()
    const rawStatus = String(filters.status || body?.status || '').toUpperCase()
    const status = rawStatus === 'ALL' ? '' : rawStatus
    const planId = String(filters.planId || filters.subscriptionPlanId || body?.planId || body?.subscriptionPlanId || '')
    const filtered = tenants.filter((tenant) => {
      const matchesSearch = !search || tenant.companyName.toLowerCase().includes(search) || tenant.domain.includes(search)
      const matchesStatus = !status || tenant.status === status
      const matchesPlan = !planId || tenant.subscriptionPlanId === planId
      return matchesSearch && matchesStatus && matchesPlan
    })

    await fulfillJson(route, {
      content: filtered,
      totalElements: filtered.length,
      totalPages: 1,
    })
  })

  await page.route('**/api/tenant/tenant-*', async (route) => {
    const url = new URL(route.request().url())
    const id = decodeURIComponent(url.pathname.split('/').at(-1) || '')
    const tenant = tenants.find((item) => item.id === id) || tenants[0]

    if (route.request().method() === 'DELETE') {
      await fulfillJson(route, { success: true, data: {} })
      return
    }

    if (route.request().method() === 'PUT') {
      await fulfillJson(route, { success: true, data: { ...tenant, ...route.request().postDataJSON() } })
      return
    }

    await fulfillJson(route, { success: true, data: tenant })
  })

  await page.route('**/api/user/*', (route) => fulfillJson(route, {
    success: true,
    data: {
      id: 'admin-kvu',
      fullName: 'Kvu Admin',
      email: 'admin@kvu.test',
      status: 'ACTIVE',
      userRole: 'Tenant Admin',
      createdAt: '2026-01-01T00:00:00Z',
    },
  }))
}

export async function mockHrJobCriteriaApis(page: Page) {
  await page.route('**/api/dashboard/stats/job-posting', (route) => fulfillJson(route, {
    success: true,
    data: {
      totalActivePostings: 1,
      totalApplicants: 8,
      postingsExpiringSoon: 0,
    },
  }))

  await page.route('**/api/job-posting/limit', (route) => fulfillJson(route, {
    success: true,
    data: {
      activeJobPostingUsed: 1,
      activeJobPostingLimit: 10,
      activeJobPostingUnlimited: false,
    },
  }))

  await page.route('**/api/job-posting/list', (route) => fulfillJson(route, {
    success: true,
    data: {
      content: jobs,
      totalElements: jobs.length,
      totalPages: 1,
    },
  }))

  await page.route('**/api/job-posting/job-senior-ai', (route) => fulfillJson(route, {
    success: true,
    data: jobs[0],
  }))

  await page.route('**/api/job-criteria/job/job-senior-ai', (route) => fulfillJson(route, {
    success: true,
    data: criteria,
  }))

  await page.route('**/api/job-criteria', async (route) => {
    await fulfillJson(route, {
      success: true,
      data: route.request().postDataJSON(),
    })
  })
}
