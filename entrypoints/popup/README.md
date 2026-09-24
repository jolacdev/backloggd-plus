# Backloggd Plus — Popup (`popup`)

> A WXT popup for the extension's features and preferences. Its current feature configures game-collection export defaults and opens Backloggd's Data settings page.

---

## Business Logic Overview

1. **Feature navigation** — `App.tsx` lists implemented features in `FeatureTabs`; only one panel is visible at a time.
2. **Saved defaults** — `features/game-collection/` loads and updates play-status defaults in `local:statusFilters` storage.
3. **Open export page** — The popup waits for pending saves before opening `/settings/data/` in a new tab. Failed loads or saves offer Retry; successful saves show brief confirmation.

## Architecture

### Directory Structure

```text
📦 popup/
├── 📜 index.html, index.tsx   WXT popup entry and React mount
├── 📜 App.tsx                 Feature tabs and popup title
├── 📜 style.css               Theme tokens, sizing, and focus styles
├── 📂 components/             FeatureTabs, FeatureSection, Tooltip
└── 📂 features/               Feature UI and state (currently game-collection/)
```

## Popup UI

### Navigation & Lifecycle

`index.tsx` mounts `<App />` with the popup translation namespace. `FeatureTabs` supports arrow keys, Home, and End; inactive panels stay mounted so switching features preserves edits and pending saves. Add tabs only for implemented features.

### Styling & Help

Use `FeatureSection` for card-style feature section, shared `Button` for primary or secondary actions, shared `Icon` for icons, and `Tooltip` for help text.

Component styles live in Tailwind; `style.css` holds the popup's explicit width, theme tokens, and focus styles.
