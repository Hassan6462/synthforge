import React from 'react';
import { RefreshCw, Download, SlidersHorizontal, PanelLeft, Database, GitMerge, FileCode, FileSpreadsheet, Code, FileText, ShieldCheck } from 'lucide-react';
import { Theme, TabType } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';

interface HeaderProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onRegenerate: () => void;
  onExportDirect: (format: 'csv' | 'json' | 'sql') => void;
  onOpenExportModal: () => void;
  onToggleSidebar: () => void;
  onToggleConfig: () => void;
  onOpenValidation?: () => void;
  qualityScore?: number;
  isSidebarOpen: boolean;
  isConfigOpen: boolean;
  isGenerating: boolean;
  stats: {
    totalRows: number;
    generationTimeMs: number;
    estimatedSizeBytes: number;
    columnCount: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  onThemeChange,
  activeTab,
  onTabChange,
  onRegenerate,
  onExportDirect,
  onOpenExportModal,
  onToggleSidebar,
  onToggleConfig,
  onOpenValidation,
  qualityScore,
  isSidebarOpen,
  isConfigOpen,
  isGenerating,
  stats,
}) => {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 py-2 border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Zone 1: Brand Wordmark & Drawer Trigger */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:hidden cursor-pointer"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: isSidebarOpen ? 'var(--bg-surface-elevated)' : 'transparent',
          }}
          aria-label="Toggle Sidebar"
          title="Toggle Navigation Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <a
          href="#"
          onClick={(e) => { e.preventDefault(); }}
          className="text-lg font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2 select-none"
        >
          <span>SynthForge</span>
        </a>

        {/* Quiet unboxed metadata */}
        <div className="hidden 2xl:flex items-center gap-2 text-xs text-[var(--text-muted)] border-l pl-3 ml-1" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="font-mono tabular-nums">{stats.totalRows.toLocaleString()} rows</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{stats.columnCount} columns</span>
        </div>
      </div>

      {/* Zone 2: Navigation Mode Selector */}
      <nav className="flex items-center gap-1 p-1 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
        <button
          type="button"
          onClick={() => onTabChange('tabular')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'tabular'
              ? 'text-[var(--accent-foreground)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'tabular' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Tabular</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('relational')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'relational'
              ? 'text-[var(--accent-foreground)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'relational' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Relational</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('documents')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'documents'
              ? 'text-[var(--accent-foreground)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'documents' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Documents</span>
        </button>
      </nav>

      {/* Zone 3: Direct Export Buttons & Controls */}
      <div className="flex items-center gap-2">
        {/* Direct Export Buttons: CSV, JSON, SQL */}
        <div className="hidden md:flex items-center gap-1 p-0.5 rounded-lg border text-xs font-mono" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
          <span className="text-[10px] text-[var(--text-muted)] font-sans px-1.5 uppercase font-semibold">
            Export:
          </span>
          <button
            type="button"
            onClick={() => onExportDirect('csv')}
            className="px-2 py-1 rounded text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
            title="Export directly as CSV"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => onExportDirect('json')}
            className="px-2 py-1 rounded text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
            title="Export directly as JSON"
          >
            JSON
          </button>
          <button
            type="button"
            onClick={() => onExportDirect('sql')}
            className="px-2 py-1 rounded text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
            title="Export directly as SQL INSERT Script"
          >
            SQL
          </button>
        </div>

        <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />

        {onOpenValidation && (
          <button
            type="button"
            onClick={onOpenValidation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-400 transition-all cursor-pointer whitespace-nowrap shadow-xs"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
            title="Produce Data Quality Validation Report (Orphan FKs, Uniqueness, Null %, Invoices, Quality Score)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Validate</span>
            {qualityScore !== undefined && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold tabular-nums">
                {qualityScore}%
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
          title="Regenerate synthetic data with new random seed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span className="hidden xl:inline">Regenerate</span>
        </button>

        <button
          type="button"
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent-foreground)] shadow-xs transition-all cursor-pointer whitespace-nowrap hover:brightness-105 active:scale-98"
          style={{
            backgroundColor: 'var(--accent-primary)',
          }}
          title="Open advanced export options"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Options</span>
        </button>

        {/* Toggle Right Config Panel */}
        <button
          type="button"
          onClick={onToggleConfig}
          className="p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] xl:hidden cursor-pointer"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: isConfigOpen ? 'var(--bg-surface-elevated)' : 'transparent',
          }}
          aria-label="Toggle Configuration Panel"
          title="Toggle Generator Configuration"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
