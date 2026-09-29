import React, { useMemo } from 'react';
import { ColumnDefinition } from '../types';
import { BarChart3, AlertCircle } from 'lucide-react';

interface ColumnProfilerProps {
  rows: Record<string, any>[];
  columns: ColumnDefinition[];
}

export const ColumnProfiler: React.FC<ColumnProfilerProps> = ({ rows, columns }) => {
  const profileData = useMemo(() => {
    return columns.map((col) => {
      const values = rows.map((r) => r[col.name]);
      const total = values.length;
      const nulls = values.filter((v) => v === null || v === undefined || v === '').length;
      const nullPct = total > 0 ? Math.round((nulls / total) * 100) : 0;

      const nonNulls = values.filter((v) => v !== null && v !== undefined && v !== '');
      const uniqueCount = new Set(nonNulls.map((v) => String(v))).size;

      // Frequency map for top values
      const freq: Record<string, number> = {};
      nonNulls.forEach((v) => {
        const k = String(v);
        freq[k] = (freq[k] || 0) + 1;
      });

      const topEntries = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      // Check numeric stats
      const isNumeric = col.type === 'integer' || col.type === 'float';
      let minVal: number | null = null;
      let maxVal: number | null = null;
      let avgVal: number | null = null;

      if (isNumeric && nonNulls.length > 0) {
        const numValues = nonNulls.map(Number).filter((n) => !isNaN(n));
        if (numValues.length > 0) {
          minVal = Math.min(...numValues);
          maxVal = Math.max(...numValues);
          const sum = numValues.reduce((a, b) => a + b, 0);
          avgVal = Number((sum / numValues.length).toFixed(2));
        }
      }

      return {
        column: col,
        total,
        nulls,
        nullPct,
        uniqueCount,
        topEntries,
        isNumeric,
        minVal,
        maxVal,
        avgVal,
      };
    });
  }, [rows, columns]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>Statistical Column Profiler & Quality Metrics</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Validation of synthetic distributions, cardinalities, and null injection rates.
          </p>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">
          {rows.length} rows evaluated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {profileData.map((item) => (
          <div
            key={item.column.id}
            className="p-3.5 rounded-xl border space-y-2.5"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate max-w-[170px]">
                {item.column.name}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {item.column.type}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                <span className="text-[10px] text-[var(--text-muted)] block">Distinct Values</span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {item.uniqueCount} <span className="text-[10px] text-[var(--text-muted)] font-sans">({Math.round((item.uniqueCount / Math.max(1, item.total)) * 100)}%)</span>
                </span>
              </div>

              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                <span className="text-[10px] text-[var(--text-muted)] block">Null / Missing</span>
                <span className={`font-semibold tabular-nums ${item.nulls > 0 ? 'text-amber-500' : 'text-[var(--text-primary)]'}`}>
                  {item.nulls} <span className="text-[10px] font-sans">({item.nullPct}%)</span>
                </span>
              </div>
            </div>

            {/* Numeric distribution summary */}
            {item.isNumeric && item.minVal !== null && (
              <div className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center justify-between px-1">
                <span>Min: <b className="text-[var(--text-primary)]">{item.minVal}</b></span>
                <span>Avg: <b className="text-[var(--accent-primary)]">{item.avgVal}</b></span>
                <span>Max: <b className="text-[var(--text-primary)]">{item.maxVal}</b></span>
              </div>
            )}

            {/* Top Sample Frequency */}
            <div>
              <span className="text-[10px] font-medium text-[var(--text-muted)] block mb-1">
                Sample Values:
              </span>
              <div className="space-y-1">
                {item.topEntries.map(([val, count], idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                    <span className="truncate max-w-[180px] text-[var(--text-secondary)]">
                      {val || <span className="italic text-amber-500 font-sans">null</span>}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] tabular-nums shrink-0">
                      {count} ({Math.round((count / Math.max(1, item.total)) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
