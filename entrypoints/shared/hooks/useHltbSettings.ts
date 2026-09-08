import { hltbSettingsStorageItem } from '@globalShared/storage';
import { HltbSettings } from '@globalShared/types/hltb';

type UseHltbSettingsParams = {
  canEditStorage?: boolean;
};

/**
 * Reads the HowLongToBeat settings, mirroring the shape of `useStatusFilters`.
 *
 * One deliberate difference: this also **watches** storage. Toggling the feature in the
 * popup has to take effect on an already-open Backloggd tab, otherwise disabling the
 * integration would appear not to work until the user refreshes.
 */
export const useHltbSettings = ({
  canEditStorage = false,
}: UseHltbSettingsParams = {}) => {
  const [settings, setSettings] = useState<HltbSettings>(
    hltbSettingsStorageItem.fallback,
  );
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const applyStored = (stored: HltbSettings | null) => {
      if (isMounted && stored) setSettings(stored);
    };

    hltbSettingsStorageItem.getValue().then((stored) => {
      applyStored(stored);
      if (isMounted) setHasLoaded(true);
    });

    const unwatch = hltbSettingsStorageItem.watch(applyStored);

    return () => {
      isMounted = false;
      unwatch();
    };
  }, []);

  const updateSettings = (patch: Partial<HltbSettings>) => {
    const nextSettings = { ...settings, ...patch };

    setSettings(nextSettings);
    if (canEditStorage) hltbSettingsStorageItem.setValue(nextSettings);
  };

  return { settings, updateSettings, hasLoadedSettings: hasLoaded };
};
