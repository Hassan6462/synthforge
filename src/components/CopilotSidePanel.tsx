import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Check,
  AlertCircle,
  Plus,
  RefreshCw,
  Minus,
  CheckCircle2,
  Layers,
  ArrowRight,
  Shield,
  Sliders,
} from 'lucide-react';
import { ColumnDefinition, GenerationSettings, SchemaPatch, CopilotResponse } from '../types';
import { useToast } from '../context/ToastContext';

interface CopilotSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentColumns: ColumnDefinition[];
  currentSettings: GenerationSettings;
  onApplyPatches: (patches: SchemaPatch[]) => void;
}

export const CopilotSidePanel: React.FC<CopilotSidePanelProps> = ({
  isOpen,
  onClose,
  currentColumns,
  currentSettings,
  onApplyPatches,
}) => {
  const toast = useToast();
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copilotResult, setCopilotResult] = useState<CopilotResponse | null>(null);

  if (!isOpen) return null;

  const quickPills = [
    'Add a credit score column bounded 300 to 850',
    'Mask all sensitive PII columns',
    'Add fraud flag and risk score indicators',
    'Inject severe edge cases and outliers',
    'Add phone number and address columns',
  ];

  const handleSendPrompt = async (textToSend?: string) => {
    const query = (textToSend || prompt).trim();
    if (!query) return;

    setIsLoading(true);
    setCopilotResult(null);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          currentColumns,
          currentSettings,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setCopilotResult({
          summary: resJson.data.summary,
          patches: resJson.data.patches,
          source: resJson.source,
        });
        toast.info('Copilot Suggestion Ready', resJson.data.summary);
      } else {
        throw new Error('Invalid copilot payload received.');
      }
    } catch (err: any) {
      console.warn('Copilot request failed:', err);
      toast.error('Copilot Error', err?.message || 'Failed to generate schema patch.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!copilotResult || copilotResult.patches.length === 0) return;
    onApplyPatches(copilotResult.patches);
    toast.success('Changes Applied', `Applied ${copilotResult.patches.length} schema patches.`);
    setCopilotResult(null);
    setPrompt('');
  };

  const handleDiscard = () => {
    setCopilotResult(null);
    toast.info('Patches Discarded', 'Proposal was rejected.');
  };

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-[var(--bg-surface)] border-l shadow-2xl flex flex-col transition-all"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b bg-[var(--bg-surface-elevated)]"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">AI Schema Copilot</h3>
            <span className="text-[10px] text-purple-400 font-mono">Gemini-Powered Architect</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {/* Quick Suggestion Pills */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">Suggested Directives</span>
          <div className="flex flex-wrap gap-1.5">
            {quickPills.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(pill);
                  handleSendPrompt(pill);
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border text-[var(--text-secondary)] hover:text-purple-300 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all text-left cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Diff Review View */}
        {copilotResult && (
          <div
            className="p-4 rounded-xl border bg-[var(--bg-surface-elevated)] flex flex-col gap-3 shadow-xs"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Proposed Schema Diff</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                {copilotResult.source === 'gemini' ? 'Gemini 3.8 Flash' : 'Keyword Fallback'}
              </span>
            </div>

            <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
              {copilotResult.summary}
            </p>

            {/* List of Changes */}
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {copilotResult.patches.map((patch, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 ${
                    patch.action === 'add_column'
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                      : patch.action === 'modify_column'
                      ? 'border-amber-500/30 bg-amber-500/5 text-amber-300'
                      : patch.action === 'remove_column'
                      ? 'border-red-500/30 bg-red-500/5 text-red-300'
                      : 'border-sky-500/30 bg-sky-500/5 text-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1 uppercase text-[10px] tracking-wider">
                      {patch.action === 'add_column' && <Plus className="w-3 h-3 text-emerald-400" />}
                      {patch.action === 'modify_column' && <RefreshCw className="w-3 h-3 text-amber-400" />}
                      {patch.action === 'remove_column' && <Minus className="w-3 h-3 text-red-400" />}
                      {patch.action === 'update_settings' && <Sliders className="w-3 h-3 text-sky-400" />}
                      <span>{patch.action.replace('_', ' ')}</span>
                    </span>
                    {patch.column?.name && (
                      <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-black/20 font-bold">
                        {patch.column.name}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)]">{patch.explanation}</span>
                </div>
              ))}
            </div>

            {/* Actions: Accept or Reject */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Diff</span>
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="py-2 px-3 rounded-lg text-xs font-medium border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-500/40 transition-colors cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Box Footer */}
      <div
        className="p-3 border-t bg-[var(--bg-surface-elevated)] flex flex-col gap-2"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
            placeholder="Type directive (e.g. Add credit score bounded 300 to 850)..."
            rows={2}
            className="w-full bg-[var(--bg-canvas)] border rounded-xl p-2.5 pr-10 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-purple-500 resize-none transition-colors"
            style={{ borderColor: 'var(--border-subtle)' }}
          />

          <button
            type="button"
            onClick={() => handleSendPrompt()}
            disabled={isLoading || !prompt.trim()}
            className="absolute right-2 bottom-3 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] px-1 font-mono">
          <span>Press Enter to propose patch</span>
          <span>Diff preview before applying</span>
        </div>
      </div>
    </div>
  );
};
