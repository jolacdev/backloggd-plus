import { ContentScriptContext } from '#imports';
import { createRoot } from 'react-dom/client';

import i18n from '@globalShared/i18n';

import App from './App';
import { hasUrlChanged, isCurrentPathname } from './shared/utils/url';
import { getLoggedInUsername } from './shared/utils/user';

import css from './style.css?inline'; // NOTE: Imports CSS file as a string.

// TODO: Check if move to constants
const INJECTED_ROOT_ELEMENT = 'backloggd-plus-ui';
const SETTINGS_DATA_PATHNAME = '/settings/data/';

const createUi = async (
  ctx: ContentScriptContext,
  options: { anchor: Element; username: string },
) =>
  await createShadowRootUi(ctx, {
    anchor: options.anchor,
    append: 'after',
    css,
    name: INJECTED_ROOT_ELEMENT,
    position: 'inline', // NOTE: Adds inline styles to the container depending on the value.
    onMount: (container) => {
      // NOTE: Use container inline style by using `container.style`.

      const root = createRoot(container);
      root.render(<App username={options.username} />);

      return root;
    },
    onRemove: (root) => {
      root?.unmount();
    },
  });

// TODO: Check support for development hot reload. Check ui.remove(); || ui = null;
export default defineContentScript({
  // NOTE: Matches all pages to trigger on SPA navigation. Injection conditions are handled separately.
  matches: ['*://backloggd.com/*', '*://*.backloggd.com/*'],

  main(ctx) {
    i18n.options.defaultNS = 'content'; // NOTE: Set 'content' as default namespace for this entrypoint.

    const inject = async () => {
      if (!isCurrentPathname(SETTINGS_DATA_PATHNAME)) {
        return;
      }

      const username = getLoggedInUsername();
      if (!username) {
        return;
      }

      const injectedRootElement = document.querySelector(INJECTED_ROOT_ELEMENT);
      const dataManagementSubtitleRow = document.querySelector(
        '#settings-navigation + div > #log-in .row.mb-4',
      );

      // Avoid duplicate injections or missing anchor.
      if (injectedRootElement || !dataManagementSubtitleRow) {
        return;
      }

      const ui = await createUi(ctx, {
        anchor: dataManagementSubtitleRow,
        username,
      });

      ui.mount();
    };

    // Initial injection
    inject();

    // NOTE: Backloggd uses Turbo, so we could listen to 'turbo:render' to detect page changes, refresh UI injections, etc.
    // If content uses event listeners, it should check context invalidations to clean them up accordingly.

    let url = location.href;

    const monitorChanges = () => {
      if (ctx.isInvalid) {
        return;
      }

      // TODO: Navigating to the same URL causes the UI to be unmounted. Check how to re-inject.
      if (hasUrlChanged(url)) {
        url = location.href;
        inject();
      }

      ctx.requestAnimationFrame(monitorChanges);
    };

    ctx.requestAnimationFrame(monitorChanges);
  },
});
