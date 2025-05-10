/**
 * Utility functions for safely working with arrays
 * These functions help prevent "t.map is not a function" errors
 */

/**
 * Safely maps over an array, returning an empty array if the input is not an array
 * @param arr The array to map over
 * @param callback The mapping function
 * @returns The mapped array or an empty array if input is not an array
 */
export function safeMap<T, U>(
  arr: T[] | null | undefined,
  callback: (item: T, index: number, array: T[]) => U
): U[] {
  if (!arr || !Array.isArray(arr)) {
    return [];
  }
  return arr.map(callback);
}

/**
 * Safely filters an array, returning an empty array if the input is not an array
 * @param arr The array to filter
 * @param callback The filter predicate
 * @returns The filtered array or an empty array if input is not an array
 */
export function safeFilter<T>(
  arr: T[] | null | undefined,
  callback: (item: T, index: number, array: T[]) => boolean
): T[] {
  if (!arr || !Array.isArray(arr)) {
    return [];
  }
  return arr.filter(callback);
}

/**
 * Ensures a value is an array
 * @param value The value to ensure is an array
 * @returns The value if it's an array, or an empty array otherwise
 */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [];
}

/**
 * Gets a safe length of an array, returning 0 if the input is not an array
 * @param arr The array to get the length of
 * @returns The length of the array or 0 if input is not an array
 */
export function safeLength(arr: any[] | null | undefined): number {
  if (!arr || !Array.isArray(arr)) {
    return 0;
  }
  return arr.length;
}
