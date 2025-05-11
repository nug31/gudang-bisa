/**
 * Utility functions for UUID validation and handling
 */

/**
 * Validates if a string is a valid UUID
 * @param id The string to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
export const isValidUuid = (id: string | null | undefined): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Validates a UUID and returns it if valid, or null if invalid
 * @param id The UUID to validate
 * @returns The UUID if valid, null otherwise
 */
export const validateUuid = (id: string | null | undefined): string | null => {
  if (!id) return null;
  return isValidUuid(id) ? id : null;
};

/**
 * Sanitizes an object by validating all UUID fields
 * @param obj The object to sanitize
 * @returns A new object with all UUID fields validated
 */
export const sanitizeUuids = <T extends Record<string, any>>(obj: T): T => {
  if (!obj) return obj;
  
  const result = { ...obj };
  
  // Process all keys in the object
  for (const [key, value] of Object.entries(obj)) {
    // Check if this is a potential UUID field
    if ((key.toLowerCase().includes('id') || key.endsWith('Id')) && 
        typeof value === 'string' && 
        value !== '') {
      
      // Validate and update the UUID field
      result[key] = validateUuid(value);
      
      // Log invalid UUIDs in development
      if (process.env.NODE_ENV !== 'production' && value && !isValidUuid(value)) {
        console.warn(`Invalid UUID format for ${key}: "${value}". Setting to null.`);
      }
    }
    
    // Recursively sanitize nested objects
    else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeUuids(value);
    }
  }
  
  return result;
};

/**
 * Creates a placeholder UUID for testing
 * @param num A number to use in the UUID
 * @returns A valid UUID
 */
export const createTestUuid = (num: number): string => {
  // Pad the number with leading zeros
  const paddedNum = num.toString().padStart(12, '0');
  return `00000000-0000-0000-0000-${paddedNum}`;
};
