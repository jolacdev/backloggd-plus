# Architecture

## Entrypoints

- `entrypoints/popup/`: standalone UI.
- `entrypoints/backloggd.content/`: Backloggd UI inside a Shadow DOM.
- `entrypoints/background/`: HLTB transport, request queue, and serialized persistent cache.
- Each entrypoint owns its features and support code.
- Keep Backloggd controls in content and feature-specific controls near their feature.

## Shared code and boundaries

- `entrypoints/shared/`: components, i18n, and storage used across entrypoints.
- Use shared storage for persisted state needed by multiple entrypoints.
- General preferences live in `local:preferences`; console logging defaults off and never expires. `entrypoints/shared/logger.ts` is available to all entrypoints and checks the latest saved flag on each call. Currently, only HLTB errors use it.
- Shared code cannot import entrypoints; entrypoints cannot import each other; content features cannot import other features.
- HLTB messages and settings/cache contracts live in shared code. The background owns cache writes; content owns matching, Backloggd DOM parsing, and injected UI. See the [HLTB feature](../entrypoints/backloggd.content/features/hltb/README.md).
- ESLint enforces boundaries in `eslint.constants.ts`.
