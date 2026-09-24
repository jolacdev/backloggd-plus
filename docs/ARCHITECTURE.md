# Architecture

## Entrypoints

- `entrypoints/popup/` provides the extension's standalone UI.
- `entrypoints/backloggd.content/` adds UI to Backloggd pages inside a Shadow DOM.
- `entrypoints/background/` owns background work; it currently has no feature logic.

Each entrypoint owns its features and entrypoint-specific support code

- `entrypoints/shared/` is the place for cross-entrypoint common files: i18n, storage, components.

Shared code cannot import an entrypoint; entrypoints cannot import each other, and content features cannot import other features. ESLint enforces these boundaries in `eslint.constants.ts`.

Shared storage is the bridge when entrypoints need the same persisted state.

## i18n

- English is the only supported language. The ES files are templates for future translations; missing keys fall back to English.
