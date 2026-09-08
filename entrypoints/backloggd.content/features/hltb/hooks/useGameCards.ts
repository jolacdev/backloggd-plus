import { debugLog } from '@globalShared/utils/debug';

import { RegisteredCard } from '../types';
import {
  areSameCards,
  isCardMutation,
  OBSERVED_CARD_ATTRIBUTE,
  scanCards,
} from '../utils/cards';

const RESCAN_DEBOUNCE_MS = 100;

/** Stable identity, so a disabled layer never re-renders on it. */
const NO_CARDS: RegisteredCard[] = [];

/**
 * Tracks every game card on the page, while `isEnabled` holds.
 *
 * Backloggd uses `turbo-refresh-method: morph`, so filtering and sorting **patch nodes in
 * place**: a `turbo:load` listener alone misses the cards they produce, which is exactly
 * why the reference extension needs a manual refresh.
 *
 * The scan is idempotent by construction — it rebuilds from the DOM rather than tracking
 * what it has seen, so a morphed or re-attached node is never double-processed or dropped.
 */
const useGameCards = (isEnabled: boolean): RegisteredCard[] => {
  const [cards, setCards] = useState<RegisteredCard[]>(NO_CARDS);

  useEffect(() => {
    if (!isEnabled) return undefined;

    let rescanTimer: null | ReturnType<typeof setTimeout> = null;

    const rescan = () => {
      const found = scanCards();

      setCards((current) => {
        if (areSameCards(current, found)) return current;

        debugLog('cards', 'registry changed', {
          from: current.length,
          to: found.length,
        });

        return found;
      });
    };

    rescan();

    const observer = new MutationObserver((records) => {
      if (rescanTimer || !records.some(isCardMutation)) return;

      rescanTimer = setTimeout(() => {
        rescanTimer = null;
        rescan();
      }, RESCAN_DEBOUNCE_MS);
    });

    // NOTE: `document.body`, deliberately not the library container — Backloggd's sort
    // and filter links are Turbo *frame* navigations that replace the container itself, so
    // an observer bound to it would be left watching a detached node and never fire again.
    // Symptom: badges on a direct load of a filtered URL, none when navigating to one.
    observer.observe(document.body, {
      attributeFilter: [OBSERVED_CARD_ATTRIBUTE],
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (rescanTimer) clearTimeout(rescanTimer);
    };
  }, [isEnabled]);

  // Derived rather than cleared on disable: the effect's own `rescan` is the only writer,
  // so a stale list can never be handed out while the feature is off.
  return isEnabled ? cards : NO_CARDS;
};

export default useGameCards;
