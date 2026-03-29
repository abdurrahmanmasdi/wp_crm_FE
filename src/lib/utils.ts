import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class name inputs and resolves Tailwind conflicts.
 *
 * @param inputs Class value fragments (strings, arrays, objects, falsy values).
 * @returns A single normalized className string suitable for React components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
