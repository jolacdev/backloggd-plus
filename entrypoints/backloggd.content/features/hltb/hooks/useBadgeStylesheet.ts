import badgeCss from '../components/badge.css?inline'; // NOTE: Imports CSS file as a string.

const BADGE_STYLE_ELEMENT_ID = 'backloggd-plus-hltb-styles';

/**
 * Badges are portaled into Backloggd's light DOM, so their stylesheet has to live there
 * too — the Shadow Root's own styles cannot reach them. Injected once per page.
 */
const useBadgeStylesheet = () => {
  useEffect(() => {
    if (document.getElementById(BADGE_STYLE_ELEMENT_ID)) return undefined;

    const style = document.createElement('style');
    style.id = BADGE_STYLE_ELEMENT_ID;
    style.textContent = badgeCss;
    document.head.append(style);

    return () => {
      style.remove();
    };
  }, []);
};

export default useBadgeStylesheet;
