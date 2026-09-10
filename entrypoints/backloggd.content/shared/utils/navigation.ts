// Backloggd uses Turbo: full page loads emit 'turbo:load', while in-page filter
// and sort controls navigate a Turbo *frame* and only emit 'turbo:frame-load'.
const PAGE_CHANGE_EVENTS = ['turbo:load', 'turbo:render', 'turbo:frame-load'];

/**
 * Subscribes to every navigation event Backloggd can produce.
 *
 * @param onPageChange - Called after each navigation.
 * @returns An unsubscribe function that removes every listener.
 */
export const subscribeToPageChanges = (onPageChange: () => void) => {
  PAGE_CHANGE_EVENTS.forEach((event) =>
    document.addEventListener(event, onPageChange),
  );
  // Back/forward navigation through frame navigations does not re-emit Turbo events.
  window.addEventListener('popstate', onPageChange);

  return () => {
    PAGE_CHANGE_EVENTS.forEach((event) =>
      document.removeEventListener(event, onPageChange),
    );
    window.removeEventListener('popstate', onPageChange);
  };
};
