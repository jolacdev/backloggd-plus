import { useTranslation } from 'react-i18next';

import { subscribeToPageChanges } from '@content/shared/utils/navigation';
import Icon from '@globalShared/components/Icon';
import Typography from '@globalShared/components/Typography';
import {
  HLTB_CATEGORIES,
  HltbCategory,
  HltbMatchedEntry,
} from '@globalShared/hltb';
import { cn } from '@globalShared/utils/cn';

export type TooltipAnchor = {
  displayCategory: HltbCategory;
  element: HTMLElement;
  entry: HltbMatchedEntry;
  rect: DOMRect;
};
import { formatDuration } from './format';

type HltbTooltipProps = {
  anchor: TooltipAnchor;
  onClose: () => void;
  onDismiss: () => void;
  onKeepOpen: () => void;
};

/** Shows available completion estimates, the matched title, and its HLTB source. */
const HltbTooltip = ({
  anchor,
  onClose,
  onDismiss,
  onKeepOpen,
}: HltbTooltipProps) => {
  const { t } = useTranslation('content', { keyPrefix: 'features.hltb' });
  const { t: tShared } = useTranslation('shared', {
    keyPrefix: 'features.hltb',
  });
  const tooltipRef = useRef<HTMLElement>(null);
  const { entry } = anchor;

  useEffect(() => {
    const element = tooltipRef.current;
    if (!element) return;
    const { rect } = anchor;
    const width = Math.min(256, window.innerWidth - 16);
    element.style.width = `${width}px`;
    const height = element.getBoundingClientRect().height;
    element.style.left = `${Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8))}px`;
    element.style.top = `${Math.max(8, rect.bottom + height + 8 > window.innerHeight ? rect.top - height - 8 : rect.bottom + 8)}px`;
  }, [anchor]);

  useEffect(() => {
    const element = tooltipRef.current;
    if (!element) return undefined;
    // Native events avoid React's relatedTarget retargeting across separate shadow roots.
    element.addEventListener('mouseenter', onKeepOpen);
    element.addEventListener('mouseleave', onDismiss);
    return () => {
      element.removeEventListener('mouseenter', onKeepOpen);
      element.removeEventListener('mouseleave', onDismiss);
    };
  }, [onDismiss, onKeepOpen]);

  return (
    <section
      ref={tooltipRef}
      aria-label={t('aria.breakdown')}
      className="border-border bg-section text-content pointer-events-auto fixed max-h-[calc(100vh-16px)] overflow-y-auto rounded-xl border p-3 font-sans shadow-xl"
      data-hltb-popover=""
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onDismiss();
      }}
      onFocus={onKeepOpen}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <Typography
          as="h2"
          className="flex items-center gap-1.5 font-semibold"
          variant="bodySmall"
        >
          <Icon name="clock-outline" size={16} /> HowLongToBeat
        </Typography>
        <button
          aria-label={t('aria.close')}
          className="text-content/65 hover:text-content cursor-pointer rounded p-1"
          type="button"
          onClick={onClose}
        >
          <Icon name="close" size={16} />
        </button>
      </header>
      <dl className="m-0 flex flex-col gap-1">
        {HLTB_CATEGORIES.map((category) => ({
          category,
          value: formatDuration(entry.times[category]),
        }))
          .filter((row) => row.value !== null)
          .map(({ category, value }) => (
            <div
              key={category}
              className={cn(
                'flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-[13px] leading-5',
                category === anchor.displayCategory
                  ? 'bg-primary/10 text-content font-semibold'
                  : 'text-content/75',
              )}
            >
              <dt>{tShared(`category.${category}`)}</dt>
              <dd className="m-0 tabular-nums">{value}</dd>
            </div>
          ))}
      </dl>
      <footer className="border-border mt-3 border-t pt-2">
        <Typography
          className="text-content/65 mb-1 break-words"
          variant="caption"
        >
          {entry.name}
          {entry.year ? ` (${entry.year})` : ''}
        </Typography>
        <a
          className="text-content text-xs underline underline-offset-4"
          href={`https://howlongtobeat.com/game/${entry.hltbId}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t('viewOnHltb')}
        </a>
      </footer>
    </section>
  );
};

export default HltbTooltip;

/** Keeps the card-to-popover crossing open and dismisses stale viewport anchors. */
export const useTooltipAnchor = () => {
  const [anchor, setAnchor] = useState<null | TooltipAnchor>(null);
  const timer = useRef<null | ReturnType<typeof setTimeout>>(null);
  const cancelDismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const dismiss = useCallback(() => {
    cancelDismiss();
    setAnchor(null);
  }, [cancelDismiss]);
  const scheduleDismiss = useCallback(() => {
    cancelDismiss();
    timer.current = setTimeout(dismiss, 200);
  }, [cancelDismiss, dismiss]);
  const show = useCallback(
    (next: TooltipAnchor) => {
      cancelDismiss();
      setAnchor(next);
    },
    [cancelDismiss],
  );

  useEffect(() => {
    if (!anchor) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (
        !event
          .composedPath()
          .some(
            (node) =>
              node === anchor.element ||
              (node instanceof Element &&
                node.hasAttribute('data-hltb-popover')),
          )
      ) {
        dismiss();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('scroll', dismiss, {
      capture: true,
      passive: true,
    });
    window.addEventListener('resize', dismiss);
    const unsubscribe = subscribeToPageChanges(dismiss);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
      unsubscribe();
    };
  }, [anchor, dismiss]);
  useEffect(() => cancelDismiss, [cancelDismiss]);
  return { anchor, cancelDismiss, dismiss, scheduleDismiss, show };
};
