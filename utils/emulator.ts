import { execFile, spawn } from 'node:child_process'
import { join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

// Comma-separated AVDs that global setup booted, so teardown only shuts those down
const STARTED_ENV = 'MW_EMULATORS_STARTED_BY_SETUP'

async function onlineAvds(): Promise<Set<string>> {
  const { stdout } = await run('npx', ['mobilecli', 'devices'])
  const devices: { id: string; state: string }[] = JSON.parse(stdout).data.devices
  return new Set(devices.filter(d => d.state === 'online').map(d => d.id))
}

// mobilecli always boots with a hidden window, so headed mode calls the emulator directly.
// An explicit port gives a known adb serial to wait on when several emulators boot at once.
async function bootHeaded(avd: string, port: number) {
  const sdk = process.env.ANDROID_HOME ?? join(process.env.HOME!, 'Library/Android/sdk')
  spawn(join(sdk, 'emulator', 'emulator'), ['-avd', avd, '-port', String(port)], {
    detached: true,
    stdio: 'ignore',
  }).unref()
  await run(
    'adb',
    [
      '-s',
      `emulator-${port}`,
      'wait-for-device',
      'shell',
      'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 1; done',
    ],
    { timeout: 180_000 }
  )
}

export async function startEmulators(avds: string[]) {
  const online = await onlineAvds()
  const toBoot = avds.filter(avd => !online.has(avd))
  for (const avd of avds.filter(avd => online.has(avd))) {
    console.log(`${avd} is already running, reusing it`)
  }
  await Promise.all(
    toBoot.map(async (avd, i) => {
      console.log(`Booting ${avd}${process.env.HEADED ? ' (headed)' : ''}`)
      if (process.env.HEADED) {
        await bootHeaded(avd, 5554 + i * 2)
      } else {
        await run('npx', ['mobilecli', 'device', 'boot', '--device', avd])
      }
    })
  )
  process.env[STARTED_ENV] = toBoot.join(',')
}

// Closes Chrome's open tabs on every running emulator so the next boot starts clean.
// Chrome keeps tabs in a protected folder, so this needs admin (su) access: Google APIs images allow it, Google Play images don't.
async function clearChromeTabs() {
  const { stdout } = await run('adb', ['devices'])
  const serials = stdout
    .split('\n')
    .filter(l => l.startsWith('emulator-'))
    .map(l => l.split('\t')[0])
  await Promise.all(
    serials.map(serial =>
      run('adb', [
        '-s',
        serial,
        'shell',
        `am force-stop ${process.env.CHROME_BUNDLE_ID}; su 0 rm -rf /data/data/${process.env.CHROME_BUNDLE_ID}/app_tabs`,
      ])
    )
  )
}

export async function stopEmulators() {
  await clearChromeTabs()
  const started = process.env[STARTED_ENV]?.split(',').filter(Boolean) ?? []
  await Promise.all(
    started.map(avd => run('npx', ['mobilecli', 'device', 'shutdown', '--device', avd]))
  )
}
