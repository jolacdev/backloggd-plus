import { useTranslation } from 'react-i18next';

import { HLTB_CATEGORIES } from '@globalShared/types/hltb';
import { cn } from '@globalShared/utils/cn';

import { TooltipAnchor } from '../types';
import { formatDuration } from '../utils/format';
import { getTooltipStyle } from '../utils/tooltip';

type HltbTooltipProps = {
  anchor: TooltipAnchor;
  onDismiss: () => void;
  onKeepOpen: () => void;
};

/**
 * The completion-time breakdown.
 *
 * Lives inside the Shadow DOM (so it keeps Tailwind and full style isolation) and is
 * `position: fixed`, so no `overflow: hidden` ancestor in Backloggd's grid can clip it.
 *
 * It shows the matched HowLongToBeat name and year on purpose: until the game-details
 * feature ships a correction UI, that is how a user spots a bad match.
 */
const HltbTooltip = ({ anchor, onDismiss, onKeepOpen }: HltbTooltipProps) => {
  const { t } = useTranslation('content', { keyPrefix: 'features.hltb' });
  const { displayCategory, entry } = anchor;
  const tooltipRef = useRef<HTMLDivElement>(null);

  /**
   * Native listeners, deliberately not React's `onMouseEnter` / `onMouseLeave`.
   *
   * React synthesizes those from `mouseover` / `mouseout` by comparing `relatedTarget`,
   * which is **retargeted** at a shadow boundary — so moving in from Backloggd's light-DOM
   * card could fail to produce a synthetic `mouseenter`, the pending dismiss was never
   * cancelled, and the tooltip always vanished. Native events do not retarget for a
   * listener bound inside the same tree.
   */
  useEffect(() => {
    const element = tooltipRef.current;
    if (!element) return undefined;

    element.addEventListener('mouseenter', onKeepOpen);
    element.addEventListener('mouseleave', onDismiss);

    return () => {
      element.removeEventListener('mouseenter', onKeepOpen);
      element.removeEventListener('mouseleave', onDismiss);
    };
  }, [onDismiss, onKeepOpen]);

  const style = getTooltipStyle(anchor.rect);

  return (
    <div
      ref={tooltipRef}
      // `bgpl-hltb-tooltip` is an identifier for tests and debugging, not a style hook.
      className="bgpl-hltb-tooltip pointer-events-auto fixed"
      style={style}
    >
      <div
        className={cn(
          'flex flex-col gap-1 rounded-md p-2',
          'border border-[var(--back-field-border,#3b414e)]',
          'bg-[var(--back-field-background,#272c37)] shadow-lg',
        )}
      >
        {HLTB_CATEGORIES.map((category) => ({
          category,
          value: formatDuration(entry.times[category]),
        }))
          .filter((row) => row.value !== null)
          .map(({ category, value }) => (
            <div
              key={category}
              className={cn(
                'flex items-baseline justify-between gap-3 text-[0.8125rem] leading-[1.4]',
                category === displayCategory
                  ? 'font-[500] text-[var(--back-text,#badefc)]'
                  : 'font-[300] text-[#fff]',
              )}
            >
              <span>{t(`category.${category}`)}</span>
              <span className="tabular-nums">{value}</span>
            </div>
          ))}

        <div className="mt-1 flex flex-col gap-0.5 border-t border-[var(--back-field-border,#3b414e)] pt-1.5">
          <span className="text-[0.75rem] leading-[1.3] font-[300] text-[var(--back-text-secondary,#8f9ca7)]">
            {entry.year ? `${entry.name} (${entry.year})` : entry.name}
          </span>
          <a
            className="text-[0.75rem] leading-[1.3] font-[400] text-[var(--back-text,#badefc)] underline underline-offset-2"
            href={`https://howlongtobeat.com/game/${entry.hltbId}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('viewOnHltb')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default HltbTooltip;
