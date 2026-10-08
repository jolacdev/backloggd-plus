# Architecture

## Entrypoints

- `entrypoints/popup/`: standalone UI.
- `entrypoints/backloggd.content/`: Backloggd UI inside a Shadow DOM.
- `entrypoints/background/`: background work (no logic yet).
- Each entrypoint owns its features and support code.
- Keep Backloggd controls in content and feature-specific controls near their feature.

## Shared code and boundaries

- `entrypoints/shared/`: components, i18n, and storage used across entrypoints.
- Use shared storage for persisted state needed by multiple entrypoints.
- Shared code cannot import entrypoints; entrypoints cannot import each other; content features cannot import other features.
- ESLint enforces boundaries in `eslint.constants.ts`.
