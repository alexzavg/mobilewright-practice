# CLAUDE.md

Android test automation with Mobilewright on local emulators. See README.md for setup and architecture.

- Load the `mobilewright` skill before writing or changing tests, locators or Mobilewright config.
- Run `nvm use` first: Mobilewright needs Node.js 24 (pinned in `.nvmrc`).
- `.env` is the source of truth for emulator names, bundle IDs and URLs. Read them with `process.env` (loaded by `dotenv` in `base-config.ts`); don't hardcode them.
- Single mode: `npm test`. Parallel mode: `npm run test:parallel`. Both boot and shut down emulators themselves.
- Run `npm run format` after editing.
