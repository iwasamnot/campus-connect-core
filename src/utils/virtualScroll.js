/**
 * Virtual scrolling utility for long lists
 * Optimizes rendering of large message lists
 */

/**
 * Calculate visible items for virtual scrolling
 * @param {number} scrollTop - Current scroll position
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of container
 * @param {number} totalItems - Total number of items
 * @param {number} overscan - Number of items to render outside viewport
 * @returns {Object} Start and end indices for visible items
 */
export const calculateVisibleRange = (
  scrollTop,
  itemHeight,
  containerHeight,
  totalItems,
  overscan = 5
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  return { startIndex, endIndex };
};

/**
 * Get visible items from array
 * @param {Array} items - Full array of items
 * @param {number} startIndex - Start index
 * @param {number} endIndex - End index
 * @returns {Array} Visible items
 */
export const getVisibleItems = (items, startIndex, endIndex) => {
  return items.slice(startIndex, endIndex + 1);
};

/**
 * Calculate total height of virtual list
 * @param {number} itemHeight - Height of each item
 * @param {number} totalItems - Total number of items
 * @returns {number} Total height
 */
export const calculateTotalHeight = (itemHeight, totalItems) => {
  return itemHeight * totalItems;
};

/**
 * Calculate offset for visible items
 * @param {number} startIndex - Start index
 * @param {number} itemHeight - Height of each item
 * @returns {number} Offset in pixels
 */
export const calculateOffset = (startIndex, itemHeight) => {
  return startIndex * itemHeight;
};

