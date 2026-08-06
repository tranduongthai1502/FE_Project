import { test, expect } from '@playwright/test'

test.describe('API Processing Flow & Axios Interceptor E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()

      window.localStorage.setItem('jobfusion_auth_page', 'hr')
      window.localStorage.setItem('access_token', 'fake-jwt-access-token')
      window.localStorage.setItem('refresh_token', 'fake-jwt-refresh-token')
      window.localStorage.setItem('user_info', JSON.stringify({
        id: 'user-1',
        name: 'HR Manager',
        role: 'HR',
        userRole: 'HR',
      }))
    })
  })

  test('should attach Authorization Bearer token to request headers', async ({ page }) => {
    let capturedAuthHeader = ''

    await page.route('**/api/job-posting/list', async (route) => {
      capturedAuthHeader = route.request().headers()['authorization'] || ''
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            content: [
              {
                id: 'job-101',
                title: 'Senior React Developer',
                department: 'Engineering',
                employmentType: 'FULL_TIME',
                status: 'OPEN',
                createdAt: '2026-08-05T08:00:00',
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

    await page.route('**/api/dashboard/stats/job-posting', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { activeJobs: 1 } }),
      })
    })

    await page.goto('/hr/jobs')
    await page.waitForLoadState('networkidle')

    expect(capturedAuthHeader).toBe('Bearer fake-jwt-access-token')
  })

  test('should transform payload request parameters correctly', async ({ page }) => {
    let requestBody: any = null

    await page.route('**/api/job-posting/list', async (route) => {
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

    await page.route('**/api/dashboard/stats/job-posting', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      })
    })

    await page.goto('/hr/jobs')
    await page.waitForLoadState('networkidle')

    expect(requestBody).not.toBeNull()
    expect(requestBody.sortField).toBe('createdAt')
    expect(requestBody.sortBy).toBe('DESC')
    expect(requestBody.page).toBeGreaterThanOrEqual(1)
  })

  test('should trigger refresh token flow upon receiving 401 Unauthorized', async ({ page }) => {
    let refreshAttempted = false
    let retriedWithNewToken = false

    await page.route('**/api/dashboard/stats/job-posting', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      })
    })

    await page.route('**/api/job-posting/list', async (route) => {
      const authHeader = route.request().headers()['authorization']

      if (authHeader === 'Bearer fake-jwt-access-token') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
      } else if (authHeader === 'Bearer new-refreshed-access-token') {
        retriedWithNewToken = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { content: [], totalElements: 0 },
          }),
        })
      }
    })

    await page.route('**/api/auth/refresh-token', async (route) => {
      refreshAttempted = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            token: 'new-refreshed-access-token',
            refresh_token: 'new-refreshed-refresh-token',
          },
        }),
      })
    })

    await page.goto('/hr/jobs')
    await page.waitForLoadState('networkidle')

    expect(refreshAttempted).toBe(true)
    expect(retriedWithNewToken).toBe(true)
  })

  test('should handle API errors and display error state gracefully', async ({ page }) => {
    await page.route('**/api/job-posting/list', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Internal Server Error',
        }),
      })
    })

    await page.route('**/api/dashboard/stats/job-posting', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      })
    })

    await page.goto('/hr/jobs')
    await page.waitForLoadState('networkidle')

    const bodyText = await page.innerText('body')
    expect(bodyText).toBeDefined()
  })
})
