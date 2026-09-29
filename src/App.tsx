import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
} from './types';
import { TABULAR_PRESETS, RELATIONAL_PRESETS, DOCUMENT_PRESETS } from './data/presets';
import { generateTabularData, generateRelationalData, generateDocumentData } from './utils/generators';
import { executeExport, downloadFile, downloadBlob, exportRelationalAsZip, exportRelationalAsSqlDump } from './utils/export';
import { useSyntheticWorker } from './hooks/useSyntheticWorker';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CenterPreview } from './components/CenterPreview';
import { ConfigPanel } from './components/ConfigPanel';
import { ExportModal } from './components/ExportModal';
import { ExportProgressModal } from './components/ExportProgressModal';
import { ValidationReportModal } from './components/ValidationReportModal';
import { runValidationSuite } from './utils/dataValidator';

export default function App() {
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
  const [activeTab, setActiveTab] = useState<TabType>('tabular');

  // 3. Responsive Drawer States (for tablet and mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  // 4. Generation Settings
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
  });

  const handleUpdateSettings = (partial: Partial<GenerationSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // 5. Presets & Columns State
  const [selectedTabularPreset, setSelectedTabularPreset] = useState<TabularPreset>(TABULAR_PRESETS[0]);
  const [customColumns, setCustomColumns] = useState<ColumnDefinition[]>(TABULAR_PRESETS[0].columns);

  const [selectedRelationalPreset, setSelectedRelationalPreset] = useState<RelationalPreset>(RELATIONAL_PRESETS[0]);
  const [relationalTables, setRelationalTables] = useState<TableSchema[]>(RELATIONAL_PRESETS[0].tables);
  const [activeRelationalTable, setActiveRelationalTable] = useState<string>(RELATIONAL_PRESETS[0].tables[0].name);

  const [selectedDocumentPreset, setSelectedDocumentPreset] = useState<DocumentPreset>(DOCUMENT_PRESETS[0]);
  const [documentRegion, setDocumentRegion] = useState<DocumentRegion>(DOCUMENT_PRESETS[0].region || 'US');

  // 6. Web Worker for Tabular Generation & Chunked Export up to 1,000,000 rows
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

  // Trigger debounced generation whenever settings or columns change (400ms debounce)
  useEffect(() => {
    requestDebouncedPreview(customColumns, settings.rowCount, settings.seed);
  }, [customColumns, settings.rowCount, settings.seed, requestDebouncedPreview]);

  // Synchronous fallback / auxiliary generators for Relational & Documents
  const syncTabularFallback = useMemo(() => {
    return generateTabularData(customColumns, settings);
  }, [customColumns, settings]);

  // Relational generation with parent-first ordering, referential integrity & computed columns
  const relationalResult = useMemo(() => {
    return generateRelationalData(relationalTables, settings);
  }, [relationalTables, settings]);

  const documentResult = useMemo(() => {
    return generateDocumentData(selectedDocumentPreset.templateType, settings, documentRegion);
  }, [selectedDocumentPreset, settings, documentRegion]);

  // Active tabular rows (from Web Worker if populated, else fallback)
  const activeTabularRows = workerTabularRows.length > 0 ? workerTabularRows : syncTabularFallback.rows;

  // Re-generate dataset (re-rolls seed if not locked)
  const handleRegenerate = useCallback(() => {
    if (!settings.seedLocked) {
      const newSeed = Math.floor(Math.random() * 900000) + 100000;
      setSettings((prev) => ({ ...prev, seed: newSeed }));
    }
  }, [settings.seedLocked]);

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
  };

  const handleSelectRelationalPreset = (preset: RelationalPreset) => {
    setSelectedRelationalPreset(preset);
    setRelationalTables(preset.tables);
    setActiveRelationalTable(preset.tables[0].name);
    setIsSidebarOpen(false);
  };

  const handleSelectDocumentPreset = (preset: DocumentPreset) => {
    setSelectedDocumentPreset(preset);
    if (preset.region) {
      setDocumentRegion(preset.region);
      handleUpdateSettings({ documentRegion: preset.region });
    }
    setIsSidebarOpen(false);
  };

  // Schema Column manipulation: Add, Delete, and Reorder
  const handleAddColumn = (col: ColumnDefinition) => {
    setCustomColumns((prev) => [...prev, col]);
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
  }, [activeTab, settings.rowCount, workerStats, customColumns.length, activeTabularRows, relationalResult.stats, documentResult.stats]);

  // Relational Specific Export Handlers (ZIP of CSVs & SQL Dump)
  const handleExportRelationalZip = useCallback(async () => {
    const zipBlob = await exportRelationalAsZip(relationalResult.tablesData, relationalTables, settings.csvDelimiter);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadBlob(zipBlob, `synthforge_relational_tables_${timestamp}.zip`);
  }, [relationalResult.tablesData, relationalTables, settings.csvDelimiter]);

  const handleExportRelationalSql = useCallback(() => {
    const sqlDump = exportRelationalAsSqlDump(relationalResult.tablesData, relationalTables, settings.sqlDialect);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadFile(sqlDump, `synthforge_relational_schema_${timestamp}.sql`, 'application/sql;charset=utf-8;');
  }, [relationalResult.tablesData, relationalTables, settings.sqlDialect]);

  // Direct Export for CSV, JSON, and SQL
  const handleExportDirect = useCallback(
    (format: 'csv' | 'json' | 'sql') => {
      if (activeTab === 'tabular') {
        startChunkedExport({
          schema: customColumns,
          rowCount: settings.rowCount,
          seed: settings.seed,
          format,
          sqlDialect: settings.sqlDialect,
          csvDelimiter: settings.csvDelimiter,
        });
      } else if (activeTab === 'relational') {
        if (format === 'sql') {
          handleExportRelationalSql();
        } else if (format === 'csv') {
          // Export full relational schema as ZIP of CSV files
          handleExportRelationalZip();
        } else {
          // JSON relational bundle
          const exp = executeExport('relational', relationalResult.tablesData, [], { ...settings, exportFormat: 'json' }, activeRelationalTable, relationalTables);
          downloadFile(exp.content, exp.filename, exp.mimeType);
        }
      } else {
        // Documents immediate export
        const exp = executeExport('documents', documentResult.documents, [], { ...settings, exportFormat: format });
        downloadFile(exp.content, exp.filename, exp.mimeType);
      }
    },
    [activeTab, startChunkedExport, customColumns, settings, relationalResult.tablesData, documentResult.documents, handleExportRelationalSql, handleExportRelationalZip, activeRelationalTable, relationalTables]
  );

  // Export State & Execution for advanced options modal
  const [copiedClipboard, setCopiedClipboard] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);

  // Live dataset quality and invariant validation suite
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

  // Primary Export trigger
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
    }
  }, [activeTab, settings.exportFormat, handleExportDirect, handleExportRelationalZip, handleExportRelationalSql, exportPayload]);

  // Quick Copy to Clipboard
  const handleCopyClipboard = useCallback(() => {
    navigator.clipboard.writeText(exportPayload.content);
    setCopiedClipboard(true);
    setTimeout(() => setCopiedClipboard(false), 2000);
  }, [exportPayload.content]);

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Header with direct Export CSV / JSON / SQL buttons */}
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
        qualityScore={validationReport.qualityScore}
        isSidebarOpen={isSidebarOpen}
        isConfigOpen={isConfigOpen}
        isGenerating={isWorkerGenerating}
        stats={currentStats}
      />

      {/* 3-Column Layout: Left Sidebar | Center Preview | Right Config Panel */}
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

        {/* Center Live Preview Area (Virtualized Table, Schema Editor, React Flow ER Diagram, Relational Schema Editor) */}
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

      {/* Large Row Count Chunked Export Progress Modal with Cancel Button */}
      <ExportProgressModal
        progress={exportProgress}
        onCancel={cancelExport}
        onClose={closeExportProgress}
      />

      {/* Comprehensive Data Invariant & Quality Validation Report Modal */}
      <ValidationReportModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        report={validationReport}
        onRerun={handleRegenerate}
        activeTab={activeTab}
      />
    </div>
  );
}
