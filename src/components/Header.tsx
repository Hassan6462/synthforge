import React from 'react';
import {
  RefreshCw,
  Download,
  SlidersHorizontal,
  PanelLeft,
  Database,
  GitMerge,
  FileCode,
  FileSpreadsheet,
  Code,
  FileText,
  ShieldCheck,
  Home,
  BarChart3,
  Sparkles,
  Layers,
  HelpCircle,
  Command,
  Save,
  FolderOpen,
  Calendar,
  Terminal,
  History,
  Code2,
  Sliders,
} from 'lucide-react';
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
  onOpenDescribeIt?: () => void;
  onOpenTemplateGallery?: () => void;
  onOpenShortcuts?: () => void;
  onOpenTour?: () => void;
  onSaveProject?: () => void;
  onLoadProject?: () => void;
  onToggleCopilot?: () => void;
  onOpenCommandPalette?: () => void;
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
  onOpenDescribeIt,
  onOpenTemplateGallery,
  onOpenShortcuts,
  onOpenTour,
  onSaveProject,
  onLoadProject,
  onToggleCopilot,
  onOpenCommandPalette,
  qualityScore,
  isSidebarOpen,
  isConfigOpen,
  isGenerating,
  stats,
}) => {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2 border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Zone 1: Brand Wordmark & Drawer Trigger */}
      <div className="flex items-center gap-2">
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
          onClick={(e) => {
            e.preventDefault();
            onTabChange('home');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-1.5 select-none"
        >
          <span>SynthForge</span>
        </a>

        {/* AI Describe Trigger */}
        {onOpenDescribeIt && (
          <button
            type="button"
            onClick={onOpenDescribeIt}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500/15 to-indigo-500/15 text-purple-400 border border-purple-500/25 hover:brightness-125 transition-all cursor-pointer shadow-2xs"
            title="Describe dataset with AI prompt (Gemini)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Describe It</span>
          </button>
        )}

        {/* Templates Trigger */}
        {onOpenTemplateGallery && (
          <button
            type="button"
            onClick={onOpenTemplateGallery}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-all cursor-pointer"
            style={{ borderColor: 'var(--border-subtle)' }}
            title="Open Template Gallery (Banking, HR, Retail, Healthcare)"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Templates</span>
          </button>
        )}
      </div>

      {/* Zone 2: Navigation Mode Selector */}
      <nav
        className="flex items-center gap-0.5 p-1 rounded-lg border overflow-x-auto max-w-[50vw] sm:max-w-none"
        style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}
      >
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'home'
              ? 'text-[var(--accent-foreground)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'home' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Home</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('tabular')}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'tabular'
              ? 'text-[var(--accent-foreground)] shadow-xs'
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
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'relational'
              ? 'text-[var(--accent-foreground)] shadow-xs'
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
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'documents'
              ? 'text-[var(--accent-foreground)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'documents' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Documents</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('timeseries')}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'timeseries'
              ? 'text-[var(--accent-foreground)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'timeseries' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Series</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('datasources')}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'datasources'
              ? 'text-[var(--accent-foreground)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'datasources' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Sources</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('eda')}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'eda'
              ? 'text-[var(--accent-foreground)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'eda' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>EDA</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('quality')}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'quality'
              ? 'text-[var(--accent-foreground)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'quality' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Quality</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('notebooks')}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'notebooks'
              ? 'text-[var(--accent-foreground)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'notebooks' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>Python</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('scenarios')}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'scenarios'
              ? 'text-[var(--accent-foreground)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'scenarios' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline">Scenarios</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('jobs')}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'jobs'
              ? 'text-[var(--accent-foreground)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'jobs' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <History className="w-3.5 h-3.5 text-sky-400" />
          <span>Jobs</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('api')}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'api'
              ? 'text-[var(--accent-foreground)] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
          style={{
            backgroundColor: activeTab === 'api' ? 'var(--accent-primary)' : 'transparent',
          }}
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>API</span>
        </button>
      </nav>

      {/* Zone 3: Direct Export Buttons & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Save / Load Workspace JSON Buttons */}
        <div className="hidden lg:flex items-center gap-1">
          {onSaveProject && (
            <button
              type="button"
              onClick={onSaveProject}
              className="p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
              title="Save project workspace as JSON (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          )}
          {onLoadProject && (
            <button
              type="button"
              onClick={onLoadProject}
              className="p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
              title="Load project JSON file"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* AI Copilot Side Panel Trigger */}
        {onToggleCopilot && (
          <button
            type="button"
            onClick={onToggleCopilot}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-gradient-to-r from-purple-500/15 to-indigo-500/15 text-purple-300 border-purple-500/30 hover:brightness-125 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
            title="Open AI Copilot Schema Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        )}

        {/* Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border-subtle)' }}
            title="Open Command Palette (Ctrl+K)"
          >
            <Command className="w-3.5 h-3.5" />
            <kbd className="hidden sm:inline-block font-mono text-[10px] text-[var(--text-muted)]">⌘K</kbd>
          </button>
        )}

        {/* Shortcuts & Tour Triggers */}
        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="hidden 2xl:flex p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border-subtle)' }}
            title="Keyboard Shortcuts"
          >
            <Command className="w-3.5 h-3.5" />
          </button>
        )}

        {onOpenTour && (
          <button
            type="button"
            onClick={onOpenTour}
            className="p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border-subtle)' }}
            title="Onboarding Guided Tour"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          </button>
        )}

        <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />

        {onOpenValidation && (
          <button
            type="button"
            onClick={onOpenValidation}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-400 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
            title="Produce Data Quality Validation Report"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Validate</span>
            {qualityScore !== undefined && (
              <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold tabular-nums">
                {qualityScore}%
              </span>
            )}
          </button>
        )}

        {/* Regenerate Button */}
        {(activeTab === 'tabular' || activeTab === 'relational' || activeTab === 'documents' || activeTab === 'timeseries') && (
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
        )}

        {/* Export Button */}
        {(activeTab === 'tabular' || activeTab === 'relational' || activeTab === 'documents' || activeTab === 'timeseries') && (
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent-foreground)] shadow-2xs transition-all cursor-pointer whitespace-nowrap hover:brightness-105 active:scale-98"
            style={{
              backgroundColor: 'var(--accent-primary)',
            }}
            title="Open advanced export options"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}

        {/* Toggle Right Config Panel */}
        {(activeTab === 'tabular' || activeTab === 'documents') && (
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
        )}
      </div>
    </header>
  );
};

