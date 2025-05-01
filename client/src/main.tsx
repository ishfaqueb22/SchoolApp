import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { initFetchInterceptor } from "./lib/fetchInterceptor";

// Initialize fetch interceptor for better debugging and error handling
initFetchInterceptor({
  enableLogging: true,
  errorHandler: (error, request) => {
    console.error('Fetch error detected:', error, 'Request:', request);
  }
});

// Set up global focus protection
const setupFocusProtection = () => {
  // Track when we're handling focus to prevent infinite loops
  let isHandlingFocus = false;
  
  // This helps prevent focus issues with aria-hidden elements
  const observer = new MutationObserver((mutations) => {
    if (isHandlingFocus) return; // Prevent recursive calls
    
    try {
      isHandlingFocus = true;
      
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'aria-hidden' || 
             mutation.attributeName === 'data-aria-hidden')) {
          const target = mutation.target as HTMLElement;
          const isHidden = target.getAttribute('aria-hidden') === 'true';
          
          if (isHidden && target.contains(document.activeElement)) {
            // Just blur the active element without setting focus anywhere else
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }
        }
      }
    } finally {
      isHandlingFocus = false;
    }
  });

  // Observe changes to aria-hidden attribute on all elements
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['aria-hidden', 'data-aria-hidden'],
    subtree: true
  });

  // Cleanup on unload
  window.addEventListener('unload', () => {
    observer.disconnect();
  });
};

// Create root and render app
const root = createRoot(document.getElementById("root")!);
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Set up focus protection after initial render
setupFocusProtection();
