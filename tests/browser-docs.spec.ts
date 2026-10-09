import { test } from '../utils/fixtures'

test.use({ bundleId: process.env.CHROME_BUNDLE_ID! })

test.beforeEach(async ({ screenManager }) => {
  await screenManager.chrome.launch()
})

test.afterEach(async ({ screenManager }) => {
  await screenManager.chrome.close()
})

test('mobilewright docs open in Chrome', async ({ screenManager }) => {
  await screenManager.docs.open()
  await screenManager.docs.expectLoaded()
})
