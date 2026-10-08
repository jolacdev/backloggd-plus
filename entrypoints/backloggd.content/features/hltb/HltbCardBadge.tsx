import { SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import Icon from '@globalShared/components/Icon';
import { HLTB_CATEGORIES, HltbCategory } from '@globalShared/hltb';
import { cn } from '@globalShared/utils/cn';

import { formatDuration, resolveDisplayCategory } from './format';
import { TooltipAnchor } from './HltbTooltip';
import { RegisteredCard } from './useGameCards';
import useHltbGame from './useHltbGame';

import css from '../../style.css?inline';

let stylesheet: CSSStyleSheet | undefined;

const createBadgeRoot = () => {
  const host = document.createElement('toolkittd-hltb-badge');
  // Host positioning belongs to Backloggd's grid; button styles stay inside the shadow.
  Object.assign(host.style, {
    lineHeight: '0',
    position: 'absolute',
    right: '4px',
    top: '4px',
    zIndex: '11',
  });
  host.setAttribute('data-turbo-temporary', '');
  const shadow = host.attachShadow({ mode: 'open' });
  if (typeof CSSStyleSheet.prototype.replaceSync === 'function') {
    if (!stylesheet) {
      stylesheet = new CSSStyleSheet();
      stylesheet.replaceSync(css);
    }
    shadow.adoptedStyleSheets = [stylesheet];
  } else {
    const style = document.createElement('style');
    style.textContent = css;
    shadow.append(style);
  }
  return shadow;
};

type HltbCardBadgeProps = {
  card: RegisteredCard;
  defaultCategory: HltbCategory;
  revision: number;
  onDismissTooltip: () => void;
  onShowTooltip: (anchor: TooltipAnchor) => void;
};

/** Resolves nearby covers and portals a native button into an isolated badge shadow root. */
const HltbCardBadge = ({
  card,
  defaultCategory,
  onDismissTooltip,
  onShowTooltip,
  revision,
}: HltbCardBadgeProps) => {
  const { t } = useTranslation('content', { keyPrefix: 'features.hltb' });
  const { t: tShared } = useTranslation('shared', {
    keyPrefix: 'features.hltb',
  });
  const [badgeRoot] = useState(createBadgeRoot);
  const resolution = useHltbGame(card, revision);
  const hasMatch = resolution?.status === 'matched';

  useEffect(() => {
    if (!hasMatch) return undefined;
    const { mountPoint } = card;
    if (
      mountPoint instanceof HTMLElement &&
      ['', 'static'].includes(getComputedStyle(mountPoint).position)
    ) {
      mountPoint.style.setProperty('position', 'relative');
    }
    const host = badgeRoot.host;
    // A Turbo snapshot can clone a host without its shadow root or React owner.
    mountPoint
      .querySelectorAll(':scope > toolkittd-hltb-badge')
      .forEach((node) => {
        if (node !== host) node.remove();
      });
    mountPoint.append(host);
    return () => {
      host.remove();
    };
  }, [badgeRoot, card, hasMatch]);

  useEffect(() => {
    card.element.addEventListener('mouseleave', onDismissTooltip);
    return () => {
      card.element.removeEventListener('mouseleave', onDismissTooltip);
    };
  }, [card, onDismissTooltip]);

  if (resolution?.status !== 'matched') return null;
  const displayCategory = resolveDisplayCategory(
    resolution.times,
    defaultCategory,
  );
  const label = displayCategory
    ? formatDuration(resolution.times[displayCategory])
    : null;
  if (!displayCategory || !label) return null;

  const show = (event: SyntheticEvent<HTMLButtonElement>) => {
    const element = event.currentTarget;
    onShowTooltip({
      displayCategory,
      element,
      entry: resolution,
      rect: element.getBoundingClientRect(),
    });
  };
  const description = [
    t('aria.badge', { name: resolution.name }),
    ...HLTB_CATEGORIES.map((category) => {
      const value = formatDuration(resolution.times[category]);
      return value ? `${tShared(`category.${category}`)}: ${value}` : null;
    }).filter(Boolean),
  ].join('. ');

  return createPortal(
    <button
      aria-label={description}
      className={cn(
        'text-content inline-flex cursor-pointer items-center gap-1 rounded-md border px-1.5 py-0.5',
        'border-content/25 bg-background/95 font-sans text-[11px] leading-4 font-semibold tabular-nums shadow-sm',
        'hover:border-content/60 focus-visible:outline-content focus-visible:outline-2 focus-visible:outline-offset-1',
      )}
      type="button"
      onBlur={onDismissTooltip}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        show(event);
      }}
      onFocus={show}
      onMouseEnter={show}
    >
      <Icon name="clock-outline" size={12} />
      {label}
    </button>,
    badgeRoot,
  );
};

export default HltbCardBadge;
