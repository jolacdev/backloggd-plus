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
