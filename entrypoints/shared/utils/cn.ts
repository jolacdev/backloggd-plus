import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names using `clsx` and resolves Tailwind CSS conflicts using `twMerge`.
 * @param args - A list of classes, objects, or arrays to be merged.
 * @returns A single string of merged, conflict-free Tailwind classes.
 */
export const cn = (...args: ClassValue[]): string => twMerge(clsx(...args));
