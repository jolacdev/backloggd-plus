import { HLTB_CATEGORIES, HltbCategory, HltbTimes } from '@globalShared/hltb';

const SECONDS_PER_HOUR = 3600;

/** Compact completion time, rounded to minutes or half-hours. */
export const formatDuration = (seconds: null | number): null | string => {
  if (!seconds || seconds <= 0) return null;
  if (seconds < SECONDS_PER_HOUR) {
    return `${Math.max(1, Math.round(seconds / 60))}m`;
  }

  const halfHours = Math.round((seconds / SECONDS_PER_HOUR) * 2);
  const hours = Math.floor(halfHours / 2);

  return halfHours % 2 === 0 ? `${hours}h` : `${hours}½h`;
};

/** Use the preferred category, then the first category with a usable estimate. */
export const resolveDisplayCategory = (
  times: HltbTimes,
  preferred: HltbCategory,
): HltbCategory | null =>
  times[preferred] !== null
    ? preferred
    : (HLTB_CATEGORIES.find((category) => times[category] !== null) ?? null);
