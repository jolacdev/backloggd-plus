# Toolkittd — Popup (`popup`)

> A WXT popup for game-collection export defaults and HowLongToBeat completion-time preferences.

---

## Business Logic Overview

1. **Feature navigation** — `App.tsx` lists implemented features in `FeatureTabs`; only one panel is visible at a time.
2. **Saved defaults** — `features/game-collection/` loads and updates play-status defaults in `local:statusFilters` storage.
3. **Open export page** — The popup opens `/settings/data/` in a new tab.
4. **HowLongToBeat** — `features/hltb/` enables collection badges, selects the preferred duration category, and asks the background to reset saved estimates. Changes apply to open collections through storage watchers. Save/reset failures are shown in the panel.

5. **General settings** — The header's settings button opens a dedicated view with the persistent console-logging toggle. Back returns to the previously selected feature tab. Logging defaults off and currently controls HLTB errors through the shared logger. Clearing HLTB estimates does not change it.

## Architecture

### Directory Structure

```text
📦 popup/
├── 📜 index.html, index.tsx   WXT popup entry and React mount
├── 📜 App.tsx                 Feature/settings navigation and popup title
├── 📜 style.css               Theme tokens, sizing, and focus styles
├── 📂 components/             FeatureTabs, FeatureSection, Tooltip, GeneralSettings
└── 📂 features/               game-collection/ and hltb/ UI
```

## Popup UI

### Navigation & Lifecycle

`index.tsx` mounts `<App />` with the popup translation namespace. The header button switches between features and general settings, keeping both views mounted and focus on the navigation button. `FeatureTabs` supports arrow keys, Home, and End; inactive panels stay mounted so switching features or visiting settings preserves edits and the selected tab. Add tabs only for implemented features.

### Styling & Help

Use `FeatureSection` for card-style feature section, shared `Button` for primary or secondary actions, shared `Icon` for icons, and `Tooltip` for help text.

Component styles live in Tailwind; `style.css` holds the popup's explicit width, theme tokens, and focus styles.
