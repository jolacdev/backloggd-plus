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

    const loadStoredFilters = async () => {
      const storedFilters = await filtersStorageItem.getValue();

      // Only update state if the component is still actively mounted
      if (isMounted) {
        if (storedFilters) {
          setFilters(storedFilters);
        }
        setHasLoaded(true);
      }
    };

    loadStoredFilters();

    // Cleanup flag when unmounting
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
