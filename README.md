<div align="center">

<img src="assets/branding/toolkittd.svg" alt="Toolkittd logo" width="128" height="128" />

# Toolkittd

**Extra tools to enhance your Backloggd experience.**

![Version](https://img.shields.io/github/v/release/jolacdev/backloggd-plus)
![License](https://img.shields.io/badge/License-GPL%20v3-blue)
![Framework WXT](https://img.shields.io/badge/Framework-WXT-67217A)
![React 19](https://img.shields.io/badge/React-19-149ECA)

</div>

---

## Overview

**Toolkittd** is a browser extension that enhances [Backloggd](https://backloggd.com) with features the platform doesn't offer natively.

Its current feature lets authenticated users **export their game collection** (including ratings, play status, playthroughs, etc.) as downloadable **CSV and JSON** files. The JSON contains the full data; the CSV is more limited and contains only the first playthrough of each game.

The export feature pulls your games from your profile, enriches each entry with log data from Backloggd's internal APIs, and hands you files you can use to back up, migrate, or analyze your game collection.

> [!WARNING]
> The export feature relies on **internal, undocumented Backloggd endpoints** that may change without notice. Their behavior is inferred, so issues like rate-limit errors or other unexpected behavior may occur.

## Key Features

- **📤 Game collection export:** Export your game collection from **Settings → Data Management**.
- **🎨 Native look & feel:** Injected via Shadow DOM for full style isolation, matching Backloggd's UI without leaking styles either way.
- **🎯 Status filtering:** Choose which play statuses to include (played, playing, backlog, wishlist). Configure your preferred statuses in the extension popup; your selection is saved and automatically applied to future exports.
- **🗂️ CSV & JSON output:** Every run produces both formats: a concise and more limited CSV and a complete JSON with all data to analyze or manage however you like.

## Tech Stack

| Layer               | Technology                                     |
| ------------------- | ---------------------------------------------- |
| **Framework**       | [WXT](https://wxt.dev) (Web Extension Toolkit) |
| **UI**              | React 19, Tailwind CSS v4, DaisyUI v5          |
| **State / Data**    | TanStack Query, Axios, WXT Storage             |
| **Data Processing** | PapaParse (CSV serialization)                  |
| **i18n**            | i18next + react-i18next                        |
| **Tooling**         | TypeScript, Vite, ESLint, Prettier, Vitest     |

## Getting Started

Use the **Node** version in `.node-version` and the **pnpm** version in `package.json#packageManager`.

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Start the dev server
pnpm dev         # pnpm dev:firefox for Firefox

# Build for production
pnpm build       # pnpm build:firefox for Firefox

# Package as a distributable zip
pnpm zip         # pnpm zip:firefox for Firefox
```

Run `pnpm test` for the test suite and `pnpm lint:no-fix` to type-check and lint without rewriting files (`pnpm lint` applies fixes).

Firefox reviewer build instructions are in [Firefox reviewer instructions](docs/FIREFOX_REVIEWER_INSTRUCTIONS.md).

## Architecture

The **content script** enhances Backloggd pages, while the **popup** provides feature preferences. Their dedicated READMEs cover implementation details:

- 📖 **[Content Script Documentation →](entrypoints/backloggd.content/README.md)** — data flow, WXT specifics, import boundaries, and the API layer.
- 📖 **[Popup Documentation →](entrypoints/popup/README.md)** — feature navigation, saved preferences, and UI behavior.

## Planned improvements

See [ROADMAP.md](ROADMAP.md) for planned features and future automation improvements.

## License

Copyright (c) 2026 jolacdev

This project is licensed under the GNU GPL v3.

## Branding

The project name, logo, and other branding assets are proprietary and are not covered by the GPL. Forks and derivative works must use different branding.
