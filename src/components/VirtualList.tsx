import React from 'react';

interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  height?: number;
  rowRenderer: (index: number, item: T) => React.ReactNode;
  className?: string;
}

export function VirtualList<T>({
  items,
  rowHeight,
  height = 400,
  rowRenderer,
  className = '',
}: VirtualListProps<T>) {
  // Only virtualize if list is large enough (>= 200 items)
  const shouldVirtualize = items.length >= 200;

  // Fallback to normal rendering if list is small or virtualization fails
  if (!shouldVirtualize) {
    return (
      <div className={className} style={{ maxHeight: height, overflowY: 'auto' }}>
        {items.map((item, index) => (
          <div key={index} style={{ height: rowHeight }}>
            {rowRenderer(index, item)}
          </div>
        ))}
      </div>
    );
  }

  // Try to use react-window for large lists
  try {
    // Dynamic import attempt - if it fails, will fall back to normal rendering
    const { FixedSizeList } = require('react-window');
    
    return (
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={rowHeight}
        width="100%"
        className={className}
      >
        {({ index, style }: { index: number; style: React.CSSProperties }) => (
          <div style={style}>{rowRenderer(index, items[index])}</div>
        )}
      </FixedSizeList>
    );
  } catch (error) {
    // Fallback to normal rendering if react-window is not available
    console.warn('react-window not available, falling back to normal rendering');
    return (
      <div className={className} style={{ maxHeight: height, overflowY: 'auto' }}>
        {items.map((item, index) => (
          <div key={index} style={{ height: rowHeight }}>
            {rowRenderer(index, item)}
          </div>
        ))}
      </div>
    );
  }
}
