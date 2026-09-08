/**
 * Backloggd changes pages in three ways, and each announces itself differently:
 *
 * | change | event |
 * | --- | --- |
 * | full Turbo Drive visit | `turbo:load` |
 * | morph refresh (`turbo-refresh-method: morph`) | `turbo:render` |
 * | Turbo **frame** navigation | `turbo:frame-load` (bubbles to `document`) |
 *
 * The library's own sort and filter links are the third kind: they carry
 * `data-turbo-frame` with `data-turbo-action="advance"`, so the URL changes via
 * `pushState` and only the frame re-renders — `turbo:load` never fires. Listening to it
 * alone is why navigating to `/u/:user/games/added/type:playing/` used to leave the page
 * without badges while loading that same URL directly worked.
 */
const PAGE_CHANGE_EVENTS = ['turbo:load', 'turbo:render', 'turbo:frame-load'];

/** Subscribes to every kind of Backloggd navigation. Returns an unsubscribe function. */
export const subscribeToPageChanges = (onPageChange: () => void) => {
  PAGE_CHANGE_EVENTS.forEach((eventName) => {
    document.addEventListener(eventName, onPageChange);
  });

  // Back/forward through frame navigations, which `pushState` alone does not announce.
  window.addEventListener('popstate', onPageChange);

  return () => {
    PAGE_CHANGE_EVENTS.forEach((eventName) => {
      document.removeEventListener(eventName, onPageChange);
    });

    window.removeEventListener('popstate', onPageChange);
  };
};
