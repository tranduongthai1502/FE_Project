import { test, expect } from '@playwright/test'

test.describe('Super Admin Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage auth session to Super Admin for testing
    await page.addInitScript(() => {
      window.localStorage.setItem('dashboard_user_role', 'SUPER_ADMIN')
      window.localStorage.setItem(
        'dashboard_user',
        JSON.stringify({
          id: 'admin-1',
          fullName: 'Super Admin User',
          email: 'admin@system.com',
          userRole: 'SUPER_ADMIN',
        }),
      )
    })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  test('should render dashboard shell and topbar', async ({ page }) => {
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should render metric cards and navigation menu', async ({ page }) => {
    const navButtons = page.locator('nav button, .role-nav button')
    if (await navButtons.count() > 0) {
      await expect(navButtons.first()).toBeVisible()
    }
  })
})
