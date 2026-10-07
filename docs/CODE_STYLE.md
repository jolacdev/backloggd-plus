# Code style

## TypeScript and React

- Follow existing TypeScript, React, WXT, and Tailwind patterns.
- Prefer clear names, short functions, and early returns.
- Use `type` aliases instead of interfaces.
- Prefer `const`; use `let` when reassignment is clearer.
- Extract only for reuse or clearer responsibility.
- Avoid speculative abstractions unless explicitly requested.
- Add defensive state, retries, or guards only when the probability of failure justifies the complexity.
- Avoid unnecessary `useCallback`/`useMemo`.
- Add one-line `/** ... */` intent comments to components and named hooks with unclear names.
- Use WXT and React hook auto-imports.
- Don't leave promises unhandled (`void` doesn't catch rejections).

## UI and styling

- Use Tailwind for component styles; CSS for framework setup, tokens, sizing, and base rules.
- Keep short class lists inline; split long lists into a few `cn` strings to limit horizontal scrolling (often 2–3 strings).
  - Suggested order following `prettier-plugin-tailwindcss`: unrecognized classes → positioning/margins/display/sizing → transforms/animation/cursor/touch → grid/flex alignment/gaps/overflow (including `truncate`) → borders/backgrounds/padding → typography → effects/transitions → remaining utilities → variants.
  - Combine adjacent groups as needed.
- Keep tokens few and role-based. Use readable opacity variants; retain distinct reused colors.
- Hardcoded color classes and one-off spacing need a design reason.
- Use shared `Typography` for recurring text roles.
- Register [MDI icons](https://pictogrammers.com/library/mdi/) in shared `Icon` under source slugs.

## Language

- English is the only supported language.
- ES config and files are future-locale templates.
- Missing translation keys fall back to English.

## Accessibility

- Prefer native HTML5 semantics.
- Use ARIA only in exceptional cases where it is strongly recommended for a clear, specific reason.
- Add IDs for ARIA relationships only when required.
- Put required ARIA i18n keys in their namespace's `aria` block for traceability.
