import type { Device, Screen } from 'mobilewright'
import { expect } from '@mobilewright/test'
import { chromeLocators } from '../locators/chrome.locators'

export class ChromeScreen {
  constructor(
    private readonly device: Device,
    private readonly screen: Screen
  ) {}

  async launch() {
    await this.device.terminateApp(process.env.CHROME_BUNDLE_ID!).catch(() => {})
    await this.device.launchApp(process.env.CHROME_BUNDLE_ID!)
    await expect(chromeLocators.toolbar(this.screen)).toBeVisible({
      timeout: 15_000,
    })
  }

  async close() {
    await this.device.terminateApp(process.env.CHROME_BUNDLE_ID!)
  }
}
