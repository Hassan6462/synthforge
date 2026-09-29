import React from 'react';

export const TableLoadingSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 8, cols = 6 }) => {
  return (
    <div className="w-full h-full p-4 overflow-hidden animate-pulse">
      {/* Table Header Skeleton */}
      <div className="flex gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {Array.from({ length: cols }).map((_, c) => (
          <div
            key={c}
            className="h-7 rounded-md flex-1"
            style={{ backgroundColor: 'var(--bg-surface-elevated)' }}
          />
        ))}
      </div>
      {/* Table Rows Skeleton */}
      <div className="flex flex-col gap-2.5 pt-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-8 rounded-md flex-1"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  opacity: 0.6 + (c % 3) * 0.15,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardLoadingSkeleton: React.FC = () => {
  return (
    <div
      className="p-5 rounded-xl border animate-pulse flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--bg-surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="h-4 w-1/3 rounded" style={{ backgroundColor: 'var(--border-subtle)' }} />
      <div className="h-8 w-2/3 rounded" style={{ backgroundColor: 'var(--border-subtle)' }} />
      <div className="h-3 w-1/2 rounded" style={{ backgroundColor: 'var(--border-subtle)' }} />
    </div>
  );
};
