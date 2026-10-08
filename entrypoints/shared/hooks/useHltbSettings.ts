import { HLTB_CATEGORIES, HltbSettings } from '../hltb';
import { hltbSettingsStorageItem } from '../storage';

/** Shares saved preferences with the popup and already-open collection pages. */
export const useHltbSettings = () => {
  const [settings, setSettings] = useState(hltbSettingsStorageItem.fallback);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let hasChanged = false;
    const apply = (stored: HltbSettings | null) => {
      if (!isMounted) return;
      setSettings({
        defaultCategory:
          stored && HLTB_CATEGORIES.includes(stored.defaultCategory)
            ? stored.defaultCategory
            : 'main',
        isEnabled:
          typeof stored?.isEnabled === 'boolean' ? stored.isEnabled : true,
      });
    };
    const unwatch = hltbSettingsStorageItem.watch((stored) => {
      hasChanged = true;
      apply(stored);
    });
    hltbSettingsStorageItem
      .getValue()
      .then((stored) => {
        if (!hasChanged) apply(stored);
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      })
      .finally(() => {
        if (isMounted) setHasLoaded(true);
      });
    return () => {
      isMounted = false;
      unwatch();
    };
  }, []);

  const updateSettings = async (patch: Partial<HltbSettings>) => {
    const next = { ...settings, ...patch };
    setIsSaving(true);
    setHasError(false);
    setSettings(next);
    try {
      await hltbSettingsStorageItem.setValue(next);
    } catch {
      setSettings(settings);
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return { settings, updateSettings, hasError, hasLoaded, isSaving };
};
