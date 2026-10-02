import type { Device, Screen } from 'mobilewright'
import { expect } from '@mobilewright/test'
import { docsLocators } from '../locators/docs.locators'

export class DocsScreen {
  constructor(
    private readonly device: Device,
    private readonly screen: Screen
  ) {}

  async open() {
    await this.device.openUrl(process.env.DOCS_URL!)
  }

  async expectLoaded() {
    await expect(docsLocators.introductionHeading(this.screen)).toBeVisible({
      timeout: 15_000,
    })
  }

  async expectTextVisible(text: string, timeout?: number) {
    await expect(docsLocators.text(this.screen, text)).toBeVisible({ timeout })
  }
}
