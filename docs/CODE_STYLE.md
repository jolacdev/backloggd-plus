# Code style

- Follow existing TypeScript, React, WXT, and Tailwind patterns. Prefer clear names, short functions, and early returns; extract only for real reuse or clearer responsibility.
- Prefer `const`; use `let` when reassignment is clearer.
- Add a one-line `/** ... */` intent comment to components and named hooks when their purpose is not clear from the name. Avoid speculative abstractions and unnecessary `useCallback`/`useMemo`.
- Use Tailwind for component styling and CSS for framework setup, theme tokens, sizing, and base rules. Keep short class lists inline; split long lists into group-based `cn` strings (layout, appearance, text, interaction, focus).
- Keep tokens few and role-based; derive readable variations with opacity, but retain distinct reused colors. Avoid hardcoded colors in class names and one-off spacing without a design reason.
- Use shared `Typography` for recurring text roles. Keep Backloggd-specific controls in the content entrypoint and feature-specific controls near their feature.
- Use [MDI icons](https://pictogrammers.com/library/mdi/) under their source slugs in the shared `Icon` registry.
- Rely on WXT and React hook auto-imports. Await, return, or handle promises; use `void` only when rejection is handled.
- English is the only supported language. Empty ES files are future-locale templates; missing keys fall back to English. Put accessibility-only translations under an `aria` key.
- Prefer native HTML semantics. Use ARIA and related IDs only when needed for an accessible name, state, or relationship.
