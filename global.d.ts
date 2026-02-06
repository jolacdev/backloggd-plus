// NOTE: This file contains module declarations for files that lack TypeScript definitions.

declare module '*/.wxt/eslint-auto-imports.mjs' {
  import type { Linter } from 'eslint';

  const autoImports: {
    name: string;
    languageOptions: {
      globals: Record<string, boolean>;
      sourceType: Linter.SourceType;
    };
  };

  export default autoImports;
}
