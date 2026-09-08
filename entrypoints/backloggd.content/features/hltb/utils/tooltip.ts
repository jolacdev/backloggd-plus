const TOOLTIP_WIDTH_PX = 216;
/** The content is fixed-size, so an estimate is enough to decide the flip direction. */
const TOOLTIP_ESTIMATED_HEIGHT_PX = 176;
const TOOLTIP_GAP_PX = 8;

/**
 * Places the fixed-positioned tooltip against a badge, flipping above it near the bottom
 * of the viewport and clamping it inside the horizontal edges.
 *
 * Returns ready-to-apply styles: the gap is **padding**, not empty space, so the hover
 * target runs continuously from the badge to the tooltip and the pointer never crosses
 * dead ground on its way there.
 */
export const getTooltipStyle = (rect: DOMRect) => {
  const centeredLeft = rect.left + rect.width / 2 - TOOLTIP_WIDTH_PX / 2;
  const maxLeft = window.innerWidth - TOOLTIP_WIDTH_PX - TOOLTIP_GAP_PX;
  const shouldFlipUp =
    rect.bottom + TOOLTIP_GAP_PX + TOOLTIP_ESTIMATED_HEIGHT_PX >
    window.innerHeight;

  const top = shouldFlipUp
    ? rect.top - TOOLTIP_ESTIMATED_HEIGHT_PX - TOOLTIP_GAP_PX
    : rect.bottom;

  return {
    left: `${Math.max(Math.min(centeredLeft, maxLeft), TOOLTIP_GAP_PX)}px`,
    paddingBottom: shouldFlipUp ? `${TOOLTIP_GAP_PX}px` : undefined,
    paddingTop: shouldFlipUp ? undefined : `${TOOLTIP_GAP_PX}px`,
    top: `${Math.max(top, 0)}px`,
    width: `${TOOLTIP_WIDTH_PX}px`,
  };
};
