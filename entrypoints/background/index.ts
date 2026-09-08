import {
  HLTB_SEARCH_MESSAGE_TYPE,
  HltbSearchRequest,
} from '@globalShared/types/hltb';

import { searchGames } from './hltb/service';

/**
 * HowLongToBeat answers `403` to any request that does not carry
 * `Referer: https://howlongtobeat.com`. Measured, for the record:
 *
 * | request                                        | result |
 * | ---------------------------------------------- | ------ |
 * | correct `Referer` + a browser User-Agent       | 200    |
 * | `Origin` set but no `Referer`                  | 403    |
 * | `Referer: https://backloggd.com/`              | 403    |
 * | correct `Referer` but a non-browser User-Agent | 403    |
 *
 * So `Referer` is the gate, not `Origin`, and it cannot be set from JavaScript — it is a
 * forbidden header name for `fetch()` and the `referrer` init option is same-origin only.
 * It therefore has to be applied at the network layer.
 *
 * `User-Agent` is deliberately left alone: the handshake token embeds it, so the init call
 * and the search call must both be seen with the browser's real one.
 *
 * WXT targets MV3 for Chromium and MV2 for Firefox. MV3 has no blocking `webRequest` and
 * MV2 has no `declarativeNetRequest`, so both paths exist; the branch resolves at build
 * time, so only one is bundled.
 */
const HLTB_ORIGIN = 'https://howlongtobeat.com';
const REFERER_RULE_ID = 1;

const installRefererRule = async () => {
  try {
    if (import.meta.env.MANIFEST_VERSION === 3) {
      await browser.declarativeNetRequest.updateDynamicRules({
        // Passing the same id to both makes this idempotent across worker restarts.
        removeRuleIds: [REFERER_RULE_ID],
        addRules: [
          {
            id: REFERER_RULE_ID,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              requestHeaders: [
                { header: 'Referer', operation: 'set', value: HLTB_ORIGIN },
                { header: 'Origin', operation: 'set', value: HLTB_ORIGIN },
              ],
            },
            condition: {
              resourceTypes: ['xmlhttprequest'],
              urlFilter: '||howlongtobeat.com/*',
            },
          },
        ],
      } as Parameters<
        typeof browser.declarativeNetRequest.updateDynamicRules
      >[0]);

      return;
    }

    browser.webRequest.onBeforeSendHeaders.addListener(
      ({ requestHeaders }) => ({
        requestHeaders: [
          ...(requestHeaders ?? []).filter(
            ({ name }) => !/^(?:referer|origin)$/i.test(name),
          ),
          { name: 'Referer', value: HLTB_ORIGIN },
          { name: 'Origin', value: HLTB_ORIGIN },
        ],
      }),
      { urls: [`${HLTB_ORIGIN}/*`] },
      ['blocking', 'requestHeaders'],
    );
  } catch (error) {
    // Without the rule every call 403s and the circuit breaker opens, which degrades to
    // "no badges" rather than to a broken page.
    console.error('Failed to install the HowLongToBeat Referer rule:', error);
  }
};

const isSearchRequest = (message: unknown): message is HltbSearchRequest =>
  typeof message === 'object' &&
  message !== null &&
  (message as HltbSearchRequest).type === HLTB_SEARCH_MESSAGE_TYPE &&
  typeof (message as HltbSearchRequest).title === 'string';

export default defineBackground(() => {
  // Runs on every worker start, including after an MV3 service worker eviction.
  // `updateDynamicRules` is idempotent, so re-applying it is free.
  installRefererRule();

  browser.runtime.onMessage.addListener((message) => {
    if (!isSearchRequest(message)) return undefined;

    // NOTE: Returning a promise keeps the message channel open until it settles.
    // `searchGames` never rejects, so the content script always gets a typed response.
    return searchGames(message.title);
  });
});
