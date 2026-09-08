import { StatusFiltersState } from './hooks/useStatusFilters';
import { HltbCacheMap, HltbSettings } from './types/hltb';

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
  {
    fallback: {
      defaultCategory: 'main',
      isEnabled: true,
    },
  },
);

/**
 * Resolved HowLongToBeat matches, keyed by IGDB game id (Backloggd's `game_id`). Written
 * through `@content/features/hltb/cache`, which batches: this is a single storage value,
 * so persisting per game would re-serialize the whole map on every match.
 */
export const hltbResolutionsStorageItem = storage.defineItem<HltbCacheMap>(
  'local:hltbResolutions',
  { fallback: {} },
);

/** Last search path known to work, so a rotation costs one extra request in total. */
export const hltbEndpointStorageItem = storage.defineItem<null | string>(
  'local:hltbEndpoint',
  { fallback: null },
);
