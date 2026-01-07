import React from 'react';

/**
 * Skeleton loader component for better loading states
 */
// CRITICAL: Declare SkeletonLoader as a top-level const before exporting
const SkeletonLoader = ({ className = '', width = '100%', height = '1rem', rounded = true }) => {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${rounded ? 'rounded' : ''} ${className}`}
      style={{ width, height }}
      aria-label="Loading..."
    />
  );
};

/**
 * Message skeleton loader
 */
// CRITICAL: Declare MessageSkeleton as a top-level const before exporting
const MessageSkeleton = () => {
  return (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
};

/**
 * Table skeleton loader
 */
// CRITICAL: Declare TableSkeleton as a top-level const before exporting
const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Card skeleton loader
 */
// CRITICAL: Declare CardSkeleton as a top-level const before exporting
const CardSkeleton = () => {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
};

// Export all declared components
export { SkeletonLoader, MessageSkeleton, TableSkeleton, CardSkeleton };
export default SkeletonLoader;

