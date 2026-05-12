export const hasUrlChanged = (url: string) => url !== location.href;

export const isCurrentPathname = (pathname: string) =>
  location.pathname === pathname;
