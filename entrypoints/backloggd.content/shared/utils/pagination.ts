/**
 * Calculates the total number of pages for a paginated Backloggd listing.
 *
 * Backloggd does not expose a page count, so it is derived from the total item
 * count in the page header and the number of items the first page rendered.
 *
 * @param totalItems - The total number of items reported by the page.
 * @param itemsPerPage - The number of items rendered on a single page.
 * @returns The total number of pages, or 0 when either input is empty.
 */
export const getTotalPages = (
  totalItems: number,
  itemsPerPage: number,
): number => {
  if (totalItems === 0 || itemsPerPage === 0) return 0;

  return Math.ceil(totalItems / itemsPerPage);
};

/**
 * Generates an array of page numbers from 1 up to the specified total number of pages.
 * @param totalPages - The total number of pages.
 * @returns An array containing sequential page numbers (e.g., [1, 2, 3]).
 */
export const getPageNumbers = (totalPages: number): number[] =>
  Array.from({ length: totalPages }, (_, index) => index + 1);
