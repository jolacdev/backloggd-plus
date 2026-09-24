# Architecture

## Entrypoints

- `entrypoints/popup/` provides the extension's standalone UI.
- `entrypoints/backloggd.content/` adds UI to Backloggd pages inside a Shadow DOM.
- `entrypoints/background/` owns background work; it currently has no feature logic.

Each entrypoint owns its features and entrypoint-specific support code.

## Shared code and boundaries

- `entrypoints/shared/` holds code used across entrypoints, including i18n, storage, and components.
- Shared code cannot import an entrypoint; entrypoints cannot import each other, and content features cannot import other features. ESLint enforces these boundaries in `eslint.constants.ts`.
- Shared storage is the bridge when entrypoints need the same persisted state.
