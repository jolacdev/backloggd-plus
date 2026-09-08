import { TooltipAnchor } from '../types';

/** Covers the single boundary crossing from the card's subtree into the tooltip's. */
const TOOLTIP_DISMISS_DELAY_MS = 200;

/**
 * Owns which badge the shared tooltip is anchored to.
 *
 * Dismissal is deferred rather than immediate: the card and the tooltip are separate DOM
 * subtrees — the badge is portaled into Backloggd's markup, the tooltip lives in the Shadow
 * Root — so leaving the card fires `mouseleave` *before* the tooltip's `mouseenter`.
 * Closing synchronously would unmount the tooltip before it could cancel. Same mechanism as
 * Tippy's `interactive` and Floating UI's `safePolygon`.
 */
const useTooltipAnchor = () => {
  const [anchor, setAnchor] = useState<null | TooltipAnchor>(null);
  const dismissTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null);

  const cancelDismiss = useCallback(() => {
    if (!dismissTimerRef.current) return;

    clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
  }, []);

  const scheduleDismiss = useCallback(() => {
    cancelDismiss();

    dismissTimerRef.current = setTimeout(() => {
      dismissTimerRef.current = null;
      setAnchor(null);
    }, TOOLTIP_DISMISS_DELAY_MS);
  }, [cancelDismiss]);

  const show = useCallback(
    (next: TooltipAnchor) => {
      cancelDismiss();
      setAnchor(next);
    },
    [cancelDismiss],
  );

  // The tooltip is fixed-positioned against a rect that scrolling invalidates, so it is
  // closed outright rather than after the grace period. The handler is inline so the
  // effect depends only on stable values and does not re-bind on every render.
  useEffect(() => {
    if (!anchor) return undefined;

    const dismissNow = () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
      setAnchor(null);
    };

    window.addEventListener('scroll', dismissNow, { passive: true });
    window.addEventListener('resize', dismissNow);

    return () => {
      window.removeEventListener('scroll', dismissNow);
      window.removeEventListener('resize', dismissNow);
    };
  }, [anchor]);

  useEffect(
    () => () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    },
    [],
  );

  return { anchor, cancelDismiss, scheduleDismiss, show };
};

export default useTooltipAnchor;
