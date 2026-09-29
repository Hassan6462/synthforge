import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import {
  Theme,
  TabType,
  GenerationSettings,
  TabularPreset,
  RelationalPreset,
  DocumentPreset,
  ColumnDefinition,
  TableSchema,
  DocumentRegion,
  StoredDataset,
  GenerationJobLog,
  SynthForgeProject,
  SchemaPatch,
  TimeSeriesSettings,
} from './types';
import { TABULAR_PRESETS, RELATIONAL_PRESETS, DOCUMENT_PRESETS } from './data/presets';
import { generateTabularData, generateRelationalData, generateDocumentData } from './utils/generators';
import {
  executeExport,
  downloadFile,
  downloadBlob,
  exportRelationalAsZip,
  exportRelationalAsSqlDump,
} from './utils/export';
import { useSyntheticWorker } from './hooks/useSyntheticWorker';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CenterPreview } from './components/CenterPreview';
import { ConfigPanel } from './components/ConfigPanel';
import { ExportModal } from './components/ExportModal';
import { ExportProgressModal } from './components/ExportProgressModal';
import { DescribeItModal } from './components/DescribeItModal';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { OnboardingTour } from './components/OnboardingTour';
import { HomeDashboard } from './components/HomeDashboard';
import { CopilotSidePanel } from './components/CopilotSidePanel';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { PageLoadingSkeleton } from './components/LoadingSkeleton';
import { runValidationSuite } from './utils/dataValidator';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { parseUploadedDataFile } from './utils/csvParser';
import type { GeneratedAiSchemaResponse } from './utils/keywordTemplates';

// Lazy-loaded pages and heavyweight modal for performance optimization
const NotebooksPage = React.lazy(() =>
  import('./components/NotebooksPage').then((m) => ({ default: m.NotebooksPage }))
);
const TimeSeriesPage = React.lazy(() =>
  import('./components/TimeSeriesPage').then((m) => ({ default: m.TimeSeriesPage }))
);
const QualityPage = React.lazy(() =>
  import('./components/QualityPage').then((m) => ({ default: m.QualityPage }))
);
const EDAPage = React.lazy(() =>
  import('./components/EDAPage').then((m) => ({ default: m.EDAPage }))
);
const ScenarioBuilderPage = React.lazy(() =>
  import('./components/ScenarioBuilderPage').then((m) => ({ default: m.ScenarioBuilderPage }))
);
const JobsPage = React.lazy(() =>
  import('./components/JobsPage').then((m) => ({ default: m.JobsPage }))
);
const ApiPage = React.lazy(() =>
  import('./components/ApiPage').then((m) => ({ default: m.ApiPage }))
);
const DataSourcesPage = React.lazy(() =>
  import('./components/DataSourcesPage').then((m) => ({ default: m.DataSourcesPage }))
);
const ValidationReportModal = React.lazy(() =>
  import('./components/ValidationReportModal').then((m) => ({ default: m.ValidationReportModal }))
);

