import { HltbTimes } from '@globalShared/hltb';

import { formatDuration, resolveDisplayCategory } from '../format';

// Compact minute and half-hour formatting for cover buttons.
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
