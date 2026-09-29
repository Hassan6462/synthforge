import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Table as TableIcon,
  Key,
  ArrowRight,
  Calculator,
  Settings2,
  Sparkles,
  Link,
  Layers,
  X,
  Check,
} from 'lucide-react';
import {
  ColumnDataType,
  ColumnDefinition,
  ForeignKeyDefinition,
  RelationshipCardinality,
  TableSchema,
  ComputedAggregationType,
} from '../types';

interface RelationalSchemaEditorProps {
  tables: TableSchema[];
  activeTableName: string;
  onSelectTable: (name: string) => void;
  onChangeTables: (tables: TableSchema[]) => void;
  onClose?: () => void;
}

const AVAILABLE_TYPES: { type: ColumnDataType; label: string }[] = [
  { type: 'uuid', label: 'UUID (ID)' },
  { type: 'integer', label: 'Integer' },
  { type: 'float', label: 'Float' },
  { type: 'string', label: 'String' },
  { type: 'boolean', label: 'Boolean' },
  { type: 'date', label: 'Date' },
  { type: 'category', label: 'Category' },
  { type: 'email', label: 'Email' },
  { type: 'full name', label: 'Full Name' },
  { type: 'phone', label: 'Phone' },
  { type: 'address', label: 'Address' },
  { type: 'company', label: 'Company' },
];

