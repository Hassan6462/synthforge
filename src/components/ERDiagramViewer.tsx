import React from 'react';
import { Key, ArrowRight, Table as TableIcon } from 'lucide-react';
import { TableSchema } from '../types';

interface ERDiagramViewerProps {
  tables: TableSchema[];
  activeTable: string;
  onSelectTable: (tableName: string) => void;
  relationships: { parentTable: string; childTable: string; fkCol: string; pkCol: string; linkCount: number }[];
}

export const ERDiagramViewer: React.FC<ERDiagramViewerProps> = ({
  tables,
  activeTable,
  onSelectTable,
  relationships,
}) => {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Relational Summary Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Relational Entity Schema & Integrity Graph
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Synthetic foreign keys are strictly matched to parent records. Zero orphan rows.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
          <span>{tables.length} entities</span>
          <span aria-hidden="true">·</span>
          <span>{relationships.length} foreign key links</span>
        </div>
      </div>

      {/* Visual Relationship Chain */}
      {relationships.length > 0 && (
        <div className="p-3.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
          <span className="font-semibold text-[var(--text-primary)] block mb-2">Referential Hierarchy:</span>
          <div className="flex flex-wrap items-center gap-2">
            {relationships.map((rel, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border font-mono text-[11px]"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="font-semibold text-[var(--accent-primary)]">{rel.parentTable}</span>
                <span className="text-[var(--text-muted)]">({rel.pkCol})</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span className="font-semibold text-[var(--accent-primary)]">{rel.childTable}</span>
                <span className="text-[var(--text-muted)]">({rel.fkCol})</span>
                <span className="ml-1 text-[var(--text-secondary)] font-sans">
                  ({rel.linkCount} records linked)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schema Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => {
          const isActive = table.name === activeTable;
          const fk = table.foreignKeys?.[0];

          return (
            <div
              key={table.id}
              onClick={() => onSelectTable(table.name)}
              className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${
                isActive
                  ? 'ring-2 ring-[var(--accent-primary)] border-[var(--border-focus)]'
                  : 'hover:border-[var(--border-hover)]'
              }`}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: isActive ? 'var(--border-focus)' : 'var(--border-subtle)',
              }}
            >
              {/* Card Header */}
              <div
                className="p-3 border-b flex items-center justify-between"
                style={{
                  backgroundColor: isActive ? 'var(--accent-light)' : 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                    {table.name}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {table.columns.length} cols
                </span>
              </div>

              {/* Table Columns List */}
              <div className="p-3 divide-y text-xs font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
                {table.columns.map((col) => {
                  const isPk = col.name === table.primaryKey;
                  const isFk = fk && col.name === fk.column;

                  return (
                    <div
                      key={col.id}
                      className="py-1.5 flex items-center justify-between gap-2"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isPk ? (
                          <span title="Primary Key" className="shrink-0 flex items-center">
                            <Key className="w-3 h-3 text-amber-500" />
                          </span>
                        ) : isFk ? (
                          <span title="Foreign Key" className="shrink-0 flex items-center">
                            <ArrowRight className="w-3 h-3 text-[var(--accent-primary)]" />
                          </span>
                        ) : (
                          <span className="w-3 h-3 inline-block" />
                        )}
                        <span className={`truncate text-[11px] ${isPk ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                          {col.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {col.type}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Card Footer */}
              {fk && (
                <div className="p-2 bg-[var(--bg-surface-subtle)] border-t text-[10px] text-[var(--text-muted)] flex items-center gap-1" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span>FK:</span>
                  <span className="font-mono text-[var(--accent-primary)]">
                    {fk.column} &rarr; {fk.targetTable}.{fk.targetColumn}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
