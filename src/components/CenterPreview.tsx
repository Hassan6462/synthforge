import React, { useState, useMemo } from 'react';
import {
  Search,
  Table as TableIcon,
  Code,
  BarChart3,
  GitMerge,
  Settings2,
  Cpu,
  Archive,
  FileText,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { ColumnDefinition, TableSchema, TabType, DocumentRegion } from '../types';
import { ColumnProfiler } from './ColumnProfiler';
import { ReactFlowERDiagram } from './ReactFlowERDiagram';
import { DocumentViewer } from './DocumentViewer';
import { VirtualizedTable } from './VirtualizedTable';
import { SchemaEditor } from './SchemaEditor';
import { RelationalSchemaEditor } from './RelationalSchemaEditor';

interface CenterPreviewProps {
  activeTab: TabType;
  // Tabular data
  tabularRows: Record<string, any>[];
  tabularColumns: ColumnDefinition[];
  onChangeTabularColumns: (cols: ColumnDefinition[]) => void;
  // Relational data
  relationalTables: TableSchema[];
  relationalData: Record<string, Record<string, any>[]>;
  relationalRelationships: {
    id: string;
    parentTable: string;
    childTable: string;
    fkCol: string;
    pkCol: string;
    cardinality: string;
    linkCount: number;
  }[];
  activeRelationalTable: string;
  onSelectRelationalTable: (table: string) => void;
  onChangeRelationalTables?: (tables: TableSchema[]) => void;
  onExportRelationalZip?: () => void;
  onExportRelationalSql?: () => void;
  // Documents data
  documentsData: any[];
  selectedRegion?: DocumentRegion;
  onSelectRegion?: (region: DocumentRegion) => void;
  // Web worker status
  isWorkerGenerating?: boolean;
  totalConfiguredRows?: number;
  onOpenValidation?: () => void;
  qualityScore?: number;
}

export const CenterPreview: React.FC<CenterPreviewProps> = ({
  activeTab,
  tabularRows,
  tabularColumns,
  onChangeTabularColumns,
  relationalTables,
  relationalData,
  relationalRelationships,
  activeRelationalTable,
  onSelectRelationalTable,
  onChangeRelationalTables,
  onExportRelationalZip,
  onExportRelationalSql,
  documentsData,
  selectedRegion,
  onSelectRegion,
  isWorkerGenerating = false,
  totalConfiguredRows = 50,
  onOpenValidation,
  qualityScore,
}) => {
  // Center view states
  const [viewMode, setViewMode] = useState<'grid' | 'schema' | 'relational_schema' | 'json' | 'profiler' | 'er'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Active dataset for table view
  const currentRows = useMemo(() => {
    if (activeTab === 'tabular') {
      return tabularRows;
    }
    if (activeTab === 'relational') {
      return relationalData[activeRelationalTable] || [];
    }
    return [];
  }, [activeTab, tabularRows, relationalData, activeRelationalTable]);

  const currentColumns = useMemo(() => {
    if (activeTab === 'tabular') {
      return tabularColumns;
    }
    if (activeTab === 'relational') {
      const tbl = relationalTables.find((t) => t.name === activeRelationalTable);
      if (tbl) return tbl.columns;
      if (currentRows.length > 0) {
        return Object.keys(currentRows[0]).map((k) => ({
          id: k,
          name: k,
          type: 'string' as const,
          nullPercentage: 0,
          isUnique: false,
        }));
      }
    }
    return [];
  }, [activeTab, tabularColumns, relationalTables, activeRelationalTable, currentRows]);

  // Handle Search Filtering
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return currentRows;
    const q = searchQuery.toLowerCase();
    return currentRows.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [currentRows, searchQuery]);

  // Handle Sorting
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    const sorted = [...filteredRows].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [filteredRows, sortColumn, sortDirection]);

  // Sort toggle handler
  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  return (
    <main
      className="flex-1 flex flex-col min-w-0 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* Top Preview Sub-Bar */}
      <div
        className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Left: Relational Table Tabs & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'relational' && (
            <div className="flex items-center gap-1 p-0.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
              {relationalTables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectRelationalTable(t.name);
                    if (viewMode === 'relational_schema') {
                      // remain in schema view
                    } else if (viewMode !== 'er') {
                      setViewMode('grid');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md font-mono font-medium transition-colors cursor-pointer ${
                    activeRelationalTable === t.name
                      ? 'text-[var(--accent-foreground)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  style={{
                    backgroundColor: activeRelationalTable === t.name ? 'var(--accent-primary)' : 'transparent',
                  }}
                >
                  {t.name}
                  <span className="ml-1 text-[10px] opacity-80">
                    ({(relationalData[t.name] || []).length})
                  </span>
                </button>
              ))}
            </div>
          )}

          {activeTab !== 'documents' && viewMode !== 'schema' && viewMode !== 'relational_schema' && (
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === 'relational' ? activeRelationalTable : 'data'}...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs text-[var(--text-primary)] focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Tabular worker status */}
          {activeTab === 'tabular' && (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono">
              <Cpu className={`w-3.5 h-3.5 ${isWorkerGenerating ? 'text-[var(--accent-primary)] animate-pulse' : 'text-emerald-500'}`} />
              <span className="hidden sm:inline">
                {isWorkerGenerating ? 'Worker synthesizing (400ms debounce)...' : 'Faker Web Worker synced'}
              </span>
            </div>
          )}
        </div>

        {/* Right: View Mode Segmented Controls & Relational Export actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Export buttons for Relational tab */}
          {activeTab === 'relational' && (
            <div className="hidden sm:flex items-center gap-1.5 border-r pr-2 mr-1" style={{ borderColor: 'var(--border-subtle)' }}>
              {onExportRelationalZip && (
                <button
                  type="button"
                  onClick={onExportRelationalZip}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                  title="Export all relational tables as a ZIP containing CSV files"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-500" />
                  <span>ZIP of CSVs</span>
                </button>
              )}

              {onExportRelationalSql && (
                <button
                  type="button"
                  onClick={onExportRelationalSql}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                  title="Export complete relational database as SQL dump with CREATE TABLE and INSERT statements"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>SQL Dump</span>
                </button>
              )}
            </div>
          )}

          {activeTab !== 'documents' && (
            <div className="flex items-center p-0.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
              {/* Virtualized Grid */}
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
                }`}
                title="Data Grid"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Data Grid</span>
              </button>

              {/* Tabular Schema Editor */}
              {activeTab === 'tabular' && (
                <button
                  type="button"
                  onClick={() => setViewMode('schema')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    viewMode === 'schema' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
                  }`}
                  title="Configure & Reorder Schema Columns"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Schema Editor</span>
                </button>
              )}

              {/* Interactive React Flow ER Diagram */}
              {activeTab === 'relational' && (
                <button
                  type="button"
                  onClick={() => setViewMode('er')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    viewMode === 'er' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
                  }`}
                  title="Interactive React Flow Entity Relationship Graph"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ER Diagram</span>
                </button>
              )}

              {/* Relational Schema & Key Editor */}
              {activeTab === 'relational' && onChangeRelationalTables && (
                <button
                  type="button"
                  onClick={() => setViewMode('relational_schema')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                    viewMode === 'relational_schema' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
                  }`}
                  title="Define Tables, Primary Keys, Foreign Keys (1:1, 1:N, N:N), and Computed Columns"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Schema & FKs</span>
                </button>
              )}

              {/* Column Profiler */}
              <button
                type="button"
                onClick={() => setViewMode('profiler')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                  viewMode === 'profiler' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
                }`}
                title="Statistical Data Profiler"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profiler</span>
              </button>

              {/* Raw JSON */}
              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                  viewMode === 'json' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
                }`}
                title="Raw JSON Payload"
              >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          )}

          {/* Quick Validate Button */}
          {onOpenValidation && (
            <button
              type="button"
              onClick={onOpenValidation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
              title="Validate Dataset: Orphan FKs, Unique Column Dupes, Null %, Invoice Totals & Quality Score"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Validate</span>
              {qualityScore !== undefined && (
                <span className="font-mono text-[10px] tabular-nums font-bold">
                  ({qualityScore}%)
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-hidden relative">
        {/* Documents Mode */}
        {activeTab === 'documents' ? (
          <DocumentViewer
            documents={documentsData}
            selectedRegion={selectedRegion}
            onSelectRegion={onSelectRegion}
          />
        ) : viewMode === 'schema' && activeTab === 'tabular' ? (
          <SchemaEditor
            columns={tabularColumns}
            onChangeColumns={onChangeTabularColumns}
            onClose={() => setViewMode('grid')}
          />
        ) : viewMode === 'relational_schema' && activeTab === 'relational' && onChangeRelationalTables ? (
          <RelationalSchemaEditor
            tables={relationalTables}
            activeTableName={activeRelationalTable}
            onSelectTable={onSelectRelationalTable}
            onChangeTables={onChangeRelationalTables}
            onClose={() => setViewMode('grid')}
          />
        ) : viewMode === 'er' && activeTab === 'relational' ? (
          /* Interactive React Flow ER Diagram */
          <ReactFlowERDiagram
            tables={relationalTables}
            activeTable={activeRelationalTable}
            onSelectTable={(tbl) => {
              onSelectRelationalTable(tbl);
              setViewMode('grid');
            }}
            relationships={relationalRelationships}
          />
        ) : viewMode === 'profiler' ? (
          <div className="h-full overflow-y-auto">
            <ColumnProfiler rows={currentRows} columns={currentColumns} />
          </div>
        ) : viewMode === 'json' ? (
          <div className="p-4 sm:p-6 font-mono text-xs overflow-auto h-full">
            <pre
              className="p-4 rounded-xl border leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {JSON.stringify(currentRows, null, 2)}
            </pre>
          </div>
        ) : (
          /* High-Performance Virtualized Table */
          <VirtualizedTable
            rows={sortedRows}
            columns={currentColumns}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </div>

      {/* Table Footer */}
      {activeTab !== 'documents' && viewMode === 'grid' && (
        <div
          className="px-4 py-2 border-t flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] gap-2 shrink-0 select-none"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2 font-mono">
            <span>
              Previewing {sortedRows.length} rows in <b>{activeTab === 'relational' ? activeRelationalTable : 'table'}</b>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[var(--accent-primary)]">
              {currentColumns.length} columns active
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {activeTab === 'relational' && (
              <button
                type="button"
                onClick={() => setViewMode('relational_schema')}
                className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Settings2 className="w-3 h-3" />
                <span>Configure Schema & FKs</span>
              </button>
            )}
            {activeTab === 'tabular' && (
              <button
                type="button"
                onClick={() => setViewMode('schema')}
                className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Settings2 className="w-3 h-3" />
                <span>Open Schema Editor</span>
              </button>
            )}
            {onOpenValidation ? (
              <button
                type="button"
                onClick={onOpenValidation}
                className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-mono font-medium"
                title="Open Validation Report"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Zero Orphan Rows Guaranteed ({qualityScore ?? 100}/100)</span>
              </button>
            ) : (
              <span className="text-[var(--text-muted)] font-mono">
                Zero Orphan Rows Guaranteed
              </span>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
