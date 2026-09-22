import { filtersStorageItem } from '@globalShared/storage';

export type StatusKey = 'backlog' | 'played' | 'playing' | 'wishlist';

export type StatusFiltersState = Record<StatusKey, boolean>;

type UseStatusFiltersParams = {
  canEditStorage?: boolean;
};

export const useStatusFilters = ({
  canEditStorage = false,
}: UseStatusFiltersParams = {}) => {
  const [filters, setFilters] = useState<StatusFiltersState>(
    filtersStorageItem.fallback,
  );
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void filtersStorageItem
      .getValue()
      .then((storedFilters) => {
        if (!isMounted) return;

        setFilters(storedFilters);
      })
      .catch(() => {
        // Keep the default filters when saved preferences are unavailable.
      })
      .finally(() => {
        if (isMounted) setHasLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleStatusFilter = (key: StatusKey) => {
    const nextState = { ...filters, [key]: !filters[key] };

    setFilters(nextState);

    // Only save if allowed
    if (canEditStorage) {
      filtersStorageItem.setValue(nextState);
    }
  };

  return { filters, toggleStatusFilter, hasLoadedStatuses: hasLoaded };
};
