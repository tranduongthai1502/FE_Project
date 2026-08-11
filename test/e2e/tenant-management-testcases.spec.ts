import { expect, test } from '@playwright/test'
import { mockTenantManagementApis, seedRoleSession } from './testcase-fixtures'

test.describe('Tenant Management test cases from workbook', () => {
  test.beforeEach(async ({ page }) => {
    await seedRoleSession(page, 'superAdmin')
    await mockTenantManagementApis(page)
  })

  test('TC 2.1 - renders Tenant Management list layout, KPI cards, required columns, and tenant data', async ({ page }) => {
    await page.goto('/super-admin/tenant-management')

    await expect(page.getByText('Tenant Management').first()).toBeVisible()
    await expect(page.getByText(/monthly active plan revenue/i)).toBeVisible()
    await expect(page.getByText(/active tenants/i)).toBeVisible()
    await expect(page.getByText(/average usage/i)).toBeVisible()
    await expect(page.getByText(/churn rate/i)).toBeVisible()

    await expect(page.getByRole('button', { name: /all tenants/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^active$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^inactive$/i })).toBeVisible()
    await expect(page.getByPlaceholder(/search tenant name|search/i)).toBeVisible()

    await expect(page.getByText(/company name|full name/i)).toBeVisible()
    await expect(page.getByText('Subscription Plan', { exact: true })).toBeVisible()
    await expect(page.getByText(/^price$/i)).toBeVisible()
    await expect(page.getByText(/expiration date/i)).toBeVisible()
    await expect(page.getByText(/user quota/i)).toBeVisible()
    await expect(page.getByText(/^status$/i)).toBeVisible()

    await expect(page.locator('.tenant-list-table-row').filter({ hasText: 'KVU Talent' })).toBeVisible()
    await expect(page.getByText('Premium')).toBeVisible()
    await expect(page.getByText(/12\/100/)).toBeVisible()
    await expect(page.getByText(/active/i).first()).toBeVisible()
  })

  test('TC 2.1 - searches by company name and restores list after clearing keyword', async ({ page }) => {
    await page.goto('/super-admin/tenant-management')
    await expect(page.locator('.tenant-list-table-row').filter({ hasText: 'KVU Talent' })).toBeVisible()

    const search = page.getByPlaceholder(/search tenant name|search/i)
    await search.fill('KVU')

    await expect(page.locator('.tenant-list-table-row').filter({ hasText: 'KVU Talent' })).toBeVisible()
    await expect(page.getByText('Alpha Talent')).toHaveCount(0)

    await search.fill('')

    await expect(page.locator('.tenant-list-table-row').filter({ hasText: 'KVU Talent' })).toBeVisible()
    await expect(page.locator('.tenant-list-table-row').filter({ hasText: 'Alpha Talent' })).toBeVisible()
  })

  test('TC 2.1 - filters by Active and Inactive status tabs', async ({ page }) => {
    await page.goto('/super-admin/tenant-management')
    await expect(page.locator('.tenant-list-table-row').filter({ hasText: 'KVU Talent' })).toBeVisible()

    await page.getByRole('button', { name: /^active$/i }).click()
    await expect(page.locator('.tenant-list-table-row').filter({ hasText: 'KVU Talent' })).toBeVisible()
    await expect(page.getByText('Alpha Talent')).toHaveCount(0)

    await page.getByRole('button', { name: /^inactive$/i }).click()
    await expect(page.locator('.tenant-list-table-row').filter({ hasText: 'Alpha Talent' })).toBeVisible()
    await expect(page.getByText('KVU Talent')).toHaveCount(0)
  })

  test('TC 2.2 - opens tenant detail and maps tenant/admin information', async ({ page }) => {
    await page.goto('/super-admin/tenant-management/tenant-kvu')

    await expect(page.getByRole('heading', { name: 'KVU Talent' })).toBeVisible()
    await expect(page.getByText('kvu.jobfusion.ai')).toBeVisible()
    await expect(page.getByText(/technology/i)).toBeVisible()
    await expect(page.getByText(/admin@kvu\.test/i)).toBeVisible()
    await expect(page.locator('strong').filter({ hasText: 'Premium' })).toBeVisible()
  })

  test('TC 2.3 - validates required fields before creating tenant', async ({ page }) => {
    await page.goto('/super-admin/tenant-management/create')

    await page.getByRole('button', { name: /^confirm$/i }).click()

    await expect(page.getByRole('textbox', { name: /company name/i })).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('button', { name: /select subscription plan/i })).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('textbox', { name: /domain \/ identifier/i })).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('textbox', { name: /admin email/i })).toHaveAttribute('aria-invalid', 'true')
  })

  test('TC 2.3 - submits create tenant payload successfully', async ({ page }) => {
    let createPayload: any = null

    await page.route('**/api/tenant', async (route) => {
      createPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'tenant-created',
            companyName: createPayload.companyName,
            domain: createPayload.domain,
            industry: createPayload.industry,
            region: createPayload.region,
            planId: createPayload.planId,
            status: 'ACTIVE',
          },
        }),
      })
    })

    await page.goto('/super-admin/tenant-management/create')

    await page.getByPlaceholder('e.g. Acme Corp').fill('Created Tenant')
    await page.getByRole('textbox', { name: /domain \/ identifier/i }).fill('created')
    await page.getByPlaceholder('Jane Doe').fill('Created Admin')
    await page.getByPlaceholder('jane@company.com').fill('admin@created.test')

    await page.getByRole('button', { name: /select subscription plan/i }).click()
    await page.getByRole('option', { name: /premium/i }).click()
    await page.getByRole('button', { name: /select industry/i }).click()
    await page.getByRole('option', { name: /technology/i }).click()
    await page.getByRole('button', { name: /select region/i }).click()
    await page.getByRole('option', { name: /vietnam/i }).click()
    await page.getByRole('button', { name: /confirm/i }).click()

    await expect.poll(() => createPayload).not.toBeNull()
    expect(createPayload.companyName).toContain('Created Tenant')
    expect(createPayload.adminEmail).toBe('admin@created.test')
  })

  test('TC 2.5 - delete inactive tenant shows confirmation and calls API', async ({ page }) => {
    let deletedTenant = ''

    await page.route('**/api/tenant/tenant-alpha', async (route) => {
      if (route.request().method() === 'DELETE') {
        deletedTenant = 'tenant-alpha'
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    })

    await page.goto('/super-admin/tenant-management')
    await expect(page.locator('.tenant-list-table-row').filter({ hasText: 'Alpha Talent' })).toBeVisible()

    await page.getByRole('button', { name: 'Delete Alpha Talent', exact: true }).click()
    await expect(page.getByText(/are you sure/i)).toBeVisible()
    await page.getByRole('button', { name: /confirm|delete/i }).last().click()

    await expect.poll(() => deletedTenant).toBe('tenant-alpha')
  })

})
