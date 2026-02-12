/**
 * Extracts the logged-in username from the navigation bar dropdown, which is only present when authenticated.
 */
export const getLoggedInUsername = (): null | string => {
  const dropdown = document.getElementById('navbarDropdown');
  if (!dropdown) {
    return null;
  }

  return dropdown.childNodes?.[0]?.textContent?.trim() || null;
};