export const RelationalSchemaEditor: React.FC<RelationalSchemaEditorProps> = ({
  tables,
  activeTableName,
  onSelectTable,
  onChangeTables,
  onClose,
}) => {
  const [newTableName, setNewTableName] = useState<string>('');
  const [isAddingTable, setIsAddingTable] = useState<boolean>(false);

  // New column form state
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<ColumnDataType>('string');

  const activeTable = tables.find((t) => t.name === activeTableName) || tables[0];

  // Helper to update active table
  const updateActiveTable = (updatedTable: Partial<TableSchema>) => {
    const updated = tables.map((t) => {
      if (t.name === activeTable.name) {
        return { ...t, ...updatedTable };
      }
      return t;
    });
    onChangeTables(updated);
  };

  // Add new Table
  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    const cleanName = newTableName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (tables.some((t) => t.name === cleanName)) {
      alert('A table with this name already exists.');
      return;
    }

    const newTable: TableSchema = {
      id: `tbl_${Date.now()}`,
      name: cleanName,
      description: `Synthetic entity table for ${cleanName}`,
      primaryKey: 'id',
      columns: [
        { id: `col_${Date.now()}_1`, name: 'id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: `col_${Date.now()}_2`, name: 'created_at', type: 'date', nullPercentage: 0, isUnique: false },
      ],
      foreignKeys: [],
    };

    const updated = [...tables, newTable];
    onChangeTables(updated);
    onSelectTable(cleanName);
    setNewTableName('');
    setIsAddingTable(false);
  };

  // Delete Table
  const handleDeleteTable = (name: string) => {
    if (tables.length <= 1) {
      alert('You must have at least one table in a relational schema.');
      return;
    }
    const updated = tables.filter((t) => t.name !== name);
    onChangeTables(updated);
    if (activeTableName === name) {
      onSelectTable(updated[0]?.name || '');
    }
  };

  // Add Column to active table
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    const cleanName = newColName.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const newCol: ColumnDefinition = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: cleanName,
      type: newColType,
      nullPercentage: 0,
      isUnique: false,
    };

    updateActiveTable({
      columns: [...activeTable.columns, newCol],
    });
    setNewColName('');
  };

  // Delete Column
  const handleDeleteColumn = (colId: string) => {
    if (activeTable.columns.length <= 1) {
      alert('A table must have at least one column.');
      return;
    }
    const colToDelete = activeTable.columns.find((c) => c.id === colId);
    if (colToDelete && colToDelete.name === activeTable.primaryKey) {
      alert('Cannot delete the primary key column. Change the primary key first.');
      return;
    }
    updateActiveTable({
      columns: activeTable.columns.filter((c) => c.id !== colId),
    });
  };

  // Add Foreign Key constraint
  const handleAddForeignKey = () => {
    const candidateParents = tables.filter((t) => t.name !== activeTable.name);
    if (candidateParents.length === 0) {
      alert('You need at least two tables to create a foreign key relationship.');
      return;
    }

    const defaultParent = candidateParents[0];
    const defaultFkCol = `${defaultParent.name}_id`;

    // Automatically ensure the FK column exists in active table
    let updatedCols = [...activeTable.columns];
    if (!updatedCols.some((c) => c.name === defaultFkCol)) {
      updatedCols.push({
        id: `col_fk_${Date.now()}`,
        name: defaultFkCol,
        type: 'uuid',
        nullPercentage: 0,
        isUnique: false,
      });
    }

    const newFk: ForeignKeyDefinition = {
      id: `fk_${Date.now()}`,
      column: defaultFkCol,
      targetTable: defaultParent.name,
      targetColumn: defaultParent.primaryKey,
      cardinality: '1:N',
      ratioMin: 1,
      ratioMax: 4,
    };

    updateActiveTable({
      columns: updatedCols,
      foreignKeys: [...(activeTable.foreignKeys || []), newFk],
    });
  };

  // Update Foreign Key
  const handleUpdateForeignKey = (fkId: string, updates: Partial<ForeignKeyDefinition>) => {
    const updatedFks = (activeTable.foreignKeys || []).map((fk) => {
      if (fk.id === fkId) {
        return { ...fk, ...updates };
      }
      return fk;
    });
    updateActiveTable({ foreignKeys: updatedFks });
  };

  // Delete Foreign Key
  const handleDeleteForeignKey = (fkId: string) => {
    updateActiveTable({
      foreignKeys: (activeTable.foreignKeys || []).filter((f) => f.id !== fkId),
    });
  };

  // Toggle/Update Computed Column option
  const handleToggleComputedColumn = (colId: string, isComputed: boolean) => {
    const candidateChildren = tables.filter((t) =>
      t.foreignKeys?.some((f) => f.targetTable === activeTable.name)
    );

    const defaultChild = candidateChildren[0] || tables.find((t) => t.name !== activeTable.name);
    const childFk = defaultChild?.foreignKeys?.find((f) => f.targetTable === activeTable.name);

    const updatedCols = activeTable.columns.map((c) => {
      if (c.id === colId) {
        if (!isComputed) {
          return { ...c, isComputed: false, computedConfig: undefined };
        }
        return {
          ...c,
          isComputed: true,
          computedConfig: {
            aggregation: 'sum' as ComputedAggregationType,
            targetChildTable: defaultChild?.name || 'order_items',
            targetChildColumn: defaultChild?.columns[0]?.name || 'line_total',
            foreignKeyColumn: childFk?.column || `${activeTable.name}_id`,
          },
        };
      }
      return c;
    });

    updateActiveTable({ columns: updatedCols });
  };

  const handleUpdateComputedConfig = (
    colId: string,
    field: string,
    value: any
  ) => {
    const updatedCols = activeTable.columns.map((c) => {
      if (c.id === colId && c.computedConfig) {
        return {
          ...c,
          computedConfig: {
            ...c.computedConfig,
            [field]: value,
          },
        };
      }
      return c;
    });
    updateActiveTable({ columns: updatedCols });
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      {/* Top Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Relational Schema & Key Editor
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            ({tables.length} entities defined)
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            aria-label="Close Schema Editor"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Editor Body: Left Tables Directory | Right Table Details */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Tables Sidebar */}
        <div
          className="w-full md:w-64 border-r flex flex-col overflow-hidden shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Add Table Button */}
          <div className="p-3 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
            {isAddingTable ? (
              <form onSubmit={handleCreateTable} className="space-y-2">
                <input
                  type="text"
                  placeholder="table_name (e.g. products)"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface-subtle)] focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingTable(false)}
                    className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTableName.trim()}
                    className="px-2.5 py-1 rounded text-xs font-semibold text-[var(--accent-foreground)] bg-[var(--accent-primary)] disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTable(true)}
                className="w-full py-1.5 px-3 rounded-lg border text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-light)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Table Entity</span>
              </button>
            )}
          </div>

          {/* Tables List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tables.map((t) => {
              const isActive = t.name === activeTable.name;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTable(t.name)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer group ${
                    isActive
                      ? 'border-[var(--border-focus)] shadow-xs'
                      : 'border-transparent hover:border-[var(--border-subtle)]'
                  }`}
                  style={{
                    backgroundColor: isActive ? 'var(--accent-light)' : 'var(--bg-surface-subtle)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <TableIcon className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                      {t.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {t.columns.length}c
                    </span>
                    {tables.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(t.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        title="Delete Table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Table Configurator */}
        {activeTable && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Table Identity & Primary Key */}
            <div
              className="p-4 sm:p-5 rounded-xl border space-y-4 shadow-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] tracking-wider">
                    Selected Table Entity
                  </span>
                  <h4 className="text-base font-bold text-[var(--text-primary)] font-mono">
                    {activeTable.name}
                  </h4>
                </div>

                {/* Primary Key Selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--text-muted)] font-mono flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>Primary Key:</span>
                  </span>
                  <select
                    value={activeTable.primaryKey}
                    onChange={(e) => updateActiveTable({ primaryKey: e.target.value })}
                    className="px-3 py-1.5 rounded-lg border text-xs font-mono font-bold bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    {activeTable.columns.map((col) => (
                      <option key={col.id} value={col.name}>
                        {col.name} ({col.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Columns Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Columns ({activeTable.columns.length})
                  </span>

                  {/* Add Column quick form */}
                  <form onSubmit={handleAddColumn} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="column_name"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface-subtle)] focus:outline-none"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    />
                    <select
                      value={newColType}
                      onChange={(e) => setNewColType(e.target.value as ColumnDataType)}
                      className="px-2 py-1 rounded-lg border text-xs font-mono bg-[var(--bg-surface-subtle)] text-[var(--text-primary)]"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      {AVAILABLE_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!newColName.trim()}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[var(--accent-foreground)] bg-[var(--accent-primary)] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>

                {/* Columns List & Computed Column configuration */}
                <div className="space-y-2">
                  {activeTable.columns.map((col) => {
                    const isPk = col.name === activeTable.primaryKey;
                    const fk = activeTable.foreignKeys?.find((f) => f.column === col.name);
                    const isComputed = !!col.isComputed;

                    return (
                      <div
                        key={col.id}
                        className="p-3 rounded-lg border space-y-2"
                        style={{
                          backgroundColor: 'var(--bg-surface-subtle)',
                          borderColor: isComputed ? 'rgba(192, 132, 252, 0.4)' : 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 font-mono">
                            {isPk && (
                              <span title="Primary Key" className="flex items-center text-amber-500">
                                <Key className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {fk && (
                              <span title="Foreign Key" className="flex items-center text-[var(--accent-primary)]">
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <span className="font-bold text-[var(--text-primary)]">{col.name}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">({col.type})</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Computed Column Checkbox */}
                            {!isPk && !fk && (
                              <label className="flex items-center gap-1.5 text-[11px] text-purple-400 font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isComputed}
                                  onChange={(e) => handleToggleComputedColumn(col.id, e.target.checked)}
                                  className="w-3.5 h-3.5 rounded border"
                                />
                                <span>Computed Column</span>
                              </label>
                            )}

                            {!isPk && (
                              <button
                                type="button"
                                onClick={() => handleDeleteColumn(col.id)}
                                className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                title="Delete Column"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Computed Column Configuration details */}
                        {isComputed && col.computedConfig && (
                          <div
                            className="p-2.5 rounded-md border text-xs font-mono space-y-2 mt-1"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-subtle)',
                            }}
                          >
                            <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                              <Calculator className="w-3.5 h-3.5" />
                              <span>Computed Aggregation Expression</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] text-[var(--text-muted)] block mb-0.5">
                                  Function
                                </label>
                                <select
                                  value={col.computedConfig.aggregation}
                                  onChange={(e) =>
                                    handleUpdateComputedConfig(col.id, 'aggregation', e.target.value)
                                  }
                                  className="w-full px-2 py-1 rounded border text-xs bg-[var(--bg-surface-subtle)] text-[var(--text-primary)]"
                                  style={{ borderColor: 'var(--border-subtle)' }}
                                >
                                  <option value="sum">SUM</option>
                                  <option value="count">COUNT</option>
                                  <option value="avg">AVG</option>
                                  <option value="min">MIN</option>
                                  <option value="max">MAX</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] text-[var(--text-muted)] block mb-0.5">
                                  Target Child Table
                                </label>
                                <select
                                  value={col.computedConfig.targetChildTable}
                                  onChange={(e) =>
                                    handleUpdateComputedConfig(col.id, 'targetChildTable', e.target.value)
                                  }
                                  className="w-full px-2 py-1 rounded border text-xs bg-[var(--bg-surface-subtle)] text-[var(--text-primary)]"
                                  style={{ borderColor: 'var(--border-subtle)' }}
                                >
                                  {tables
                                    .filter((t) => t.name !== activeTable.name)
                                    .map((t) => (
                                      <option key={t.id} value={t.name}>
                                        {t.name}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] text-[var(--text-muted)] block mb-0.5">
                                  Target Child Column
                                </label>
                                <input
                                  type="text"
                                  value={col.computedConfig.targetChildColumn}
                                  onChange={(e) =>
                                    handleUpdateComputedConfig(col.id, 'targetChildColumn', e.target.value)
                                  }
                                  placeholder="e.g. line_total"
                                  className="w-full px-2 py-1 rounded border text-xs bg-[var(--bg-surface-subtle)] text-[var(--text-primary)]"
                                  style={{ borderColor: 'var(--border-subtle)' }}
                                />
                              </div>
                            </div>

                            <p className="text-[10px] text-[var(--text-muted)] font-sans">
                              Formula: <code>{activeTable.name}.{col.name}</code> ={' '}
                              <b className="text-purple-400">
                                {col.computedConfig.aggregation}({col.computedConfig.targetChildTable}.{col.computedConfig.targetChildColumn})
                              </b>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Foreign Keys Section (1:1, 1:N, N:N) */}
            <div
              className="p-4 sm:p-5 rounded-xl border space-y-4 shadow-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>Foreign Key Constraints & Cardinalities (1:1, 1:N, N:N)</span>
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Child rows pick only existing parent IDs — zero orphan rows guaranteed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddForeignKey}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent-primary)] border border-[var(--border-subtle)] hover:bg-[var(--accent-light)] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add FK Link</span>
                </button>
              </div>

              {/* Foreign Keys List */}
              {(!activeTable.foreignKeys || activeTable.foreignKeys.length === 0) ? (
                <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                  This table currently has no outgoing foreign keys. (It behaves as a root parent table).
                </p>
              ) : (
                <div className="space-y-3">
                  {activeTable.foreignKeys.map((fk) => (
                    <div
                      key={fk.id}
                      className="p-3.5 rounded-xl border space-y-3 font-mono text-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-[var(--accent-primary)]" />
                          <span className="font-bold text-[var(--text-primary)]">
                            {activeTable.name}.{fk.column} &rarr; {fk.targetTable}.{fk.targetColumn}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteForeignKey(fk.id)}
                          className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                          title="Remove Foreign Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Foreign Key Parameters */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] block mb-1">
                            Local FK Column
                          </label>
                          <select
                            value={fk.column}
                            onChange={(e) => handleUpdateForeignKey(fk.id, { column: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            {activeTable.columns.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] block mb-1">
                            Target Parent Table
                          </label>
                          <select
                            value={fk.targetTable}
                            onChange={(e) => {
                              const parent = tables.find((t) => t.name === e.target.value);
                              handleUpdateForeignKey(fk.id, {
                                targetTable: e.target.value,
                                targetColumn: parent?.primaryKey || 'id',
                              });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-[var(--bg-surface)] text-[var(--text-primary)]"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            {tables
                              .filter((t) => t.name !== activeTable.name)
                              .map((t) => (
                                <option key={t.id} value={t.name}>
                                  {t.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] block mb-1">
                            Cardinality
                          </label>
                          <select
                            value={fk.cardinality}
                            onChange={(e) =>
                              handleUpdateForeignKey(fk.id, {
                                cardinality: e.target.value as RelationshipCardinality,
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold bg-[var(--bg-surface)] text-[var(--accent-primary)]"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            <option value="1:1">1:1 (One-to-One)</option>
                            <option value="1:N">1:N (One-to-Many)</option>
                            <option value="N:N">N:N (Many-to-Many)</option>
                          </select>
                        </div>

                        {fk.cardinality === '1:N' && (
                          <div className="flex items-center gap-1 pt-4">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={fk.ratioMin || 1}
                              onChange={(e) =>
                                handleUpdateForeignKey(fk.id, { ratioMin: Number(e.target.value) })
                              }
                              className="w-14 px-2 py-1 rounded border text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] text-center"
                              style={{ borderColor: 'var(--border-subtle)' }}
                              title="Min children per parent"
                            />
                            <span className="text-[10px] text-[var(--text-muted)]">to</span>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={fk.ratioMax || 4}
                              onChange={(e) =>
                                handleUpdateForeignKey(fk.id, { ratioMax: Number(e.target.value) })
                              }
                              className="w-14 px-2 py-1 rounded border text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] text-center"
                              style={{ borderColor: 'var(--border-subtle)' }}
                              title="Max children per parent"
                            />
                            <span className="text-[10px] text-[var(--text-muted)] font-sans">
                              children
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
