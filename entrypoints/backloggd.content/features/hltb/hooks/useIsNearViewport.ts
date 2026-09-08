/** Start resolving slightly before a card scrolls into view, so the badge is already there. */
const VIEWPORT_ROOT_MARGIN = '200px';

/**
 * The single biggest performance lever: a 1000-game library resolves the ~20 cards the
 * user can actually see instead of firing 1000 requests on load. Once true it stays true.
 */
const useIsNearViewport = (element: Element) => {
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    if (isNear) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setIsNear(true);
      },
      { rootMargin: VIEWPORT_ROOT_MARGIN },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, isNear]);

  return isNear;
};

export default useIsNearViewport;
