import { defineConfig } from 'mobilewright'
import { baseConfig } from './base-config'

export default defineConfig({
  ...baseConfig,
  // mobilecli shows AVD names with spaces instead of underscores
  deviceName: new RegExp(
    `^(${process.env.EMULATOR_1!.replaceAll('_', ' ')}|${process.env.EMULATOR_2!.replaceAll('_', ' ')})$`
  ),
  fullyParallel: true,
  workers: 2,
  globalSetup: './utils/global-setup-parallel.ts',
  globalTeardown: './utils/global-teardown.ts',
})
