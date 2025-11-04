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
  // Simplified version without react-window dependency
  // Will render normally for all list sizes
  // In production, this would use react-window for lists >= 200 items
  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={index}>{rowRenderer(index, item)}</div>
      ))}
    </div>
  );
}
