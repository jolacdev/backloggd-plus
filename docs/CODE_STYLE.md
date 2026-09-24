# Code style

- Follow existing TypeScript, React, WXT, and Tailwind patterns. Prefer clear names, short functions, and early returns; extract only for real reuse or clearer responsibility.
- Prefer `const`; use `let` when reassignment is clearer.
- Add a one-line `/** ... */` intent comment above components and named hooks. Avoid speculative abstractions and unnecessary `useCallback`/`useMemo`.
- Use Tailwind for component styling; reserve CSS for framework setup, theme, sizing, and base styles. Keep short class lists inline; split long lists into group-based `cn` strings (layout, appearance, text, interaction, focus).
- Use Tailwind for UI and CSS for theme tokens, base rules, and sizing. Keep tokens few and role-based; derive readable variations with opacity, but retain distinct reused colors. Avoid hardcoded colors in class names and one-off spacing without a design reason.
- Use shared `Typography` for recurring text roles. Keep Backloggd-specific controls in the content entrypoint and feature-specific controls near their feature.
- Use [MDI icons](https://pictogrammers.com/library/mdi/) under their source slugs in the shared `Icon` registry.
- Rely on WXT and React hook auto-imports. Await, return, or handle promises; use `void` only when rejection is handled.
- Prefer semantic HTML. Only use ARIA and related IDs when strictly necessary. If a i18n aria label needs to be created, add it under `aria` parent key.
