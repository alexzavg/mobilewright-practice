import { test, expect } from '@mobilewright/test'

test.use({ bundleId: process.env.CHROME_BUNDLE_ID! })

test.beforeEach(async ({ device }) => {
  await device.terminateApp(process.env.CHROME_BUNDLE_ID!).catch(() => {})
  await device.launchApp(process.env.CHROME_BUNDLE_ID!)
})

test.afterEach(async ({ device }) => {
  await device.terminateApp(process.env.CHROME_BUNDLE_ID!)
})

test('mobilewright docs open in Chrome', async ({ device, screen }) => {
  await device.openUrl(process.env.DOCS_URL!)

  await expect(screen.getByText('Introduction')).toBeVisible({ timeout: 15_000 })
})
