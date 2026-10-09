import type { Device } from 'mobilewright'

export class BrowserScreen {
  constructor(
    private readonly device: Device,
    private readonly bundleId: string
  ) {}

  async launch() {
    await this.device.terminateApp(this.bundleId).catch(() => {})
    await this.device.launchApp(this.bundleId)
  }

  async close() {
    await this.device.terminateApp(this.bundleId)
  }
}
