import {
  HltbCategory,
  HltbGame,
  HltbMatchedEntry,
} from '@globalShared/types/hltb';

/**
 * Feature-local types. The cross-entrypoint contract with the background worker lives in
 * [`@globalShared/types/hltb`](../../../shared/types/hltb.ts) instead.
 */

/** What a Backloggd library card exposes. No release year — see `utils/cards`. */
export type GameCardMeta = {
  igdbId: string;
  slug: string;
  title: string;
};

export type RegisteredCard = {
  element: Element;
  meta: GameCardMeta;
};

/**
 * `needs-year` means several candidates are equally plausible on title alone and a release
 * year can still settle it — see `matchByYear`. `no-match` is terminal.
 */
export type MatchOutcome =
  | { candidates: HltbGame[]; status: 'needs-year' }
  | { game: HltbGame; status: 'matched' }
  | { status: 'no-match' };

/**
 * A single shared tooltip is positioned against whichever badge is hovered or focused,
 * rather than giving every card its own. On a page with hundreds of games that is the
 * difference between one floating element and hundreds.
 */
export type TooltipAnchor = {
  displayCategory: HltbCategory;
  entry: HltbMatchedEntry;
  rect: DOMRect;
};
