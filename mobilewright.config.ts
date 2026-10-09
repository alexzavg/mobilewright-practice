import { defineConfig } from 'mobilewright'
import { baseConfig, devices } from './base-config'

export default defineConfig({
  ...baseConfig,
  deviceName: new RegExp(`^${devices[0].replaceAll('_', ' ')}$`),
  fullyParallel: false,
  workers: 1,
  globalSetup: './utils/global-setup.ts',
  globalTeardown: './utils/global-teardown.ts',
})
