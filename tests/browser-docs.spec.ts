import { test } from '../utils/fixtures'

test.beforeEach(async ({ screenManager }) => {
  await screenManager.browser.launch()
})

test.afterEach(async ({ screenManager }) => {
  await screenManager.browser.close()
})

test('mobilewright docs open in the browser', async ({ screenManager }) => {
  await screenManager.docs.open()
  await screenManager.docs.expectLoaded()
})
