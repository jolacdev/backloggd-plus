import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot, type Root } from 'react-dom/client';

import i18n from '@globalShared/i18n';

import App from './App';
import { queryClient } from './lib/react-query';
import { hasUrlChanged } from './utils/url';
import { getLoggedInUsername } from './utils/user';

import css from './style.css?inline'; // NOTE: Imports CSS file as a string.

// TODO: Check if move to constants
const INJECTED_ROOT_ELEMENT = 'backloggd-plus-ui';

// TODO: Check support for development hot reload. Check ui.remove(); || ui = null;
export default defineContentScript({
  matches: ['*://backloggd.com/*', '*://*.backloggd.com/*'],

  main(ctx) {
    i18n.options.defaultNS = 'content'; // NOTE: Set 'content' as default namespace for this entrypoint.

    const inject = async () => {
      const username = getLoggedInUsername();
      if (!username) {
        return;
      }

      const injectedRootElement = document.querySelector(INJECTED_ROOT_ELEMENT);
      const navbarDropdownDividerAnchor = document.querySelector(
        '#navbarDropdown + .dropdown-menu > .dropdown-divider:last-of-type',
      );

      // Avoid duplicate injections or missing anchor.
      if (injectedRootElement || !navbarDropdownDividerAnchor) {
        return;
      }

      const ui = await createShadowRootUi(ctx, {
        anchor: navbarDropdownDividerAnchor,
        append: 'after',
        css,
        name: INJECTED_ROOT_ELEMENT,
        position: 'inline', // NOTE: Adds inline styles to the container depending on the value.
        onMount: (container) => {
          // NOTE: Use container inline style by using `container.style`.

          const root = createRoot(container);
          root.render(
            <QueryClientProvider client={queryClient}>
              <App username={username} />
            </QueryClientProvider>,
          );

          return root;
        },
        onRemove: (root: Root | undefined) => {
          root?.unmount();
        },
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

      if (hasUrlChanged(url)) {
        url = location.href;
        inject();
      }

      ctx.requestAnimationFrame(monitorChanges);
    };

    ctx.requestAnimationFrame(monitorChanges);
  },
});
