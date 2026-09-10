import {
  ListEntryScrapeResponse,
  ListPageScrapeResponse,
  ListStatsScrapeResponse,
} from '@content/shared/types/api';
import { getTotalGamesCount } from '@content/shared/utils/dom';

export const BACKLOGGD_ORIGIN = 'https://backloggd.com';

// Backloggd serves two very different list pages, told apart by the route it
// stamps on <body>. Standard lists paginate a flat entry list; GOTY lists are a
// single page of category picks with a bespoke layout.
const GOTY_ROUTE = 'list#goty_list';

// Every Backloggd list selector lives here so markup changes are a one-file fix.
// Shared by both page shapes:
const GAME_CARD = '.card.game-cover[game_id]';
const GAME_COVER = 'img.card-img';
const GAME_LINK = 'a[href^="/games/"]';
const LIST_DESCRIPTION = '#list-desc .collapse-text-body';

// Standard list pages, requested in Grid display so ranked and unranked lists
// render identically. Detail-view selectors are kept as fallbacks in case the
// display request does not take.
const ENTRY = '.grid-list-entry, .detail-list-entry';
const GAME_NAME = '.game-text-centered, .game-name h4';
const LIST_TITLE = '.list-title h1';

// Backloggd renders a status overlay on every card that has any log at all, so
// it reads "Completed" for games that are merely backlogged or wishlisted. Only
// cards it also fades are actually played, so the status is read through
// `.fade-played` and is otherwise ignored.
const PLAYED_STATUS = '.fade-played .status-overlay';

// GOTY list pages. Category is rendered twice per entry (mobile + desktop
// headers), so every lookup takes the first match only.
const GOTY_CATEGORY = '.goty-category';
const GOTY_ENTRY = '.goty-list-entry';
const GOTY_GAME_NAME = '.game-title';
const GOTY_YEAR = '.goty-list-year';

// Progress panel, also rendered twice (mobile + desktop sidebar).
const STATS_AVERAGE_RATING = '#avg-rating';
const STATS_CONTAINER = '.list-progress-extra';
const STATS_PLAYED = '#list-progress-label';
const STATS_STATUS_LABEL = '.list-progress-type-label';

// Note markup differs per list type: unranked wraps `.readmore-content` in a
// `.list-detail-note`, ranked uses `.note-content`. Trying them in order avoids
// having to detect the list type at all.
const NOTES = ['.readmore-content', '.note-content', '.list-detail-note'];

/** An entry with its 1-based position across the whole list. */
export type ListEntry = ListEntryScrapeResponse & {
  position: number;
};

/** A fully resolved list: every entry across all pages, plus its own details. */
export type ListDetails = {
  description: string;
  entries: ListEntry[];
  kind: 'goty' | 'standard';
  owner: string;
  title: string;
  totalGames: number;
  url: string;
  /** The sort the entries were fetched in, which is what `position` reflects. */
  sort?: string;
  stats?: ListStatsScrapeResponse;
};

const getText = (root: Document | Element, selector: string): string =>
  root.querySelector(selector)?.textContent?.trim() ?? '';

const getNote = (entry: Element): string | undefined =>
  NOTES.map((selector) => getText(entry, selector)).find(Boolean);

const toNumber = (value: string): null | number => {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : null;
};

/**
 * Reads the viewer's progress panel: games played, per-status counts and the
 * average rating they gave to games in this list.
 *
 * GOTY pages do not render this panel, so it resolves to `undefined` there.
 */
const parseStats = (doc: Document): ListStatsScrapeResponse | undefined => {
  const statsContainer = doc.querySelector(STATS_CONTAINER);
  // "You've played 1 / 21 games"
  const playedMatch = getText(doc, STATS_PLAYED).match(/(\d+)\s*\/\s*\d+/);

  if (!statsContainer && !playedMatch) return undefined;

  const statuses: Record<string, number> = {};

  statsContainer?.querySelectorAll(STATS_STATUS_LABEL).forEach((label) => {
    // "1 Completed"
    const match = label.textContent?.trim().match(/^(\d+)\s+(.+)$/);
    if (match) statuses[match[2].toLowerCase()] = Number(match[1]);
  });

  return {
    averageRating: toNumber(getText(doc, STATS_AVERAGE_RATING)),
    playedGames: playedMatch ? Number(playedMatch[1]) : null,
    statuses,
  };
};

/**
 * Extracts one entry. The cover card, game link and note markup are identical on
 * both page shapes; only the game name selector and the category differ.
 */
const parseEntry = (
  entry: Element,
  { category, nameSelector }: { nameSelector: string; category?: string },
): ListEntryScrapeResponse | undefined => {
  const id = entry.querySelector(GAME_CARD)?.getAttribute('game_id');
  if (!id) return undefined;

  const cover = entry.querySelector(GAME_COVER);
  const path = entry.querySelector(GAME_LINK)?.getAttribute('href');

  return {
    id,
    category,
    coverUrl: cover?.getAttribute('src') ?? undefined,
    name: getText(entry, nameSelector) || (cover?.getAttribute('alt') ?? ''),
    note: getNote(entry),
    // Lowercased to match the keys of `ListStatsScrapeResponse['statuses']`, so
    // the list totals can be attributed back to individual games.
    status: getText(entry, PLAYED_STATUS).toLowerCase() || undefined,
    url: path ? `${BACKLOGGD_ORIGIN}${path}` : '',
  };
};

const parseEntries = (
  elements: NodeListOf<Element>,
  getEntryOptions: (entry: Element) => Parameters<typeof parseEntry>[1],
): ListEntryScrapeResponse[] =>
  [...elements].flatMap((entry) => {
    const parsedEntry = parseEntry(entry, getEntryOptions(entry));
    return parsedEntry ? [parsedEntry] : [];
  });

const parseStandardListPage = (doc: Document): ListPageScrapeResponse => ({
  description: getText(doc, LIST_DESCRIPTION),
  stats: parseStats(doc),
  title: getText(doc, LIST_TITLE),
  totalGames: getTotalGamesCount(doc),
  // Only GOTY lists group their entries, so no category is resolved here.
  entries: parseEntries(doc.querySelectorAll(ENTRY), () => ({
    nameSelector: GAME_NAME,
  })),
});

const parseGotyListPage = (doc: Document): ListPageScrapeResponse => {
  const entries = parseEntries(doc.querySelectorAll(GOTY_ENTRY), (entry) => ({
    category: getText(entry, GOTY_CATEGORY) || undefined,
    nameSelector: GOTY_GAME_NAME,
  }));

  return {
    description: getText(doc, LIST_DESCRIPTION),
    entries,
    // GOTY lists are a single page of at most a handful of picks: there is no
    // "N Games" counter and no pagination, so the page is its own total.
    title: getText(doc, GOTY_YEAR),
    totalGames: entries.length,
  };
};

/**
 * Parses a list page document into its details, stats and entries.
 *
 * Entries missing a game id are dropped rather than exported blank.
 */
export const parseListPage = (doc: Document): ListPageScrapeResponse =>
  doc.body?.dataset.route === GOTY_ROUTE
    ? parseGotyListPage(doc)
    : parseStandardListPage(doc);
