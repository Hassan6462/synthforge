import React from 'react';
import { Database, GitMerge, FileCode, Check, Plus, X, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { TabType, TabularPreset, RelationalPreset, DocumentPreset } from '../types';
import { TABULAR_PRESETS, RELATIONAL_PRESETS, DOCUMENT_PRESETS } from '../data/presets';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  selectedTabularPreset: TabularPreset;
  onSelectTabularPreset: (preset: TabularPreset) => void;
  selectedRelationalPreset: RelationalPreset;
  onSelectRelationalPreset: (preset: RelationalPreset) => void;
  selectedDocumentPreset: DocumentPreset;
  onSelectDocumentPreset: (preset: DocumentPreset) => void;
  isOpen: boolean;
  onClose: () => void;
  onAddNewCustomColumn: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  selectedTabularPreset,
  onSelectTabularPreset,
  selectedRelationalPreset,
  onSelectRelationalPreset,
  selectedDocumentPreset,
  onSelectDocumentPreset,
  isOpen,
  onClose,
  onAddNewCustomColumn,
}) => {
  return (
    <>
      {/* Mobile/Tablet Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 lg:w-64 xl:w-72 flex flex-col border-r transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Sidebar Header with Tab switcher */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Data Schemas</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector in Sidebar */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => onTabChange('tabular')}
              className={`flex flex-col items-center py-2 px-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'tabular'
                  ? 'text-[var(--accent-foreground)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={{
                backgroundColor: activeTab === 'tabular' ? 'var(--accent-primary)' : 'transparent',
              }}
            >
              <Database className="w-4 h-4 mb-1" />
              <span>Tabular</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('relational')}
              className={`flex flex-col items-center py-2 px-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'relational'
                  ? 'text-[var(--accent-foreground)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={{
                backgroundColor: activeTab === 'relational' ? 'var(--accent-primary)' : 'transparent',
              }}
            >
              <GitMerge className="w-4 h-4 mb-1" />
              <span>Relational</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('documents')}
              className={`flex flex-col items-center py-2 px-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'documents'
                  ? 'text-[var(--accent-foreground)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={{
                backgroundColor: activeTab === 'documents' ? 'var(--accent-primary)' : 'transparent',
              }}
            >
              <FileCode className="w-4 h-4 mb-1" />
              <span>Documents</span>
            </button>
          </div>
        </div>

        {/* Preset List Section */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {activeTab === 'tabular'
                  ? 'Tabular Presets'
                  : activeTab === 'relational'
                  ? 'Relational Schemas'
                  : 'Document Blueprints'}
              </span>
              {activeTab === 'tabular' && (
                <button
                  type="button"
                  onClick={onAddNewCustomColumn}
                  className="flex items-center gap-1 text-[11px] text-[var(--accent-primary)] hover:underline cursor-pointer"
                  title="Add custom column to current schema"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Field</span>
                </button>
              )}
            </div>

            {/* Tabular Presets */}
            {activeTab === 'tabular' && (
              <div className="space-y-1.5">
                {TABULAR_PRESETS.map((preset) => {
                  const isSelected = selectedTabularPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectTabularPreset(preset)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-[var(--border-focus)] shadow-xs'
                          : 'border-transparent hover:border-[var(--border-subtle)]'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                          {preset.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--text-muted)] font-mono">
                        <span>{preset.columns.length} columns</span>
                        <span aria-hidden="true">·</span>
                        <span>Multi-type</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Relational Presets */}
            {activeTab === 'relational' && (
              <div className="space-y-1.5">
                {RELATIONAL_PRESETS.map((preset) => {
                  const isSelected = selectedRelationalPreset.id === preset.id;
                  const totalTables = preset.tables.length;
                  const totalFKs = preset.tables.reduce((acc, t) => acc + (t.foreignKeys?.length || 0), 0);

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectRelationalPreset(preset)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-[var(--border-focus)] shadow-xs'
                          : 'border-transparent hover:border-[var(--border-subtle)]'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                          {preset.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--text-muted)] font-mono">
                        <span>{totalTables} tables</span>
                        <span aria-hidden="true">·</span>
                        <span>{totalFKs} FK links</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Document Presets */}
            {activeTab === 'documents' && (
              <div className="space-y-1.5">
                {DOCUMENT_PRESETS.map((preset) => {
                  const isSelected = selectedDocumentPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectDocumentPreset(preset)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-[var(--border-focus)] shadow-xs'
                          : 'border-transparent hover:border-[var(--border-subtle)]'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                      }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                          {preset.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--text-muted)] font-mono">
                        {preset.region && (
                          <span className="px-1.5 py-0.5 rounded font-bold bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--accent-primary)]">
                            {preset.region}
                          </span>
                        )}
                        <span>
                          {preset.templateType === 'invoice'
                            ? 'Reconciled Invoices'
                            : preset.templateType === 'bank_statement'
                            ? 'Verified Statement Ledger'
                            : 'JSON Payload'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer Note */}
        <div className="p-3 border-t text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Zero Remote Storage</span>
          </div>
          <p className="mt-1 leading-snug">
            All synthetic distributions are computed client-side deterministically.
          </p>
        </div>
      </aside>
    </>
  );
};
