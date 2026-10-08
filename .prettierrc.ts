import type { Config } from 'prettier';

const config: Config = {
  arrowParens: 'always',
  bracketSameLine: false,
  endOfLine: 'auto',
  jsxSingleQuote: false,
  plugins: ['prettier-plugin-tailwindcss'],
  printWidth: 80,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  overrides: [
    {
      files: 'scripts/**/*.ts',
      options: { printWidth: 120 }, // Keep script commands and assertions together.
    },
  ],
};

export default config;
