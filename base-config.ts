import 'dotenv/config'
import type { MobilewrightConfig, MobilewrightUseOptions } from 'mobilewright'
import type { PlaywrightWorkerOptions } from '@playwright/test'

// mobilewright passes `use` through to Playwright, but its type omits video/trace
type UseOptions = MobilewrightUseOptions &
  Partial<Pick<PlaywrightWorkerOptions, 'video' | 'trace'>>

// Shared by mobilewright.config.ts and mobilewright.parallel.config.ts.
// Kept as a plain object: defineConfig() adds mobilewright's own hooks, so it must run once per config.
export const baseConfig = {
  testDir: './tests',
  platform: 'android',
  deviceType: 'emulator',
  retries: process.env.CI ? 2 : 0,
  viewTree: 'on-failure',
  use: <UseOptions>{
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  // mobilewright show-report reads mobilewright-report/, but Playwright's html reporter defaults to playwright-report/
  reporter: [['html', { open: 'never', outputFolder: 'mobilewright-report' }]],
} satisfies MobilewrightConfig
