import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import build from '../src/build.mjs'
import fs from 'fs'

test.use({
    baseURL: `file://${process.cwd()}/build/`,
})
test.beforeAll(async () => {
    build({markdown: ['README.md']})
})
test.beforeEach(async ({ page }) => {
    await page.goto('index.html')
})
test.afterAll(async () => {
    fs.rmdir('build', {recursive: true}, () => {})
})

test('should not have automatically detectable accessibility issues', async ({ page }, testInfo) => {

    const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

    // Attach accessibility violations to test report.
    await testInfo.attach('accessibility-scan-results', {
        body: JSON.stringify(accessibilityScanResults.violations, null, 2),
        contentType: 'application/json',
    })

    expect(accessibilityScanResults.violations).toEqual([])

})
