import { platform } from '../base-config'
import { stopEmulators } from './emulator'
import { stopSimulators } from './simulator'

export default async function globalTeardown() {
  await (platform === 'ios' ? stopSimulators() : stopEmulators())
}
