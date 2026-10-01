# AGENTS.md

Use only the documents relevant to the current task.

## Project guidance

- Use `docs/CODE_STYLE.md` for code or UI conventions.
- Use `docs/ARCHITECTURE.md` for feature boundaries, shared code, storage, or integrations.
- Use `entrypoints/popup/README.md` or `entrypoints/backloggd.content/README.md` for entrypoint-specific behavior.

## Validation

- Run relevant checks with `pnpm test`, `pnpm lint:no-fix`, or `pnpm build`.
- `pnpm lint` applies fixes; use `pnpm lint:no-fix` for a read-only check.
