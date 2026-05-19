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

  useEffect(() => {
    const loadStoredFilters = async () => {
      const storedFilters = await filtersStorageItem.getValue();
      if (storedFilters) {
        setFilters(storedFilters);
      }
    };

    loadStoredFilters();
  }, []);

  const toggleStatusFilter = (key: StatusKey) => {
    const nextState = { ...filters, [key]: !filters[key] };

    setFilters(nextState);

    // Only save if allowed
    if (canEditStorage) {
      filtersStorageItem.setValue(nextState);
    }
  };

  return { filters, toggleStatusFilter };
};
