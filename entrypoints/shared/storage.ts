import { StatusFiltersState } from './hooks/useStatusFilters';

export const filtersStorageItem = storage.defineItem<StatusFiltersState>(
  'local:statusFilters',
  {
    fallback: {
      backlog: true,
      completed: true,
      playing: true,
      wishlist: true,
    },
  },
);
