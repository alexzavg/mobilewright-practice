import { stopEmulators } from './emulator'

export default async function globalTeardown() {
  await stopEmulators()
}
