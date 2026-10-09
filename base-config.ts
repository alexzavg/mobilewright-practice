import 'dotenv/config'
import type { MobilewrightConfig, MobilewrightUseOptions } from 'mobilewright'
import type { PlaywrightWorkerOptions } from '@playwright/test'

// mobilewright passes `use` through to Playwright, but its type omits video/trace
type UseOptions = MobilewrightUseOptions &
  Partial<Pick<PlaywrightWorkerOptions, 'video' | 'trace'>>

// PLATFORM=ios runs on iOS simulators. Without it, tests run on Android emulators.
const ios = process.env.PLATFORM === 'ios'
export const platform = ios ? 'ios' : 'android'

// The single config uses the first device, the parallel config both
export const devices = ios
  ? [process.env.SIMULATOR_1!, process.env.SIMULATOR_2!]
  : [process.env.EMULATOR_1!, process.env.EMULATOR_2!]

// Shared by mobilewright.config.ts and mobilewright.parallel.config.ts.
// Kept as a plain object: defineConfig() adds mobilewright's own hooks, so it must run once per config.
export const baseConfig = {
  testDir: './tests',
  platform,
  deviceType: ios ? 'simulator' : 'emulator',
  // Xcode can install several iOS versions, each with simulators of the same names
  osVersion: ios ? process.env.IOS_VERSION : undefined,
  // The browser: Chrome can't be installed on iOS simulators, so iOS uses Safari
  bundleId: ios ? process.env.SAFARI_BUNDLE_ID : process.env.CHROME_BUNDLE_ID,
  // BrowserScreen launches the browser. mobilewright's own launch fails on a simulator when Safari isn't running.
  autoAppLaunch: false,
  retries: process.env.CI ? 2 : 0,
  viewTree: 'on-failure',
  use: <UseOptions>{
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  // mobilewright show-report reads mobilewright-report/, but Playwright's html reporter defaults to playwright-report/
  reporter: [['html', { open: 'never', outputFolder: 'mobilewright-report' }]],
} satisfies MobilewrightConfig
