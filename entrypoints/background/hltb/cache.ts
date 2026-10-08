import {
  HltbCacheRead,
  HltbCacheState,
  HltbCacheValue,
  isHltbCacheValue,
  isRecord,
} from '@globalShared/hltb';
import { logger } from '@globalShared/logger';
import {
  hltbCacheRevisionStorageItem,
  hltbCacheStorageItem,
} from '@globalShared/storage';

let state: HltbCacheState | undefined;
let loading: Promise<HltbCacheState> | undefined;
let writes = Promise.resolve();

const load = async (): Promise<HltbCacheState> => {
  if (state) return state;
  loading ??= hltbCacheStorageItem
    .getValue()
    .then((stored: unknown) => {
      const next: HltbCacheState = {
        ...hltbCacheStorageItem.fallback,
        entries: {},
      };
      if (isRecord(stored)) {
        if (
          typeof stored.revision === 'number' &&
          Number.isFinite(stored.revision)
        ) {
          next.revision = stored.revision;
        }
        if (
          typeof stored.blockedUntil === 'number' &&
          Number.isFinite(stored.blockedUntil)
        ) {
          next.blockedUntil = stored.blockedUntil;
        }
        if (isRecord(stored.entries)) {
          next.entries = Object.fromEntries(
            Object.entries(stored.entries).filter(
              (entry): entry is [string, HltbCacheValue] =>
                isHltbCacheValue(entry[1]),
            ),
          );
        }
      }
      state = next;
      return next;
    })
    .catch((error: unknown) => {
      logger.error('Failed to load saved HLTB data:', error);
      state = { ...hltbCacheStorageItem.fallback, entries: {} };
      return state;
    });
  return await loading;
};

/** Serialize writes and await persistence before replying; keep memory on storage errors. */
const mutate = async (update: (cache: HltbCacheState) => void) => {
  const write = writes.then(async () => {
    const cache = await load();
    update(cache);
    await hltbCacheStorageItem.setValue(structuredClone(cache));
  });
  writes = write.catch((error: unknown) =>
    logger.error('Failed to save HLTB data:', error),
  );
  await write;
};

export const readCache = async (key: string): Promise<HltbCacheRead> => {
  const cache = await load();
  return { revision: cache.revision, value: cache.entries[key] ?? null };
};

export const writeCache = async (
  key: string,
  value: HltbCacheValue,
  revision: number,
) => {
  await mutate((cache) => {
    // A lookup started before a user reset must not refill the cleared cache.
    if (cache.revision === revision) cache.entries[key] = value;
  });
};

export const getBlockedUntil = async () => (await load()).blockedUntil;

export const setBlockedUntil = async (until: number) => {
  await mutate((cache) => {
    cache.blockedUntil = until;
  });
};

export const clearCache = async () => {
  let revision = 0;
  await mutate((cache) => {
    cache.entries = {};
    cache.blockedUntil = 0;
    cache.revision = Math.max(Date.now(), cache.revision + 1);
    revision = cache.revision;
  });
  await hltbCacheRevisionStorageItem.setValue(revision);
};

/** Test helper simulating a worker restart; saved values remain intact. */
export const resetHltbCache = () => {
  state = undefined;
  loading = undefined;
  writes = Promise.resolve();
};
