// NOTE: https://vitest.dev/guide/extending-matchers
import * as matchers from '@testing-library/jest-dom/matchers';
import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// NOTE: Extends TypeScript `Assertion` interface used in Vitest's `expect` with the Jest-DOM matchers.
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any>
    extends jest.Matchers<void, T>,
      TestingLibraryMatchers<T, void> {}
}

// NOTE: Extends the `expect` function from Vitest to add the matchers of Jest-DOM. Allowing the use of matchers like `.toBeInTheDocument()`.
expect.extend(matchers);
