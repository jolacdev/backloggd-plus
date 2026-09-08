import { useHltbSettings } from '@globalShared/hooks/useHltbSettings';
import { debugLog } from '@globalShared/utils/debug';

import { flushResolutionCache, loadResolutionCache } from '../api/cache';
import useBadgeStylesheet from '../hooks/useBadgeStylesheet';
import useGameCards from '../hooks/useGameCards';
import useIsProfileGamesPage from '../hooks/useIsProfileGamesPage';
import useTooltipAnchor from '../hooks/useTooltipAnchor';
import HltbCardBadge from './HltbCardBadge';
import HltbTooltip from './HltbTooltip';

/**
 * Root of the HowLongToBeat integration.
 *
 * Mounted once per document and left in place: it decides for itself whether the current
 * route is a library page, so Backloggd's client-side navigation needs no imperative
 * mount/unmount dance in the entrypoint. Inactive means no observers and no requests.
 *
 * Renders one portal per card, all driven by a single React root — a 500-game library
 * costs one reconciler and one stylesheet rather than 500 of each.
 */
const HltbLayer = () => {
  const { settings, hasLoadedSettings } = useHltbSettings();
  const [hasLoadedCache, setHasLoadedCache] = useState(false);

  const isActive = useIsProfileGamesPage() && settings.isEnabled;
  const cards = useGameCards(isActive);
  const { anchor, cancelDismiss, scheduleDismiss, show } = useTooltipAnchor();

  useBadgeStylesheet();

  // Loaded on the first library visit and flushed when the user leaves it — the layer now
  // outlives the route, so its own unmount is no longer the signal to persist.
  useEffect(() => {
    if (!isActive) return undefined;

    let isMounted = true;

    loadResolutionCache()
      // The cache is an optimisation, never a prerequisite. Failing to read it must not
      // gate rendering, or one storage error would silently blank every badge on the page.
      .catch((error: unknown) => {
        debugLog('cache', 'load failed, continuing without it', error);
      })
      .finally(() => {
        if (isMounted) setHasLoadedCache(true);
      });

    return () => {
      isMounted = false;
      flushResolutionCache();
    };
  }, [isActive]);

  if (!isActive || !hasLoadedSettings || !hasLoadedCache) return null;

  return (
    <>
      {cards.map((card, index) => (
        <HltbCardBadge
          // NOTE: The same game can legitimately appear twice, so the id is not unique.
          key={`${card.meta.igdbId}-${index}`}
          card={card}
          defaultCategory={settings.defaultCategory}
          onDismissTooltip={scheduleDismiss}
          onShowTooltip={show}
        />
      ))}

      {anchor && (
        <HltbTooltip
          anchor={anchor}
          onDismiss={scheduleDismiss}
          onKeepOpen={cancelDismiss}
        />
      )}
    </>
  );
};

export default HltbLayer;
