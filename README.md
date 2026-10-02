# mobilewright-practice

Android test automation with [Mobilewright](https://mobilewright.dev/docs), running on local emulators.

## Contents

- [Preconditions](#preconditions)
- [Setup](#setup)
- [Running tests](#running-tests)
- [Architecture](#architecture)
  - [Single mode](#single-mode-mobilewrightconfigts)
  - [Parallel mode](#parallel-mode-mobilewrightparallelconfigts)
  - [Emulator lifecycle](#emulator-lifecycle-utilsemulatorts)
- [Writing tests](#writing-tests)
- [Failure artifacts](#failure-artifacts)
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
- **[nvm](https://github.com/nvm-sh/nvm)**, to install the pinned Node.js version.
- **Git.**

Xcode isn't needed: this repo only runs Android tests.

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
4. Copy `.env.example` to `.env` and adjust the values if needed. `.env` is the single source of truth for emulator names, the app bundle ID and URLs:
   ```
   EMULATOR_1=Samsung_S24_API_34
   EMULATOR_2=Samsung_S24_API_34_2
   CHROME_BUNDLE_ID=com.android.chrome
   DOCS_URL=https://mobilewright.dev/docs
   ```
5. Check the environment:
   ```sh
   npx mobilewright doctor
   ```

## Running tests

| Command                        | What it does                                               |
| ------------------------------ | ---------------------------------------------------------- |
| `npm test`                     | Single mode, headless emulator                             |
| `npm run test:headed`          | Single mode, emulator window visible                       |
| `npm run test:parallel`        | Parallel mode, two headless emulators                      |
| `npm run test:parallel:headed` | Parallel mode, emulator windows visible                    |
| `npm run report`               | Open the HTML report (http://localhost:9323)               |
| `npm run inspect`              | Open the Mobilewright Inspector (needs a running emulator) |

Run a single file with `npm test -- tests/chrome-docs.spec.ts`.

You don't need to start emulators yourself: the test commands boot them and shut them down. To manage them by hand:

| Command                         | What it does                    |
| ------------------------------- | ------------------------------- |
| `npm run emulator:start`        | Boot `EMULATOR_1` (headless)    |
| `npm run emulator:start:headed` | Boot `EMULATOR_1` with a window |
| `npm run emulator:kill`         | Shut down `EMULATOR_1`          |
| `npm run emulators:kill:all`    | Kill every running emulator     |

## Architecture

There are two configs. Both share the settings in `base-config.ts`: platform, retries (0 locally, 2 when `CI` is set), and failure artifacts. They differ in how many emulators they use.

### Single mode: `mobilewright.config.ts`

- One emulator (`EMULATOR_1`), one worker, tests run one after another.
- `utils/global-setup.ts` boots the emulator before all tests.
- `utils/global-teardown.ts` shuts it down after all tests.

### Parallel mode: `mobilewright.parallel.config.ts`

- Two emulators (`EMULATOR_1` and `EMULATOR_2`), two workers, `fullyParallel: true`.
- `utils/global-setup-parallel.ts` boots both emulators at the same time.
- `utils/global-teardown.ts` shuts both down. It's the same teardown as single mode: it shuts down whatever setup booted.
- Mobilewright gives each worker its own emulator, so tests never share a device.

Parallel mode needs two separate AVDs. Two copies of the same AVD don't work: mobilecli identifies an emulator by its AVD name, so Mobilewright sees both copies as one device. To add a third emulator, clone another AVD, add `EMULATOR_3` to `.env`, and add it to the parallel setup and config.

### Emulator lifecycle (`utils/emulator.ts`)

Both setups and teardowns use the same helpers:

- **Boot:** headless runs use `mobilecli device boot`. Headed runs (`HEADED=1`) start the emulator directly, because mobilecli always hides the window.
- **Reuse:** if an emulator is already running, setup reuses it instead of booting it again.
- **Clean state:** before shutdown, teardown closes all Chrome tabs on every running emulator, so the next run starts clean.
- **Shutdown:** teardown only shuts down emulators that setup booted. An emulator you started yourself stays running.

#### Why Google APIs

Chrome remembers its open tabs between runs, so without cleanup each run adds more tabs. Teardown deletes Chrome's saved tabs, but Android keeps them in a protected app folder that only the device's admin (root) account can change. Google APIs emulator images allow admin access from `adb`. Google Play images don't, so on those the cleanup can't delete the tabs.

## Writing tests

Tests use the Screen Object Model, the mobile version of the Page Object Model:

```
locators/   selectors, one module per screen (docs.locators.ts, chrome.locators.ts)
screens/    screen objects: actions, waits and assertions (DocsScreen, ChromeScreen)
utils/screenManager.ts   creates screen objects when a test uses them
utils/fixtures.ts        the screenManager fixture
tests/      specs: only call screen objects, no selectors
```

Import `test` from `utils/fixtures` and use the `screenManager` fixture:

```ts
import { test } from '../utils/fixtures'

test('mobilewright docs open in Chrome', async ({ screenManager }) => {
  await screenManager.chrome.launch()
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

## Claude Code

The repo includes the [Mobilewright skill](https://github.com/mobile-next/mobilewright-skill) in `.claude/skills/mobilewright/`, and `.claude/CLAUDE.md` tells Claude Code to use it. When you ask Claude to automate a scenario or change a test, it loads the skill first and follows Mobilewright's API and locator practices.

## Formatting

Prettier rules come from the `martech-playwright-template` repo.

```sh
npm run format        # fix formatting
npm run format:check  # check only
```
