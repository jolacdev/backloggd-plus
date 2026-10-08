import { preferencesStorageItem } from './storage';

/** Console output is opt-in, shared across entrypoints, and follows the latest saved flag. */
const guarded =
  (level: 'debug' | 'error' | 'log' | 'warn') =>
  (...args: unknown[]) => {
    preferencesStorageItem
      .getValue()
      .then((preferences) => {
        if (preferences?.isLoggingEnabled === true) {
          // eslint-disable-next-line no-console -- Guarded by the user's preference.
          console[level]('[Toolkittd]', ...args);
        }
      })
      .catch(() => undefined);
  };

export const logger = {
  debug: guarded('debug'),
  error: guarded('error'),
  log: guarded('log'),
  warn: guarded('warn'),
};
