import { HltbCacheValue } from '@globalShared/hltb';
// @vitest-environment node
import { hltbCacheStorageItem } from '@globalShared/storage';

import { clearCache, readCache, resetHltbCache, writeCache } from '../cache';

const matched: HltbCacheValue = {
  kind: 'resolution',
  entry: {
    hltbId: 1,
    name: 'Braid',
    status: 'matched',
    times: { all: null, hundred: null, main: 3600, plus: null },
  },
};

describe('persistent HLTB cache', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    resetHltbCache();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('serializes independent tab writes and survives a worker restart', async () => {
    await Promise.all(
      Array.from({ length: 20 }, async (_, index) => {
        await writeCache(`resolution:${index}`, matched, 0);
      }),
    );
    resetHltbCache();
    for (let index = 0; index < 20; index += 1) {
      expect((await readCache(`resolution:${index}`)).value).toEqual(matched);
    }
  });

  it.each([
    ['resolution:matched', matched],
    [
      'resolution:negative',
      {
        entry: { status: 'no-match' },
        kind: 'resolution',
      },
    ],
    ['search:braid', { games: [matched.entry], kind: 'search' }],
    ['search:empty', { games: [], kind: 'search' }],
    ['year:braid', { kind: 'year', year: 2008 }],
    ['year:unknown', { kind: 'year', year: null }],
  ] as [string, HltbCacheValue][])(
    'keeps %s indefinitely, across writes and worker restarts',
    async (key, value) => {
      vi.useFakeTimers();
      await writeCache(key, value, 0);
      vi.advanceTimersByTime(20 * 365 * 86400000);
      await writeCache('year:another-game', { kind: 'year', year: 2020 }, 0);
      resetHltbCache();
      expect((await readCache(key)).value).toEqual(value);
      expect((await hltbCacheStorageItem.getValue()).entries[key]).toEqual(
        value,
      );
    },
  );

  it('rejects old writes after cache reset and persists new ones', async () => {
    await writeCache('resolution:1', matched, 0);
    await clearCache();
    await writeCache('resolution:2', matched, 0);
    const { revision, value } = await readCache('resolution:2');
    expect(value).toBeNull();
    await writeCache('resolution:3', matched, revision);
    resetHltbCache();
    expect((await readCache('resolution:1')).value).toBeNull();
    expect((await readCache('resolution:3')).value).toEqual(matched);
  });

  it('discards corrupt entries instead of breaking lookups', async () => {
    await hltbCacheStorageItem.setValue({
      blockedUntil: 0,
      revision: 0,
      entries: {
        invalid: { entry: {}, kind: 'resolution' },
      },
    } as never);
    expect((await readCache('invalid')).value).toBeNull();
  });

  it('keeps memory lookups working when persistence fails', async () => {
    vi.spyOn(hltbCacheStorageItem, 'setValue').mockRejectedValue(
      new Error('quota'),
    );
    await expect(writeCache('resolution:1', matched, 0)).rejects.toThrow(
      'quota',
    );
    expect((await readCache('resolution:1')).value).toEqual(matched);
  });

  it('preserves previously saved data when a new write reaches the browser quota', async () => {
    await writeCache('resolution:1', matched, 0);
    vi.spyOn(hltbCacheStorageItem, 'setValue').mockRejectedValue(
      new Error('quota'),
    );
    await expect(
      writeCache('year:braid', { kind: 'year', year: 2008 }, 0),
    ).rejects.toThrow('quota');
    resetHltbCache();
    expect((await readCache('resolution:1')).value).toEqual(matched);
  });
});
