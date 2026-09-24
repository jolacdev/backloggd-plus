import { filtersStorageItem } from '@globalShared/storage';

export type StatusKey = 'backlog' | 'played' | 'playing' | 'wishlist';

export type StatusFiltersState = Record<StatusKey, boolean>;

/** Loads saved defaults into a local selection for one export. */
export const useExportStatusFilters = () => {
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
    setFilters((current) => ({ ...current, [key]: !current[key] }));
  };

  return { filters, toggleStatusFilter, hasLoadedStatuses: hasLoaded };
};
