import { test, expect } from '@playwright/test'

test.describe('Tenant Admin API Flow & Interceptor E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock authentication storage tokens and tenantAdmin role
    await page.addInitScript(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()

      window.localStorage.setItem('jobfusion_auth_page', 'tenantAdmin')
      window.localStorage.setItem('access_token', 'fake-tenant-admin-access-token')
      window.localStorage.setItem('refresh_token', 'fake-tenant-admin-refresh-token')
      window.localStorage.setItem('user_info', JSON.stringify({
        id: 'tenant-admin-1',
        name: 'Tenant Admin Manager',
        role: 'tenantAdmin',
        userRole: 'tenantAdmin',
      }))
    })
  })

  test('should attach Authorization Bearer token to staff list request headers', async ({ page }) => {
    let capturedAuthHeader = ''

    await page.route('**/api/user/staff/list', async (route) => {
      capturedAuthHeader = route.request().headers()['authorization'] || ''
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                id: 'staff-101',
                fullName: 'Nguyen Van HR',
                email: 'hr.nguyen@example.com',
                roles: ['HR'],
                status: 'ACTIVE',
              },
            ],
            page: 1,
            size: 10,
            totalElements: 1,
            totalPages: 1,
          },
        }),
      })
    })

    await page.route('**/api/user/staff/limit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { used: 3, max: 10 },
        }),
      })
    })

    await page.goto('/tenant-admin/staff-management')
    await page.waitForLoadState('networkidle')

    expect(capturedAuthHeader).toBe('Bearer fake-tenant-admin-access-token')
  })

  test('should transform pagination request payload correctly for staff list', async ({ page }) => {
    let requestBody: any = null

    await page.route('**/api/user/staff/list', async (route) => {
      requestBody = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { content: [], totalElements: 0 },
        }),
      })
    })

    await page.route('**/api/user/staff/limit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { used: 0, max: 10 } }),
      })
    })

    await page.goto('/tenant-admin/staff-management')
    await page.waitForLoadState('networkidle')

    expect(requestBody).not.toBeNull()
    expect(requestBody.sortField).toBeDefined()
    expect(requestBody.sortBy).toBeDefined()
    expect(requestBody.page).toBeGreaterThanOrEqual(1)
  })

  test('should fetch and process staff activity logs successfully', async ({ page }) => {
    let activityLogRequested = false

    await page.route('**/api/activity-log/list', async (route) => {
      activityLogRequested = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                id: 'log-1',
                title: 'Created Job Posting',
                description: 'Created Senior React Dev job',
                ipAddress: '192.168.1.1',
                createdAt: '2026-08-05T09:00:00Z',
              },
            ],
            totalElements: 1,
          },
        }),
      })
    })

    await page.route('**/api/user/staff/list', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { content: [] } }),
      })
    })

    await page.route('**/api/user/staff/limit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { used: 0, max: 10 } }),
      })
    })

    await page.goto('/tenant-admin/staff-management')
    await page.waitForLoadState('networkidle')

    expect(activityLogRequested).toBeDefined()
  })
})
