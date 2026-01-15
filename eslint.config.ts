/* eslint-disable perfectionist/sort-objects */
import eslint from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import perfectionist from 'eslint-plugin-perfectionist';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import autoImports from './.wxt/eslint-auto-imports.mjs';
import {
  booleanPrefixes,
  importRulesOff,
  perfectionistSortObjects,
  perfectionistSortTypes,
} from './eslint.constants.ts';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  // FILES: A config object only applies to a file if the filename matches a pattern in files (or if there is no files key, in which case it will match all files).
  // RULES: The severity levels are off (0), warning (1), and error (2).

  // GLOBAL IGNORES: Added in a separate object to apply globally and be able to match directories. Only global `ignores` can match directories.
  {
    ignores: ['dist', 'build', 'storybook-static', '.output', '.wxt'], // Ignore build and output directories.
  },

  // SETTINGS: Detect React version automatically for `eslint-plugin-react` rules.
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // EXTENDS: Extends specific set of rules (like recommended) from the different plugins.
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'], // Disables some React recommended rules like `react-in-jsx-scope` not needed in React 17+.
  reactHooks.configs['recommended-latest'], // TODO: Update to v7+ and change 'recommended-latest' to 'recommended'.
  jsxA11y.flatConfigs.recommended,
  prettierRecommended,
  importPlugin.flatConfigs.recommended,

  // TYPESCRIPT: Specific rules for TypeScript files in separate object to prevent parser conflicts with JS files.
  {
    ignores: ['*.{js,mjs,jsx}'], // Ignore JavaScript files.
    // PARSER: TypeScript & JSX support using the nearest tsconfig.json.
    // More details: https://eslint.org/docs/latest/use/configure/parser
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true, // Linted files will use the type information of the nearest `tsconfig.json`.
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },

      // GLOBAL VARIABLES: Groups of variables globally available during runtime, like `console` in the browser.
      // More details: https://eslint.org/docs/latest/use/configure/migration-guide#configuring-language-options
      globals: {
        ...autoImports.languageOptions.globals,
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
    },

    rules: {
      // [TYPESCRIPT RULES]
      // Uses the TypeScript no-unused-vars rule instead of the base one.
      'no-unused-vars': 0,
      '@typescript-eslint/no-unused-vars': [
        1,
        {
          // Allow function arguments that start with _
          argsIgnorePattern: '^_',
          // Allow catch arguments that start with _
          caughtErrorsIgnorePattern: '^_',
          // Allow sibling variables of ...rest in destructure objects.
          ignoreRestSiblings: true,
          // Allow variables that start with _
          varsIgnorePattern: '^_',
        },
      ],

      // Uses the TypeScript no-shadow rule instead of the base one.
      // Disallows a local variable to have the same name as a variable in its containing scope.
      'no-shadow': 0,
      '@typescript-eslint/no-shadow': 2,

      // Uses the TypeScript no-use-before-define rule instead of the base one.
      // Disallows the use of variables before they are defined.
      '@typescript-eslint/no-use-before-define': 2,
      'no-use-before-define': 0,

      // Enforces the naming conventions for some cases across the code.
      // Variables must be in camelCase or UPPER_CASE. Boolean variables must have a verb prefixed. (Normal variables).
      // Function variables must be in camelCase or PascalCase (used for creating Functions and Components).
      // Types like (class, enum, interface, typeAlias, typeParameter) must be in PascalCase. Interfaces must be prefixed with 'I'.
      // Functions declared using the 'function' keyword must be in camelCase.
      '@typescript-eslint/naming-convention': [
        2,
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: booleanPrefixes,
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'function',
          format: ['camelCase'],
        },
      ],
    },
  },

  {
    // PLUGINS: Declare plugins here to make their rules available in the `rules` object.
    // More details: https://eslint.org/docs/latest/use/configure/plugins
    plugins: {
      perfectionist,
      react,
    },

    // RULES: Defines specific linting rules, their severity, and other customizations.
    // NOTE: These rules should come from the installed plugins defined in the `plugins` object.
    // More details: https://eslint.org/docs/latest/use/core-concepts/#rules
    rules: {
      // [ESLINT RULES]
      // Enforces the use of `===` and `!==`.
      eqeqeq: 2,
      // Enforces the use of curly {} in block statements (if, else, for, while...).
      curly: [2, 'all'],
      // Disallows the use of undeclared variables.
      'no-undef': 2,
      // Enforces no braces when they can be omitted. Incorrect: const foo = (x) => { return x; } Correct: const foo = (x) => x;
      'arrow-body-style': [2, 'as-needed'],
      // Warns when using console statements (console.log, console.debug...).
      'no-console': 1,

      // [IMPORT RULES]
      ...importRulesOff,
      'import/newline-after-import': 2,

      // [REACT RULES]
      // Enforces arrow functions for Components.
      'react/function-component-definition': [
        2,
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],

      // Enforces using JSX only in *.tsx files.
      'react/jsx-filename-extension': [2, { extensions: ['.tsx'] }],

      // Enforces non-required props to define their default values in the function arguments/parameters.
      // Example: const Component = ({ optionalProp = 'default' }: ComponentProps) => {}
      'react/require-default-props': [
        2,
        {
          functions: 'defaultArguments',
        },
      ],

      // Only allows spreading in JSX components (<MyCustomComponent {...props} />) and in allowed exceptions (SVGs, etc.)
      'react/jsx-props-no-spreading': [
        2,
        {
          custom: 'ignore',
          exceptions: ['button', 'svg'],
        },
      ],

      // Enforces the way of sorting the component props.
      // Alphabetical case insensitive order, React reserved props before, callbacks after.
      // Example: <Component dangerouslySetInnerHTML={...} firstName="John" lastName="Doe" onClick={...} />
      'react/jsx-sort-props': [
        2,
        {
          callbacksLast: true,
          ignoreCase: true,
          reservedFirst: true,
        },
      ],

      // [PERFECTIONIST RULES]
      // IMPORTS ORDER: Enforces a strict and consistent order for import statements.
      // NOTE: Disable `source.organizeImports` on `codeActionsOnSave` in VSCode Settings to avoid conflicts.
      'sort/imports': 0, // Note: Disable ESLint's rule to avoid conflicts.
      'perfectionist/sort-imports': [
        2,
        {
          // Natural order. Example: 'item2' < 'item10'.
          type: 'natural',

          // NOTE: Custom internal path patterns to match aliased imports.
          internalPattern: [
            '@components/.+',
            '@constants$',
            '@features/.+',
            '@hooks/.+',
            '@icons/.+',
            '@screens/.+',
            '@store/.+',
            '@utils/.+',
            'types/.+',
          ],

          // NOTE: Default values explicitly set for clarity.
          newlinesBetween: 'always',
          order: 'asc',
          ignoreCase: true,
          groups: [
            // Built-in or external installed modules and types.
            // Example: import path from 'path' || import axios from 'axios'
            // Example: import type { TFunction } from 'i18next';
            ['builtin', 'external'],
            { newlinesBetween: 0 }, // NOTE: No newlines are allowed.
            ['builtin-type', 'external-type'],
            { newlinesBetween: 1 },

            // Internal modules and types that are not in the same or parent directory.
            // Example: import Button from '~/components/Button' || import type { ButtonProps } from '~/components/Button'
            'internal',
            { newlinesBetween: 0 },
            'internal-type',
            { newlinesBetween: 1 },

            // Parent or current directory modules and types.
            // Example: import foo from '../utils/foo' || './foo' || '.'
            // Example: import type { FooProps } from '../utils/foo' || './foo' || '.'
            ['parent', 'sibling', 'index'],
            { newlinesBetween: 0 },
            ['parent-type', 'sibling-type', 'index-type'],
            { newlinesBetween: 1 },

            // Side effect script files. Example: import './set-production-env.js'
            'side-effect',

            // Style files. Example: import './styles.scss' || import styles from './index.module.css'
            'side-effect-style',
            { newlinesBetween: 0 }, // NOTE: No newlines are allowed.
            'style',
          ],
        },
      ],
      'perfectionist/sort-named-imports': [2, { type: 'natural' }],

      // OBJECTS ORDER: Enforces a strict and consistent order for object, types and other declarations.
      'perfectionist/sort-object-types': [2, perfectionistSortTypes],
      'perfectionist/sort-union-types': [2, { type: 'natural' }],
      'perfectionist/sort-interfaces': [2, perfectionistSortTypes],
      'perfectionist/sort-objects': [2, perfectionistSortObjects],
      'perfectionist/sort-enums': [2, { type: 'natural' }],
    },
  },

  // NOTE: Ignore auto-generated PyWebView API types
  {
    ignores: ['**/types/pywebview/pywebview-api.d.ts'],
  },
];
