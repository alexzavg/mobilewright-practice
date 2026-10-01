import { test, expect } from '@mobilewright/test'

test.use({ bundleId: process.env.CHROME_BUNDLE_ID! })

test.beforeEach(async ({ device }) => {
  await device.terminateApp(process.env.CHROME_BUNDLE_ID!).catch(() => {})
  await device.launchApp(process.env.CHROME_BUNDLE_ID!)
})

test.afterEach(async ({ device }) => {
  await device.terminateApp(process.env.CHROME_BUNDLE_ID!)
})

// Fails on purpose to produce failure artifacts (screenshot, view tree, video, trace) in the report
test('deliberate failure: missing element on docs page', async ({ device, screen }) => {
  await device.openUrl(process.env.DOCS_URL!)
  await expect(screen.getByText('Introduction')).toBeVisible({ timeout: 15_000 })

  await expect(screen.getByText('This text does not exist on the page')).toBeVisible({
    timeout: 3_000,
  })
})
