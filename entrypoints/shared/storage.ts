import { HltbCacheState, HltbSettings } from './hltb';

export const preferencesStorageItem = storage.defineItem<{
  isLoggingEnabled: boolean;
}>('local:preferences', { fallback: { isLoggingEnabled: false } });

export type StatusKey = 'backlog' | 'played' | 'playing' | 'wishlist';

export type StatusFiltersState = Record<StatusKey, boolean>;

export const filtersStorageItem = storage.defineItem<StatusFiltersState>(
  'local:statusFilters',
  {
    fallback: {
      backlog: true,
      played: true,
      playing: true,
      wishlist: false,
    },
  },
);

export const hltbSettingsStorageItem = storage.defineItem<HltbSettings>(
  'local:hltbSettings',
  { fallback: { defaultCategory: 'main', isEnabled: true } },
);

/** Only the background worker writes this cache, so tabs cannot overwrite each other. */
export const hltbCacheStorageItem = storage.defineItem<HltbCacheState>(
  'local:hltbCache',
  { fallback: { blockedUntil: 0, entries: {}, revision: 0 } },
);

export const hltbCacheRevisionStorageItem = storage.defineItem<number>(
  'local:hltbCacheRevision',
  { fallback: 0 },
);

export const hltbEndpointStorageItem = storage.defineItem<null | string>(
  'local:hltbEndpoint',
  { fallback: null },
);
