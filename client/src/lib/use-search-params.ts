import { useLocation } from 'wouter';

/**
 * Custom hook to work with URL search parameters
 * Provides a convenient way to read and update search parameters in the URL
 */
export function useSearchParams() {
  const [location, setLocation] = useLocation();
  
  // Parse current search params
  const search = new URLSearchParams(window.location.search);
  
  // Function to update search params
  const setSearchParams = (params: URLSearchParams | Record<string, string>) => {
    const newParams = new URLSearchParams();
    
    // If params is an object, convert it to URLSearchParams
    if (!(params instanceof URLSearchParams)) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) newParams.set(key, value);
      });
    } else {
      // Use the URLSearchParams object directly
      params.forEach((value, key) => {
        if (value) newParams.set(key, value);
      });
    }
    
    // Get the base path without search params
    const basePath = location.split('?')[0];
    
    // Create the new URL with updated search params
    const newSearch = newParams.toString();
    const newUrl = newSearch ? `${basePath}?${newSearch}` : basePath;
    
    // Update the URL
    setLocation(newUrl);
  };
  
  return { search, setSearchParams };
}