import React, { useState } from 'react';
import {
  Sliders,
  Download,
  Copy,
  Check,
  Lock,
  Unlock,
  Shuffle,
  Plus,
  Trash2,
  X,
  Shield,
  AlertTriangle,
  FileSpreadsheet,
  Code,
  FileText,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { ColumnDataType, ColumnDefinition, ExportFormat, GenerationSettings, SqlDialect, TabType, DocumentRegion } from '../types';
import { Archive } from 'lucide-react';

interface ConfigPanelProps {
  activeTab: TabType;
  settings: GenerationSettings;
  onUpdateSettings: (newSettings: Partial<GenerationSettings>) => void;
  columns: ColumnDefinition[];
  onAddColumn: (col: ColumnDefinition) => void;
  onDeleteColumn: (colId: string) => void;
  onReorderColumns?: (cols: ColumnDefinition[]) => void;
  onExport: () => void;
  onExportDirect: (format: 'csv' | 'json' | 'sql') => void;
  onCopyClipboard: () => void;
  isCopied: boolean;
  isOpen: boolean;
  onClose: () => void;
  selectedRegion?: DocumentRegion;
  onSelectRegion?: (r: DocumentRegion) => void;
}

const AVAILABLE_TYPES: { type: ColumnDataType; label: string }[] = [
  { type: 'integer', label: 'Integer' },
  { type: 'float', label: 'Float' },
  { type: 'string', label: 'String' },
  { type: 'boolean', label: 'Boolean' },
  { type: 'date', label: 'Date' },
  { type: 'category', label: 'Category' },
  { type: 'uuid', label: 'UUID' },
  { type: 'email', label: 'Email' },
  { type: 'full name', label: 'Full Name' },
  { type: 'phone', label: 'Phone' },
  { type: 'address', label: 'Address' },
  { type: 'company', label: 'Company' },
];

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  activeTab,
  settings,
  onUpdateSettings,
  columns,
  onAddColumn,
  onDeleteColumn,
  onReorderColumns,
  onExport,
  onExportDirect,
  onCopyClipboard,
  isCopied,
  isOpen,
  onClose,
  selectedRegion = 'US',
  onSelectRegion,
}) => {
  const [isAddingField, setIsAddingField] = useState<boolean>(false);
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<ColumnDataType>('full name');

  const handleRollSeed = () => {
    onUpdateSettings({ seed: Math.floor(Math.random() * 900000) + 100000 });
  };

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    const cleanName = newFieldName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    onAddColumn({
      id: `col_${Date.now()}`,
      name: cleanName,
      type: newFieldType,
      nullPercentage: 0,
      isUnique: false,
      min: newFieldType === 'integer' ? 1 : newFieldType === 'float' ? 0 : 2,
      max: newFieldType === 'integer' ? 1000 : newFieldType === 'float' ? 100 : 5,
      precision: 2,
      categoryWeights:
        newFieldType === 'category'
          ? [
              { id: 'cw1', value: 'High', weight: 40 },
              { id: 'cw2', value: 'Normal', weight: 60 },
            ]
          : undefined,
    });

    setNewFieldName('');
    setIsAddingField(false);
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    if (!onReorderColumns) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const newCols = [...columns];
    const temp = newCols[targetIndex];
    newCols[targetIndex] = newCols[index];
    newCols[index] = temp;
    onReorderColumns(newCols);
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs xl:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed xl:static top-0 bottom-0 right-0 z-40 w-80 lg:w-84 xl:w-80 flex flex-col border-l transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Panel Header */}
        <div className="p-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Configuration</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] xl:hidden cursor-pointer"
            aria-label="Close configuration"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Controls Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* 1. Generation Parameters */}
          <div className="space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
              Generation Parameters
            </span>

            {/* Row Count Direct Input & Range Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="rowCountNumberInput" className="font-medium text-[var(--text-secondary)]">
                  Total Row Count (up to 1,000,000)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="rowCountNumberInput"
                    type="number"
                    min={1}
                    max={1000000}
                    value={settings.rowCount}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(1000000, Number(e.target.value) || 1));
                      onUpdateSettings({ rowCount: val });
                    }}
                    className="w-24 px-2 py-1 rounded border text-xs font-mono font-bold text-[var(--text-primary)] text-right bg-[var(--bg-surface-subtle)] focus:outline-none"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  />
                  <span className="text-[11px] text-[var(--text-muted)]">rows</span>
                </div>
              </div>

              {/* Slider for logarithmic/granular range */}
              <input
                id="rowCountSlider"
                type="range"
                min={10}
                max={10000}
                step={50}
                value={Math.min(settings.rowCount, 10000)}
                onChange={(e) => onUpdateSettings({ rowCount: Number(e.target.value) })}
                className="w-full accent-[var(--accent-primary)] cursor-pointer"
              />

              {/* Quick preset buttons including 10k, 100k, 1M */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {[
                  { label: '50', count: 50 },
                  { label: '1k', count: 1000 },
                  { label: '10k', count: 10000 },
                  { label: '50k', count: 50000 },
                  { label: '100k', count: 100000 },
                  { label: '500k', count: 500000 },
                  { label: '1M', count: 1000000 },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => onUpdateSettings({ rowCount: item.count })}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer transition-colors ${
                      settings.rowCount === item.count
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-foreground)] border-transparent font-bold'
                        : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Seed Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-[var(--text-secondary)]">Seed (Faker PRNG)</label>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ seedLocked: !settings.seedLocked })}
                  className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  title={settings.seedLocked ? 'Seed is locked' : 'Seed re-rolls on regenerate'}
                >
                  {settings.seedLocked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 text-[var(--text-muted)]" />}
                  <span>{settings.seedLocked ? 'Locked' : 'Dynamic'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.seed}
                  onChange={(e) => onUpdateSettings({ seed: Number(e.target.value) || 1 })}
                  className="flex-1 px-3 py-1.5 rounded-lg border text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-subtle)',
                  }}
                />
                <button
                  type="button"
                  onClick={handleRollSeed}
                  className="p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                  title="Randomize seed"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PII Anonymization Switch */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--accent-primary)]" />
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] block">
                      Synthetic PII Shield
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Mask personal identifiers for GDPR testing
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.anonymizePII}
                  onChange={(e) => onUpdateSettings({ anonymizePII: e.target.checked })}
                  className="rounded border text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Inject Edge Cases Stress-Testing Section */}
            <div className="pt-3 border-t space-y-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] block">
                      Inject Edge Cases
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Stress-test pipelines against boundary anomalies
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={!!settings.injectEdgeCases}
                  onChange={(e) => onUpdateSettings({ injectEdgeCases: e.target.checked })}
                  className="rounded border text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {settings.injectEdgeCases && (
                <div
                  className="p-3 rounded-xl border space-y-3 animate-fadeIn"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {/* Intensity Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text-secondary)]">Intensity</span>
                      <span className="font-mono text-[11px] font-bold text-amber-400 capitalize">
                        {settings.edgeCaseIntensity || 'medium'} (
                        {settings.edgeCaseIntensity === 'high' ? '30%' : settings.edgeCaseIntensity === 'low' ? '5%' : '15%'} rows)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['low', 'medium', 'high'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => onUpdateSettings({ edgeCaseIntensity: lvl })}
                          className={`py-1 rounded-lg text-xs font-mono font-semibold capitalize cursor-pointer transition-colors ${
                            (settings.edgeCaseIntensity || 'medium') === lvl
                              ? 'bg-amber-500 text-black shadow-xs font-bold'
                              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Edge Case Types Checkboxes */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                      Anomaly Types
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'nulls', label: 'Nulls & Empty' },
                        { key: 'extremeValues', label: 'Extreme Values' },
                        { key: 'duplicates', label: 'Duplicates' },
                        { key: 'unicodeEmoji', label: 'Unicode / Emojis' },
                        { key: 'veryLongText', label: 'Very Long Text' },
                        { key: 'invalidFormats', label: 'Invalid Formats' },
                      ].map((item) => {
                        const types = settings.edgeCaseTypes || {
                          nulls: true,
                          extremeValues: true,
                          duplicates: true,
                          unicodeEmoji: true,
                          veryLongText: true,
                          invalidFormats: true,
                        };
                        const isChecked = types[item.key as keyof typeof types] ?? true;

                        return (
                          <label key={item.key} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                onUpdateSettings({
                                  edgeCaseTypes: {
                                    ...types,
                                    [item.key]: e.target.checked,
                                  },
                                });
                              }}
                              className="rounded border text-amber-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-[11px] text-[var(--text-secondary)]">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Documents Specific Configuration */}
          {activeTab === 'documents' && (
            <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                Regional Template & Currency
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'US' as DocumentRegion, label: 'United States', sub: '$ USD · Sales Tax' },
                  { id: 'UK' as DocumentRegion, label: 'United Kingdom', sub: '£ GBP · 20% VAT' },
                  { id: 'PK' as DocumentRegion, label: 'Pakistan', sub: 'PKR · 18% GST' },
                  { id: 'EU' as DocumentRegion, label: 'European Union', sub: '€ EUR · 19% VAT' },
                ].map((item) => {
                  const isSelected = (settings.documentRegion || selectedRegion) === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({ documentRegion: item.id });
                        if (onSelectRegion) onSelectRegion(item.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-light)] shadow-xs'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold font-mono text-xs ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                          {item.id}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                      </div>
                      <p className="font-semibold text-[11px] text-[var(--text-primary)] mt-0.5">{item.label}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">{item.sub}</p>
                    </button>
                  );
                })}
              </div>

              {/* Bulk Generation Presets */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Bulk Count (Up to 1,000)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 25, 50, 100, 250, 500, 1000].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onUpdateSettings({ rowCount: num })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium cursor-pointer transition-colors ${
                        settings.rowCount === num
                          ? 'bg-[var(--accent-primary)] text-[var(--accent-foreground)]'
                          : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Custom Schema Builder & Reordering */}
          {activeTab === 'tabular' && (
            <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Columns Schema ({columns.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingField(true)}
                  className="flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>

              {/* Add Field Form */}
              {isAddingField && (
                <form
                  onSubmit={handleCreateColumn}
                  className="p-3 rounded-lg border space-y-2.5 animate-fadeIn"
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderColor: 'var(--border-focus)',
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
                    <span>New Column</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingField(false)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="column_name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none"
                    style={{ borderColor: 'var(--border-subtle)' }}
                    autoFocus
                  />

                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as ColumnDataType)}
                    className="w-full px-2 py-1.5 rounded border text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    {AVAILABLE_TYPES.map((dt) => (
                      <option key={dt.type} value={dt.type}>
                        {dt.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingField(false)}
                      className="px-2.5 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newFieldName.trim()}
                      className="px-3 py-1 rounded text-xs font-medium text-[var(--accent-foreground)] bg-[var(--accent-primary)] disabled:opacity-50 cursor-pointer"
                    >
                      Add Column
                    </button>
                  </div>
                </form>
              )}

              {/* Column list with reorder buttons */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {columns.map((col, index) => (
                  <div
                    key={col.id}
                    className="flex items-center justify-between p-2 rounded-lg border text-xs group"
                    style={{
                      backgroundColor: 'var(--bg-surface-subtle)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="min-w-0 pr-2 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-[var(--text-primary)] block truncate text-[11px]">
                          {col.name}
                        </span>
                        {col.isUnique && (
                          <span className="text-[9px] font-mono text-amber-500 font-bold">UQ</span>
                        )}
                        {col.nullPercentage > 0 && (
                          <span className="text-[9px] font-mono text-[var(--text-muted)]">
                            {col.nullPercentage}% null
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {col.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {onReorderColumns && (
                        <>
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveColumn(index, 'up')}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === columns.length - 1}
                            onClick={() => moveColumn(index, 'down')}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteColumn(col.id)}
                        className="p-1 text-red-500 hover:text-red-700 opacity-50 group-hover:opacity-100 cursor-pointer"
                        title="Remove Column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Export Parameters */}
          <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
              Export Configuration
            </span>

            {/* Direct Export Buttons: CSV, JSON, SQL INSERT */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onExportDirect('csv')}
                className="py-2 px-2 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                title="Export directly as CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => onExportDirect('json')}
                className="py-2 px-2 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                title="Export directly as JSON"
              >
                <Code className="w-4 h-4 text-blue-500" />
                <span>JSON</span>
              </button>
              {activeTab !== 'documents' ? (
                <button
                  type="button"
                  onClick={() => onExportDirect('sql')}
                  className="py-2 px-2 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                  title="Export directly as SQL INSERT Script with chunked generation"
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>SQL Script</span>
                </button>
              ) : (
                <div
                  className="py-2 px-2 rounded-lg text-[10px] border flex flex-col items-center justify-center text-center leading-tight text-[var(--text-muted)] bg-[var(--bg-surface-subtle)]"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span>PDF & ZIP in Preview</span>
                </div>
              )}
            </div>

            {/* Delimiter / Dialect options (only for relational/tabular) */}
            {activeTab !== 'documents' && (
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">SQL Dialect:</span>
                  <select
                    value={settings.sqlDialect}
                    onChange={(e) => onUpdateSettings({ sqlDialect: e.target.value as SqlDialect })}
                    className="px-2 py-1 rounded border text-xs bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="sqlite">SQLite</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions with Primary Export Button */}
        <div className="p-4 border-t space-y-2 shrink-0" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <button
            type="button"
            onClick={onExport}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[var(--accent-foreground)] shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:brightness-105 active:scale-98"
            style={{
              backgroundColor: 'var(--accent-primary)',
            }}
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download ({settings.rowCount.toLocaleString()} rows)</span>
          </button>

          <button
            type="button"
            onClick={onCopyClipboard}
            className="w-full py-2 px-4 rounded-xl text-xs font-medium border text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-elevated)',
            }}
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'Copied Preview!' : 'Copy Preview to Clipboard'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
