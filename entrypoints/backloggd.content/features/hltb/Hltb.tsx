import { useQueryClient } from '@tanstack/react-query';

import { useHltbSettings } from '@globalShared/hooks/useHltbSettings';
import { hltbCacheRevisionStorageItem } from '@globalShared/storage';

import HltbCardBadge from './HltbCardBadge';
import HltbTooltip, { useTooltipAnchor } from './HltbTooltip';
import useGameCards from './useGameCards';

/** Coordinates one React tree for collection badges and a shared floating breakdown. */
const Hltb = () => {
  const { settings, hasLoaded } = useHltbSettings();
  const [revision, setRevision] = useState<null | number>(null);
  const queryClient = useQueryClient();
  const isActive = hasLoaded && settings.isEnabled;
  const cards = useGameCards(isActive);
  const { anchor, cancelDismiss, dismiss, scheduleDismiss, show } =
    useTooltipAnchor();

  useEffect(() => {
    let isMounted = true;
    let hasChanged = false;
    const apply = (next: null | number) => {
      if (!isMounted) return;
      queryClient.removeQueries({ queryKey: ['hltbGameReleaseYear'] });
      setRevision(next ?? 0);
    };
    const unwatch = hltbCacheRevisionStorageItem.watch((next) => {
      hasChanged = true;
      apply(next);
    });
    hltbCacheRevisionStorageItem
      .getValue()
      .then((next) => {
        if (!hasChanged) apply(next);
      })
      .catch(() => {
        if (isMounted) setRevision(0);
      });
    return () => {
      isMounted = false;
      unwatch();
    };
  }, [queryClient]);

  useEffect(() => {
    dismiss();
  }, [cards, dismiss, revision, settings.defaultCategory]);

  if (!isActive || revision === null) return null;
  return (
    <>
      {cards.map((card) => (
        <HltbCardBadge
          key={`${revision}:${card.key}`}
          card={card}
          defaultCategory={settings.defaultCategory}
          revision={revision}
          onDismissTooltip={scheduleDismiss}
          onShowTooltip={show}
        />
      ))}
      {anchor && (
        <HltbTooltip
          anchor={anchor}
          onClose={dismiss}
          onDismiss={scheduleDismiss}
          onKeepOpen={cancelDismiss}
        />
      )}
    </>
  );
};

export default Hltb;
