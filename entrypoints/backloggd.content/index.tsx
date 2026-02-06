import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot, type Root } from 'react-dom/client';

import i18n from '@globalShared/i18n';

import App from './App';
import { queryClient } from './lib/react-query';
import { hasUrlChanged } from './utils/url';
import { isCurrentUserProfilePage } from './utils/user';

export default defineContentScript({
  // TODO: Check if specifically filter profile pages here.
  // If so, remove from isCurrentUserProfilePage logic
  matches: ['*://backloggd.com/*', '*://*.backloggd.com/*'],

  main(ctx) {
    i18n.options.defaultNS = 'content'; // NOTE: Set 'content' as default namespace for this entrypoint.

    const inject = () => {
      // Restrict to the logged-in user that is in their own profile pages.
      if (!isCurrentUserProfilePage()) {
        return;
      }

      const testElement = document.getElementById('testButton');
      const anchor = document.getElementById('add-a-game');

      // Avoid duplicate injections or missing anchor.
      if (testElement || !anchor) {
        return;
      }

      const ui = createIntegratedUi(ctx, {
        anchor,
        append: 'after',
        position: 'inline', // NOTE: Adds inline styles to the container depending on the value.
        onMount: (container) => {
          // Container inline styles.
          container.style.display = 'inline-flex';
          container.style.marginLeft = '10px';

          const root = createRoot(container);
          root.render(
            <QueryClientProvider client={queryClient}>
              <App />
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
