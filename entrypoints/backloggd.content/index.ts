export default defineContentScript({
  matches: ['*://backloggd.com/*', '*://*.backloggd.com/*'],
  // matches: ['https://backloggd.com/*', 'https://*.backloggd.com/*'], // HTTPS Only.
  main(ctx) {
    console.log('Hello Backloggd Content.');

    const injectButton = () => {
      const pathRegex = /^\/u\/([^/]+)\/games\/?/;
      const match = window.location.pathname.match(pathRegex);
      if (!match) {
        return;
      }

      // Prevent duplicate buttons
      if (document.getElementById('backloggd-plus-lists-btn')) {
        return;
      }

      const avatar = document.querySelector('div.avatar.avatar-static');
      if (avatar && avatar.parentElement) {
        const username = match[1];

        const link = document.createElement('a');
        link.id = 'backloggd-plus-lists-btn';
        link.href = `/u/${username}/lists/`;
        link.innerText = 'User Lists';

        // Style as a button (using Backloggd's likely Bootstrap classes + existing styles)
        link.className = 'btn btn-main py-1';
        link.style.marginTop = '10px';
        link.style.display = 'block';
        link.style.width = '100%';
        link.style.textAlign = 'center';

        avatar.parentElement.insertBefore(link, avatar.nextSibling);
      }
    };

    // Run immediately
    injectButton();

    // Observe for page changes (Turbo handling fallback / dynamic updates)
    const observer = new MutationObserver(() => {
      injectButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Handle Turbo/Turbolinks navigation events explicitly
    window.addEventListener('turbo:load', injectButton);
    window.addEventListener('turbolinks:load', injectButton);

    // Clean up on invalidation (e.g. extension reload)
    ctx.onInvalidated(() => {
      observer.disconnect();
      window.removeEventListener('turbo:load', injectButton);
      window.removeEventListener('turbolinks:load', injectButton);
    });
  },
});
