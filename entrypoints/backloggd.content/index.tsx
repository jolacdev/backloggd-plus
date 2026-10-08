import { ContentScriptContext } from '#imports';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import i18n from '@globalShared/i18n';
import { logger } from '@globalShared/logger';

import App from './App';
import Hltb from './features/hltb/Hltb';
import { queryClient } from './lib/react-query';
import { subscribeToPageChanges } from './shared/utils/navigation';
import { isCurrentPathname, isProfileGamesPage } from './shared/utils/url';
import { getLoggedInUsername } from './shared/utils/user';

import css from './style.css?inline'; // NOTE: Imports CSS file as a string.

const INJECTED_ROOT_ELEMENT = 'toolkittd-ui';
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
      container.dataset.theme = 'business'; // Set theme because :root selector misses the Shadow DOM.

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
    name: 'toolkittd-hltb',
    position: 'inline',
    onMount: (container) => {
      container.dataset.theme = 'business';
      Object.assign(container.style, {
        inset: '0',
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: '2147483000',
      });
      const root = createRoot(container);
      root.render(
        <QueryClientProvider client={queryClient}>
          <Hltb />
        </QueryClientProvider>,
      );
      return root;
    },
    onRemove: (root) => root?.unmount(),
  });

export default defineContentScript({
  // NOTE: Matches all pages to trigger on SPA navigation. Injection conditions are handled separately.
  matches: ['*://backloggd.com/*', '*://*.backloggd.com/*'],

  main(ctx) {
    i18n.options.defaultNS = 'content'; // NOTE: Set 'content' as default namespace for this entrypoint.

    let exportUi: Awaited<ReturnType<typeof createUi>> | undefined;
    let hltbUi: Awaited<ReturnType<typeof createHltbUi>> | undefined;
    let isCreatingExport = false;
    let isCreatingHltb = false;
    let generation = 0;

    const injectExport = async () => {
      if (!isCurrentPathname(SETTINGS_DATA_PATHNAME)) return;

      const username = getLoggedInUsername();
      if (!username) return;

      const injectedRootElement = document.querySelector(INJECTED_ROOT_ELEMENT);
      const dataManagementSubtitleRow = document.querySelector(
        '#settings-navigation + div > #log-in .row.mb-4',
      );

      // Avoid duplicate injections or missing anchor.
      if (
        isCreatingExport ||
        injectedRootElement ||
        !dataManagementSubtitleRow
      ) {
        return;
      }
      isCreatingExport = true;
      const startedAt = generation;

      try {
        const ui = await createUi(ctx, {
          anchor: dataManagementSubtitleRow,
          username,
        });

        if (
          ctx.isInvalid ||
          startedAt !== generation ||
          !dataManagementSubtitleRow.isConnected
        ) {
          ui.remove();
          return;
        }
        exportUi?.remove();
        exportUi = ui;
        ui.shadowHost.setAttribute('data-turbo-temporary', '');
        ui.mount();
      } catch (error) {
        console.error('Failed to inject Toolkittd UI:', error);
      } finally {
        isCreatingExport = false;
      }
    };

    const injectHltb = async () => {
      if (!isProfileGamesPage()) {
        hltbUi?.remove();
        hltbUi = undefined;
        return;
      }
      if (isCreatingHltb || hltbUi?.shadowHost.isConnected) return;
      isCreatingHltb = true;
      const startedAt = generation;
      try {
        hltbUi?.remove();
        const ui = await createHltbUi(ctx);
        if (
          ctx.isInvalid ||
          startedAt !== generation ||
          !isProfileGamesPage()
        ) {
          ui.remove();
          return;
        }
        hltbUi = ui;
        ui.shadowHost.setAttribute('data-turbo-temporary', '');
        ui.mount();
      } catch (error) {
        logger.error('Failed to inject HowLongToBeat UI:', error);
      } finally {
        isCreatingHltb = false;
      }
    };

    const inject = () => {
      if (ctx.isInvalid) return;
      injectExport().catch(console.error);
      injectHltb().catch(logger.error);
    };
    const remove = () => {
      generation += 1;
      exportUi?.remove();
      hltbUi?.remove();
      exportUi = undefined;
      hltbUi = undefined;
    };

    inject();
    const unsubscribe = subscribeToPageChanges(inject);
    document.addEventListener('turbo:before-cache', remove);
    document.addEventListener('turbo:before-render', remove);
    ctx.onInvalidated(() => {
      unsubscribe();
      document.removeEventListener('turbo:before-cache', remove);
      document.removeEventListener('turbo:before-render', remove);
      remove();
    });
  },
});
