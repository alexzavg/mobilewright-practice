# mobilewright-practice

Android and iOS test automation with [Mobilewright](https://mobilewright.dev/docs), running on local Android emulators and iOS simulators. The same tests run on both platforms: in Chrome on Android, in Safari on iOS.

## Contents

- [Preconditions](#preconditions)
- [Setup](#setup)
- [Running tests](#running-tests)
- [Architecture](#architecture)
  - [Single mode](#single-mode-mobilewrightconfigts)
  - [Parallel mode](#parallel-mode-mobilewrightparallelconfigts)
  - [Emulator lifecycle](#emulator-lifecycle-utilsemulatorts)
  - [Simulator lifecycle](#simulator-lifecycle-utilssimulatorts)
- [Writing tests](#writing-tests)
- [Failure artifacts](#failure-artifacts)
- [CI](#ci)
- [Claude Code](#claude-code)
- [Formatting](#formatting)

## Preconditions

Install these before the setup:

- **macOS.** The scripts use a macOS shell and the default Android SDK path.
- **[Android Studio](https://developer.android.com/studio).** It installs the Android SDK, the emulator and `adb`. In the SDK Manager, install an Android 14 (API 34) system image of the **Google APIs** type, not **Google Play** (see [Why Google APIs](#why-google-apis)).
- **Java JDK 17 or newer**, with `JAVA_HOME` set.
- **`ANDROID_HOME`** set to the SDK path, with `platform-tools` on your `PATH` so `adb` works:
  ```sh
  export ANDROID_HOME="$HOME/Library/Android/sdk"
  export PATH="$PATH:$ANDROID_HOME/platform-tools"
  ```
- **[Xcode](https://developer.apple.com/xcode/)**, for iOS tests only. It installs the iOS simulators and `xcrun simctl`. Open Xcode once to finish the install, and add an iOS runtime in **Settings > Components** if there's none.
- **[nvm](https://github.com/nvm-sh/nvm)**, to install the pinned Node.js version.
- **Git.**

## Setup

1. Use Node.js 24. The version is pinned in `.nvmrc`:
   ```sh
   nvm install && nvm use
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create the emulators in Android Studio's Device Manager. The tests use two identical AVDs: `Samsung_S24_API_34` and a copy of it named `Samsung_S24_API_34_2`. Pick the Google APIs system image for both.
4. For iOS, nothing to create: the tests use simulators that Xcode includes, `iPhone 16` and `iPhone 16 Pro`. List yours with `xcrun simctl list devices available`.
5. Copy `.env.example` to `.env` and adjust the values if needed. `.env` is the single source of truth for device names, app bundle IDs and URLs:
   ```
   EMULATOR_1=Samsung_S24_API_34
   EMULATOR_2=Samsung_S24_API_34_2
   SIMULATOR_1="iPhone 16"
   SIMULATOR_2="iPhone 16 Pro"
   IOS_VERSION=18.5
   CHROME_BUNDLE_ID=com.android.chrome
   SAFARI_BUNDLE_ID=com.apple.mobilesafari
   DOCS_URL=https://mobilewright.dev/docs
   ```
   Keep the quotes around simulator names: the npm scripts read `.env` with the shell, and the names have spaces. `IOS_VERSION` picks the simulators when Xcode has several iOS versions, because each version has simulators with the same names.
6. Check the environment:
   ```sh
   npx mobilewright doctor
   ```

## Running tests

| Command                            | What it does                                                         |
| ---------------------------------- | -------------------------------------------------------------------- |
| `npm test`                         | Android, single mode, headless emulator                              |
| `npm run test:headed`              | Android, single mode, emulator window visible                        |
| `npm run test:parallel`            | Android, parallel mode, two headless emulators                       |
| `npm run test:parallel:headed`     | Android, parallel mode, emulator windows visible                     |
| `npm run test:ios`                 | iOS, single mode, headless simulator                                 |
| `npm run test:ios:headed`          | iOS, single mode, simulator window visible                           |
| `npm run test:ios:parallel`        | iOS, parallel mode, two headless simulators                          |
| `npm run test:ios:parallel:headed` | iOS, parallel mode, simulator windows visible                        |
| `npm run report`                   | Open the HTML report of the last run (http://localhost:9323)         |
| `npm run inspect`                  | Open the Mobilewright Inspector (needs a running emulator/simulator) |

Run a single file with `npm test -- tests/browser-docs.spec.ts` or `npm run test:ios -- tests/browser-docs.spec.ts`.

You don't need to start emulators or simulators yourself: the test commands boot them and shut them down. To manage them by hand:

| Command                         | What it does                      |
| ------------------------------- | --------------------------------- |
| `npm run emulator:start`        | Boot `EMULATOR_1` (headless)      |
| `npm run emulator:start:headed` | Boot `EMULATOR_1` with a window   |
| `npm run emulator:kill`         | Shut down `EMULATOR_1`            |
| `npm run emulators:kill:all`    | Kill every running emulator       |
| `npm run simulators:kill:all`   | Shut down every running simulator |

To boot a simulator by hand, open it from Xcode (**Open Developer Tool > Simulator**).

## Architecture

There are two configs. Both share the settings in `base-config.ts`: platform, retries (0 locally, 2 when `CI` is set), and failure artifacts. They differ in how many devices they use.

The `PLATFORM` environment variable picks the platform. The `test:ios*` scripts set `PLATFORM=ios`; without it, tests run on Android. `base-config.ts` then picks the devices from `.env` (`EMULATOR_*` or `SIMULATOR_*`) and the browser (Chrome or Safari), and global setup boots emulators or simulators.

### Single mode: `mobilewright.config.ts`

- One emulator (`EMULATOR_1`), one worker, tests run one after another.
- `utils/global-setup.ts` boots the emulator before all tests.
- `utils/global-teardown.ts` shuts it down after all tests.

### Parallel mode: `mobilewright.parallel.config.ts`

- Two devices (`EMULATOR_1` and `EMULATOR_2`, or `SIMULATOR_1` and `SIMULATOR_2`), two workers, `fullyParallel: true`.
- `utils/global-setup-parallel.ts` boots both devices at the same time.
- `utils/global-teardown.ts` shuts both down. It's the same teardown as single mode: it shuts down whatever setup booted.
- Mobilewright gives each worker its own device, so tests never share a device.

On Android, parallel mode needs two separate AVDs. Two copies of the same AVD don't work: mobilecli identifies an emulator by its AVD name, so Mobilewright sees both copies as one device. To add a third emulator, clone another AVD, add `EMULATOR_3` to `.env`, and add it to the parallel setup and config.

### Emulator lifecycle (`utils/emulator.ts`)

On Android, both setups and teardowns use the same helpers:

- **Boot:** headless runs use `mobilecli device boot`. Headed runs (`HEADED=1`) start the emulator directly, because mobilecli always hides the window.
- **Reuse:** if an emulator is already running, setup reuses it instead of booting it again.
- **Clean state:** before shutdown, teardown closes all Chrome tabs on every running emulator, so the next run starts clean.
- **Shutdown:** teardown only shuts down emulators that setup booted. An emulator you started yourself stays running.

#### Why Google APIs

Chrome remembers its open tabs between runs, so without cleanup each run adds more tabs. Teardown deletes Chrome's saved tabs, but Android keeps them in a protected app folder that only the device's admin (root) account can change. Google APIs emulator images allow admin access from `adb`. Google Play images don't, so on those the cleanup can't delete the tabs.

### Simulator lifecycle (`utils/simulator.ts`)

On iOS, both setups and teardowns use these helpers:

- **Find:** setup looks up each simulator by its name and `IOS_VERSION`.
- **Boot:** setup boots with `xcrun simctl`, which has no window. Headed runs (`HEADED=1`) also open the Simulator app, which shows a window for each booted simulator.
- **Agent:** mobilecli controls iOS through an agent app on the simulator. Setup installs it if it's missing (about 15 seconds, once per simulator).
- **Reuse:** if a simulator is already running, setup reuses it instead of booting it again.
- **Shutdown:** teardown only shuts down simulators that setup booted.

Tests use Safari, because simulators have no App Store to install Chrome. There's no tab cleanup: Safari reuses the open tab when it opens a URL that's already open, so tabs don't pile up.

## Writing tests

Tests use the Screen Object Model, the mobile version of the Page Object Model:

```
locators/   selectors, one module per screen (docs.locators.ts)
screens/    screen objects: actions, waits and assertions (DocsScreen, BrowserScreen)
utils/screenManager.ts   creates screen objects when a test uses them
utils/fixtures.ts        the screenManager fixture
tests/      specs: only call screen objects, no selectors
```

The same specs run on both platforms. `BrowserScreen` launches the app from the config's `bundleId`: Chrome on Android, Safari on iOS.

Import `test` from `utils/fixtures` and use the `screenManager` fixture:

```ts
import { test } from '../utils/fixtures'

test('mobilewright docs open in the browser', async ({ screenManager }) => {
  await screenManager.browser.launch()
  await screenManager.docs.open()
  await screenManager.docs.expectLoaded()
})
```

To add a screen:

1. Add its selectors to a new module in `locators/`.
2. Add a screen object in `screens/` that uses them.
3. Add a getter for it in `utils/screenManager.ts`.

Each getter creates its screen object only when a test accesses it, as `pageManager` does in the `martech-playwright-template` repo.

## Failure artifacts

When a test fails, the report includes a screenshot, a video, the view tree (the screen's elements as JSON) and a trace. Open them with `npm run report`.

The trace shows the test steps but not the rendered screen. Playwright's trace viewer draws the screen from a browser page, and there isn't one on a device. Use the screenshot and video instead.

## CI

`.github/workflows/tests.yml` runs the tests on GitHub Actions on demand: **Actions > Mobile tests > Run workflow**, then pick `android` or `ios`. From the terminal: `gh workflow run tests.yml -f platform=ios`. The HTML report is attached to the run as the `mobilewright-report` artifact.

- **Android** runs on `ubuntu-latest` with an Android 14 Google APIs emulator. The emulator and a snapshot of its first boot are cached, so a run takes about 2.5 minutes. The first run after a change to the workflow takes about 4 minutes, because it rebuilds the cache.
- **iOS** runs on `macos-15`, whose Xcode 16.4 has the `iPhone 16` with iOS 18.5 from `.env.example`. A fresh simulator is slow: Safari's first launch takes about 3 minutes, so the workflow opens Safari once before the tests. A run takes about 9 minutes.

The run always fails, because `deliberate-failure.spec.ts` fails on purpose.

## Claude Code

The repo includes the [Mobilewright skill](https://github.com/mobile-next/mobilewright-skill) in `.claude/skills/mobilewright/`, and `.claude/CLAUDE.md` tells Claude Code to use it. When you ask Claude to automate a scenario or change a test, it loads the skill first and follows Mobilewright's API and locator practices.

## Formatting

Prettier rules come from the `martech-playwright-template` repo.

```sh
npm run format        # fix formatting
npm run format:check  # check only
```
