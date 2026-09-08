import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { HLTB_CATEGORIES, HltbCategory } from '@globalShared/types/hltb';

import { getCachedResolution } from '../api/cache';
import { queryKeys } from '../api/keys';
import { resolveHltbGame } from '../api/resolve-hltb-game';
import useIsNearViewport from '../hooks/useIsNearViewport';
import { RegisteredCard, TooltipAnchor } from '../types';
import { ensurePositionedMountPoint, getBadgeMountPoint } from '../utils/cards';
import { formatDuration, resolveDisplayCategory } from '../utils/format';

type HltbCardBadgeProps = {
  card: RegisteredCard;
  defaultCategory: HltbCategory;
  onDismissTooltip: () => void;
  onShowTooltip: (anchor: TooltipAnchor) => void;
};

/**
 * Owns one card's lifecycle: wait until it nears the viewport, resolve it, then portal a
 * badge into Backloggd's own markup.
 *
 * Every unsettled or unsuccessful state renders `null` — no spinner, no placeholder, no
 * "unknown" pill. That is what makes the two failure modes the reference extension is
 * criticised for (a grey badge with no number, a tooltip stuck on "loading") unrepresentable.
 */
const HltbCardBadge = ({
  card,
  defaultCategory,
  onDismissTooltip,
  onShowTooltip,
}: HltbCardBadgeProps) => {
  const { t } = useTranslation('content', { keyPrefix: 'features.hltb' });
  const queryClient = useQueryClient();
  const badgeRef = useRef<HTMLSpanElement>(null);

  const isNearViewport = useIsNearViewport(card.element);
  const mountPoint = useMemo(
    () => getBadgeMountPoint(card.element),
    [card.element],
  );

  // A fresh persistent-cache hit short-circuits entirely, so revisiting a library issues
  // no requests. Read once at mount rather than per render: the read prunes stale entries,
  // and the badge remounts anyway when its card changes identity. `retry: false` keeps a
  // failed resolution failed for this page view rather than retrying it once per card.
  const [cached] = useState(() => getCachedResolution(card.meta.igdbId));
  const { data } = useQuery({
    enabled: isNearViewport && !cached,
    gcTime: Infinity,
    queryKey: queryKeys.resolution(card.meta.igdbId),
    retry: false,
    staleTime: Infinity,
    queryFn: async () => await resolveHltbGame(card.meta, queryClient),
  });
  const resolution = cached ?? data ?? null;

  useEffect(() => {
    ensurePositionedMountPoint(mountPoint);
  }, [mountPoint]);

  /**
   * The whole card is the hover region, not just the badge.
   *
   * The badge is a ~35x18px corner target and the tooltip opens below it, so the pointer
   * must leave the badge to reach the tooltip. Closing on the badge's own `mouseleave`
   * therefore made the tooltip unreachable. Binding the close to the *card* means the
   * whole journey happens inside the region that keeps it open.
   *
   * Bound imperatively because the card is Backloggd's DOM, not ours.
   */
  useEffect(() => {
    const { element } = card;
    element.addEventListener('mouseleave', onDismissTooltip);

    return () => {
      element.removeEventListener('mouseleave', onDismissTooltip);
    };
  }, [card, onDismissTooltip]);

  if (!resolution || resolution.status !== 'matched') return null;

  const displayCategory = resolveDisplayCategory(
    resolution.times,
    defaultCategory,
  );
  const label = displayCategory
    ? formatDuration(resolution.times[displayCategory])
    : null;

  if (!displayCategory || !label) return null;

  const show = () => {
    const rect = badgeRef.current?.getBoundingClientRect();
    if (rect) onShowTooltip({ displayCategory, entry: resolution, rect });
  };

  const activate = (event: {
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    event.preventDefault();
    event.stopPropagation();
    show();
  };

  /** The full breakdown, so assistive tech never needs the visual tooltip. */
  const description = [
    resolution.name,
    ...HLTB_CATEGORIES.map((category) => {
      const value = formatDuration(resolution.times[category]);
      return value ? `${t(`category.${category}`)}: ${value}` : null;
    }).filter(Boolean),
  ].join('. ');

  // The badge deliberately never navigates: it sits on top of the card's cover link, and
  // hijacking a click meant for the game would be worse than the small dead zone it costs.
  // Click opens the tooltip too, so the breakdown is reachable on touch devices. There is
  // no `onMouseLeave` — closing is owned by the card above; `onBlur` covers the keyboard.
  return createPortal(
    <span
      ref={badgeRef}
      aria-label={description}
      className="bgpl-hltb-badge"
      role="button"
      tabIndex={0}
      onBlur={onDismissTooltip}
      onClick={activate}
      onFocus={show}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') activate(event);
      }}
      onMouseEnter={show}
    >
      {label}
    </span>,
    mountPoint,
  );
};

export default HltbCardBadge;
