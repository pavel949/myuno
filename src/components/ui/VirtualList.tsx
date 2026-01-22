import React, { useRef, useMemo, ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  estimateSize: number;
  renderItem: (item: T, index: number) => ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  className?: string;
  overscan?: number;
  gap?: number;
  maxHeight?: number | string;
}

export function VirtualList<T>({
  items,
  estimateSize,
  renderItem,
  getItemKey,
  className,
  overscan = 5,
  gap = 0,
  maxHeight = 'calc(100vh - 200px)',
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize + gap,
    overscan,
    getItemKey: getItemKey 
      ? (index) => getItemKey(items[index], index)
      : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
      style={{ maxHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size - gap}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Grouped virtual list for date-grouped items
interface GroupedVirtualListProps<T> {
  groups: {
    label: string;
    items: T[];
  }[];
  estimateSize: number;
  estimateHeaderSize?: number;
  renderItem: (item: T, index: number) => ReactNode;
  renderHeader: (label: string, count: number) => ReactNode;
  getItemKey?: (item: T) => string | number;
  className?: string;
  maxHeight?: number | string;
}

interface FlattenedItem<T> {
  type: 'header' | 'item';
  data: T | { label: string; count: number };
}

export function GroupedVirtualList<T>({
  groups,
  estimateSize,
  estimateHeaderSize = 40,
  renderItem,
  renderHeader,
  getItemKey,
  className,
  maxHeight = 'calc(100vh - 200px)',
}: GroupedVirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten groups with headers
  const flattenedItems = useMemo(() => {
    const result: FlattenedItem<T>[] = [];
    groups.forEach(group => {
      if (group.items.length > 0) {
        result.push({ 
          type: 'header', 
          data: { label: group.label, count: group.items.length } 
        });
        group.items.forEach(item => {
          result.push({ type: 'item', data: item });
        });
      }
    });
    return result;
  }, [groups]);

  const virtualizer = useVirtualizer({
    count: flattenedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => 
      flattenedItems[index].type === 'header' ? estimateHeaderSize : estimateSize,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (flattenedItems.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-auto', className)}
      style={{ maxHeight }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const flatItem = flattenedItems[virtualRow.index];
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {flatItem.type === 'header' 
                ? renderHeader(
                    (flatItem.data as { label: string; count: number }).label,
                    (flatItem.data as { label: string; count: number }).count
                  )
                : renderItem(flatItem.data as T, virtualRow.index)
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
