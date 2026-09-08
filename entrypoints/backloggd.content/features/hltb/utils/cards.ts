import { GameCardMeta, RegisteredCard } from '../types';

/**
 * Every Backloggd DOM detail this feature depends on.
 *
 * Backloggd is a Rails + Hotwire Turbo app whose markup can change without notice, so the
 * selectors and the scanning that uses them are confined to this one file: if the site is
 * redesigned, this is the only module that needs updating.
 */

/**
 * NOTE: `game_id` is a bare attribute, not a `data-` one, so `dataset` will not see it.
 * Its value is the **IGDB game id** — verified for GTA V (1020), RDR2 (25076), Elden Ring
 * (119133) and Hollow Knight (14593) — which makes it a stable, title-independent key.
 */
const GAME_CARD_SELECTOR = '.card.game-cover[game_id]';

/** Already clips and positions the cover art, so the badge is portaled in here. */
const COVER_WRAPPER_SELECTOR = '.overflow-wrapper';

const GAME_SLUG_PATTERN = /^\/games\/([^/?#]+)/;

/**
 * Extracts what a library card exposes, or `null` if it is unusable. Note what is **not**
 * here: a release year — the visible date is the user's play date, so disambiguating
 * same-titled games needs {@link parseGamePageReleaseYear} and an extra request.
 */
export const getGameCardMeta = (card: Element): GameCardMeta | null => {
  const igdbId = card.getAttribute('game_id')?.trim();
  if (!igdbId) return null;

  const title =
    card.querySelector('img.card-img')?.getAttribute('alt')?.trim() ||
    card.querySelector('.game-text-centered')?.textContent?.trim() ||
    '';
  if (!title) return null;

  const href = card.querySelector('a.cover-link')?.getAttribute('href') ?? '';

  return { igdbId, slug: href.match(GAME_SLUG_PATTERN)?.[1] ?? '', title };
};

/** Falls back to the card so a markup change degrades to a misplaced badge, not none. */
export const getBadgeMountPoint = (card: Element): Element =>
  card.querySelector(COVER_WRAPPER_SELECTOR) ?? card;

/**
 * The badge is absolutely positioned, so its mount point needs a positioning context —
 * unless Backloggd already established one. An empty computed value means "not computed"
 * (jsdom does this) and counts as unpositioned.
 */
export const ensurePositionedMountPoint = (mountPoint: Element) => {
  if (!(mountPoint instanceof HTMLElement)) return;

  const { position } = window.getComputedStyle(mountPoint);
  if (!position || position === 'static') {
    mountPoint.style.position = 'relative';
  }
};

/** Reads the release year from a Backloggd game page (`/games/:slug/`). */
export const parseGamePageReleaseYear = (doc: Document): number | undefined => {
  const text = doc.querySelector('a.game-year')?.textContent?.trim();
  const year = Number.parseInt(text ?? '', 10);

  return Number.isFinite(year) ? year : undefined;
};

/**
 * Compares metadata as well as node identity: a Turbo morph can swap which game a card
 * represents without replacing the element, leaving it showing the previous game's time.
 */
export const areSameCards = (a: RegisteredCard[], b: RegisteredCard[]) =>
  a.length === b.length &&
  a.every(
    (card, index) =>
      card.element === b[index].element &&
      card.meta.igdbId === b[index].meta.igdbId &&
      card.meta.title === b[index].meta.title,
  );

export const scanCards = (): RegisteredCard[] =>
  [...document.querySelectorAll(GAME_CARD_SELECTOR)].flatMap((element) => {
    const meta = getGameCardMeta(element);
    return meta ? [{ element, meta }] : [];
  });

/**
 * Narrows a page-wide `MutationObserver` down to changes that can affect the registry, so
 * unrelated churn never triggers a rescan. Attribute records always qualify — the observer
 * filters on `game_id` already.
 */
export const isCardMutation = (record: MutationRecord) =>
  record.type === 'attributes' ||
  [...record.addedNodes, ...record.removedNodes].some(
    (node) =>
      node instanceof Element &&
      (node.matches(GAME_CARD_SELECTOR) ||
        node.querySelector(GAME_CARD_SELECTOR) !== null),
  );

/** The attribute a morph can change in place, so the observer has to watch it. */
export const OBSERVED_CARD_ATTRIBUTE = 'game_id';
