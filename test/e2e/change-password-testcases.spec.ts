import { expect, test } from '@playwright/test'
import { seedRoleSession } from './testcase-fixtures'

const currentPassword = () => '#candidate-current-password'
const newPassword = () => '#candidate-new-password'
const confirmPassword = () => '#candidate-confirm-password'

test.describe('Change Password test cases from workbook', () => {
  test.beforeEach(async ({ page }) => {
    await seedRoleSession(page, 'candidate')
  })

  test('renders change password form, placeholders, password strength, and eye controls', async ({ page }) => {
    await page.goto('/candidate/change-password')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible()
    await expect(page.locator(currentPassword())).toHaveAttribute('placeholder', 'Enter current password')
    await expect(page.locator(newPassword())).toHaveAttribute('placeholder', 'Enter at least 8 characters')
    await expect(page.locator(confirmPassword())).toHaveAttribute('placeholder', 'Re-type your new password')
    await expect(page.getByText(/not entered/i)).toBeVisible()

    await expect(page.getByRole('button', { name: /show current password/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /show new password/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /show confirm password/i })).toBeVisible()
  })

  test('validates required fields when saving empty form', async ({ page }) => {
    await page.goto('/candidate/change-password')
    await page.waitForLoadState('domcontentloaded')

    await page.getByRole('button', { name: /save changes/i }).click()

    await expect(page.getByText('Please enter your current password.')).toBeVisible()
    await expect(page.getByText('Please enter your new password.')).toBeVisible()
    await expect(page.getByText('Please confirm your new password.')).toBeVisible()
  })

  test('updates password strength in real time', async ({ page }) => {
    await page.goto('/candidate/change-password')
    await page.waitForLoadState('domcontentloaded')

    await page.locator(newPassword()).fill('Abcdefgh')
    await expect(page.getByText(/weak/i)).toBeVisible()

    await page.locator(newPassword()).fill('Aa12*')
    await expect(page.getByText(/medium/i)).toBeVisible()

    await page.locator(newPassword()).fill('Abcdef1@')
    await expect(page.getByText(/strong/i)).toBeVisible()
  })

  test('toggles password visibility with accessible eye buttons', async ({ page }) => {
    await page.goto('/candidate/change-password')
    await page.waitForLoadState('domcontentloaded')

    await page.locator(currentPassword()).fill('OldPass@123')
    await expect(page.locator(currentPassword())).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: /show current password/i }).click()
    await expect(page.locator(currentPassword())).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: /hide current password/i }).click()
    await expect(page.locator(currentPassword())).toHaveAttribute('type', 'password')
  })

  test('validates password mismatch and duplicate current password', async ({ page }) => {
    await page.goto('/candidate/change-password')
    await page.waitForLoadState('domcontentloaded')

    await page.locator(currentPassword()).fill('OldPass@123')
    await page.locator(newPassword()).fill('NewPass@123')
    await page.locator(confirmPassword()).fill('DifferentPass@123')
    await page.getByRole('button', { name: /save changes/i }).click()
    await expect(page.getByText('Passwords do not match.')).toBeVisible()

    await page.locator(newPassword()).fill('OldPass@123')
    await page.locator(confirmPassword()).fill('OldPass@123')
    await page.getByRole('button', { name: /save changes/i }).click()
    await expect(page.getByText('New password duplicates current password.')).toBeVisible()
  })

  test('submits successful change-password request after confirmation', async ({ page }) => {
    let changePasswordPayload: any = null

    await page.route('**/api/auth/change-password', async (route) => {
      changePasswordPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, httpStatus: 200, data: {} }),
      })
    })

    await page.goto('/candidate/change-password')
    await page.waitForLoadState('domcontentloaded')

    await page.locator(currentPassword()).fill('OldPass@123')
    await page.locator(newPassword()).fill('NewPass@123')
    await page.locator(confirmPassword()).fill('NewPass@123')
    await page.getByRole('button', { name: /save changes/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: /^confirm$/i }).click()

    await expect.poll(() => changePasswordPayload).not.toBeNull()
    expect(changePasswordPayload).toMatchObject({
      oldPassword: 'OldPass@123',
      newPassword: 'NewPass@123',
    })
    await expect(page).toHaveURL(/\/login/)
  })

  test('maps wrong current password API error to current password field', async ({ page }) => {
    await page.route('**/api/auth/change-password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'wrong_password',
          message: 'wrong_password',
        }),
      })
    })

    await page.goto('/candidate/change-password')
    await page.waitForLoadState('domcontentloaded')

    await page.locator(currentPassword()).fill('WrongPass@123')
    await page.locator(newPassword()).fill('NewPass@123')
    await page.locator(confirmPassword()).fill('NewPass@123')
    await page.getByRole('button', { name: /save changes/i }).click()
    await page.getByRole('button', { name: /^confirm$/i }).click()

    await expect(page.getByText('Current password is incorrect.')).toBeVisible()
  })

  test('cancel confirmation keeps user on form until confirmed', async ({ page }) => {
    await page.goto('/candidate/change-password')
    await page.waitForLoadState('domcontentloaded')

    await page.locator(currentPassword()).fill('OldPass@123')
    await page.getByRole('button', { name: /^cancel$/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: /^cancel$/i }).last().click()
    await expect(page.locator(currentPassword())).toHaveValue('OldPass@123')
  })
})
