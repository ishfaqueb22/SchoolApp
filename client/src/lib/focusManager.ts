/**
 * Focus Manager utility to prevent infinite focus loops
 * 
 * This utility helps prevent "Maximum call stack size exceeded" errors
 * that can occur when multiple components try to manage focus simultaneously.
 */

let isFocusProcessing = false;
let focusTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Execute a focus-related operation safely, preventing recursion
 * 
 * @param callback Function to execute
 * @param delay Optional delay in milliseconds (default: 0)
 * @returns boolean indicating if the operation was executed
 */
export function executeSafeFocus(callback: () => void, delay = 0): boolean {
  if (isFocusProcessing) {
    return false;
  }
  
  isFocusProcessing = true;
  
  if (focusTimeout) {
    clearTimeout(focusTimeout);
  }
  
  focusTimeout = setTimeout(() => {
    try {
      callback();
    } finally {
      isFocusProcessing = false;
      focusTimeout = null;
    }
  }, delay);
  
  return true;
}

/**
 * Check if a focus operation is currently in progress
 */
export function isFocusInProgress(): boolean {
  return isFocusProcessing;
}

/**
 * Reset the focus processing state (use with caution)
 */
export function resetFocusState(): void {
  isFocusProcessing = false;
  if (focusTimeout) {
    clearTimeout(focusTimeout);
    focusTimeout = null;
  }
}

/**
 * Create a mutation observer that monitors for aria-hidden attribute changes
 * which can cause focus trapping issues
 * 
 * @param callback Function to call when aria-hidden changes are detected
 * @returns MutationObserver instance
 */
export function createAriaHiddenObserver(callback: (mutations: MutationRecord[]) => void): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    const ariaHiddenMutations = mutations.filter(mutation => 
      mutation.attributeName === 'aria-hidden'
    );
    
    if (ariaHiddenMutations.length > 0) {
      callback(ariaHiddenMutations);
    }
  });
  
  return observer;
}

/**
 * Observe aria-hidden attribute changes on the document body
 * 
 * @param callback Function to call when aria-hidden changes are detected
 * @returns Function to disconnect the observer
 */
export function observeAriaHiddenChanges(callback: (mutations: MutationRecord[]) => void): () => void {
  const observer = createAriaHiddenObserver(callback);
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['aria-hidden'],
    subtree: true
  });
  
  return () => observer.disconnect();
}

export default {
  executeSafeFocus,
  isFocusInProgress,
  resetFocusState,
  createAriaHiddenObserver,
  observeAriaHiddenChanges
}; 