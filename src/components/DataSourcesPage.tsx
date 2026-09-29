import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Trash2,
  Download,
  BarChart3,
  Sparkles,
  Database,
  FileText,
  Clock,
  Layers,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';
import type { StoredDataset, ColumnDefinition } from '../types';
import {
  getAllDatasetsFromDb,
  saveDatasetToDb,
  deleteDatasetFromDb,
  seedDefaultDatasets,
} from '../utils/indexedDb';
import { parseUploadedDataFile } from '../utils/csvParser';
import { EmptyState } from './EmptyState';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface DataSourcesPageProps {
  onOpenEdaForDataset: (dataset: StoredDataset) => void;
  onGenerateSyntheticFromDataset: (columns: ColumnDefinition[], rowCount: number) => void;
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({
  onOpenEdaForDataset,
  onGenerateSyntheticFromDataset,
}) => {
  const [datasets, setDatasets] = useState<StoredDataset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { user } = useAuth();

  const loadDatasets = async () => {
    try {
      setIsLoading(true);
      await seedDefaultDatasets();
      const list = await getAllDatasetsFromDb(user?.id);
      setDatasets(list);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, [user?.id]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsParsing(true);
      const parsed = await parseUploadedDataFile(file);

      const newDataset: StoredDataset = {
        id: `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: user?.id,
        name: file.name,
        format: parsed.format,
        sizeBytes: file.size,
        rowCount: parsed.records.length,
        columnCount: parsed.headers.length,
        headers: parsed.headers,
        records: parsed.records,
        uploadedAt: Date.now(),
      };

      await saveDatasetToDb(newDataset);
      setDatasets((prev) => [newDataset, ...prev]);
      toast.success('Dataset Uploaded & Parsed', `${file.name} (${parsed.records.length.toLocaleString()} rows) stored in IndexedDB.`);
    } catch (err: any) {
      toast.error('File Parsing Failed', err?.message || 'Unable to parse file in browser.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteDatasetFromDb(id);
      setDatasets((prev) => prev.filter((d) => d.id !== id));
      toast.info('Dataset Deleted', `Removed ${name} from local storage.`);
    } catch (err) {
      toast.error('Delete Failed', 'Could not delete dataset.');
    }
  };

  const handleDownloadDataset = (dataset: StoredDataset) => {
    const jsonStr = JSON.stringify(dataset.records, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dataset.name.replace(/\.[^/.]+$/, '') + '.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download Started', `Exported ${dataset.name}`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Data Sources</h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Drag & drop CSV, JSON, or Excel (XLSX) files. Parsed locally and stored securely in IndexedDB.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[var(--accent-primary)] text-[var(--accent-foreground)] shadow-sm hover:brightness-105 active:scale-95 transition-all cursor-pointer"
        >
          {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>Upload Dataset</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.json,.xlsx,.xls,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
          isDragOver
            ? 'border-[var(--accent-primary)] bg-[var(--accent-light)]'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-hover)] bg-[var(--bg-surface)]'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border shadow-xs"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--accent-primary)',
          }}
        >
          {isParsing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
          {isParsing ? 'Parsing and indexing dataset in browser...' : 'Drag & drop your dataset here or click to browse'}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-md leading-relaxed">
          Supports <strong>.CSV</strong>, <strong>.TSV</strong>, <strong>.JSON</strong>, and <strong>.XLSX</strong> spreadsheets.
          All parsing and analysis happen in your browser using Web Workers.
        </p>
      </div>

      {/* Datasets Table */}
      <div
        className="rounded-2xl border overflow-hidden flex flex-col shadow-xs"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-primary)]">Stored Datasets</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] font-bold">
              {datasets.length}
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">IndexedDB Storage</span>
        </div>

        {datasets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-[10px] font-mono text-[var(--text-muted)] uppercase" style={{ borderColor: 'var(--border-subtle)' }}>
                  <th className="px-6 py-3 font-semibold">Dataset Name</th>
                  <th className="px-4 py-3 font-semibold">Format</th>
                  <th className="px-4 py-3 font-semibold">Rows</th>
                  <th className="px-4 py-3 font-semibold">Columns</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold">Uploaded</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {datasets.map((d) => (
                  <tr key={d.id} className="hover:bg-[var(--bg-surface-elevated)] transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-[var(--text-primary)] truncate max-w-xs">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono uppercase text-[10px] font-bold text-[var(--accent-primary)]">
                      {d.format}
                    </td>
                    <td className="px-4 py-3.5 font-mono tabular-nums text-[var(--text-secondary)]">
                      {d.rowCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-mono tabular-nums text-[var(--text-secondary)]">
                      {d.columnCount}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[var(--text-muted)] text-[11px]">
                      {(d.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)] text-[11px]">
                      {new Date(d.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEdaForDataset(d)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/25 font-semibold text-[11px] transition-colors cursor-pointer"
                          title="Open Exploratory Data Analysis & PII Profiler"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>EDA Profiler</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const parsed = await parseUploadedDataFile(new File([JSON.stringify(d.records)], d.name, { type: 'application/json' }));
                            onGenerateSyntheticFromDataset(parsed.columns, d.rowCount);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 font-semibold text-[11px] transition-colors cursor-pointer"
                          title="Extract Schema & Generate Synthetic Counterpart"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Clone Synthetic</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadDataset(d)}
                          className="p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          title="Download dataset JSON"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(d.id, d.name)}
                          className="p-1.5 rounded-lg border text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete dataset"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FileSpreadsheet}
            title="No Datasets Uploaded"
            description="Drag and drop any CSV, JSON, or XLSX file above to store and profile it."
            actionText="Upload Sample File"
            onAction={() => fileInputRef.current?.click()}
          />
        )}
      </div>
    </div>
  );
};
