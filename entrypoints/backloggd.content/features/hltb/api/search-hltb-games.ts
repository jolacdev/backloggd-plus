import {
  HLTB_SEARCH_MESSAGE_TYPE,
  HltbSearchRequest,
  HltbSearchResponse,
} from '@globalShared/types/hltb';

const UNAVAILABLE: HltbSearchResponse = {
  reason: 'service-unavailable',
  status: 'unavailable',
};

/**
 * The content script cannot call HowLongToBeat itself: the API returns no CORS headers and
 * 404s on preflight, so a background fetch with host permissions is the only path.
 *
 * Never rejects. A worker that is asleep, restarting or gone after an extension update
 * resolves as unavailable, which renders as "no badge" rather than a stuck one.
 */
export const searchHltbGames = async (
  title: string,
): Promise<HltbSearchResponse> => {
  const request: HltbSearchRequest = { title, type: HLTB_SEARCH_MESSAGE_TYPE };

  try {
    const response: unknown = await browser.runtime.sendMessage(request);

    return typeof response === 'object' &&
      response !== null &&
      'status' in response
      ? (response as HltbSearchResponse)
      : UNAVAILABLE;
  } catch {
    return UNAVAILABLE;
  }
};
