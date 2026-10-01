import { startEmulators } from './emulator'

export default async function globalSetup() {
  await startEmulators([process.env.EMULATOR_1!])
}
