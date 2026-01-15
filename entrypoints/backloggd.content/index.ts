export default defineContentScript({
  matches: ['*://backloggd.com/*', '*://*.backloggd.com/*'],
  // matches: ['https://backloggd.com/*', 'https://*.backloggd.com/*'], // HTTPS Only.
  main() {
    console.log('Hello Backloggd Content.');
  },
});
