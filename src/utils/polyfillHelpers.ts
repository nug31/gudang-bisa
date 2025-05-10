/**
 * Utility functions to help with polyfill issues in different environments
 */

/**
 * Safely parses URL search parameters
 * @param search The search string to parse
 * @returns An object with the parsed parameters
 */
export function safeParseSearchParams(search: string): Record<string, string> {
  try {
    const params: Record<string, string> = {};
    // Remove the leading ? if present
    const searchString = search.startsWith('?') ? search.substring(1) : search;
    
    // Split by & to get key-value pairs
    const pairs = searchString.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    }
    
    return params;
  } catch (error) {
    console.error('Error parsing search params:', error);
    return {};
  }
}

/**
 * Safely finds an item in an array without using Array.prototype.find
 * @param array The array to search
 * @param predicate The function to test each element
 * @returns The first element that passes the test, or undefined
 */
export function safeFind<T>(array: T[], predicate: (item: T) => boolean): T | undefined {
  if (!Array.isArray(array)) return undefined;
  
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) {
      return array[i];
    }
  }
  
  return undefined;
}

/**
 * Safely maps an array without using Array.prototype.map
 * @param array The array to map
 * @param callback The function to call on each element
 * @returns A new array with the results of calling the callback on each element
 */
export function safeMap<T, U>(array: T[], callback: (item: T, index: number) => U): U[] {
  if (!Array.isArray(array)) return [];
  
  const result: U[] = [];
  for (let i = 0; i < array.length; i++) {
    result.push(callback(array[i], i));
  }
  
  return result;
}
