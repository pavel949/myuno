/**
 * Standardized horizontal scroll utilities
 * Ensures consistent mobile touch behavior across all carousels
 */

/**
 * Standard horizontal scroll classes for carousels
 * - overflow-x-auto: enables horizontal scrolling
 * - snap-x snap-mandatory: enables snap points for items
 * - touch-pan-y: CRITICAL - allows vertical page scrolling while horizontal swiping works
 * - scrollbar-hide: hides scrollbar for cleaner look
 */
export const HORIZONTAL_SCROLL_CLASSES = 
  'overflow-x-auto snap-x snap-mandatory touch-pan-y scrollbar-hide';

/**
 * Classes for individual scroll items
 */
export const SCROLL_ITEM_CLASSES = 
  'flex-shrink-0 snap-start touch-manipulation';

/**
 * Full horizontal scroll section with padding compensation
 */
export const HORIZONTAL_SECTION_CLASSES = 
  `flex gap-3 pb-2 ${HORIZONTAL_SCROLL_CLASSES} -mx-4 px-4`;

/**
 * Validate touch-action in development
 * Use this to audit components for incorrect touch settings
 */
export function validateTouchAction(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  const touchAction = computedStyle.touchAction;
  
  // Bad values that block vertical scrolling
  const badValues = ['pan-x', 'none'];
  
  if (badValues.includes(touchAction)) {
    console.warn(
      `[ScrollUtils] Element has touch-action: ${touchAction} which may block vertical scrolling`,
      element
    );
    return false;
  }
  
  return true;
}
