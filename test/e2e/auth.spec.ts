import { test, expect } from '@playwright/test'

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('domcontentloaded')
  })

  test('should render login page input fields and submit button', async ({ page }) => {
    await expect(page).toHaveURL(/\/login/)

    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
  })

  test('should allow entering email and password', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()

    await emailInput.waitFor({ state: 'visible' })
    await passwordInput.waitFor({ state: 'visible' })

    await emailInput.fill('admin@example.com')
    await passwordInput.fill('Password123!')

    await expect(emailInput).toHaveValue('admin@example.com')
    await expect(passwordInput).toHaveValue('Password123!')
  })

  test('should switch between Login and Signup pages', async ({ page }) => {
    const signupLink = page.locator('a, button').filter({ hasText: /sign\s*up|create\s*account|đăng\s*ký/i }).first()
    if (await signupLink.isVisible()) {
      await signupLink.click()
      await expect(page).toHaveURL(/\/signup/)
    }
  })
})
