import React, { useEffect } from 'react';
import { Download, X, CheckCircle2, Cpu, AlertOctagon, FileText } from 'lucide-react';
import { ExportProgressState } from '../hooks/useSyntheticWorker';

interface ExportProgressModalProps {
  progress: ExportProgressState;
  onCancel: () => void;
  onClose: () => void;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  progress,
  onCancel,
  onClose,
}) => {
  const isOpen = progress.isExporting || progress.isComplete;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (progress.isComplete) onClose();
        else onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, progress.isComplete, onClose, onCancel]);

  if (!isOpen) {
    return null;
  }

  const formatTitle =
    progress.format === 'csv'
      ? 'CSV File'
      : progress.format === 'json'
      ? 'JSON File'
      : 'SQL INSERT Script';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-progress-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden p-6 space-y-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                progress.isComplete
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-[var(--accent-light)] border-[var(--border-focus)] text-[var(--accent-primary)]'
              }`}
            >
              {progress.isComplete ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Cpu className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div>
              <h3 id="export-progress-title" className="text-base font-bold text-[var(--text-primary)]">
                {progress.isComplete ? 'Synthetic Export Ready' : `Generating ${formatTitle}`}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {progress.isComplete
                  ? 'File generation complete. Download has started automatically.'
                  : 'Chunked synthesis running inside background Web Worker.'}
              </p>
            </div>
          </div>

          {progress.isComplete && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar & Counters */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between text-xs font-mono">
            <span className="text-[var(--text-secondary)] font-medium">
              {progress.isComplete ? (
                <span className="text-emerald-500 font-bold">100% Completed</span>
              ) : (
                <>Synthesizing records in chunks...</>
              )}
            </span>
            <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
              {progress.percent}%
            </span>
          </div>

          {/* Progress track */}
          <div
            className="w-full h-3 rounded-full overflow-hidden border p-0.5"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-150 ease-out"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: progress.isComplete ? '#10b981' : 'var(--accent-primary)',
              }}
            />
          </div>

          {/* Status Breakdown metrics */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl border text-xs font-mono"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Processed</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {progress.currentCount.toLocaleString()} / {progress.totalCount.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Throughput</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {progress.rowsPerSec > 0 ? `${progress.rowsPerSec.toLocaleString()} r/s` : 'Initializing...'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Format</span>
              <span className="font-semibold text-[var(--accent-primary)] uppercase">
                {progress.format}
              </span>
            </div>
          </div>
        </div>

        {/* Completed File Details Card */}
        {progress.isComplete && progress.blobUrl && (
          <div
            className="p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <span className="font-bold text-[var(--text-primary)] truncate block">
                  {progress.filename}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {progress.fileSizeMb} MB · {progress.totalCount.toLocaleString()} rows
                </span>
              </div>
            </div>

            <a
              href={progress.blobUrl}
              download={progress.filename || 'synthforge_export'}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--accent-foreground)] shadow-xs flex items-center gap-1.5 shrink-0 hover:brightness-105"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Again</span>
            </a>
          </div>
        )}

        {/* Action Buttons: Cancel during generation OR Done when complete */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          {progress.isExporting ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-500/40 text-red-500 hover:bg-red-500/10 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Cancel Export</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] cursor-pointer transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
