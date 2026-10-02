import type { Device, Screen } from 'mobilewright'
import { ChromeScreen } from '../screens/ChromeScreen'
import { DocsScreen } from '../screens/DocsScreen'

// Screen objects are created only when a test accesses them
export class ScreenManager {
  constructor(
    private readonly device: Device,
    private readonly screen: Screen
  ) {}

  get chrome(): ChromeScreen {
    return new ChromeScreen(this.device, this.screen)
  }

  get docs(): DocsScreen {
    return new DocsScreen(this.device, this.screen)
  }
}
