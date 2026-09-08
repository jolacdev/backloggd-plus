import { HltbTimes } from '@globalShared/types/hltb';

import { formatDuration, resolveDisplayCategory } from '../format';

// Four or five characters, so the badge never covers the cover art it sits on.
it.each([
  [null, null],
  [0, null],
  [-1, null],
  [1800, '30m'],
  [3600, '1h'],
  [43_200, '12h'],
  [45_000, '12½h'],
])('formatDuration(%s) renders %s', (seconds, expected) => {
  expect(formatDuration(seconds)).toBe(expected);
});

/**
 * Without the fallback, a game with only Main Story data would render a blank badge for
 * anyone whose default is Completionist — exactly the "grey badge with no number" the
 * reference extension is criticised for.
 */
describe('resolveDisplayCategory', () => {
  const times = (partial: Partial<HltbTimes>): HltbTimes => ({
    all: null,
    hundred: null,
    main: null,
    plus: null,
    ...partial,
  });

  it.each([
    [
      'uses the preferred category when it has data',
      { main: 1, plus: 2 },
      'plus',
    ],
    ['falls back to the first category with data', { main: 1 }, 'main'],
  ])('%s', (_unused, available, expected) => {
    expect(resolveDisplayCategory(times(available), 'plus')).toBe(expected);
  });

  it('returns null when the entry has no times at all', () => {
    expect(resolveDisplayCategory(times({}), 'main')).toBeNull();
  });
});
