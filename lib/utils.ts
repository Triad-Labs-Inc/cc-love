/**
 * Utility functions for the application
 */

/**
 * Combines multiple class names or style objects
 * Simple helper for conditional styling
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get user initials from first and last name
 */
export const getUserInitials = (firstName?: string, lastName?: string): string => {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
  return firstInitial + lastInitial;
};
