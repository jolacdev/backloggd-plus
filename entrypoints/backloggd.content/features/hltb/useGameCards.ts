export type GameCardMeta = { igdbId: string; slug: string; title: string };
export type RegisteredCard = {
  element: Element;
  key: string;
  meta: GameCardMeta;
  mountPoint: Element;
};

const CARD_SELECTOR = '.card.game-cover[game_id]';
const BADGE_SELECTOR = 'toolkittd-hltb-badge';
const NO_CARDS: RegisteredCard[] = [];
const elementIds = new WeakMap<Element, number>();
let nextId = 0;
const getElementId = (element: Element) => {
  if (!elementIds.has(element)) elementIds.set(element, ++nextId);
  return elementIds.get(element);
};

export const getGameCardMeta = (card: Element): GameCardMeta | null => {
  const igdbId = card.getAttribute('game_id')?.trim();
  const title =
    card.querySelector('img.card-img')?.getAttribute('alt')?.trim() ||
    card.querySelector('.game-text-centered')?.textContent?.trim();
  if (!igdbId || !/^\d+$/.test(igdbId) || !title) return null;
  const href = card.querySelector('a.cover-link')?.getAttribute('href') ?? '';
  return { igdbId, slug: href.match(/^\/games\/([^/?#]+)/)?.[1] ?? '', title };
};

const scanCards = (): RegisteredCard[] =>
  [...document.querySelectorAll(CARD_SELECTOR)].flatMap((element) => {
    const meta = getGameCardMeta(element);
    if (!meta) return [];
    const mountPoint = element.querySelector('.overflow-wrapper') ?? element;
    const key = `${getElementId(element)}:${getElementId(mountPoint)}:${meta.igdbId}:${meta.slug}:${meta.title}`;
    return [{ element, key, meta, mountPoint }];
  });

/** Ignore our own badge mounts and unrelated page changes. */
const isCardMutation = (record: MutationRecord) => {
  if (record.type === 'attributes' && record.attributeName === 'game_id') {
    return true;
  }
  const nodes = [...record.addedNodes, ...record.removedNodes];
  if (
    record.target instanceof Element &&
    record.target.closest(CARD_SELECTOR)
  ) {
    return (
      record.type === 'attributes' ||
      nodes.some(
        (node) => !(node instanceof Element && node.matches(BADGE_SELECTOR)),
      )
    );
  }
  return nodes.some(
    (node) =>
      node instanceof Element &&
      (node.matches(CARD_SELECTOR) || node.querySelector(CARD_SELECTOR)),
  );
};

/** Rescan after Turbo appends, replaces, or morphs cards in either collection mode. */
const useGameCards = (isEnabled: boolean): RegisteredCard[] => {
  const [cards, setCards] = useState(NO_CARDS);
  useEffect(() => {
    if (!isEnabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let shouldRestoreBadges = false;
    const rescan = () => {
      const found = scanCards();
      const shouldRestore = shouldRestoreBadges;
      setCards((current) =>
        !shouldRestore &&
        current.length === found.length &&
        current.every((card, index) => card.key === found[index].key)
          ? current
          : found,
      );
      shouldRestoreBadges = false;
      timer = undefined;
    };
    rescan();
    const observer = new MutationObserver((records) => {
      // A morph can remove a live host without changing the card or its metadata.
      shouldRestoreBadges ||= records.some(
        (record) =>
          record.target instanceof Element &&
          record.target.isConnected &&
          record.target.closest(CARD_SELECTOR) &&
          !record.target.querySelector(BADGE_SELECTOR) &&
          [...record.removedNodes].some(
            (node) =>
              node instanceof Element &&
              node.matches(BADGE_SELECTOR) &&
              node.shadowRoot,
          ),
      );
      if (!timer && (shouldRestoreBadges || records.some(isCardMutation))) {
        timer = setTimeout(rescan, 100);
      }
    });
    // Frame navigation can replace the library container itself.
    observer.observe(document.documentElement, {
      attributeFilter: ['game_id', 'alt', 'href'],
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [isEnabled]);
  return isEnabled ? cards : NO_CARDS;
};

export default useGameCards;
