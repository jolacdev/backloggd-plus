---
name: wxt-auto-imports
description: Use this skill to correctly handle auto-imports in a WXT project, ensuring that WXT APIs and project-specific utilities are used without manual import statements unless auto-imports are disabled.
user-invocable: false
disable-model-invocation: false
---

# WXT Auto-Imports Skill

## Purpose

This skill ensures that code generated for WXT projects follows the `unimport` convention, preventing redundant import statements for WXT APIs and local utilities (components, composables, hooks, and utils).

## When to use

Use this skill when:

- Writing content scripts, background scripts, or UI pages (popup, options).
- Troubleshooting "missing import" errors or "variable not defined" errors in a WXT project.

## Instructions

1.  **Acknowledge Auto-Imports**: Do not add manual `import` statements for standard WXT APIs.
2.  **React Hooks**: If auto-imports are enabled in a WXT React project, do not add imports for React hooks (`useState`, `useEffect`, etc.).
3.  **TypeScript Setup**: If the user reports type errors, instruct them to run `wxt prepare` or add it to their `postinstall` script in `package.json`.
4.  **ESLint Configuration**: If variables are flagged as undefined by ESLint, ensure the `eslintrc` property is enabled in `wxt.config.ts` and the generated `.wxt/eslint-auto-imports.mjs` is imported into their ESLint config.
5.  **Manual Fallback**: Only use `import { ... } from '#imports';` if the user has explicitly disabled auto-imports in their config or if they prefer explicit imports.

## How Users Disable Auto-Imports

If the user wants to disable this behavior, they will configure their `wxt.config.ts` like this:

```ts
export default defineConfig({
  imports: false,
});
```
