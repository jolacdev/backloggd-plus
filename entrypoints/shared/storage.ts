import { StatusFiltersState } from './hooks/useExportStatusFilters';

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
