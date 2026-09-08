// @vitest-environment node
// NOTE: `fakeBrowser` loads WXT's test utilities, which pull in esbuild — and esbuild
// refuses to run under jsdom's TextEncoder. The cache is pure storage logic with no DOM
// involvement, so this suite runs in Node instead.
import { hltbResolutionsStorageItem } from '@globalShared/storage';
import { HltbCacheEntry } from '@globalShared/types/hltb';

import {
  flushResolutionCache,
  getCachedResolution,
  loadResolutionCache,
  resetResolutionCache,
  setCachedResolution,
} from '../cache';

const DAY_MS = 24 * 60 * 60 * 1000;
const FLUSH_THRESHOLD = 25;

const matchedEntry = (resolvedAt = Date.now()): HltbCacheEntry => ({
  hltbId: 26286,
  name: 'Hollow Knight',
  resolvedAt,
  status: 'matched',
  times: { all: 150549, hundred: 236141, main: 97204, plus: 149763 },
  year: 2017,
});

const unmatchedEntry = (resolvedAt = Date.now()): HltbCacheEntry => ({
  resolvedAt,
  status: 'no-match',
});

describe('resolution cache', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    resetResolutionCache();
  });

  // Revisiting a library must issue no requests at all.
  it('serves a stored entry without re-resolving it', async () => {
    await hltbResolutionsStorageItem.setValue({ '14593': matchedEntry() });
    await loadResolutionCache();

    expect(getCachedResolution('14593')).toMatchObject({ status: 'matched' });
  });

  // Matched entries last 30 days; unmatched only 7, so a game HowLongToBeat adds later is
  // picked up within the week.
  it.each([
    ['a matched entry', matchedEntry(Date.now() - 29 * DAY_MS), true],
    ['a stale matched entry', matchedEntry(Date.now() - 31 * DAY_MS), false],
    ['an unmatched entry', unmatchedEntry(Date.now() - 6 * DAY_MS), true],
    ['a stale unmatched entry', unmatchedEntry(Date.now() - 8 * DAY_MS), false],
  ])('serves %s: %s', async (_unused, entry, isServed) => {
    await hltbResolutionsStorageItem.setValue({ '14593': entry });
    await loadResolutionCache();

    expect(getCachedResolution('14593')).toEqual(isServed ? entry : undefined);
  });

  // The whole map is a single storage value, so persisting per game would re-serialize the
  // entire cache on every match.
  it('batches writes rather than persisting per game', async () => {
    await loadResolutionCache();
    const setValue = vi.spyOn(hltbResolutionsStorageItem, 'setValue');

    setCachedResolution('14593', matchedEntry());
    setCachedResolution('1020', matchedEntry());
    expect(setValue).not.toHaveBeenCalled();

    await flushResolutionCache();

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(await hltbResolutionsStorageItem.getValue()).toHaveProperty('1020');
  });

  // A fast scroll can settle more games than one debounce window would hold.
  it('flushes on its own once enough resolutions accumulate', async () => {
    await loadResolutionCache();
    const setValue = vi.spyOn(hltbResolutionsStorageItem, 'setValue');

    for (let index = 0; index < FLUSH_THRESHOLD; index += 1) {
      setCachedResolution(`game-${index}`, matchedEntry());
    }

    expect(setValue).toHaveBeenCalledTimes(1);
  });
});
