/**
 * Utility functions for checking user permissions
 */

type UserRole = 'admin' | 'manager' | 'user' | string | undefined;

/**
 * Check if a user has admin permissions
 * @param role The user's role
 * @returns True if the user has admin permissions
 */
export const isAdmin = (role: UserRole): boolean => {
  return role === 'admin';
};

/**
 * Check if a user has manager permissions
 * @param role The user's role
 * @returns True if the user has manager permissions
 */
export const isManager = (role: UserRole): boolean => {
  return role === 'manager';
};

/**
 * Check if a user has admin or manager permissions
 * @param role The user's role
 * @returns True if the user has admin or manager permissions
 */
export const isAdminOrManager = (role: UserRole): boolean => {
  return role === 'admin' || role === 'manager';
};

/**
 * Check if a user can create inventory items
 * @param role The user's role
 * @returns True if the user can create inventory items
 */
export const canCreateInventoryItems = (role: UserRole): boolean => {
  return isAdminOrManager(role);
};

/**
 * Check if a user can edit inventory items
 * @param role The user's role
 * @returns True if the user can edit inventory items
 */
export const canEditInventoryItems = (role: UserRole): boolean => {
  return isAdminOrManager(role);
};

/**
 * Check if a user can delete inventory items
 * @param role The user's role
 * @returns True if the user can delete inventory items
 */
export const canDeleteInventoryItems = (role: UserRole): boolean => {
  return isAdminOrManager(role);
};

/**
 * Check if a user can manage categories
 * @param role The user's role
 * @returns True if the user can manage categories
 */
export const canManageCategories = (role: UserRole): boolean => {
  return isAdminOrManager(role);
};

/**
 * Check if a user can manage users
 * @param role The user's role
 * @returns True if the user can manage users
 */
export const canManageUsers = (role: UserRole): boolean => {
  // Only managers can manage users
  return role === 'manager';
};

/**
 * Check if a user can view inventory
 * @param role The user's role
 * @returns True if the user can view inventory
 */
export const canViewInventory = (role: UserRole): boolean => {
  // All authenticated users can view inventory
  return !!role;
};

/**
 * Check if a user can request items
 * @param role The user's role
 * @returns True if the user can request items
 */
export const canRequestItems = (role: UserRole): boolean => {
  // All authenticated users can request items
  return !!role;
};
