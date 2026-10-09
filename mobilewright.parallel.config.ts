import { defineConfig } from 'mobilewright'
import { baseConfig, devices } from './base-config'

export default defineConfig({
  ...baseConfig,
  deviceName: new RegExp(
    `^(${devices[0].replaceAll('_', ' ')}|${devices[1].replaceAll('_', ' ')})$`
  ),
  fullyParallel: true,
  workers: 2,
  globalSetup: './utils/global-setup-parallel.ts',
  globalTeardown: './utils/global-teardown.ts',
})
