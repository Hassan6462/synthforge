import React, { useState } from 'react';
import { Sparkles, X, Loader2, ArrowRight, Table, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GeneratedAiSchemaResponse } from '../utils/keywordTemplates';

interface DescribeItModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySchema: (schemaData: GeneratedAiSchemaResponse) => void;
}

const EXAMPLE_PROMPTS = [
  'online store with 1000 customers and 5000 orders',
  'hospital clinic with 300 patients and 1200 appointments',
  'fintech banking system with 500 accounts and 3000 transactions',
  'hr payroll with 150 employees and company departments',
  'saas telemetry platform with server nodes and performance metrics',
];

export const DescribeItModal: React.FC<DescribeItModalProps> = ({ isOpen, onClose, onApplySchema }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GeneratedAiSchemaResponse | null>(null);
  const [source, setSource] = useState<'gemini' | 'fallback' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (targetPrompt?: string) => {
    const textToUse = (targetPrompt || prompt).trim();
    if (!textToUse) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToUse }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const json = await response.json();
      if (json.success && json.data) {
        setResult(json.data);
        setSource(json.source);
      } else {
        throw new Error(json.error || 'Failed to generate schema structure');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error communicating with schema generation server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplySchema(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Describe It — AI Schema Architect</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Generate tabular schemas or relational databases with entity relations from plain text
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {/* Prompt Input Box */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Describe your dataset or database
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. online store with 1000 customers and 5000 orders"
                rows={3}
                disabled={isLoading}
                className="w-full px-4 py-3 text-sm rounded-xl border transition-all resize-none outline-hidden focus:ring-2 focus:ring-purple-500/30"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Architecting...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Schema</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Try an example:</span>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPrompt(ex);
                    handleGenerate(ex);
                  }}
                  className="px-2.5 py-1 text-[11px] rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-left cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Result Preview */}
          {result && (
            <div
              className="p-4 rounded-xl border flex flex-col gap-3.5 animate-in fade-in-50 duration-200"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">Generated Architecture</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold uppercase">
                    {result.mode}
                  </span>
                </div>
                {source && (
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    Engine: {source === 'gemini' ? 'Gemini 3.8 Flash' : 'Keyword Fallback Engine'}
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{result.summary}</p>

              {/* Tabular Mode Preview */}
              {result.mode === 'tabular' && result.tabularColumns && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
                    <span className="flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-sky-400" />
                      Columns ({result.tabularColumns.length})
                    </span>
                    {result.rowCount && (
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        Suggested Rows: {result.rowCount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {result.tabularColumns.map((col) => (
                      <span
                        key={col.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <span className="text-[var(--text-primary)] font-semibold">{col.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">({col.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relational Mode Preview */}
              {result.mode === 'relational' && result.relationalTables && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    Tables ({result.relationalTables.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.relationalTables.map((tbl) => (
                      <div
                        key={tbl.id}
                        className="p-3 rounded-lg border flex flex-col gap-1"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--text-primary)] font-mono">{tbl.name}</span>
                          {tbl.rowCount && (
                            <span className="text-[10px] font-mono text-teal-400 font-semibold">
                              {tbl.rowCount.toLocaleString()} rows
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">{tbl.columns.length} columns (PK: {tbl.primaryKey})</div>
                        {tbl.foreignKeys && tbl.foreignKeys.length > 0 && (
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">
                            FK: {tbl.foreignKeys.map((fk) => `${fk.column} -> ${fk.targetTable}`).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!result}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply to Generator</span>
          </button>
        </div>
      </div>
    </div>
  );
};
