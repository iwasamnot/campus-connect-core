import React from 'react';

/**
 * Skeleton loader component for better loading states
 */
// CRITICAL: Declare SkeletonLoader as a top-level const before exporting
const SkeletonLoader = ({ className = '', width = '100%', height = '1rem', rounded = true }) => {
  return (
    <div
      className={`bg-white/10 animate-pulse ${rounded ? 'rounded' : ''} ${className}`}
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
      <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="h-3 w-16 bg-white/10 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-3/4 bg-white/10 rounded" />
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
            <div key={j} className="flex-1 h-4 bg-white/10 rounded" />
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
    <div className="p-4 glass-panel border border-white/10 rounded-xl animate-pulse backdrop-blur-sm">
      <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
      <div className="h-3 w-1/2 bg-white/10 rounded" />
    </div>
  );
};

// Export all declared components
export { SkeletonLoader, MessageSkeleton, TableSkeleton, CardSkeleton };
export default SkeletonLoader;

