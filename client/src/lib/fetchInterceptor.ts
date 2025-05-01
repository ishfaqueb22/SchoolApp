/**
 * Fetch API Interceptor for enhanced debugging and error handling
 * 
 * This utility wraps the native fetch API to:
 * 1. Provide detailed logging for requests and responses
 * 2. Detect and handle common errors, especially related to HTTP methods
 * 3. Format error messages in a consistent way
 */

type FetchInterceptorOptions = {
  /** Enable or disable logging */
  enableLogging?: boolean;
  /** Additional request processing */
  requestInterceptor?: (request: Request | RequestInit) => Request | RequestInit;
  /** Additional response processing */
  responseInterceptor?: (response: Response) => Response | Promise<Response>;
  /** Error handler */
  errorHandler?: (error: Error, request?: Request | RequestInit) => void;
};

/**
 * Initialize the fetch API interceptor
 */
export function initFetchInterceptor(options: FetchInterceptorOptions = {}) {
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override with our enhanced version
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    // Support both input formats: URL string or Request object
    const request = input instanceof Request 
      ? input 
      : new Request(input.toString(), init);
      
    const requestInit = input instanceof Request ? {} : init || {};
    
    try {
      // Normalize HTTP method
      if (requestInit.method) {
        // Ensure method is uppercase and valid
        const method = requestInit.method.toUpperCase();
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        
        if (!validMethods.includes(method)) {
          console.warn(`Warning: "${method}" is not a standard HTTP method. Using "GET" instead.`);
          requestInit.method = 'GET';
        } else {
          requestInit.method = method;
        }
      }
      
      // Apply custom request processing if provided
      const processedRequest = options.requestInterceptor 
        ? options.requestInterceptor(input instanceof Request ? input : requestInit)
        : input instanceof Request ? input : requestInit;
        
      // Log request details if logging is enabled
      if (options.enableLogging) {
        const url = input instanceof Request ? input.url : input.toString();
        const method = (input instanceof Request ? input.method : requestInit.method) || 'GET';
        
        console.group(`🌐 Fetch: ${method} ${url}`);
        console.log('Request:', { 
          url, 
          method, 
          headers: input instanceof Request 
            ? Object.fromEntries(input.headers.entries())
            : requestInit.headers,
          body: input instanceof Request 
            ? (input.body || undefined) 
            : requestInit.body
        });
      }
      
      // Make the actual fetch call
      let response: Response;
      
      if (processedRequest instanceof Request) {
        response = await originalFetch(processedRequest);
      } else {
        response = await originalFetch(input.toString(), processedRequest as RequestInit);
      }
      
      // Apply custom response processing if provided
      const processedResponse = options.responseInterceptor 
        ? await options.responseInterceptor(response)
        : response;
        
      // Log response details if logging is enabled
      if (options.enableLogging) {
        console.log('Response:', { 
          status: processedResponse.status, 
          statusText: processedResponse.statusText,
          headers: Object.fromEntries(processedResponse.headers.entries()),
          url: processedResponse.url
        });
        console.groupEnd();
      }
      
      return processedResponse;
    } catch (error) {
      // Log error details if logging is enabled
      if (options.enableLogging) {
        console.error('Fetch error:', error);
        console.groupEnd();
      }
      
      // Call custom error handler if provided
      if (options.errorHandler && error instanceof Error) {
        options.errorHandler(error, input instanceof Request ? input : requestInit);
      }
      
      throw error;
    }
  };
  
  // Return a function to restore the original fetch
  return function restore() {
    window.fetch = originalFetch;
  };
}

export default {
  init: initFetchInterceptor
}; 