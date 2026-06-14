<div align="center">

<img src="public/icon/128.png" alt="Backloggd Plus logo" width="128" height="128" />

# Backloggd Plus

**Own your game library: export your Backloggd logs as CSV & JSON.**

<!-- Badges placeholder. Add CI, version, store listing, and license badges here -->

![Framework WXT](https://img.shields.io/badge/Framework-WXT-67217A)
![React 19](https://img.shields.io/badge/React-19-149ECA)
![License](https://img.shields.io/badge/license-GPL%20v3-blue)

</div>

---

## Overview

**Backloggd Plus** is a browser extension that enhances [Backloggd](https://backloggd.com) with features the platform doesn't offer natively.

It injects a React-powered UI directly into the Backloggd website, visually matching the site's own styling, so authenticated users can **export their entire game library** (including ratings, play status, playthroughs, etc.) as downloadable **CSV and JSON** files. The JSON contains the full data; the CSV is more limited and contains only the first playthrough of each game.

The extension pulls your games from your profile, enriches each entry with log data from Backloggd's internal APIs, and hands you files you can use to back up, migrate, or analyze your library.

> [!WARNING]
> The export feature relies on **internal, undocumented Backloggd endpoints** that may change without notice. Their behavior is inferred, so issues like rate-limit errors or other unexpected behavior may occur.

## Key Features

- **📤 Library export:** Export your full game log from **Settings → Data Management**.
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

This project uses **pnpm** as its package manager.

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev         # pnpm dev:firefox for Firefox

# Build for production
pnpm build       # pnpm build:firefox for Firefox

# Package as a distributable zip
pnpm zip         # pnpm zip:firefox for Firefox
```

Run `pnpm test` for the test suite and `pnpm lint` to type-check and lint.

## Architecture

The core feature lives in the **content script**, which is documented in depth (data flow, WXT specifics, import boundaries, and the API layer) in its dedicated README:

📖 **[Content Script Documentation →](entrypoints/backloggd.content/README.md)**

## License

Copyright (c) 2026 jolacdev

This project is licensed under the GNU GPL v3.

## Branding

The project name, logo, and other branding assets are proprietary and are not covered by the GPL. Forks and derivative works must use different branding.
