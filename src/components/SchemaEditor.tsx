import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Sliders,
  Settings2,
  X,
  Scale,
  Key,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { ColumnDataType, ColumnDefinition, CategoryWeight } from '../types';

interface SchemaEditorProps {
  columns: ColumnDefinition[];
  onChangeColumns: (columns: ColumnDefinition[]) => void;
  onClose?: () => void;
}

const AVAILABLE_TYPES: { type: ColumnDataType; label: string; desc: string }[] = [
  { type: 'integer', label: 'Integer', desc: 'Whole numbers within min/max range' },
  { type: 'float', label: 'Float', desc: 'Decimals with specified precision' },
  { type: 'string', label: 'String', desc: 'Lorem text words within length bounds' },
  { type: 'boolean', label: 'Boolean', desc: 'True or False boolean values' },
  { type: 'date', label: 'Date', desc: 'ISO dates between min and max bounds' },
  { type: 'category', label: 'Category', desc: 'Categorical items sampled by weight' },
  { type: 'uuid', label: 'UUID', desc: 'RFC 4122 v4 unique identifiers' },
  { type: 'email', label: 'Email', desc: 'Realistic email addresses' },
  { type: 'full name', label: 'Full Name', desc: 'Global personal names' },
  { type: 'phone', label: 'Phone', desc: 'Formatted phone numbers' },
  { type: 'address', label: 'Address', desc: 'Street address with city and state' },
  { type: 'company', label: 'Company', desc: 'Realistic corporate enterprise names' },
];

