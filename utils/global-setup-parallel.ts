import { startEmulators } from './emulator'

// One emulator per worker; each needs its own AVD because mobilecli identifies devices by AVD name
export default async function globalSetup() {
  await startEmulators([process.env.EMULATOR_1!, process.env.EMULATOR_2!])
}
