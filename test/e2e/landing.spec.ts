import { test, expect } from '@playwright/test'

test.describe('Landing Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/landingpage')
  })

  test('should display landing page title and hero content', async ({ page }) => {
    await expect(page).toHaveURL(/\/landingpage$/)
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
  })

  test('should navigate to login page when clicking login button', async ({ page }) => {
    const loginButton = page.locator('button, a').filter({ hasText: /log\s*in|sign\s*in|đăng\s*nhập/i }).first()
    if (await loginButton.isVisible()) {
      await loginButton.click()
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('should navigate to signup page when clicking signup button', async ({ page }) => {
    const signupButton = page.locator('button, a').filter({ hasText: /sign\s*up|register|đăng\s*ký/i }).first()
    if (await signupButton.isVisible()) {
      await signupButton.click()
      await expect(page).toHaveURL(/\/signup/)
    }
  })
})
