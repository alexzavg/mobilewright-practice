import type { Device, Screen } from 'mobilewright'
import { BrowserScreen } from '../screens/BrowserScreen'
import { DocsScreen } from '../screens/DocsScreen'

// Screen objects are created only when a test accesses them
export class ScreenManager {
  constructor(
    private readonly device: Device,
    private readonly screen: Screen,
    private readonly bundleId: string
  ) {}

  get browser(): BrowserScreen {
    return new BrowserScreen(this.device, this.bundleId)
  }

  get docs(): DocsScreen {
    return new DocsScreen(this.device, this.screen)
  }
}
