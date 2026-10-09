# CLAUDE.md

Android and iOS test automation with Mobilewright on local emulators and simulators. See README.md for setup and architecture.

- Load the `mobilewright` skill before writing or changing tests, locators or Mobilewright config.
- Run `nvm use` first: Mobilewright needs Node.js 24 (pinned in `.nvmrc`).
- `.env` is the source of truth for emulator and simulator names, bundle IDs and URLs. Read them with `process.env` (loaded by `dotenv` in `base-config.ts`); don't hardcode them.
- Android: `npm test` (single mode), `npm run test:parallel`. iOS: `npm run test:ios`, `npm run test:ios:parallel`. All boot and shut down devices themselves.
- Run `npm run format` after editing.
