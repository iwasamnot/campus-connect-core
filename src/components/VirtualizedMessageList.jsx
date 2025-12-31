import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { calculateVisibleRange, getVisibleItems, calculateTotalHeight, calculateOffset } from '../utils/virtualScroll';

/**
 * Virtualized message list component for performance
 * Only renders visible messages + overscan
 */
const VirtualizedMessageList = memo(({ 
  messages = [], 
  renderMessage, 
  itemHeight = 100,
  overscan = 5,
  containerHeight = 600
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef(null);

  const visibleRange = useMemo(() => {
    return calculateVisibleRange(
      scrollTop,
      itemHeight,
      containerHeight,
      messages.length,
      overscan
    );
  }, [scrollTop, itemHeight, containerHeight, messages.length, overscan]);

  const visibleMessages = useMemo(() => {
    return getVisibleItems(messages, visibleRange.startIndex, visibleRange.endIndex);
  }, [messages, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = useMemo(() => {
    return calculateTotalHeight(itemHeight, messages.length);
  }, [itemHeight, messages.length]);

  const offset = useMemo(() => {
    return calculateOffset(visibleRange.startIndex, itemHeight);
  }, [visibleRange.startIndex, itemHeight]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollContainerRef.current && messages.length > 0) {
      const container = scrollContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages.length]);

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      className="virtual-scroll-container"
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        <div
          style={{
            transform: `translateY(${offset}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleMessages.map((message, index) => {
            const actualIndex = visibleRange.startIndex + index;
            return (
              <div
                key={message.id || actualIndex}
                style={{
                  height: itemHeight,
                  minHeight: itemHeight
                }}
              >
                {renderMessage(message, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';

export default VirtualizedMessageList;

