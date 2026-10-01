import {
  filtersStorageItem,
  StatusFiltersState,
  StatusKey,
} from '@globalShared/storage';

/** Loads status defaults and optionally saves changes to them. */
export const useStatusFilters = ({ canEditStorage = false } = {}) => {
  const [filters, setFilters] = useState<StatusFiltersState>(
    filtersStorageItem.fallback,
  );
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    void filtersStorageItem
      .getValue()
      .then(setFilters)
      .catch(() => {
        // Keep the fallback when storage is unavailable.
      })
      .finally(() => setHasLoaded(true));
  }, []);

  const toggleStatusFilter = (key: StatusKey) => {
    const nextFilters = { ...filters, [key]: !filters[key] };
    setFilters(nextFilters);
    if (canEditStorage) {
      void filtersStorageItem.setValue(nextFilters).catch(() => {
        // TODO: Check - Keep the local selection if storage is unavailable.
      });
    }
  };

  return { filters, toggleStatusFilter, hasLoaded };
};
