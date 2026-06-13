import { useTranslation } from 'react-i18next';
import { vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

type UseTranslationParams = Parameters<typeof useTranslation>;

vi.mock('react-i18next', () => ({
  useTranslation: (
    _ns?: UseTranslationParams[0],
    options?: UseTranslationParams[1],
  ) => ({
    i18n: {
      changeLanguage: vi.fn(() => Promise.resolve()),
      language: 'en',
    },
    t: (key: string) =>
      options?.keyPrefix ? `${options.keyPrefix}.${key}` : key,
  }),
}));
