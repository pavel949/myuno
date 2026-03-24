/**
 * @module scrollUtils
 * @description Standardized scroll utilities for consistent mobile behavior
 * 
 * CRITICAL: Always use these utilities for horizontal carousels and dropdowns
 * to prevent blocking vertical page scrolling on mobile devices.
 */

// =============================================================================
// HORIZONTAL SCROLL (Carousels, galleries)
// =============================================================================

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

// =============================================================================
// SELECT & DROPDOWN (Radix UI components)
// =============================================================================

/**
 * Standard classes for SelectContent to ensure proper scrolling on mobile
 * Apply to SelectContent className
 */
export const SELECT_CONTENT_CLASSES = 
  'max-h-[min(400px,60vh)] overflow-y-auto touch-pan-y overscroll-contain';

/**
 * Standard classes for dropdown menus
 */
export const DROPDOWN_CONTENT_CLASSES = 
  'max-h-[min(400px,60vh)] overflow-y-auto touch-pan-y overscroll-contain';

/**
 * Standard classes for CommandList in searchable selects
 */
export const COMMAND_LIST_CLASSES = 
  'max-h-[300px] overflow-y-auto touch-pan-y';

// =============================================================================
// DIALOG & SHEET FORMS
// =============================================================================

/**
 * Standard classes for scrollable form content in dialogs
 * Prevents nested scroll conflicts
 */
export const DIALOG_FORM_CLASSES = 
  'overflow-y-auto touch-pan-y max-h-[80vh] overscroll-contain';

/**
 * Standard classes for Sheet content with forms
 */
export const SHEET_FORM_CLASSES = 
  'overflow-y-auto touch-pan-y flex-1 overscroll-contain';

/**
 * Standard classes for ScrollArea inside dialogs
 */
export const SCROLL_AREA_DIALOG_CLASSES = 
  'h-full max-h-[60vh] pr-4';

// =============================================================================
// VALIDATION & DEBUGGING
// =============================================================================

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

/**
 * Dev utility to audit all scrollable containers on the page
 */
export function auditScrollContainers(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const scrollables = document.querySelectorAll('[class*="overflow"]');
  let issues = 0;
  
  scrollables.forEach((el) => {
    if (!validateTouchAction(el as HTMLElement)) {
      issues++;
    }
  });
  
  if (issues > 0) {
    console.warn(`[ScrollUtils] Found ${issues} potential scroll issues`);
  }
}
