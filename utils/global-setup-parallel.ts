import { devices, platform } from '../base-config'
import { startEmulators } from './emulator'
import { startSimulators } from './simulator'

export default async function globalSetup() {
  const start = platform === 'ios' ? startSimulators : startEmulators
  await start(devices)
}
