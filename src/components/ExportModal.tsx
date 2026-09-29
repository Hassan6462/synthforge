import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, CheckCircle2 } from 'lucide-react';
import { ExportFormat, GenerationSettings, SqlDialect, TabType } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  exportContent: string;
  filename: string;
  mimeType: string;
  onDownload: () => void;
  settings: GenerationSettings;
  onUpdateSettings: (newSettings: Partial<GenerationSettings>) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  exportContent,
  filename,
  mimeType,
  onDownload,
  settings,
  onUpdateSettings,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = exportContent.split('\n').length;
  const fileSizeKb = (exportContent.length / 1024).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-xl flex flex-col max-h-[88vh] overflow-hidden animate-fadeIn"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Download className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Export Synthetic Dataset</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Ready-to-use synthetic file generated client-side.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            aria-label="Close export dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Format Selection Bar */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Export Format</span>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
              {(['csv', 'json', 'sql', 'ndjson'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onUpdateSettings({ exportFormat: fmt })}
                  className={`py-1.5 uppercase font-mono font-bold text-xs rounded transition-colors cursor-pointer ${
                    settings.exportFormat === fmt
                      ? 'text-[var(--accent-foreground)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  style={{
                    backgroundColor: settings.exportFormat === fmt ? 'var(--accent-primary)' : 'transparent',
                  }}
                >
                  .{fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata pill-less summary */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] font-mono p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
            <div>
              <span className="text-[var(--text-muted)]">File: </span>
              <span className="font-semibold text-[var(--text-primary)]">{filename}</span>
            </div>
            <span aria-hidden="true">·</span>
            <div>
              <span className="text-[var(--text-muted)]">Size: </span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">{fileSizeKb} KB</span>
            </div>
            <span aria-hidden="true">·</span>
            <div>
              <span className="text-[var(--text-muted)]">Lines: </span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">{lineCount}</span>
            </div>
          </div>

          {/* Payload Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Payload Preview (first 100 lines)</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Preview'}</span>
              </button>
            </div>
            <div
              className="p-3.5 rounded-xl border font-mono text-[11px] max-h-56 overflow-auto leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <pre className="whitespace-pre">
                {exportContent.split('\n').slice(0, 80).join('\n')}
                {lineCount > 80 ? `\n\n... and ${lineCount - 80} more lines` : ''}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 sm:p-5 border-t flex items-center justify-end gap-3"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium border text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onDownload();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-[var(--accent-foreground)] shadow-sm flex items-center gap-2 cursor-pointer hover:brightness-105 active:scale-98"
            style={{
              backgroundColor: 'var(--accent-primary)',
            }}
          >
            <Download className="w-4 h-4" />
            <span>Download {filename}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