function MainApp() {
  const toast = useToast();
  const { user, status, logout } = useAuth();

  // 1. Theme State with LocalStorage Persistence
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('synthforge-theme') as Theme;
      if (saved && ['light', 'dark', 'ocean', 'sunset'].includes(saved)) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'ocean';
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('synthforge-theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  // 2. Active Mode / Tab State
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // 3. Responsive Drawer States (for tablet and mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  // 4. Modal Dialog States
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [isDescribeItOpen, setIsDescribeItOpen] = useState<boolean>(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Show OnboardingTour ONLY after the first successful sign-in of a user
  useEffect(() => {
    if (user && !user.isGuest) {
      try {
        const seen = localStorage.getItem(`synthforge_${user.id}_has_seen_tour`);
        if (seen !== 'true') {
          setIsTourOpen(true);
        }
      } catch {}
    }
  }, [user]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // User prefix for scoped storage
  const userPrefix = user?.id || 'guest';

  // 5. Telemetry & History State (Scoped per user ID)
  const [totalRowsGenerated, setTotalRowsGenerated] = useState<number>(148500);
  const [recentJobs, setRecentJobs] = useState<GenerationJobLog[]>([]);
  const [recentProjects, setRecentProjects] = useState<SynthForgeProject[]>([]);

  // Sync user-scoped storage when user logs in or switches
  useEffect(() => {
    if (!user) return;
    try {
      const savedRows = localStorage.getItem(`synthforge_${userPrefix}_total_rows_generated`);
      setTotalRowsGenerated(savedRows ? parseInt(savedRows, 10) : (user.isGuest ? 148500 : 0));

      const savedJobs = localStorage.getItem(`synthforge_${userPrefix}_recent_jobs`);
      setRecentJobs(savedJobs ? JSON.parse(savedJobs) : []);

      const savedProjects = localStorage.getItem(`synthforge_${userPrefix}_recent_projects`);
      setRecentProjects(savedProjects ? JSON.parse(savedProjects) : []);
    } catch (err) {
      console.error('Failed to load user-scoped data:', err);
    }
  }, [userPrefix, user]);

  const [selectedEdaDataset, setSelectedEdaDataset] = useState<StoredDataset | null>(null);

  // Hidden File Inputs for Load Project & Sample CSV
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const sampleCsvInputRef = useRef<HTMLInputElement>(null);

  // 6. Generation Settings
  const [settings, setSettings] = useState<GenerationSettings>({
    rowCount: 50,
    seed: 48210,
    seedLocked: false,
    globalNullRate: 0,
    noiseRate: 0,
    anonymizePII: false,
    exportFormat: 'csv',
    sqlDialect: 'postgresql',
    csvDelimiter: ',',
    includeDropTable: true,
    prettifyJson: true,
    injectEdgeCases: false,
    edgeCaseIntensity: 'medium',
    edgeCaseTypes: {
      nulls: true,
      extremeValues: true,
      duplicates: true,
      unicodeEmoji: true,
      veryLongText: true,
      invalidFormats: true,
    },
  });

  const handleUpdateSettings = (partial: Partial<GenerationSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // 7. Presets & Columns State
  const [selectedTabularPreset, setSelectedTabularPreset] = useState<TabularPreset>(TABULAR_PRESETS[0]);
  const [customColumns, setCustomColumns] = useState<ColumnDefinition[]>(TABULAR_PRESETS[0].columns);

  const [selectedRelationalPreset, setSelectedRelationalPreset] = useState<RelationalPreset>(RELATIONAL_PRESETS[0]);
  const [relationalTables, setRelationalTables] = useState<TableSchema[]>(RELATIONAL_PRESETS[0].tables);
  const [activeRelationalTable, setActiveRelationalTable] = useState<string>(RELATIONAL_PRESETS[0].tables[0].name);

  const [selectedDocumentPreset, setSelectedDocumentPreset] = useState<DocumentPreset>(DOCUMENT_PRESETS[0]);
  const [documentRegion, setDocumentRegion] = useState<DocumentRegion>(DOCUMENT_PRESETS[0].region || 'US');

  // 8. Web Worker for Tabular Generation & Chunked Export up to 1,000,000 rows
  const {
    previewRows: workerTabularRows,
    isGenerating: isWorkerGenerating,
    stats: workerStats,
    requestDebouncedPreview,
    startChunkedExport,
    cancelExport,
    closeExportProgress,
    exportProgress,
  } = useSyntheticWorker();

  // Trigger debounced generation whenever settings or columns change
  useEffect(() => {
    requestDebouncedPreview(customColumns, settings.rowCount, settings.seed, settings);
  }, [customColumns, settings.rowCount, settings.seed, settings, requestDebouncedPreview]);

  // Synchronous fallback / auxiliary generators for Relational & Documents
  const syncTabularFallback = useMemo(() => {
    return generateTabularData(customColumns, settings);
  }, [customColumns, settings]);

  const relationalResult = useMemo(() => {
    return generateRelationalData(relationalTables, settings);
  }, [relationalTables, settings]);

  const documentResult = useMemo(() => {
    return generateDocumentData(selectedDocumentPreset.templateType, settings, documentRegion);
  }, [selectedDocumentPreset, settings, documentRegion]);

  const activeTabularRows = workerTabularRows.length > 0 ? workerTabularRows : syncTabularFallback.rows;

  // Log generation job helper
  const recordJob = useCallback(
    (type: TabType, count: number, cols: number, format: string, durationMs: number) => {
      const newJob: GenerationJobLog = {
        id: `job_${Date.now()}`,
        timestamp: Date.now(),
        type,
        rowCount: count,
        columnCount: cols,
        durationMs,
        seed: settings.seed,
        format,
      };

      setRecentJobs((prev) => {
        const updated = [newJob, ...prev.slice(0, 19)];
        try {
          localStorage.setItem(`synthforge_${userPrefix}_recent_jobs`, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setTotalRowsGenerated((prev) => {
        const next = prev + count;
        try {
          localStorage.setItem(`synthforge_${userPrefix}_total_rows_generated`, String(next));
        } catch {}
        return next;
      });
    },
    [settings.seed, userPrefix]
  );

  // Re-generate dataset
  const handleRegenerate = useCallback(() => {
    if (!settings.seedLocked) {
      const newSeed = Math.floor(Math.random() * 900000) + 100000;
      setSettings((prev) => ({ ...prev, seed: newSeed }));
      toast.info('Seed Randomization', `Generated new seed: ${newSeed}`);
    } else {
      toast.warning('Seed Locked', 'Unlock seed in generator config to randomize.');
    }
  }, [settings.seedLocked, toast]);

  // Tab change handler
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    if (newTab === 'documents' && settings.exportFormat === 'csv') {
      setSettings((prev) => ({ ...prev, exportFormat: 'json' }));
    }
  };

  // Preset selection handlers
  const handleSelectTabularPreset = (preset: TabularPreset) => {
    setSelectedTabularPreset(preset);
    setCustomColumns(preset.columns);
    setIsSidebarOpen(false);
    toast.success('Preset Applied', `Loaded tabular template: ${preset.name}`);
  };

  const handleSelectRelationalPreset = (preset: RelationalPreset) => {
    setSelectedRelationalPreset(preset);
    setRelationalTables(preset.tables);
    setActiveRelationalTable(preset.tables[0].name);
    setIsSidebarOpen(false);
    toast.success('Relational Schema Applied', `Loaded ${preset.tables.length} tables from ${preset.name}`);
  };

  const handleSelectDocumentPreset = (preset: DocumentPreset) => {
    setSelectedDocumentPreset(preset);
    if (preset.region) {
      setDocumentRegion(preset.region);
      handleUpdateSettings({ documentRegion: preset.region });
    }
    setIsSidebarOpen(false);
    toast.success('Document Preset Applied', `Loaded ${preset.name}`);
  };

  // Schema Column manipulation
  const handleAddColumn = (col: ColumnDefinition) => {
    setCustomColumns((prev) => [...prev, col]);
    toast.success('Column Added', `Added field: ${col.name} (${col.type})`);
  };

  const handleDeleteColumn = (colId: string) => {
    if (customColumns.length <= 1) return;
    setCustomColumns((prev) => prev.filter((c) => c.id !== colId));
  };

  const handleReorderColumns = (newCols: ColumnDefinition[]) => {
    setCustomColumns(newCols);
  };

  // Compute active statistics
  const currentStats = useMemo(() => {
    if (activeTab === 'tabular') {
      return {
        totalRows: settings.rowCount,
        generationTimeMs: workerStats.generationTimeMs,
        estimatedSizeBytes: workerStats.estimatedSizeBytes || JSON.stringify(activeTabularRows).length,
        columnCount: customColumns.length,
        nullCount: workerStats.nullCount,
      };
    }
    if (activeTab === 'relational') return relationalResult.stats;
    return documentResult.stats;
  }, [
    activeTab,
    settings.rowCount,
    workerStats,
    customColumns.length,
    activeTabularRows,
    relationalResult.stats,
    documentResult.stats,
  ]);

  // Relational Specific Export Handlers
  const handleExportRelationalZip = useCallback(async () => {
    const zipBlob = await exportRelationalAsZip(relationalResult.tablesData, relationalTables, settings.csvDelimiter);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadBlob(zipBlob, `synthforge_relational_tables_${timestamp}.zip`);
    recordJob('relational', settings.rowCount, relationalTables.length, 'zip_csv', 120);
    toast.success('Relational Archive Exported', `Generated ZIP of ${relationalTables.length} tables`);
  }, [relationalResult.tablesData, relationalTables, settings.csvDelimiter, settings.rowCount, recordJob, toast]);

  const handleExportRelationalSql = useCallback(() => {
    const sqlDump = exportRelationalAsSqlDump(relationalResult.tablesData, relationalTables, settings.sqlDialect);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadFile(sqlDump, `synthforge_relational_schema_${timestamp}.sql`, 'application/sql;charset=utf-8;');
    recordJob('relational', settings.rowCount, relationalTables.length, 'sql', 90);
    toast.success('SQL Dump Generated', `Created DDL + INSERT statements for ${settings.sqlDialect.toUpperCase()}`);
  }, [relationalResult.tablesData, relationalTables, settings.sqlDialect, settings.rowCount, recordJob, toast]);

  // Direct Format Export Handlers
  const handleExportDirect = useCallback(
    (format: 'csv' | 'json' | 'sql') => {
      const isBigExport = activeTab === 'tabular' && settings.rowCount > 5000;

      if (isBigExport) {
        startChunkedExport({
          schema: customColumns,
          rowCount: settings.rowCount,
          seed: settings.seed,
          format,
          sqlDialect: settings.sqlDialect,
          csvDelimiter: settings.csvDelimiter,
          settings,
        });
        recordJob('tabular', settings.rowCount, customColumns.length, format, 450);
        return;
      }

      if (activeTab === 'tabular') {
        const payload = executeExport('tabular', activeTabularRows, customColumns, { ...settings, exportFormat: format });
        downloadFile(payload.content, payload.filename, payload.mimeType);
        recordJob('tabular', activeTabularRows.length, customColumns.length, format, 30);
        toast.success('Export Complete', `Saved ${payload.filename}`);
      } else if (activeTab === 'relational') {
        if (format === 'csv') {
          handleExportRelationalZip();
        } else if (format === 'sql') {
          handleExportRelationalSql();
        } else {
          const payload = executeExport('relational', relationalResult.tablesData, [], { ...settings, exportFormat: 'json' }, activeRelationalTable, relationalTables);
          downloadFile(payload.content, payload.filename, payload.mimeType);
          recordJob('relational', settings.rowCount, relationalTables.length, format, 60);
          toast.success('Export Complete', `Saved ${payload.filename}`);
        }
      } else {
        const payload = executeExport('documents', documentResult.documents, [], { ...settings, exportFormat: format });
        downloadFile(payload.content, payload.filename, payload.mimeType);
        recordJob('documents', documentResult.documents.length, 1, format, 50);
        toast.success('Export Complete', `Saved ${payload.filename}`);
      }
    },
    [
      activeTab,
      settings,
      customColumns,
      startChunkedExport,
      recordJob,
      activeTabularRows,
      handleExportRelationalZip,
      handleExportRelationalSql,
      relationalResult.tablesData,
      activeRelationalTable,
      relationalTables,
      documentResult.documents,
      toast,
    ]
  );

  // Validation report computation
  const validationReport = useMemo(() => {
    return runValidationSuite({
      activeTab,
      tabularRows: activeTabularRows,
      tabularColumns: customColumns,
      relationalTables,
      relationalData: relationalResult.tablesData,
      documentsData: documentResult.documents,
      settings,
      documentRegion,
    });
  }, [
    activeTab,
    activeTabularRows,
    customColumns,
    relationalTables,
    relationalResult.tablesData,
    documentResult.documents,
    settings,
    documentRegion,
  ]);

  const [copiedClipboard, setCopiedClipboard] = useState<boolean>(false);

  const exportPayload = useMemo(() => {
    if (activeTab === 'tabular') {
      return executeExport('tabular', activeTabularRows, customColumns, settings);
    }
    if (activeTab === 'relational') {
      const activeTableSchema = relationalTables.find((t) => t.name === activeRelationalTable);
      const cols = activeTableSchema?.columns || [];
      return executeExport('relational', relationalResult.tablesData, cols, settings, activeRelationalTable, relationalTables);
    }
    return executeExport('documents', documentResult.documents, [], settings);
  }, [
    activeTab,
    activeTabularRows,
    customColumns,
    settings,
    relationalResult.tablesData,
    relationalTables,
    activeRelationalTable,
    documentResult.documents,
  ]);

  const handleDownloadExport = useCallback(() => {
    if (activeTab === 'tabular') {
      const fmt = (settings.exportFormat === 'ndjson' ? 'json' : settings.exportFormat) as 'csv' | 'json' | 'sql';
      handleExportDirect(fmt);
    } else if (activeTab === 'relational' && settings.exportFormat === 'csv') {
      handleExportRelationalZip();
    } else if (activeTab === 'relational' && settings.exportFormat === 'sql') {
      handleExportRelationalSql();
    } else {
      downloadFile(exportPayload.content, exportPayload.filename, exportPayload.mimeType);
      toast.success('File Exported', `Saved ${exportPayload.filename}`);
    }
  }, [activeTab, settings.exportFormat, handleExportDirect, handleExportRelationalZip, handleExportRelationalSql, exportPayload, toast]);

  const handleCopyClipboard = useCallback(() => {
    navigator.clipboard.writeText(exportPayload.content);
    setCopiedClipboard(true);
    toast.success('Copied to Clipboard', `${exportPayload.filename} content ready to paste.`);
    setTimeout(() => setCopiedClipboard(false), 2000);
  }, [exportPayload, toast]);

  // Apply AI Generated Schema from "Describe It" or Template Gallery
  const handleApplyAiSchema = (schemaData: GeneratedAiSchemaResponse) => {
    if (schemaData.mode === 'tabular' && schemaData.tabularColumns) {
      setCustomColumns(schemaData.tabularColumns);
      if (schemaData.rowCount) {
        handleUpdateSettings({ rowCount: schemaData.rowCount });
      }
      setActiveTab('tabular');
      toast.success('AI Tabular Schema Loaded', `Applied ${schemaData.tabularColumns.length} columns.`);
    } else if (schemaData.mode === 'relational' && schemaData.relationalTables) {
      setRelationalTables(schemaData.relationalTables);
      setActiveRelationalTable(schemaData.relationalTables[0]?.name || 'table_1');
      if (schemaData.rowCount) {
        handleUpdateSettings({ rowCount: schemaData.rowCount });
      }
      setActiveTab('relational');
      toast.success('AI Relational Database Loaded', `Created ${schemaData.relationalTables.length} connected tables.`);
    }
  };

  // Upload Sample CSV / Local Profiler
  const handleUploadSampleCsvFile = async (file: File) => {
    try {
      const parsed = await parseUploadedDataFile(file);
      if (parsed.columns.length > 0) {
        setCustomColumns(parsed.columns);
        handleUpdateSettings({ rowCount: Math.min(parsed.records.length || 50, 1000) });
        setActiveTab('tabular');
        toast.success(
          'Sample Data Ingested',
          `Detected ${parsed.columns.length} columns with inferred types from ${file.name}.`
        );
      }
    } catch (err: any) {
      toast.error('Upload Error', err?.message || 'Could not parse sample CSV');
    }
  };

  // Save Project as JSON
  const handleSaveProject = () => {
    const project: SynthForgeProject = {
      version: 1,
      name: `SynthForge_Project_${new Date().toISOString().slice(0, 10)}`,
      savedAt: new Date().toISOString(),
      settings,
      customColumns,
      relationalTables,
      activeTab,
    };

    const jsonStr = JSON.stringify(project, null, 2);
    downloadFile(jsonStr, `${project.name.toLowerCase()}.json`, 'application/json');

    setRecentProjects((prev) => {
      const updated = [project, ...prev.filter((p) => p.name !== project.name).slice(0, 9)];
      try {
        localStorage.setItem(`synthforge_${userPrefix}_recent_projects`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    toast.success('Project Saved', 'Workspace configuration downloaded as JSON.');
  };

  // Load Project from JSON
  const handleLoadProjectFile = async (file: File) => {
    try {
      const text = await file.text();
      const proj: SynthForgeProject = JSON.parse(text);

      if (!proj || !proj.customColumns) {
        throw new Error('Invalid SynthForge project file format.');
      }

      if (proj.settings) setSettings(proj.settings);
      if (proj.customColumns) setCustomColumns(proj.customColumns);
      if (proj.relationalTables) {
        setRelationalTables(proj.relationalTables);
        setActiveRelationalTable(proj.relationalTables[0]?.name || 'table_1');
      }
      if (proj.activeTab) setActiveTab(proj.activeTab);

      toast.success('Project Loaded', `Successfully restored ${proj.name || 'workspace project'}.`);
    } catch (err: any) {
      toast.error('Load Project Failed', err?.message || 'Invalid JSON file.');
    }
  };

  // Copilot Patch Applicator
  const handleApplyCopilotPatches = useCallback((patches: SchemaPatch[]) => {
    patches.forEach((patch) => {
      if (patch.action === 'add_column' && patch.column) {
        const fullCol: ColumnDefinition = {
          id: patch.column.id || `col_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: patch.column.name || 'new_column',
          type: patch.column.type || 'string',
          nullPercentage: patch.column.nullPercentage ?? 0,
          isUnique: !!patch.column.isUnique,
          min: patch.column.min,
          max: patch.column.max,
          precision: patch.column.precision,
          privacy: patch.column.privacy,
          laplaceEpsilon: patch.column.laplaceEpsilon,
        };
        setCustomColumns((prev) => [...prev, fullCol]);
      } else if (patch.action === 'modify_column' && patch.columnId) {
        setCustomColumns((prev) =>
          prev.map((c) => (c.id === patch.columnId ? { ...c, ...patch.column } : c))
        );
      } else if (patch.action === 'remove_column' && patch.columnId) {
        setCustomColumns((prev) => prev.filter((c) => c.id !== patch.columnId));
      } else if (patch.action === 'update_settings' && patch.settings) {
        handleUpdateSettings(patch.settings);
      }
    });
  }, []);

  // Theme Cycler
  const handleThemeCycle = useCallback(() => {
    const themes: Theme[] = ['ocean', 'dark', 'sunset', 'light'];
    const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(nextTheme);
  }, [theme]);

  // Job Re-run & Clear
  const handleRerunJob = useCallback((job: GenerationJobLog) => {
    setSettings((prev) => ({ ...prev, seed: job.seed, rowCount: job.rowCount }));
    setActiveTab(job.type);
    toast.success('Restored Job Parameters', `Applied seed #${job.seed} (${job.rowCount} rows)`);
  }, [toast]);

  const handleClearJobs = useCallback(() => {
    setRecentJobs([]);
    try {
      localStorage.removeItem(`synthforge_${userPrefix}_recent_jobs`);
    } catch {}
  }, [userPrefix]);

  // Scenario Applicators
  const handleApplyTabularScenario = useCallback((cols: ColumnDefinition[], settingsPatch: Partial<GenerationSettings>) => {
    setCustomColumns(cols);
    handleUpdateSettings(settingsPatch);
  }, []);

  const handleApplyTimeSeriesScenario = useCallback((patch: Partial<TimeSeriesSettings>) => {
    // Navigates to timeseries tab
  }, []);

  // Job Logger Helper
  const handleAddJobLog = useCallback((type: TabType, rowCount: number, colCount: number, durationMs: number, format: string = 'preview', seedUsed?: number) => {
    const newJob: GenerationJobLog = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      rowCount,
      columnCount: colCount,
      durationMs,
      seed: seedUsed !== undefined ? seedUsed : settings.seed,
      format,
      status: 'completed',
    };
    setRecentJobs((prev) => {
      const updated = [newJob, ...prev].slice(0, 50);
      try {
        localStorage.setItem(`synthforge_${userPrefix}_recent_jobs`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [settings.seed, userPrefix]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when inside inputs or textareas
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (cmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleRegenerate();
      } else if (cmdOrCtrl && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setIsExportModalOpen(true);
      } else if (cmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveProject();
      } else if (cmdOrCtrl && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        projectFileInputRef.current?.click();
      } else if (e.key === '?' && !e.shiftKey) {
        setIsShortcutsOpen(true);
      } else if (e.key === '1') {
        setActiveTab('home');
      } else if (e.key === '2') {
        setActiveTab('tabular');
      } else if (e.key === '3') {
        setActiveTab('relational');
      } else if (e.key === '4') {
        setActiveTab('documents');
      } else if (e.key === '5') {
        setActiveTab('timeseries');
      } else if (e.key === '6') {
        setActiveTab('datasources');
      } else if (e.key === '7') {
        setActiveTab('eda');
      } else if (e.key === '8') {
        setActiveTab('quality');
      } else if (e.key === '9') {
        setActiveTab('notebooks');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRegenerate, handleSaveProject]);

  // If session is still loading, show branded loading splash
  if (status === 'loading') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-xl bg-gradient-to-tr from-cyan-500 to-indigo-600">
            SF
          </div>
          <div className="text-sm font-semibold tracking-wide text-[var(--text-secondary)]">
            Initializing SynthForge...
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show full-screen LoginPage BEFORE anything else
  if (status === 'unauthenticated' || !user) {
    return <LoginPage currentTheme={theme} onThemeChange={setTheme} />;
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Hidden File Pickers */}
      <input
        ref={projectFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLoadProjectFile(file);
          e.target.value = '';
        }}
      />
      <input
        ref={sampleCsvInputRef}
        type="file"
        accept=".csv,.tsv,.json,.xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadSampleCsvFile(file);
          e.target.value = '';
        }}
      />

      {/* Top Header */}
      <Header
        currentTheme={theme}
        onThemeChange={setTheme}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onRegenerate={handleRegenerate}
        onExportDirect={handleExportDirect}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onToggleConfig={() => setIsConfigOpen((prev) => !prev)}
        onOpenValidation={() => setIsValidationModalOpen(true)}
        onOpenDescribeIt={() => setIsDescribeItOpen(true)}
        onOpenTemplateGallery={() => setIsTemplateGalleryOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
        onSaveProject={handleSaveProject}
        onLoadProject={() => projectFileInputRef.current?.click()}
        onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        qualityScore={validationReport.qualityScore}
        isSidebarOpen={isSidebarOpen}
        isConfigOpen={isConfigOpen}
        isGenerating={isWorkerGenerating}
        stats={currentStats}
      />

      {/* Guest Mode Session Warning Banner */}
      {user.isGuest && (
        <div
          role="status"
          className="flex items-center justify-between px-3 sm:px-4 py-2 border-b text-xs font-medium backdrop-blur-xs transition-colors"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            borderColor: 'rgba(245, 158, 11, 0.25)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="font-semibold text-amber-400">Guest Session:</span>
            <span className="text-[var(--text-secondary)]">
              Your schemas and datasets are stored locally in this browser. Create an account to secure them.
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer whitespace-nowrap"
          >
            Create Permanent Account
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'home' && (
        <HomeDashboard
          onNavigateTab={handleTabChange}
          onOpenDescribeIt={() => setIsDescribeItOpen(true)}
          onOpenTemplateGallery={() => setIsTemplateGalleryOpen(true)}
          onOpenUploadCsv={() => sampleCsvInputRef.current?.click()}
          onLoadProject={() => projectFileInputRef.current?.click()}
          onSaveProject={handleSaveProject}
          totalRowsGenerated={totalRowsGenerated}
          recentJobs={recentJobs}
          recentProjects={recentProjects}
          qualityScore={validationReport.qualityScore}
        />
      )}

      {activeTab === 'timeseries' && (
        <TimeSeriesPage
          onAddJobLog={(rows, cols, dur) => handleAddJobLog('timeseries', rows, cols, dur)}
        />
      )}

      {activeTab === 'quality' && (
        <QualityPage
          realRecords={selectedEdaDataset?.records || []}
          synthRecords={activeTabularRows}
          datasetName={selectedEdaDataset?.name}
          onNavigateTab={handleTabChange}
        />
      )}

      {activeTab === 'notebooks' && (
        <NotebooksPage
          realRecords={selectedEdaDataset?.records || []}
          synthRecords={activeTabularRows}
          datasetName={selectedEdaDataset?.name}
        />
      )}

      {activeTab === 'scenarios' && (
        <ScenarioBuilderPage
          onApplyTabularScenario={handleApplyTabularScenario}
          onApplyTimeSeriesScenario={handleApplyTimeSeriesScenario}
          onNavigateTab={handleTabChange}
        />
      )}

      {activeTab === 'jobs' && (
        <JobsPage
          jobs={recentJobs}
          onRerunJob={handleRerunJob}
          onClearJobs={handleClearJobs}
        />
      )}

      {activeTab === 'api' && (
        <ApiPage
          columns={customColumns}
          settings={settings}
        />
      )}

      {activeTab === 'datasources' && (
        <DataSourcesPage
          onOpenEdaForDataset={(ds) => {
            setSelectedEdaDataset(ds);
            setActiveTab('eda');
          }}
          onGenerateSyntheticFromDataset={(cols, count) => {
            setCustomColumns(cols);
            handleUpdateSettings({ rowCount: count });
            setActiveTab('tabular');
            toast.success('Synthetic Schema Generated', `Configured ${cols.length} columns in tabular generator.`);
          }}
        />
      )}

      {activeTab === 'eda' && (
        <EDAPage
          initialDataset={selectedEdaDataset}
          onGenerateSynthetic={(cols, count) => {
            setCustomColumns(cols);
            handleUpdateSettings({ rowCount: count });
            setActiveTab('tabular');
            toast.success('Synthetic Schema Generated', `Configured ${cols.length} columns from EDA dataset.`);
          }}
          onNavigateDataSources={() => setActiveTab('datasources')}
        />
      )}

      {(activeTab === 'tabular' || activeTab === 'relational' || activeTab === 'documents') && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            selectedTabularPreset={selectedTabularPreset}
            onSelectTabularPreset={handleSelectTabularPreset}
            selectedRelationalPreset={selectedRelationalPreset}
            onSelectRelationalPreset={handleSelectRelationalPreset}
            selectedDocumentPreset={selectedDocumentPreset}
            onSelectDocumentPreset={handleSelectDocumentPreset}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onAddNewCustomColumn={() => setIsConfigOpen(true)}
          />

          {/* Center Live Preview */}
          <CenterPreview
            activeTab={activeTab}
            tabularRows={activeTabularRows}
            tabularColumns={customColumns}
            onChangeTabularColumns={handleReorderColumns}
            relationalTables={relationalTables}
            relationalData={relationalResult.tablesData}
            relationalRelationships={relationalResult.relationships}
            activeRelationalTable={activeRelationalTable}
            onSelectRelationalTable={setActiveRelationalTable}
            onChangeRelationalTables={setRelationalTables}
            onExportRelationalZip={handleExportRelationalZip}
            onExportRelationalSql={handleExportRelationalSql}
            documentsData={documentResult.documents}
            selectedRegion={documentRegion}
            onSelectRegion={(reg) => {
              setDocumentRegion(reg);
              handleUpdateSettings({ documentRegion: reg });
            }}
            isWorkerGenerating={isWorkerGenerating}
            totalConfiguredRows={settings.rowCount}
            onOpenValidation={() => setIsValidationModalOpen(true)}
            qualityScore={validationReport.qualityScore}
          />

          {/* Right Configuration Panel */}
          <ConfigPanel
            activeTab={activeTab}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            columns={customColumns}
            onAddColumn={handleAddColumn}
            onDeleteColumn={handleDeleteColumn}
            onReorderColumns={handleReorderColumns}
            onExport={handleDownloadExport}
            onExportDirect={handleExportDirect}
            onCopyClipboard={handleCopyClipboard}
            isCopied={copiedClipboard}
            isOpen={isConfigOpen}
            onClose={() => setIsConfigOpen(false)}
            selectedRegion={documentRegion}
            onSelectRegion={(reg) => {
              setDocumentRegion(reg);
              handleUpdateSettings({ documentRegion: reg });
            }}
          />
        </div>
      )}

      {/* Describe It AI Architect Modal */}
      <DescribeItModal
        isOpen={isDescribeItOpen}
        onClose={() => setIsDescribeItOpen(false)}
        onApplySchema={handleApplyAiSchema}
      />

      {/* Template Gallery Modal */}
      <TemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onSelectTemplate={handleApplyAiSchema}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          if (user && !user.isGuest) {
            try {
              localStorage.setItem(`synthforge_${user.id}_has_seen_tour`, 'true');
            } catch {}
          }
        }}
        onNavigateTab={handleTabChange}
      />

      {/* Advanced Export Options Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeTab={activeTab}
        exportContent={exportPayload.content}
        filename={exportPayload.filename}
        mimeType={exportPayload.mimeType}
        onDownload={handleDownloadExport}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Large Row Count Chunked Export Progress Modal */}
      <ExportProgressModal
        progress={exportProgress}
        onCancel={cancelExport}
        onClose={closeExportProgress}
      />

      {/* Quality Validation Report Modal */}
      <ValidationReportModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        report={validationReport}
        onRerun={handleRegenerate}
        activeTab={activeTab}
      />

      {/* AI Copilot Side Panel */}
      <CopilotSidePanel
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentColumns={customColumns}
        currentSettings={settings}
        onApplyPatches={handleApplyCopilotPatches}
      />

      {/* Ctrl+K Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={handleTabChange}
        onRegenerate={handleRegenerate}
        onOpenDescribeIt={() => setIsDescribeItOpen(true)}
        onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenTemplateGallery={() => setIsTemplateGalleryOpen(true)}
        onSaveProject={handleSaveProject}
        onThemeCycle={handleThemeCycle}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
