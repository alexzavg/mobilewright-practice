import { test } from '../utils/fixtures'

test.use({ bundleId: process.env.CHROME_BUNDLE_ID! })

test.beforeEach(async ({ screenManager }) => {
  await screenManager.chrome.launch()
})

test.afterEach(async ({ screenManager }) => {
  await screenManager.chrome.close()
})

test('deliberate failure: missing element on docs page', async ({ screenManager }) => {
  await screenManager.docs.open()
  await screenManager.docs.expectLoaded()
  await screenManager.docs.expectTextVisible(
    'This text does not exist on the page',
    3_000
  )
})
