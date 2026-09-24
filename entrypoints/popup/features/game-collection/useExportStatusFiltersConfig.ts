import {
  StatusFiltersState,
  StatusKey,
} from '@globalShared/hooks/useExportStatusFilters';
import { filtersStorageItem } from '@globalShared/storage';

type SaveState = 'error' | 'idle' | 'saved' | 'saving';

/** Owns popup defaults and save feedback, separate from per-export choices. */
export const useExportStatusFiltersConfig = () => {
  const [filters, setFilters] = useState(filtersStorageItem.fallback);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const latest = useRef<StatusFiltersState>(filtersStorageItem.fallback);
  const lastSaved = useRef<StatusFiltersState>(filtersStorageItem.fallback);
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
        latest.current = storedFilters;
        lastSaved.current = storedFilters;
        setFilters(storedFilters);
        setHasLoaded(true);
      })
      .catch(() => {
        if (isActive) setHasLoadError(true);
      });
    return () => {
      isActive = false;
    };
  }, [loadAttempt]);

  /** Saves queued changes and lets navigation wait for the latest selection. */
  const flush = (): Promise<boolean> => {
    if (pendingWrite.current) return pendingWrite.current;
    if (!hasLoaded) return Promise.resolve(false);
    if (lastSaved.current === latest.current) return Promise.resolve(true);

    setSaveState('saving');
    // Serialize writes, coalescing edits made while storage is busy. Navigation
    // awaits this same promise, including every newer selection in the queue.
    pendingWrite.current = Promise.resolve().then(async () => {
      try {
        while (lastSaved.current !== latest.current) {
          const writing = latest.current;
          await filtersStorageItem.setValue(writing);
          lastSaved.current = writing;
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
  const toggle = (key: StatusKey) => {
    if (!hasLoaded) return;
    latest.current = { ...latest.current, [key]: !latest.current[key] };
    setFilters(latest.current);
    void flush();
  };

  /** Retries loading defaults after a storage read fails. */
  const retryLoad = () => {
    setHasLoadError(false);
    setLoadAttempt((attempt) => attempt + 1);
  };

  return {
    filters,
    flush,
    retryLoad,
    saveState,
    toggle,
    hasLoaded,
    hasLoadError,
  };
};
