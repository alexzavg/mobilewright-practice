import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

// Comma-separated simulator UDIDs that global setup booted, so teardown only shuts those down
const STARTED_ENV = 'MW_SIMULATORS_STARTED_BY_SETUP'

type Simulator = { udid: string; name: string; state: string }

// Finds each simulator by name among the IOS_VERSION simulators.
// Xcode creates the same simulator names for every iOS version it installs.
async function findSimulators(names: string[]): Promise<Simulator[]> {
  const version = process.env.IOS_VERSION!
  const { stdout } = await run('xcrun', ['simctl', 'list', 'devices', 'available', '-j'])
  const runtimes: Record<string, Simulator[]> = JSON.parse(stdout).devices
  const runtime = `com.apple.CoreSimulator.SimRuntime.iOS-${version.replaceAll('.', '-')}`
  return names.map(name => {
    const simulator = runtimes[runtime]?.find(s => s.name === name)
    if (!simulator) {
      throw new Error(
        `No "${name}" simulator with iOS ${version}. See: xcrun simctl list devices available`
      )
    }
    return simulator
  })
}

// Boots the simulators that aren't running yet and gets them ready for mobilecli
export async function startSimulators(names: string[]) {
  const simulators = await findSimulators(names)
  const toBoot = simulators.filter(s => s.state !== 'Booted')
  for (const s of simulators.filter(s => s.state === 'Booted')) {
    console.log(`${s.name} is already running, reusing it`)
  }
  await Promise.all(
    toBoot.map(async s => {
      console.log(`Booting ${s.name}${process.env.HEADED ? ' (headed)' : ''}`)
      // -b boots the simulator, then the command waits until the boot completes
      await run('xcrun', ['simctl', 'bootstatus', s.udid, '-b'], { timeout: 180_000 })
    })
  )
  // simctl boots without a window. The Simulator app shows a window for each booted simulator.
  if (process.env.HEADED) {
    await run('open', [
      '-a',
      'Simulator',
      '--args',
      '-CurrentDeviceUDID',
      simulators[0].udid,
    ])
  }
  // mobilecli controls iOS through an agent app. Installing it is a no-op when it's already there.
  await Promise.all(
    simulators.map(s => run('npx', ['mobilecli', 'agent', 'install', '--device', s.udid]))
  )
  process.env[STARTED_ENV] = toBoot.map(s => s.udid).join(',')
}

export async function stopSimulators() {
  const started = process.env[STARTED_ENV]?.split(',').filter(Boolean) ?? []
  await Promise.all(started.map(udid => run('xcrun', ['simctl', 'shutdown', udid])))
}
