import {
  HLTB_CATEGORIES,
  HltbCategory,
  HltbTimes,
} from '@globalShared/types/hltb';

const SECONDS_PER_HOUR = 3600;

/**
 * Renders a duration the way HowLongToBeat does: `45m`, `12h`, `12½h`. Kept to four or
 * five characters so the badge stays small enough to sit on a cover without covering
 * artwork. Returns `null` when there is nothing to show, so callers cannot accidentally
 * render an empty badge.
 */
export const formatDuration = (seconds: null | number): null | string => {
  if (!seconds || seconds <= 0) return null;
  if (seconds < SECONDS_PER_HOUR) {
    return `${Math.max(1, Math.round(seconds / 60))}m`;
  }

  const halfHours = Math.round((seconds / SECONDS_PER_HOUR) * 2);
  const hours = Math.floor(halfHours / 2);

  return halfHours % 2 === 0 ? `${hours}h` : `${hours}½h`;
};

/**
 * Picks the category the badge shows: the user's preference when the game has data for
 * it, otherwise the first category that does.
 *
 * Without the fallback a game with only Main Story data would render a blank badge for
 * anyone whose default is Completionist — exactly the "grey badge with no number" the
 * reference extension is criticised for.
 */
export const resolveDisplayCategory = (
  times: HltbTimes,
  preferred: HltbCategory,
): HltbCategory | null =>
  times[preferred] !== null
    ? preferred
    : (HLTB_CATEGORIES.find((category) => times[category] !== null) ?? null);
