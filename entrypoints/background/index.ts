export default defineBackground(() => {
  console.log('Hello Background!', { id: browser.runtime.id });
});
