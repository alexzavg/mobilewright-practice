import { test as base } from '@mobilewright/test'
import { ScreenManager } from './screenManager'

type TestFixtures = {
  screenManager: ScreenManager
}

export const test = base.extend<TestFixtures>({
  screenManager: async ({ device, screen }, use) => {
    await use(new ScreenManager(device, screen))
  },
})

export { expect } from '@mobilewright/test'