export const SchemaEditor: React.FC<SchemaEditorProps> = ({
  columns,
  onChangeColumns,
  onClose,
}) => {
  const [activeColId, setActiveColId] = useState<string | null>(columns[0]?.id || null);
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<ColumnDataType>('full name');

  // Reorder column up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newCols = [...columns];
    const temp = newCols[index - 1];
    newCols[index - 1] = newCols[index];
    newCols[index] = temp;
    onChangeColumns(newCols);
  };

  // Reorder column down
  const handleMoveDown = (index: number) => {
    if (index >= columns.length - 1) return;
    const newCols = [...columns];
    const temp = newCols[index + 1];
    newCols[index + 1] = newCols[index];
    newCols[index] = temp;
    onChangeColumns(newCols);
  };

  // Add column
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
      min: newColType === 'integer' ? 10 : newColType === 'float' ? 0 : 2,
      max: newColType === 'integer' ? 1000 : newColType === 'float' ? 100 : 6,
      precision: 2,
      minDate: '2022-01-01',
      maxDate: '2026-12-31',
      categoryWeights:
        newColType === 'category'
          ? [
              { id: 'w1', value: 'Low', weight: 50 },
              { id: 'w2', value: 'Medium', weight: 35 },
              { id: 'w3', value: 'High', weight: 15 },
            ]
          : undefined,
    };

    const updated = [...columns, newCol];
    onChangeColumns(updated);
    setActiveColId(newCol.id);
    setNewColName('');
  };

  // Delete column
  const handleDeleteColumn = (id: string) => {
    if (columns.length <= 1) {
      alert('A schema must have at least one column.');
      return;
    }
    const updated = columns.filter((c) => c.id !== id);
    onChangeColumns(updated);
    if (activeColId === id) {
      setActiveColId(updated[0]?.id || null);
    }
  };

  // Update specific column properties
  const handleUpdateColumn = (id: string, updates: Partial<ColumnDefinition>) => {
    const updated = columns.map((col) => {
      if (col.id === id) {
        const merged = { ...col, ...updates };
        // If type changed to category and no weights exist, seed default
        if (updates.type === 'category' && (!merged.categoryWeights || merged.categoryWeights.length === 0)) {
          merged.categoryWeights = [
            { id: 'cw_1', value: 'Tier A', weight: 50 },
            { id: 'cw_2', value: 'Tier B', weight: 30 },
            { id: 'cw_3', value: 'Tier C', weight: 20 },
          ];
        }
        return merged;
      }
      return col;
    });
    onChangeColumns(updated);
  };

  // Category weight management
  const handleAddCategoryWeight = (colId: string) => {
    const col = columns.find((c) => c.id === colId);
    if (!col) return;
    const currentWeights = col.categoryWeights || [];
    const newWeight: CategoryWeight = {
      id: `cw_${Date.now()}`,
      value: `Option ${currentWeights.length + 1}`,
      weight: 10,
    };
    handleUpdateColumn(colId, {
      categoryWeights: [...currentWeights, newWeight],
    });
  };

  const handleUpdateCategoryWeight = (
    colId: string,
    weightId: string,
    field: 'value' | 'weight',
    newVal: any
  ) => {
    const col = columns.find((c) => c.id === colId);
    if (!col || !col.categoryWeights) return;
    const updatedWeights = col.categoryWeights.map((w) => {
      if (w.id === weightId) {
        return {
          ...w,
          [field]: field === 'weight' ? Math.max(0, Number(newVal) || 0) : newVal,
        };
      }
      return w;
    });
    handleUpdateColumn(colId, { categoryWeights: updatedWeights });
  };

  const handleDeleteCategoryWeight = (colId: string, weightId: string) => {
    const col = columns.find((c) => c.id === colId);
    if (!col || !col.categoryWeights || col.categoryWeights.length <= 1) return;
    const updatedWeights = col.categoryWeights.filter((w) => w.id !== weightId);
    handleUpdateColumn(colId, { categoryWeights: updatedWeights });
  };

  const activeColumn = columns.find((c) => c.id === activeColId) || columns[0];

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      {/* Editor Sub-Header */}
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
            Tabular Schema Editor
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            ({columns.length} columns configured)
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

      {/* Editor Layout: Left Column List & Reordering | Right Column Inspector */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Column List */}
        <div
          className="w-full md:w-80 border-r flex flex-col overflow-hidden shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Add Column Quick Form */}
          <form
            onSubmit={handleAddColumn}
            className="p-3 border-b space-y-2 shrink-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="new_column_name"
                className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              />
              <button
                type="submit"
                disabled={!newColName.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent-foreground)] shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            <select
              value={newColType}
              onChange={(e) => setNewColType(e.target.value as ColumnDataType)}
              className="w-full px-2 py-1.5 rounded-lg border text-xs bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-mono"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {AVAILABLE_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label} ({t.type})
                </option>
              ))}
            </select>
          </form>

          {/* Reorderable Columns List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {columns.map((col, index) => {
              const isSelected = activeColId === col.id;
              return (
                <div
                  key={col.id}
                  onClick={() => setActiveColId(col.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-[var(--border-focus)] shadow-xs'
                      : 'border-transparent hover:border-[var(--border-subtle)]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-surface-subtle)',
                  }}
                >
                  {/* Name and Badges */}
                  <div className="min-w-0 pr-2 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                        {col.name}
                      </span>
                      {col.isUnique && (
                        <span
                          className="px-1 py-0.2 rounded text-[10px] font-mono text-amber-500 font-semibold"
                          title="Unique values enforced"
                        >
                          UQ
                        </span>
                      )}
                      {col.nullPercentage > 0 && (
                        <span
                          className="text-[10px] font-mono text-[var(--text-muted)]"
                          title={`${col.nullPercentage}% null rate`}
                        >
                          {col.nullPercentage}% null
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                      {col.type}
                    </span>
                  </div>

                  {/* Reordering & Delete Controls */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 cursor-pointer"
                      title="Move Column Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === columns.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 cursor-pointer"
                      title="Move Column Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteColumn(col.id)}
                      className="p-1 text-red-500 hover:text-red-700 opacity-60 hover:opacity-100 cursor-pointer ml-1"
                      title="Delete Column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column Inspector / Properties Editor */}
        {activeColumn && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Column Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] tracking-wider">
                  Field Configuration
                </span>
                <h4 className="text-base font-bold text-[var(--text-primary)] font-mono">
                  {activeColumn.name}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] font-mono">Type:</span>
                <select
                  value={activeColumn.type}
                  onChange={(e) => handleUpdateColumn(activeColumn.id, { type: e.target.value as ColumnDataType })}
                  className="px-3 py-1.5 rounded-lg border text-xs font-mono bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  {AVAILABLE_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Core Attributes Card */}
            <div
              className="p-4 sm:p-5 rounded-xl border space-y-5 shadow-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Field Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Column Name</label>
                <input
                  type="text"
                  value={activeColumn.name}
                  onChange={(e) =>
                    handleUpdateColumn(activeColumn.id, {
                      name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface-subtle)] focus:outline-none"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              {/* Null % Slider & Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="colNullRate" className="font-medium text-[var(--text-secondary)]">
                    Null Percentage (%)
                  </label>
                  <span className="font-mono font-bold text-[var(--text-primary)] tabular-nums">
                    {activeColumn.nullPercentage}%
                  </span>
                </div>
                <input
                  id="colNullRate"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={activeColumn.nullPercentage}
                  onChange={(e) =>
                    handleUpdateColumn(activeColumn.id, { nullPercentage: Number(e.target.value) })
                  }
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
                <span className="text-[11px] text-[var(--text-muted)] block">
                  Probability of generating <code className="text-amber-500">null</code> values for this specific column.
                </span>
              </div>

              {/* Unique Toggle */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-xs font-semibold text-[var(--text-primary)] block">
                        Unique Constraint Toggle
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Enforce strictly distinct values with zero duplicates across all rows.
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeColumn.isUnique}
                    onChange={(e) => handleUpdateColumn(activeColumn.id, { isUnique: e.target.checked })}
                    className="w-4 h-4 rounded border text-[var(--accent-primary)] cursor-pointer"
                  />
                </label>
              </div>

              {/* Min/Max Controls (for Numeric, String, Date) */}
              {(activeColumn.type === 'integer' ||
                activeColumn.type === 'float' ||
                activeColumn.type === 'string') && (
                <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                    <span>Range Boundaries (Min / Max)</span>
                    <span className="text-[11px] text-[var(--text-muted)] font-normal">
                      {activeColumn.type === 'string' ? 'Words length' : 'Numerical limits'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[var(--text-muted)]">Min Value</label>
                      <input
                        type="number"
                        value={activeColumn.min ?? (activeColumn.type === 'integer' ? 1 : 0)}
                        onChange={(e) =>
                          handleUpdateColumn(activeColumn.id, { min: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface-subtle)]"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-[var(--text-muted)]">Max Value</label>
                      <input
                        type="number"
                        value={activeColumn.max ?? (activeColumn.type === 'integer' ? 1000 : 100)}
                        onChange={(e) =>
                          handleUpdateColumn(activeColumn.id, { max: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface-subtle)]"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      />
                    </div>
                  </div>

                  {activeColumn.type === 'float' && (
                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] text-[var(--text-muted)]">Decimal Precision</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={activeColumn.precision ?? 2}
                        onChange={(e) =>
                          handleUpdateColumn(activeColumn.id, { precision: Number(e.target.value) })
                        }
                        className="w-32 px-3 py-1.5 rounded-lg border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface-subtle)]"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Date Min/Max Controls */}
              {activeColumn.type === 'date' && (
                <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                    <span>Date Bounds (Min / Max)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-[var(--text-muted)]">Earliest Date</label>
                      <input
                        type="date"
                        value={activeColumn.minDate || '2020-01-01'}
                        onChange={(e) =>
                          handleUpdateColumn(activeColumn.id, { minDate: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface-subtle)]"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-[var(--text-muted)]">Latest Date</label>
                      <input
                        type="date"
                        value={activeColumn.maxDate || '2026-12-31'}
                        onChange={(e) =>
                          handleUpdateColumn(activeColumn.id, { maxDate: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface-subtle)]"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Category Weights List Editor */}
              {activeColumn.type === 'category' && (
                <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[var(--text-secondary)] block">
                        Category Options & Weights List
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Configure non-uniform distribution percentages.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddCategoryWeight(activeColumn.id)}
                      className="flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Option</span>
                    </button>
                  </div>

                  {/* Weights Table */}
                  <div className="space-y-2">
                    {(() => {
                      const weights = activeColumn.categoryWeights || [];
                      const totalWeight = weights.reduce((acc, w) => acc + Math.max(0, w.weight), 0) || 1;

                      return weights.map((w) => {
                        const pct = Math.round((Math.max(0, w.weight) / totalWeight) * 100);
                        return (
                          <div
                            key={w.id}
                            className="flex items-center gap-2 p-2 rounded-lg border"
                            style={{
                              backgroundColor: 'var(--bg-surface-subtle)',
                              borderColor: 'var(--border-subtle)',
                            }}
                          >
                            <input
                              type="text"
                              value={w.value}
                              onChange={(e) =>
                                handleUpdateCategoryWeight(activeColumn.id, w.id, 'value', e.target.value)
                              }
                              placeholder="Category name"
                              className="flex-1 px-2.5 py-1 rounded border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none"
                              style={{ borderColor: 'var(--border-subtle)' }}
                            />

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] text-[var(--text-muted)]">Weight:</span>
                              <input
                                type="number"
                                min={0}
                                max={1000}
                                value={w.weight}
                                onChange={(e) =>
                                  handleUpdateCategoryWeight(activeColumn.id, w.id, 'weight', e.target.value)
                                }
                                className="w-16 px-2 py-1 rounded border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface)] text-right"
                                style={{ borderColor: 'var(--border-subtle)' }}
                              />
                              <span className="text-[11px] font-mono text-[var(--accent-primary)] font-bold w-10 text-right tabular-nums">
                                {pct}%
                              </span>
                            </div>

                            {weights.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategoryWeight(activeColumn.id, w.id)}
                                className="p-1 text-red-500 hover:text-red-700 opacity-60 hover:opacity-100 cursor-pointer"
                                title="Remove Category Option"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
