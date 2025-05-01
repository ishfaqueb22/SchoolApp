import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Enhanced API request function with better error handling
 * @param url The API endpoint URL
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param data Request body data (for POST, PUT, etc.)
 * @returns Promise with the response data
 */
export async function apiRequest(url: string, method: string, data?: any) {
  try {
    // Validate method is one of the standard HTTP methods
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    const normalizedMethod = method.toUpperCase();
    
    if (!validMethods.includes(normalizedMethod)) {
      console.warn(`Warning: "${method}" is not a standard HTTP method. Using "GET" instead.`);
      method = 'GET';
    } else {
      method = normalizedMethod;
    }
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    console.log(`Making ${method} request to ${url}`, options);
    
    const response = await fetch(url, options);
    
    // Get content type to handle different response formats
    const contentType = response.headers.get('content-type') || '';
    
    // If response is not ok, handle the error
    if (!response.ok) {
      let errorData;
      
      try {
        // Check if response is JSON or HTML
        if (contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          // If it's HTML or other non-JSON format, just get the status text
          const responseText = await response.text();
          // For debugging purposes, log a small portion of the response
          const previewText = responseText.substring(0, 100) + (responseText.length > 100 ? '...' : '');
          console.error(`Received non-JSON error response: ${previewText}`);
          
          // Check if this is a session timeout or login page
          if (responseText.includes('<!DOCTYPE html>') && 
              (responseText.includes('login') || responseText.includes('sign in'))) {
            errorData = { 
              error: 'Your session has expired. Please log in again.', 
              requiresLogin: true 
            };
          } else {
            errorData = { error: response.statusText || 'Server error', details: previewText };
          }
        }
      } catch (e) {
        // If parsing fails for any reason, use the status text
        console.error('Error parsing error response:', e);
        errorData = { error: response.statusText || 'Unknown error occurred' };
      }
      
      // Check for auth-related errors (redirect to login page or HTML response)
      if (response.status === 401 || response.status === 403 || 
          (contentType.includes('text/html') && response.status === 200 && response.url.includes('login'))) {
        console.warn('Authentication error detected, user likely needs to log in');
        errorData = { 
          error: 'Authentication required. Please log in again.', 
          status: response.status,
          redirected: response.redirected,
          url: response.url,
          requiresLogin: true
        };
      }
      
      const errorMessage = errorData.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).data = errorData;
      (error as any).requiresLogin = errorData.requiresLogin || false;
      throw error;
    }
    
    // Handle case where we get HTML instead of JSON when logged out - status might be 200
    if (contentType.includes('text/html')) {
      // Get response text and check for login page indicators
      const responseText = await response.text();
      if (responseText.includes('<!DOCTYPE html>') && 
         (responseText.includes('login') || responseText.includes('sign in'))) {
        console.warn('Received HTML login page instead of JSON response');
        const error = new Error('Your session has expired. Please log in again.');
        (error as any).requiresLogin = true;
        throw error;
      }
      
      console.warn('Received HTML response when expecting JSON:', responseText.substring(0, 100));
      return { text: responseText };
    }
    
    // If the response is 204 No Content, return empty object
    if (response.status === 204) {
      return {};
    }
    
    // Check content type for JSON, otherwise return text
    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      // Return response text for non-JSON responses
      const text = await response.text();
      console.warn('Received non-JSON response:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      return { text };
    }
  } catch (error) {
    console.error('API request error:', error);
    
    // Check if the error indicates the user has been logged out or session expired
    if (error instanceof Error && 
        ((error as any).status === 401 || 
         (error as any).status === 403 || 
         (error as any).requiresLogin ||
         error.message.includes('Authentication required') || 
         error.message.includes('session has expired'))) {
      
      // Handle authentication errors here - could redirect to login page
      console.warn('Authentication required, handling session expiration');
      
      // If the window object is available (browser environment), redirect to login
      if (typeof window !== 'undefined') {
        // Redirect to login page with return URL
        const returnUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?returnUrl=${returnUrl}`;
        // Throw a special error to indicate redirection is happening
        throw new Error('Redirecting to login page due to expired session');
      }
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
