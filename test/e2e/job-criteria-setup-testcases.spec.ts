import { expect, test } from '@playwright/test'
import { mockHrJobCriteriaApis, seedRoleSession } from './testcase-fixtures'

test.describe('Job Criteria Setup test cases from workbook', () => {
  test.beforeEach(async ({ page }) => {
    await seedRoleSession(page, 'hr')
    await mockHrJobCriteriaApis(page)
  })

  test('renders Criteria Set tab with saved criteria and total weight 100%', async ({ page }) => {
    await page.goto('/hr/jobs/job-senior-ai?tab=criteria')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('button', { name: /criteria set/i })).toBeVisible()
    await expect(page.getByText(/evaluation criteria/i)).toBeVisible()
    await expect(page.getByText('System Architecture')).toBeVisible()
    await expect(page.getByText('Team Collaboration')).toBeVisible()
    await expect(page.getByText(/total weightage/i)).toContainText('100%')
  })

  test('allows editing criteria and saving valid 100% weight payload', async ({ page }) => {
    let savedPayload: any[] | null = null

    await page.route('**/api/job-criteria', async (route) => {
      savedPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: savedPayload }),
      })
    })

    await page.goto('/hr/jobs/job-senior-ai?tab=criteria')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /edit criterion/i }).click()
    await expect(page.getByPlaceholder('System Architecture').first()).toBeVisible()
    await expect(page.getByText(/total weightage/i)).toContainText('100%')

    await page.getByRole('button', { name: /save criteria/i }).click()

    await expect.poll(() => savedPayload).not.toBeNull()
    expect(savedPayload).toHaveLength(2)
    expect(savedPayload?.[0]).toMatchObject({
      jobId: 'job-senior-ai',
      criterionName: 'System Architecture',
      category: 'Technical Skills',
      weight: 60,
    })
  })

  test('prevents saving when total criteria weight is not 100%', async ({ page }) => {
    await page.goto('/hr/jobs/job-senior-ai?tab=criteria')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /edit criterion/i }).click()
    const weightInputs = page.getByPlaceholder('40')
    await weightInputs.first().fill('30')

    await expect(page.getByText(/all criteria must have a total weight of 100/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /save criteria/i })).toBeDisabled()
  })

  test('adds and removes a draft criterion row without breaking layout', async ({ page }) => {
    await page.goto('/hr/jobs/job-senior-ai?tab=criteria')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /edit criterion/i }).click()
    await page.getByRole('button', { name: /\+ add criterion/i }).click()

    await expect(page.getByPlaceholder('System Architecture').last()).toBeVisible()
    await page.getByPlaceholder('System Architecture').last().fill('Leadership')
    await page.getByPlaceholder('Describe what this criterion evaluates').last().fill('Leads delivery and mentors teammates.')
    await page.getByPlaceholder('40').last().fill('0')

    await page.getByRole('button', { name: /remove draft criterion/i }).last().click()
    await expect(page.getByText('Leadership')).toHaveCount(0)
    await expect(page.getByText(/evaluation criteria/i)).toBeVisible()
  })
})
