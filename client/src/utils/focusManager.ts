/**
 * Focus Manager Utility
 * 
 * This utility helps prevent accessibility issues related to aria-hidden and focus.
 * It ensures that when dialogs or modals are opened/closed, focus is properly managed
 * to avoid the "Blocked aria-hidden on an element because its descendant retained focus" warning.
 */

// Track when we're already handling a focus issue to prevent recursion
let isHandlingFocus = false;

/**
 * Safely blurs the currently focused element
 */
export const blurActiveElement = (): void => {
  if (isHandlingFocus) return;
  
  try {
    isHandlingFocus = true;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  } finally {
    isHandlingFocus = false;
  }
};

/**
 * Prevents focus on elements that might become hidden
 * Call this before showing/hiding dialogs or modals
 */
export const preventFocusIssues = (): void => {
  // Prevent recursive calls
  if (isHandlingFocus) return;
  
  try {
    isHandlingFocus = true;
    
    // Blur any currently focused element
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // We'll avoid setting focus on body as it can trigger additional events
    // that might lead to infinite loops in some browsers
  } finally {
    isHandlingFocus = false;
  }
};

/**
 * Safely focuses an element after a slight delay
 * to ensure proper focus handling after dialog transitions
 */
export const safelyFocusElement = (
  elementSelector: string | HTMLElement,
  delay: number = 50
): void => {
  // Don't set focus if we're already handling focus issues
  if (isHandlingFocus) return;
  
  setTimeout(() => {
    try {
      isHandlingFocus = true;
      
      let element: HTMLElement | null = null;
      
      if (typeof elementSelector === 'string') {
        element = document.querySelector(elementSelector) as HTMLElement;
      } else {
        element = elementSelector;
      }
      
      if (element && typeof element.focus === 'function') {
        // First blur anything that might have focus
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        // Then set focus on the target element
        element.focus();
      }
    } catch (error) {
      console.error('Failed to focus element:', error);
    } finally {
      isHandlingFocus = false;
    }
  }, delay);
};

/**
 * Safely handles dialog/modal close operations
 * by properly managing focus before state updates
 * 
 * @param stateSetter Function to update component state (like setIsOpen(false))
 * @param delay Delay before executing the state change
 */
export const safelyCloseDialog = (
  stateSetter: () => void,
  delay: number = 0
): void => {
  // Prevent recursive calls
  if (isHandlingFocus) {
    stateSetter();
    return;
  }
  
  try {
    isHandlingFocus = true;
    
    // Just blur active element without additional body focus
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Then update the component state after a small delay
    setTimeout(() => {
      stateSetter();
    }, delay);
  } finally {
    isHandlingFocus = false;
  }
}; 