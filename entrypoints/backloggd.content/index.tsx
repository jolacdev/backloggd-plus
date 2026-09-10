import { ContentScriptContext } from '#imports';
import { createRoot } from 'react-dom/client';

import i18n from '@globalShared/i18n';

import App from './App';
import ExportSection from './features/export/components/ExportSection';
import ListExportButton from './features/list-export/ListExportButton';
import { subscribeToPageChanges } from './shared/utils/navigation';
import { getListRouteParams, isCurrentPathname } from './shared/utils/url';
import { getLoggedInUsername } from './shared/utils/user';

import css from './style.css?inline'; // NOTE: Imports CSS file as a string.

const EXPORT_ROOT_ELEMENT = 'backloggd-plus-ui';
const LIST_EXPORT_ROOT_ELEMENT = 'backloggd-plus-list-export';

const SETTINGS_DATA_PATHNAME = '/settings/data/';

const EXPORT_ANCHOR_SELECTOR = '#settings-navigation + div > #log-in .row.mb-4';
// Backloggd only renders the edit link for the list owner, which also makes it a
// natural anchor for an owner-only action. Standard lists put it in the desktop
// sidebar; GOTY lists have no sidebar and put it in the header block instead.
const LIST_EXPORT_ANCHOR_SELECTOR = [
  '#desktop-detail-sidebar a[href$="/edit/"]',
  '.goty-list-creation-info a[href$="/edit/"]',
].join(', ');

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
      root.render(
        <App>
          <ExportSection username={options.username} />
        </App>,
      );

      return root;
    },
    onRemove: (root) => {
      root?.unmount();
    },
  });

const createListExportUi = async (
  ctx: ContentScriptContext,
  options: { anchor: Element },
) =>
  await createShadowRootUi(ctx, {
    anchor: options.anchor,
    append: 'after',
    css,
    name: LIST_EXPORT_ROOT_ELEMENT,
    position: 'inline',
    onMount: (container) => {
      const root = createRoot(container);
      root.render(
        <App>
          <ListExportButton />
        </App>,
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

    let exportUi: Awaited<ReturnType<typeof createExportUi>> | null = null;
    let listExportUi: Awaited<ReturnType<typeof createListExportUi>> | null =
      null;

    // Turbo emits several navigation events in quick succession, and creating a
    // shadow root is async, so a re-entrancy guard is needed per UI.
    let isCreatingExportUi = false;
    let isCreatingListExportUi = false;

    const injectExportUi = async () => {
      if (!isCurrentPathname(SETTINGS_DATA_PATHNAME)) {
        exportUi?.remove();
        exportUi = null;
        return;
      }

      const username = getLoggedInUsername();
      if (!username) return;

      // Avoid duplicate injections.
      if (isCreatingExportUi || document.querySelector(EXPORT_ROOT_ELEMENT)) {
        return;
      }

      const anchor = document.querySelector(EXPORT_ANCHOR_SELECTOR);
      if (!anchor) return;

      isCreatingExportUi = true;
      try {
        exportUi = await createExportUi(ctx, { anchor, username });
        exportUi.mount();
      } finally {
        isCreatingExportUi = false;
      }
    };

    const injectListExportUi = async () => {
      const listRouteParams = getListRouteParams();
      const loggedInUsername = getLoggedInUsername();

      // Only the list owner can export, for now.
      const isOwnList =
        !!listRouteParams &&
        !!loggedInUsername &&
        listRouteParams.username.toLowerCase() ===
          loggedInUsername.toLowerCase();

      if (!isOwnList) {
        listExportUi?.remove();
        listExportUi = null;
        return;
      }

      if (
        isCreatingListExportUi ||
        document.querySelector(LIST_EXPORT_ROOT_ELEMENT)
      ) {
        return;
      }

      const anchor = document
        .querySelector(LIST_EXPORT_ANCHOR_SELECTOR)
        ?.closest('.row');
      if (!anchor) return;

      isCreatingListExportUi = true;
      try {
        listExportUi = await createListExportUi(ctx, { anchor });
        listExportUi.mount();
      } finally {
        isCreatingListExportUi = false;
      }
    };

    const inject = () => {
      void injectExportUi();
      void injectListExportUi();
    };

    // Initial injection
    inject();

    // NOTE: Backloggd uses Turbo, so navigation is detected through its events.
    const unsubscribeFromPageChanges = subscribeToPageChanges(() => {
      // Safety check: Exit if the extension context is dead
      if (ctx.isInvalid) {
        unsubscribeFromPageChanges();
        return;
      }

      // If Turbo re-renders, the DOM elements are replaced even if the URL is identical, therefore, we proceed to re-inject.
      inject();
    });
  },
});
