import { ContentScriptContext } from '#imports';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import i18n from '@globalShared/i18n';

import App from './App';
import HltbLayer from './features/hltb/components/HltbLayer';
import { queryClient } from './lib/react-query';
import { subscribeToPageChanges } from './shared/utils/navigation';
import { isCurrentPathname } from './shared/utils/url';
import { getLoggedInUsername } from './shared/utils/user';

import css from './style.css?inline'; // NOTE: Imports CSS file as a string.

const EXPORT_ROOT_ELEMENT = 'backloggd-plus-ui';
const HLTB_ROOT_ELEMENT = 'backloggd-plus-hltb';
const SETTINGS_DATA_PATHNAME = '/settings/data/';

const createExportUi = async (
  ctx: ContentScriptContext,
  options: { anchor: Element; username: string },
) =>
  await createShadowRootUi(ctx, {
    anchor: options.anchor,
    append: 'after',
    css,
    name: EXPORT_ROOT_ELEMENT,
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

const createHltbUi = async (ctx: ContentScriptContext) =>
  await createShadowRootUi(ctx, {
    anchor: 'body',
    append: 'last',
    css,
    name: HLTB_ROOT_ELEMENT,
    position: 'inline',
    onMount: (container) => {
      // A zero-footprint fixed layer. Only the tooltip is ever painted, and it must not
      // intercept clicks meant for Backloggd — the badges themselves are portaled into the
      // page's own cards, not rendered here.
      container.style.position = 'fixed';
      container.style.inset = '0';
      container.style.zIndex = '2147483000';
      container.style.pointerEvents = 'none';

      const root = createRoot(container);
      root.render(
        <QueryClientProvider client={queryClient}>
          <HltbLayer />
        </QueryClientProvider>,
      );

      return root;
    },
    onRemove: (root) => {
      root?.unmount();
    },
  });

export default defineContentScript({
  // NOTE: Matches all pages to trigger on SPA navigation. Injection conditions are handled separately.
  matches: ['*://backloggd.com/*', '*://*.backloggd.com/*'],

  main(ctx) {
    i18n.options.defaultNS = 'content'; // NOTE: Set 'content' as default namespace for this entrypoint.

    let hltbUi: Awaited<ReturnType<typeof createHltbUi>> | null = null;
    let isCreatingHltbUi = false;

    const injectExportUi = async () => {
      if (!isCurrentPathname(SETTINGS_DATA_PATHNAME)) return;

      const username = getLoggedInUsername();
      if (!username) return;

      const injectedRootElement = document.querySelector(EXPORT_ROOT_ELEMENT);
      const dataManagementSubtitleRow = document.querySelector(
        '#settings-navigation + div > #log-in .row.mb-4',
      );

      // Avoid duplicate injections or missing anchor.
      if (injectedRootElement || !dataManagementSubtitleRow) return;

      const ui = await createExportUi(ctx, {
        anchor: dataManagementSubtitleRow,
        username,
      });

      ui.mount();
    };

    /**
     * Mounted once and left alone: the layer itself tracks the route and renders nothing
     * off the library, so there is no per-navigation teardown to get wrong.
     *
     * A full Turbo Drive visit replaces `<body>` and takes the shadow host with it, which
     * `isConnected` detects — the handle alone would still look valid.
     */
    const injectHltbUi = async () => {
      if (isCreatingHltbUi || hltbUi?.shadowHost.isConnected) return;

      // Turbo can fire several navigation events in quick succession; without this guard
      // two of them could both pass the check above before the first finishes creating.
      isCreatingHltbUi = true;

      try {
        hltbUi = await createHltbUi(ctx);
        hltbUi.mount();
      } finally {
        isCreatingHltbUi = false;
      }
    };

    const inject = () => {
      injectExportUi();
      injectHltbUi();
    };

    // Initial injection
    inject();

    let unsubscribeFromPageChanges = () => {};

    const handlePageChange = () => {
      // Safety check: Exit if the extension context is dead
      if (ctx.isInvalid) {
        unsubscribeFromPageChanges();
        return;
      }

      // If Turbo re-renders, the DOM elements are replaced even if the URL is identical, therefore, we proceed to re-inject.
      inject();
    };

    unsubscribeFromPageChanges = subscribeToPageChanges(handlePageChange);
  },
});
