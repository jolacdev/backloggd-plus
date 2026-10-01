import {
  filtersStorageItem,
  StatusFiltersState,
  StatusKey,
} from '@globalShared/storage';

type SaveState = 'error' | 'idle' | 'saved' | 'saving';

/** Owns popup defaults and save feedback, separate from per-export choices. */
export const useExportStatusFiltersConfig = () => {
  const [filters, setFilters] = useState(filtersStorageItem.fallback);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const latestFilters = useRef<StatusFiltersState>(filtersStorageItem.fallback);
  const lastSavedFilters = useRef<StatusFiltersState>(
    filtersStorageItem.fallback,
  );
  const pendingWrite = useRef<null | Promise<boolean>>(null);

  // Restart after every edit, including fast writes React batches together.
  useEffect(() => {
    if (saveState !== 'saved') return;

    const timer = window.setTimeout(() => setSaveState('idle'), 3000);
    return () => window.clearTimeout(timer);
  }, [filters, saveState]);

  useEffect(() => {
    let isActive = true;

    void filtersStorageItem
      .getValue()
      .then((storedFilters) => {
        if (!isActive) return;
        latestFilters.current = storedFilters;
        lastSavedFilters.current = storedFilters;
        setFilters(storedFilters);
        setHasLoaded(true);
      })
      .catch(() => {
        if (isActive) setHasLoadError(true);
      });
    return () => {
      isActive = false;
    };
  }, []);

  /** Saves queued changes and lets navigation wait for the latest selection. */
  const savePendingPreferences = (): Promise<boolean> => {
    if (pendingWrite.current) return pendingWrite.current;
    if (!hasLoaded) return Promise.resolve(false);
    if (lastSavedFilters.current === latestFilters.current) {
      if (saveState === 'error') setSaveState('idle');
      return Promise.resolve(true);
    }

    setSaveState('saving');
    // Serialize writes, coalescing edits made while storage is busy. Navigation
    // awaits this same promise, including every newer selection in the queue.
    pendingWrite.current = Promise.resolve().then(async () => {
      try {
        while (lastSavedFilters.current !== latestFilters.current) {
          const writing = latestFilters.current;
          await filtersStorageItem.setValue(writing);
          lastSavedFilters.current = writing;
        }
        setSaveState('saved');
        return true;
      } catch {
        setSaveState('error');
        return false;
      } finally {
        pendingWrite.current = null;
      }
    });
    return pendingWrite.current;
  };

  /** Changes one default immediately, then starts a serialized save. */
  const toggleStatusFilter = (key: StatusKey) => {
    if (!hasLoaded) return;

    const updatedFilters = {
      ...latestFilters.current,
      [key]: !latestFilters.current[key],
    };
    latestFilters.current = updatedFilters;
    setFilters(updatedFilters);
    void savePendingPreferences();
  };

  return {
    filters,
    savePendingPreferences,
    saveState,
    toggleStatusFilter,
    hasLoaded,
    hasLoadError,
  };
};
