import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  FileSpreadsheet,
  TrendingUp,
  Percent,
  Activity,
  Loader2,
  ChevronDown,
  Info,
} from 'lucide-react';
import type { StoredDataset, DatasetEDAReport, ColumnEDAStats, ColumnDefinition } from '../types';
import { getAllDatasetsFromDb } from '../utils/indexedDb';
import { parseUploadedDataFile } from '../utils/csvParser';
import { EmptyState } from './EmptyState';
import { useToast } from '../context/ToastContext';

interface EDAPageProps {
  initialDataset?: StoredDataset | null;
  onGenerateSynthetic: (columns: ColumnDefinition[], rowCount: number) => void;
  onNavigateDataSources: () => void;
}

export const EDAPage: React.FC<EDAPageProps> = ({
  initialDataset,
  onGenerateSynthetic,
  onNavigateDataSources,
}) => {
  const [datasets, setDatasets] = useState<StoredDataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<StoredDataset | null>(initialDataset || null);
  const [edaReport, setEdaReport] = useState<DatasetEDAReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'columns' | 'correlation' | 'outliers' | 'pii'>('columns');
  const workerRef = useRef<Worker | null>(null);
  const toast = useToast();

  // Load datasets on mount
  useEffect(() => {
    getAllDatasetsFromDb().then((list) => {
      setDatasets(list);
      if (!selectedDataset && list.length > 0) {
        setSelectedDataset(list[0]);
      }
    });
  }, []);

  // Sync initialDataset prop changes
  useEffect(() => {
    if (initialDataset) {
      setSelectedDataset(initialDataset);
    }
  }, [initialDataset]);

  // Run EDA Analysis via Web Worker
  useEffect(() => {
    if (!selectedDataset) {
      setEdaReport(null);
      return;
    }

    setIsAnalyzing(true);

    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('../workers/eda.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { type, report, error } = e.data;
        if (type === 'EDA_SUCCESS' && report) {
          setEdaReport(report);
          setIsAnalyzing(false);
        } else if (type === 'EDA_ERROR') {
          toast.error('EDA Analysis Error', error);
          setIsAnalyzing(false);
        }
      };

      worker.postMessage({
        action: 'ANALYZE_DATASET',
        datasetId: selectedDataset.id,
        datasetName: selectedDataset.name,
        records: selectedDataset.records,
        headers: selectedDataset.headers,
      });
    } catch (err: any) {
      console.error('Failed to spawn EDA worker:', err);
      setIsAnalyzing(false);
    }

    return () => {
      if (worker) worker.terminate();
    };
  }, [selectedDataset]);

  const handleCloneSynthetic = async () => {
    if (!selectedDataset) return;
    try {
      const parsed = await parseUploadedDataFile(
        new File([JSON.stringify(selectedDataset.records)], selectedDataset.name, { type: 'application/json' })
      );
      onGenerateSynthetic(parsed.columns, selectedDataset.rowCount);
      toast.success('Synthetic Schema Generated', `Pre-filled ${parsed.columns.length} columns from ${selectedDataset.name}`);
    } catch (err: any) {
      toast.error('Error Generating Synthetic Version', err?.message);
    }
  };

  if (!selectedDataset && datasets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <EmptyState
          icon={BarChart3}
          title="No Datasets Available for EDA"
          description="Upload a CSV, JSON, or XLSX dataset on the Data Sources page to inspect distributions, correlation matrices, and PII detection."
          actionText="Go to Data Sources"
          onAction={onNavigateDataSources}
        />
      </div>
    );
  }

  const piiColumns = edaReport?.columns.filter((c) => c.pii?.detected) || [];
  const outlierColumns = edaReport?.columns.filter((c) => c.stats && c.stats.outlierCount > 0) || [];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Top Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Exploratory Data Analysis (EDA)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Browser-native Web Worker statistical profiling, IQR outlier detection, correlation matrix & PII scanner
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Dataset Selector Dropdown */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedDataset?.id || ''}
              onChange={(e) => {
                const found = datasets.find((d) => d.id === e.target.value);
                if (found) setSelectedDataset(found);
              }}
              className="w-full appearance-none px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer outline-hidden pr-8"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.rowCount.toLocaleString()} rows)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-[var(--text-muted)]" />
          </div>

          <button
            type="button"
            onClick={handleCloneSynthetic}
            disabled={!edaReport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Synthetic Version</span>
          </button>
        </div>
      </div>

      {isAnalyzing ? (
        <div className="p-16 flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-primary)]" />
          <div className="text-sm font-bold text-[var(--text-primary)]">Analyzing dataset in Web Worker...</div>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm">
            Calculating distributions, Pearson correlation coefficients, quantiles, and scanning for PII patterns.
          </p>
        </div>
      ) : edaReport ? (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              className="p-4 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Total Rows
              </span>
              <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                {edaReport.rowCount.toLocaleString()}
              </div>
            </div>

            <div
              className="p-4 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Columns
              </span>
              <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                {edaReport.columnCount}
              </div>
            </div>

            <div
              className="p-4 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Memory Footprint
              </span>
              <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                {(edaReport.sizeBytes / 1024).toFixed(1)} KB
              </div>
            </div>

            <div
              className="p-4 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Missing Values
              </span>
              <div className={`text-xl font-bold font-mono mt-1 ${edaReport.missingPercentage > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {edaReport.missingPercentage}%
              </div>
            </div>

            <div
              className="p-4 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Duplicates
              </span>
              <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
                {edaReport.duplicateRowsCount}
              </div>
            </div>

            <div
              className="p-4 rounded-xl border flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                PII Risks
              </span>
              <div className={`text-xl font-bold font-mono mt-1 ${piiColumns.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {piiColumns.length > 0 ? `${piiColumns.length} Flags` : '0 Clean'}
              </div>
            </div>
          </div>

          {/* Sub-navigation tabs: Columns, Correlation, Outliers, PII Scanner */}
          <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('columns')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'columns'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Column Distributions ({edaReport.columns.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('correlation')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'correlation'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Correlation Heatmap
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('outliers')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'outliers'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              IQR Outlier Detection ({outlierColumns.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pii')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'pii'
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              PII Scanner ({piiColumns.length})
            </button>
          </div>

          {/* Tab 1: Column Distributions */}
          {activeTab === 'columns' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {edaReport.columns.map((col) => (
                <div
                  key={col.name}
                  className="p-5 rounded-xl border flex flex-col justify-between gap-4"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {/* Column Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--text-primary)] font-mono">{col.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] uppercase">
                          {col.inferredType}
                        </span>
                        {col.pii?.detected && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25 font-bold uppercase">
                            PII: {col.pii.type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-1">
                        <span>Unique: {col.uniqueCount} ({col.uniquePercentage}%)</span>
                        <span>·</span>
                        <span>Missing: {col.missingCount} ({col.missingPercentage}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Histogram for Numeric */}
                  {col.stats?.histogram && col.stats.histogram.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                        <span>Min: {col.stats.min}</span>
                        <span>Mean: {col.stats.mean}</span>
                        <span>Max: {col.stats.max}</span>
                      </div>
                      <div className="h-16 flex items-end gap-1 px-1 bg-[var(--bg-surface-elevated)] rounded-lg p-1.5 border border-[var(--border-subtle)]">
                        {(() => {
                          const maxCount = Math.max(1, ...col.stats.histogram.map((b) => b.count));
                          return col.stats.histogram.map((b, bIdx) => (
                            <div
                              key={bIdx}
                              className="flex-1 rounded-t-xs bg-[var(--accent-primary)] hover:brightness-125 transition-all relative group"
                              style={{ height: `${Math.max(8, (b.count / maxCount) * 100)}%` }}
                              title={`[${b.binStart} - ${b.binEnd}]: ${b.count} rows`}
                            />
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Top Categories for Categorical / Text */}
                  {col.topCategories && col.topCategories.length > 0 && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                        Top Categories
                      </span>
                      <div className="flex flex-col gap-1">
                        {col.topCategories.map((cat, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2 text-xs">
                            <span className="w-24 truncate font-medium text-[var(--text-primary)]" title={cat.value}>
                              {cat.value}
                            </span>
                            <div className="flex-1 h-3 rounded-full bg-[var(--bg-surface-elevated)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-500/80"
                                style={{ width: `${Math.min(100, cat.percentage)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-[var(--text-muted)] w-10 text-right">
                              {cat.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Correlation Heatmap */}
          {activeTab === 'correlation' && (
            <div
              className="p-6 rounded-2xl border flex flex-col gap-4 overflow-x-auto"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Pearson Correlation Matrix</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Values range from -1.0 (inverse correlation) to +1.0 (perfect correlation)
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span>-1.0</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-slate-700" />
                    <span>0.0</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span>+1.0</span>
                  </div>
                </div>
              </div>

              {edaReport.correlationMatrix && edaReport.correlationMatrix.numericColumns.length >= 2 ? (
                <div className="overflow-x-auto pt-3">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2"></th>
                        {edaReport.correlationMatrix.numericColumns.map((c) => (
                          <th key={c} className="p-2 font-mono text-[11px] text-[var(--text-primary)] font-semibold rotate-[-45deg] origin-bottom-left pb-4">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {edaReport.correlationMatrix.numericColumns.map((rowName, rIdx) => (
                        <tr key={rowName}>
                          <td className="p-2 text-right font-mono text-[11px] text-[var(--text-primary)] font-semibold whitespace-nowrap pr-3">
                            {rowName}
                          </td>
                          {edaReport.correlationMatrix!.matrix[rIdx].map((val, cIdx) => {
                            // Compute color
                            let bg = 'rgb(30, 41, 59)';
                            if (val > 0) {
                              const alpha = Math.min(1, val * 0.9 + 0.1);
                              bg = `rgba(16, 185, 129, ${alpha})`;
                            } else if (val < 0) {
                              const alpha = Math.min(1, Math.abs(val) * 0.9 + 0.1);
                              bg = `rgba(59, 130, 246, ${alpha})`;
                            }
                            return (
                              <td
                                key={cIdx}
                                className="w-14 h-12 text-center font-mono text-[11px] font-bold border border-[var(--border-subtle)] transition-transform hover:scale-105 cursor-pointer text-white"
                                style={{ backgroundColor: bg }}
                                title={`${rowName} vs ${edaReport.correlationMatrix!.numericColumns[cIdx]}: r = ${val}`}
                              >
                                {val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  Dataset requires at least 2 numeric columns to generate a correlation heatmap.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: IQR Outliers */}
          {activeTab === 'outliers' && (
            <div className="flex flex-col gap-4">
              {outlierColumns.length > 0 ? (
                outlierColumns.map((col) => {
                  const s = col.stats!;
                  const lowerBound = (s.q1 - 1.5 * s.iqr).toFixed(2);
                  const upperBound = (s.q3 + 1.5 * s.iqr).toFixed(2);

                  return (
                    <div
                      key={col.name}
                      className="p-5 rounded-xl border flex flex-col gap-3"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{col.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {s.outlierCount} outliers detected (IQR method)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block">Q1 (25th):</span>
                          <span className="text-[var(--text-primary)] font-bold">{s.q1}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block">Q3 (75th):</span>
                          <span className="text-[var(--text-primary)] font-bold">{s.q3}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block">IQR:</span>
                          <span className="text-[var(--text-primary)] font-bold">{s.iqr}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block">Valid Range:</span>
                          <span className="text-emerald-400 font-bold">[{lowerBound}, {upperBound}]</span>
                        </div>
                      </div>

                      {s.sampleOutliers.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[var(--text-muted)] font-medium">Sample Outliers:</span>
                          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                            {s.sampleOutliers.map((o, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                                {o}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div
                  className="p-8 rounded-xl border text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  <span className="font-semibold text-[var(--text-primary)]">No IQR Outliers Detected</span>
                  <span>All numeric columns are well-behaved within normal distribution bounds.</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: PII Scanner */}
          {activeTab === 'pii' && (
            <div className="flex flex-col gap-4">
              {piiColumns.length > 0 ? (
                piiColumns.map((col) => (
                  <div
                    key={col.name}
                    className="p-5 rounded-xl border border-rose-500/30 flex flex-col gap-3"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                        <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{col.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25 font-bold uppercase">
                          {col.pii?.type?.toUpperCase()} DETECTED
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-rose-400">High Privacy Sensitivity</span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      Values in column <strong className="text-[var(--text-primary)]">"{col.name}"</strong> match patterns for{' '}
                      <strong>{col.pii?.type}</strong>. When synthesizing this data, enable <strong>Mask</strong>, <strong>SHA-256 Hash</strong>, or <strong>Anonymize PII</strong>.
                    </p>

                    {col.pii?.sampleMatch && (
                      <div className="p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
                        <span className="text-[var(--text-muted)]">Sample Pattern Match:</span>
                        <span className="text-rose-400 font-bold">{col.pii.sampleMatch}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div
                  className="p-8 rounded-xl border text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  <span className="font-semibold text-[var(--text-primary)]">No Sensitive PII Detected</span>
                  <span>Scanned email, phone, credit card, and SSN regex patterns without finding leaks.</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
