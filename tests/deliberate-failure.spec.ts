import { test } from '../utils/fixtures'

test.beforeEach(async ({ screenManager }) => {
  await screenManager.browser.launch()
})

test.afterEach(async ({ screenManager }) => {
  await screenManager.browser.close()
})

test('deliberate failure: missing element on docs page', async ({ screenManager }) => {
  await screenManager.docs.open()
  await screenManager.docs.expectLoaded()
  await screenManager.docs.expectTextVisible(
    'This text does not exist on the page',
    3_000
  )
})
