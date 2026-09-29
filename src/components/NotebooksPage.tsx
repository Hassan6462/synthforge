import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  RotateCw,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  BookOpen,
  Code,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  Database,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import { NotebookCell, NotebookDocument } from '../types';
import { DEFAULT_NOTEBOOK_TEMPLATES } from '../data/defaultNotebooks';
import { useToast } from '../context/ToastContext';
import { downloadFile } from '../utils/export';

interface NotebooksPageProps {
  realRecords: Record<string, any>[];
  synthRecords: Record<string, any>[];
  datasetName?: string;
}

export const NotebooksPage: React.FC<NotebooksPageProps> = ({
  realRecords,
  synthRecords,
  datasetName = 'Benchmark Real',
}) => {
  const toast = useToast();

  // Pyodide runtime state
  const [pyodideInstance, setPyodideInstance] = useState<any>(null);
  const [pyodideStatus, setPyodideStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing Python WebAssembly environment...');

  // Active notebook document
  const [notebooks, setNotebooks] = useState<NotebookDocument[]>(() => {
    try {
      const saved = localStorage.getItem('synthforge_saved_notebooks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTEBOOK_TEMPLATES;
  });

  const [activeNotebookId, setActiveNotebookId] = useState<string>(DEFAULT_NOTEBOOK_TEMPLATES[0].id);
  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId) || notebooks[0];

  const [isExecutingAll, setIsExecutingAll] = useState<boolean>(false);

  // Initialize Pyodide with Pandas & NumPy
  useEffect(() => {
    let isCancelled = false;

    async function initPyodide() {
      if ((window as any).__synthforge_pyodide__) {
        setPyodideInstance((window as any).__synthforge_pyodide__);
        setPyodideStatus('ready');
        return;
      }

      setPyodideStatus('loading');
      setLoadingMessage('Fetching Pyodide v0.26.4 runtime...');

      try {
        if (!(window as any).loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide from CDN'));
            document.head.appendChild(script);
          });
        }

        if (isCancelled) return;
        setLoadingMessage('Bootstrapping Python WebAssembly engine...');

        const pyodide = await (window as any).loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
        });

        if (isCancelled) return;
        setLoadingMessage('Preloading NumPy and Pandas packages...');
        await pyodide.loadPackage(['numpy', 'pandas']);

        try {
          setLoadingMessage('Loading Matplotlib graphics library...');
          await pyodide.loadPackage('matplotlib');
        } catch {
          console.warn('Optional matplotlib package load skipped or deferred');
        }

        if (isCancelled) return;
        (window as any).__synthforge_pyodide__ = pyodide;
        setPyodideInstance(pyodide);
        setPyodideStatus('ready');
        toast.success('Python Ready', 'Pyodide loaded with pandas & numpy.');
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Pyodide initialization failed:', err);
          setPyodideStatus('error');
          toast.error('Python Initialization Failed', err?.message || 'Could not load Pyodide runtime.');
        }
      }
    }

    initPyodide();

    return () => {
      isCancelled = true;
    };
  }, [toast]);

  // Persist notebooks
  const saveNotebooksToStorage = (updated: NotebookDocument[]) => {
    setNotebooks(updated);
    try {
      localStorage.setItem('synthforge_saved_notebooks', JSON.stringify(updated));
    } catch {}
  };

  const updateActiveNotebook = (updater: (prev: NotebookDocument) => NotebookDocument) => {
    const updatedList = notebooks.map((nb) => (nb.id === activeNotebookId ? updater(nb) : nb));
    saveNotebooksToStorage(updatedList);
  };

  // Provide real_df and synth_df to Pyodide
  const injectDataFrames = useCallback(
    async (pyodide: any) => {
      // Use fallback benchmark records if real dataset is empty
      const effectiveReal = realRecords.length > 0 ? realRecords : [
        { age: 34, income: 65000, credit_score: 710, churn: 'No', transactions: 14 },
        { age: 45, income: 82000, credit_score: 740, churn: 'No', transactions: 22 },
        { age: 29, income: 48000, credit_score: 650, churn: 'Yes', transactions: 8 },
        { age: 52, income: 115000, credit_score: 800, churn: 'No', transactions: 35 },
        { age: 38, income: 72000, credit_score: 690, churn: 'No', transactions: 19 },
      ];

      const effectiveSynth = synthRecords.length > 0 ? synthRecords : [
        { age: 33, income: 64200, credit_score: 705, churn: 'No', transactions: 15 },
        { age: 46, income: 84100, credit_score: 735, churn: 'No', transactions: 21 },
        { age: 28, income: 47500, credit_score: 645, churn: 'Yes', transactions: 9 },
        { age: 51, income: 112000, credit_score: 795, churn: 'No', transactions: 33 },
        { age: 39, income: 71500, credit_score: 695, churn: 'No', transactions: 18 },
      ];

      const realJson = JSON.stringify(effectiveReal);
      const synthJson = JSON.stringify(effectiveSynth);

      const pythonSetup = `
import json, sys, io
import numpy as np
import pandas as pd

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
except Exception:
    pass

real_df = pd.DataFrame(json.loads('''${realJson}'''))
synth_df = pd.DataFrame(json.loads('''${synthJson}'''))
`;
      await pyodide.runPythonAsync(pythonSetup);
    },
    [realRecords, synthRecords]
  );

  // Execute a single code cell
  const handleRunCell = async (cellId: string) => {
    if (!pyodideInstance || pyodideStatus !== 'ready') {
      toast.warning('Python Engine Loading', 'Please wait for Pyodide to finish initializing.');
      return;
    }

    const cell = activeNotebook.cells.find((c) => c.id === cellId);
    if (!cell || cell.type !== 'code') return;

    // Mark running
    updateActiveNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((c) => (c.id === cellId ? { ...c, isRunning: true } : c)),
    }));

    try {
      // Injects latest real_df and synth_df
      await injectDataFrames(pyodideInstance);

      // Setup stdout and stderr capture
      const runScript = `
import sys, io
_old_stdout = sys.stdout
_old_stderr = sys.stderr
sys.stdout = _captured_out = io.StringIO()
sys.stderr = _captured_err = io.StringIO()

_cell_result = None
try:
    _cell_result = eval("""${cell.content.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}""")
except Exception:
    exec("""${cell.content.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}""")

sys.stdout = _old_stdout
sys.stderr = _old_stderr

_std_text = _captured_out.getvalue()
_err_text = _captured_err.getvalue()
`;

      let outputContent = '';
      let outputType: 'text' | 'html' | 'image' | 'error' = 'text';

      try {
        const result = await pyodideInstance.runPythonAsync(runScript);
        const stdout = pyodideInstance.globals.get('_std_text') || '';
        const stderr = pyodideInstance.globals.get('_err_text') || '';
        const evalRes = pyodideInstance.globals.get('_cell_result');

        let textOutput = '';
        if (stdout) textOutput += stdout;
        if (stderr) textOutput += `\n${stderr}`;

        // Check if eval result is a Pandas DataFrame or Series
        if (evalRes && typeof evalRes === 'object') {
          if (typeof evalRes.to_html === 'function') {
            outputContent = evalRes.to_html({ classes: 'pyodide-df-table', border: 0 });
            outputType = 'html';
          } else {
            textOutput += (textOutput ? '\n' : '') + String(evalRes);
            outputContent = textOutput;
            outputType = 'text';
          }
        } else if (evalRes !== undefined && evalRes !== null) {
          textOutput += (textOutput ? '\n' : '') + String(evalRes);
          outputContent = textOutput;
          outputType = 'text';
        } else {
          outputContent = textOutput || 'Cell executed with no output.';
          outputType = 'text';
        }

        // Check for Matplotlib canvas export
        try {
          const hasPlot = await pyodideInstance.runPythonAsync(`
import io, base64
_plot_b64 = ""
try:
    if len(plt.get_fignums()) > 0:
        _buf = io.BytesIO()
        plt.savefig(_buf, format='png', bbox_inches='tight')
        plt.close('all')
        _buf.seek(0)
        _plot_b64 = base64.b64encode(_buf.read()).decode('utf-8')
except Exception:
    pass
_plot_b64
`);
          if (hasPlot && typeof hasPlot === 'string' && hasPlot.length > 50) {
            outputContent = `data:image/png;base64,${hasPlot}`;
            outputType = 'image';
          }
        } catch {}
      } catch (err: any) {
        outputContent = err?.message || String(err);
        outputType = 'error';
      }

      updateActiveNotebook((prev) => ({
        ...prev,
        cells: prev.cells.map((c) =>
          c.id === cellId
            ? {
                ...c,
                isRunning: false,
                executionCount: (c.executionCount || 0) + 1,
                output: { type: outputType, content: outputContent },
              }
            : c
        ),
      }));
    } catch (outerErr: any) {
      updateActiveNotebook((prev) => ({
        ...prev,
        cells: prev.cells.map((c) =>
          c.id === cellId
            ? {
                ...c,
                isRunning: false,
                output: { type: 'error', content: outerErr?.message || String(outerErr) },
              }
            : c
        ),
      }));
    }
  };

  // Run all cells sequentially
  const handleRunAll = async () => {
    setIsExecutingAll(true);
    for (const cell of activeNotebook.cells) {
      if (cell.type === 'code') {
        await handleRunCell(cell.id);
      }
    }
    setIsExecutingAll(false);
    toast.success('Run All Finished', 'All notebook cells completed execution.');
  };

  // Cell management
  const handleAddCell = (type: 'code' | 'markdown', targetIndex?: number) => {
    const newCell: NotebookCell = {
      id: `cell_${Date.now()}`,
      type,
      content: type === 'code' ? '# Write Python code here\n' : '### Markdown Section\nEnter text here...',
    };

    updateActiveNotebook((prev) => {
      const copy = [...prev.cells];
      if (targetIndex !== undefined) {
        copy.splice(targetIndex + 1, 0, newCell);
      } else {
        copy.push(newCell);
      }
      return { ...prev, cells: copy };
    });
  };

  const handleDeleteCell = (cellId: string) => {
    if (activeNotebook.cells.length <= 1) {
      toast.warning('Cannot Delete', 'Notebook must retain at least one cell.');
      return;
    }
    updateActiveNotebook((prev) => ({
      ...prev,
      cells: prev.cells.filter((c) => c.id !== cellId),
    }));
  };

  const handleMoveCell = (cellId: string, direction: 'up' | 'down') => {
    updateActiveNotebook((prev) => {
      const idx = prev.cells.findIndex((c) => c.id === cellId);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.cells.length - 1) return prev;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const copy = [...prev.cells];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return { ...prev, cells: copy };
    });
  };

  const handleUpdateCellContent = (cellId: string, content: string) => {
    updateActiveNotebook((prev) => ({
      ...prev,
      cells: prev.cells.map((c) => (c.id === cellId ? { ...c, content } : c)),
    }));
  };

  // Export / Import Notebook
  const handleExportNotebook = () => {
    const json = JSON.stringify(activeNotebook, null, 2);
    downloadFile(json, `${activeNotebook.title.toLowerCase().replace(/\s+/g, '_')}.json`, 'application/json');
    toast.success('Notebook Exported', `Saved ${activeNotebook.title}`);
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row overflow-hidden bg-[var(--bg-canvas)]">
      {/* Left Sidebar: Templates & Navigation */}
      <div
        className="w-full xl:w-80 border-b xl:border-b-0 xl:border-r p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Python Notebooks</span>
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                pyodideStatus === 'ready'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : pyodideStatus === 'loading'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-red-500/15 text-red-400 border-red-500/30'
              }`}
            >
              {pyodideStatus === 'ready'
                ? 'Pyodide Ready'
                : pyodideStatus === 'loading'
                ? 'Loading WASM...'
                : 'Offline'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Run real Python in-browser via WebAssembly with preloaded <code className="text-emerald-400">pandas</code> and{' '}
            <code className="text-emerald-400">numpy</code>.
          </p>
        </div>

        {/* Status Banner */}
        {pyodideStatus === 'loading' && (
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs flex items-center gap-2.5 text-amber-300">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{loadingMessage}</span>
          </div>
        )}

        {/* DataFrames Injected Status */}
        <div className="p-3 rounded-xl border bg-[var(--bg-surface-elevated)]" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 mb-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Injected Python Globals</span>
          </span>
          <div className="flex flex-col gap-1.5 text-xs font-mono">
            <div className="flex justify-between items-center p-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <span className="text-emerald-400 font-bold">real_df</span>
              <span className="text-[var(--text-muted)] text-[11px]">
                {realRecords.length > 0 ? `${realRecords.length} rows` : '5 benchmark rows'}
              </span>
            </div>
            <div className="flex justify-between items-center p-1.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <span className="text-sky-400 font-bold">synth_df</span>
              <span className="text-[var(--text-muted)] text-[11px]">
                {synthRecords.length > 0 ? `${synthRecords.length} rows` : '5 benchmark rows'}
              </span>
            </div>
          </div>
        </div>

        {/* Templates Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Template Notebooks</span>
          </label>
          <div className="flex flex-col gap-1.5">
            {DEFAULT_NOTEBOOK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  setActiveNotebookId(tpl.id);
                  toast.info('Loaded Notebook', tpl.title);
                }}
                className={`p-2.5 rounded-lg text-xs text-left border transition-all cursor-pointer ${
                  activeNotebookId === tpl.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold shadow-2xs'
                    : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <div className="font-semibold text-[var(--text-primary)]">{tpl.title}</div>
                <div className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5">{tpl.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-2 border-t mt-auto" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={handleExportNotebook}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .json</span>
          </button>
        </div>
      </div>

      {/* Main Notebook Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={activeNotebook.title}
              onChange={(e) => updateActiveNotebook((prev) => ({ ...prev, title: e.target.value }))}
              className="text-sm font-bold text-[var(--text-primary)] bg-transparent border-b border-transparent hover:border-[var(--border-subtle)] focus:border-emerald-500 focus:outline-hidden px-1 py-0.5"
            />
            <span className="text-xs text-[var(--text-muted)] font-mono">
              ({activeNotebook.cells.length} cells)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddCell('code')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Code</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddCell('markdown')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:border-purple-500 hover:text-purple-400 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>+ Text</span>
            </button>

            <button
              type="button"
              onClick={handleRunAll}
              disabled={pyodideStatus !== 'ready' || isExecutingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecutingAll ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Run All</span>
            </button>
          </div>
        </div>

        {/* Notebook Cells Container */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
          {activeNotebook.cells.map((cell, idx) => (
            <div
              key={cell.id}
              className="rounded-xl border bg-[var(--bg-surface)] overflow-hidden shadow-2xs transition-all"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {/* Cell Header */}
              <div
                className="flex items-center justify-between px-3 py-1.5 border-b bg-[var(--bg-surface-elevated)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                  {cell.type === 'code' ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Code className="w-3.5 h-3.5" />
                      <span>[{cell.executionCount || ' '}]</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-purple-400 font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Markdown</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {cell.type === 'code' && (
                    <button
                      type="button"
                      onClick={() => handleRunCell(cell.id)}
                      disabled={pyodideStatus !== 'ready' || cell.isRunning}
                      className="p-1 rounded text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer disabled:opacity-40"
                      title="Run cell (Shift+Enter)"
                    >
                      {cell.isRunning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleMoveCell(cell.id, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveCell(cell.id, 'down')}
                    disabled={idx === activeNotebook.cells.length - 1}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCell(cell.id)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-red-400 cursor-pointer"
                    title="Delete cell"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cell Input Code / Markdown */}
              <div className="p-3">
                <textarea
                  value={cell.content}
                  onChange={(e) => handleUpdateCellContent(cell.id, e.target.value)}
                  rows={Math.max(2, Math.min(18, cell.content.split('\n').length))}
                  className={`w-full bg-[var(--bg-canvas)] border rounded-lg p-2.5 text-xs font-mono text-[var(--text-primary)] focus:outline-hidden focus:border-emerald-500 resize-y transition-colors ${
                    cell.type === 'markdown' ? 'border-purple-500/30' : 'border-emerald-500/30'
                  }`}
                  placeholder={cell.type === 'code' ? 'import numpy as np...' : 'Markdown content...'}
                />
              </div>

              {/* Cell Output Display */}
              {cell.output && (
                <div
                  className="px-4 py-3 border-t bg-[var(--bg-canvas)] text-xs font-mono overflow-x-auto"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  {cell.output.type === 'image' ? (
                    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg">
                      <img src={cell.output.content} alt="Python Plot" className="max-w-full h-auto rounded" />
                    </div>
                  ) : cell.output.type === 'html' ? (
                    <div
                      className="pyodide-rendered-table overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: cell.output.content }}
                    />
                  ) : cell.output.type === 'error' ? (
                    <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 whitespace-pre-wrap flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cell.output.content}</span>
                    </div>
                  ) : (
                    <pre className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                      {cell.output.content}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Quick Insert Footer */}
          <div className="flex items-center justify-center gap-2 py-4">
            <button
              type="button"
              onClick={() => handleAddCell('code')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed text-xs text-[var(--text-muted)] hover:text-emerald-400 hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Code Cell</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddCell('markdown')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed text-xs text-[var(--text-muted)] hover:text-purple-400 hover:border-purple-500 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Markdown Cell</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
