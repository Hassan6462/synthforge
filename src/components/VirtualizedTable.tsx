import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUp, ArrowDown, ArrowUpDown, Check } from 'lucide-react';
import { ColumnDefinition } from '../types';

interface VirtualizedTableProps {
  rows: Record<string, any>[];
  columns: ColumnDefinition[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnName: string) => void;
}

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  rows,
  columns,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // 36px compact row height
    overscan: 6,
  });

  const handleCopyCell = (val: any, key: string) => {
    if (val === null || val === undefined) return;
    navigator.clipboard.writeText(String(val));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div
      ref={parentRef}
      className="w-full h-full overflow-auto relative select-none"
      style={{
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      <div
        className="min-w-full inline-block align-middle"
        style={{
          height: `${rowVirtualizer.getTotalSize() + 40}px`, // total height + header offset
          position: 'relative',
        }}
      >
        <table className="min-w-full border-collapse text-left text-xs whitespace-nowrap">
          {/* Sticky Header */}
          <thead
            className="sticky top-0 z-20 border-b backdrop-blur-md"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <tr>
              <th
                className="py-2 px-3 font-mono text-[11px] text-[var(--text-muted)] w-12 text-center border-r"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                #
              </th>
              {columns.map((col) => {
                const isSorted = sortColumn === col.name;
                return (
                  <th
                    key={col.id}
                    onClick={() => onSort(col.name)}
                    className="py-2.5 px-3.5 font-mono text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.name}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal font-sans">
                        ({col.type})
                      </span>
                      <span className="text-[var(--text-muted)] ml-auto pl-2">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-[var(--accent-primary)]" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-[var(--accent-primary)]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-30 hover:opacity-100" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Virtualized Rows */}
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-16 text-center text-xs text-[var(--text-muted)]"
                >
                  No synthetic rows generated yet. Adjust settings or schema to preview.
                </td>
              </tr>
            ) : (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                const rowIndex = virtualRow.index;
                const isEven = rowIndex % 2 === 0;

                return (
                  <tr
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    className="group transition-colors hover:bg-[var(--bg-surface-elevated)] absolute left-0 right-0 flex"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start + 38}px)`, // 38px header offset
                      backgroundColor: isEven ? 'var(--bg-surface)' : 'var(--table-stripe)',
                      borderColor: 'var(--border-subtle)',
                      borderBottomWidth: '1px',
                    }}
                  >
                    {/* Row Index */}
                    <td
                      className="py-1.5 px-3 font-mono text-[11px] text-[var(--text-muted)] text-center border-r shrink-0 w-12 flex items-center justify-center"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      {rowIndex + 1}
                    </td>

                    {/* Columns */}
                    {columns.map((col) => {
                      const val = row[col.name];
                      const cellKey = `${rowIndex}_${col.name}`;
                      const isCopied = copiedKey === cellKey;
                      const isNull = val === null || val === undefined;
                      const isNumeric = col.type === 'integer' || col.type === 'float';

                      return (
                        <td
                          key={col.id}
                          onClick={() => handleCopyCell(val, cellKey)}
                          className={`py-1.5 px-3.5 font-mono text-xs cursor-pointer flex-1 min-w-[140px] flex items-center justify-between gap-2 overflow-hidden ${
                            isNumeric ? 'justify-end text-right' : 'text-left'
                          }`}
                          title="Click to copy cell value"
                        >
                          <span
                            className={`truncate ${
                              isNull
                                ? 'italic text-amber-500 font-sans text-[11px]'
                                : isNumeric
                                ? 'text-[var(--text-primary)] font-medium tabular-nums'
                                : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {isNull ? 'null' : String(val)}
                          </span>

                          {isCopied && (
                            <span className="text-[10px] text-emerald-500 flex items-center gap-0.5 shrink-0 animate-pulse font-sans">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
