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

/**
 * Extracts the username from the current URL path if it matches the profile pattern (/u/Username/*).
 */
const getProfileUsernameFromUrl = (): null | string => {
  const match = window.location.pathname.match(/\/u\/([^/]+)/);
  return match ? match[1] : null;
};

/**
 * Checks if the current user is logged-in and viewing their own profile page.
 */
export const isCurrentUserProfilePage = (): boolean => {
  const navUsername = getLoggedInUsername();
  const urlUsername = getProfileUsernameFromUrl();

  if (!navUsername || !urlUsername) {
    return false;
  }

  return navUsername.toLowerCase() === urlUsername.toLowerCase();
};
