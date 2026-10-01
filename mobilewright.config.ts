import { defineConfig } from 'mobilewright'
import { baseConfig } from './base-config'

export default defineConfig({
  ...baseConfig,
  // mobilecli shows AVD names with spaces instead of underscores
  deviceName: new RegExp(`^${process.env.EMULATOR_1!.replaceAll('_', ' ')}$`),
  fullyParallel: false,
  workers: 1,
  globalSetup: './utils/global-setup.ts',
  globalTeardown: './utils/global-teardown.ts',
})
