import { HltbRequest, isHltbCacheValue, isRecord } from '@globalShared/hltb';
import { logger } from '@globalShared/logger';

import { clearCache, readCache, writeCache } from './hltb/cache';
import { installHltbHeaders } from './hltb/client';
import { resetHltbFailures, searchGames } from './hltb/service';

const isCacheKey = (key: unknown): key is string =>
  typeof key === 'string' &&
  key.length <= 1000 &&
  /^(resolution|year):/.test(key);

const isRequest = (message: unknown): message is HltbRequest => {
  if (!isRecord(message)) return false;
  switch (message.type) {
    case 'hltb:search':
      return typeof message.title === 'string' && message.title.length <= 300;
    case 'hltb:cache:get':
      return isCacheKey(message.key);
    case 'hltb:cache:set':
      return (
        isCacheKey(message.key) &&
        typeof message.revision === 'number' &&
        Number.isFinite(message.revision) &&
        isHltbCacheValue(message.value) &&
        ((message.key.startsWith('resolution:') &&
          message.value.kind === 'resolution') ||
          (message.key.startsWith('year:') && message.value.kind === 'year'))
      );
    case 'hltb:cache:clear':
      return true;
    default:
      return false;
  }
};

export default defineBackground(() => {
  const headersReady = installHltbHeaders()
    .then(() => true)
    .catch((error: unknown) => {
      logger.error('Failed to configure HowLongToBeat requests:', error);
      return false;
    });

  const handleRequest = async (request: HltbRequest) => {
    switch (request.type) {
      case 'hltb:search': {
        if (!(await headersReady)) {
          return { reason: 'service-unavailable', status: 'unavailable' };
        }
        return await searchGames(request.title);
      }
      case 'hltb:cache:get':
        return await readCache(request.key);
      case 'hltb:cache:set':
        await writeCache(request.key, request.value, request.revision);
        return { status: 'ok' };
      case 'hltb:cache:clear':
        await clearCache();
        resetHltbFailures();
        return { status: 'ok' };
    }
  };

  // Callback responses also work on Chrome versions without Promise listeners.
  browser.runtime.onMessage.addListener(
    (message: unknown, sender, sendResponse) => {
      if (sender.id !== browser.runtime.id || !isRequest(message)) {
        return undefined;
      }
      handleRequest(message)
        .then(sendResponse)
        .catch(() =>
          sendResponse({
            reason: 'service-unavailable',
            status: 'unavailable',
          }),
        );
      return true;
    },
  );
});
