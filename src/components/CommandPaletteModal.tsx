import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Home,
  Database,
  GitMerge,
  FileCode,
  Calendar,
  FileSpreadsheet,
  BarChart3,
  ShieldCheck,
  Terminal,
  Sparkles,
  History,
  Code2,
  Download,
  RotateCcw,
  Sliders,
  Sun,
  Layers,
  Save,
  Command,
  ArrowRight,
} from 'lucide-react';
import { TabType, Theme } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabType) => void;
  onRegenerate: () => void;
  onOpenDescribeIt: () => void;
  onToggleCopilot: () => void;
  onOpenExportModal: () => void;
  onOpenTemplateGallery: () => void;
  onSaveProject: () => void;
  onThemeCycle: () => void;
}

interface PaletteItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Workspace';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onRegenerate,
  onOpenDescribeIt,
  onToggleCopilot,
  onOpenExportModal,
  onOpenTemplateGallery,
  onSaveProject,
  onThemeCycle,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allItems: PaletteItem[] = [
    // Navigation
    {
      id: 'nav_home',
      category: 'Navigation',
      title: 'Home Dashboard',
      subtitle: 'Overview of generation telemetry, recent runs, and quick actions',
      icon: <Home className="w-4 h-4 text-sky-400" />,
      action: () => onNavigateTab('home'),
    },
    {
      id: 'nav_tabular',
      category: 'Navigation',
      title: 'Tabular Data Generator',
      subtitle: 'Virtual grid, custom columns, faker distributions, and chunked worker',
      icon: <Database className="w-4 h-4 text-sky-400" />,
      action: () => onNavigateTab('tabular'),
    },
    {
      id: 'nav_relational',
      category: 'Navigation',
      title: 'Relational Database Architect',
      subtitle: 'Multi-table schemas with foreign keys, ER diagrams, and referential integrity',
      icon: <GitMerge className="w-4 h-4 text-sky-400" />,
      action: () => onNavigateTab('relational'),
    },
    {
      id: 'nav_documents',
      category: 'Navigation',
      title: 'Document Synthesizer',
      subtitle: 'Invoices, bank statements, clinical encounters, and audit records',
      icon: <FileCode className="w-4 h-4 text-sky-400" />,
      action: () => onNavigateTab('documents'),
    },
    {
      id: 'nav_timeseries',
      category: 'Navigation',
      title: 'Time Series Generator',
      subtitle: 'Recharts live multi-series with trends, seasonality, and anomaly spikes',
      icon: <Calendar className="w-4 h-4 text-sky-400" />,
      action: () => onNavigateTab('timeseries'),
    },
    {
      id: 'nav_datasources',
      category: 'Navigation',
      title: 'Data Sources (Uploads)',
      subtitle: 'Drag & drop CSV, TSV, JSON, XLSX files with local IndexedDB storage',
      icon: <FileSpreadsheet className="w-4 h-4 text-sky-400" />,
      action: () => onNavigateTab('datasources'),
    },
    {
      id: 'nav_eda',
      category: 'Navigation',
      title: 'EDA Profiler & Health Check',
      subtitle: 'Summary statistics, IQR outliers, histograms, correlations, and PII scanner',
      icon: <BarChart3 className="w-4 h-4 text-sky-400" />,
      action: () => onNavigateTab('eda'),
    },
    {
      id: 'nav_quality',
      category: 'Navigation',
      title: 'Quality & Fidelity Report',
      subtitle: 'Two-sample KS tests, TVD distance, covariance deltas, and printable audit',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => onNavigateTab('quality'),
    },
    {
      id: 'nav_notebooks',
      category: 'Navigation',
      title: 'Python Notebooks (Pyodide)',
      subtitle: 'In-browser Python with preloaded Pandas & NumPy on real_df and synth_df',
      icon: <Terminal className="w-4 h-4 text-emerald-400" />,
      action: () => onNavigateTab('notebooks'),
    },
    {
      id: 'nav_scenarios',
      category: 'Navigation',
      title: 'Scenario Builder & Stress Testing',
      subtitle: 'Presets: 1% fraud, 95/5 class imbalance, seasonal spikes, data drift',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      action: () => onNavigateTab('scenarios'),
    },
    {
      id: 'nav_jobs',
      category: 'Navigation',
      title: 'Jobs & Execution History',
      subtitle: 'Track generated datasets, compare two runs side-by-side, and re-run seeds',
      icon: <History className="w-4 h-4 text-amber-400" />,
      action: () => onNavigateTab('jobs'),
    },
    {
      id: 'nav_api',
      category: 'Navigation',
      title: 'API & Developer SDK Snippets',
      subtitle: 'Live cURL, Python, and JavaScript snippets with interactive simulator',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      action: () => onNavigateTab('api'),
    },

    // Actions
    {
      id: 'act_regenerate',
      category: 'Actions',
      title: 'Re-roll Seed & Regenerate',
      subtitle: 'Regenerate synthetic records with a fresh pseudo-random seed',
      icon: <RotateCcw className="w-4 h-4 text-sky-400" />,
      action: () => onRegenerate(),
    },
    {
      id: 'act_describe',
      category: 'Actions',
      title: 'Describe It with AI',
      subtitle: 'Prompt Gemini to construct an entire synthetic database schema',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      action: () => onOpenDescribeIt(),
    },
    {
      id: 'act_copilot',
      category: 'Actions',
      title: 'Toggle AI Schema Copilot',
      subtitle: 'Interactive side panel for natural language schema patching with diffs',
      icon: <Sliders className="w-4 h-4 text-purple-400" />,
      action: () => onToggleCopilot(),
    },
    {
      id: 'act_export',
      category: 'Actions',
      title: 'Export Dataset Options',
      subtitle: 'Download CSV, JSON, SQL DDL, NDJSON, or relational ZIP bundles',
      icon: <Download className="w-4 h-4 text-emerald-400" />,
      action: () => onOpenExportModal(),
    },
    {
      id: 'act_templates',
      category: 'Actions',
      title: 'Browse Template Gallery',
      subtitle: 'Industry blueprints: Banking, Healthcare, E-Commerce, and HR',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      action: () => onOpenTemplateGallery(),
    },

    // Workspace
    {
      id: 'work_save',
      category: 'Workspace',
      title: 'Save Workspace to JSON',
      subtitle: 'Serialize complete schemas and configurations to a portable file',
      icon: <Save className="w-4 h-4 text-amber-400" />,
      action: () => onSaveProject(),
    },
    {
      id: 'work_theme',
      category: 'Workspace',
      title: 'Cycle Color Theme',
      subtitle: 'Switch between Ocean, Sunset, Dark, and Light UI themes',
      icon: <Sun className="w-4 h-4 text-amber-400" />,
      action: () => onThemeCycle(),
    },
  ];

  const filteredItems = allItems.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/65 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--bg-surface)] border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        style={{ borderColor: 'var(--border-subtle)' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b bg-[var(--bg-surface-elevated)]"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search (e.g. Time Series, Quality, Copilot, Export)..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-canvas)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 flex flex-col gap-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              No actions or pages matched "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-500/15 border border-sky-500/30 text-[var(--text-primary)]'
                      : 'border border-transparent hover:bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] font-normal px-1 py-0.2 rounded bg-[var(--bg-canvas)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate max-w-sm">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected && <ArrowRight className="w-4 h-4 text-sky-400" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] font-mono"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span>Use ↑ ↓ to navigate</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
};
