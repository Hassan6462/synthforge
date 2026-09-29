import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Terminal,
  Play,
  FileCode,
  Sliders,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';
import { ColumnDefinition, GenerationSettings } from '../types';
import { useToast } from '../context/ToastContext';

interface ApiPageProps {
  columns: ColumnDefinition[];
  settings: GenerationSettings;
}

export const ApiPage: React.FC<ApiPageProps> = ({ columns, settings }) => {
  const toast = useToast();
  const [activeSnippetTab, setActiveSnippetTab] = useState<'curl' | 'python' | 'javascript'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [rowCount, setRowCount] = useState<number>(settings.rowCount);
  const [format, setFormat] = useState<string>(settings.exportFormat);
  const [simulatedResponse, setSimulatedResponse] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Simplified schema payload for API call
  const schemaPayload = columns.map((c) => ({
    name: c.name,
    type: c.type,
    nullPercentage: c.nullPercentage,
    ...(c.min !== undefined ? { min: c.min } : {}),
    ...(c.max !== undefined ? { max: c.max } : {}),
    ...(c.privacy && c.privacy !== 'none' ? { privacy: c.privacy } : {}),
  }));

  const jsonSchemaString = JSON.stringify(
    {
      rowCount,
      format,
      seed: settings.seed,
      columns: schemaPayload,
    },
    null,
    2
  );

  // Generate snippets
  const curlSnippet = `curl -X POST https://synthforge.dev/api/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sf_live_test_key" \\
  -d '${JSON.stringify({ rowCount, format, seed: settings.seed, columns: schemaPayload })}'`;

  const pythonSnippet = `import requests

url = "https://synthforge.dev/api/v1/generate"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer sf_live_test_key"
}
payload = {
    "rowCount": ${rowCount},
    "format": "${format}",
    "seed": ${settings.seed},
    "columns": ${JSON.stringify(schemaPayload, null, 4)}
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print(f"Generated {len(data['records'])} rows")`;

  const javascriptSnippet = `// Node.js (v18+) or Browser fetch
const response = await fetch("https://synthforge.dev/api/v1/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer sf_live_test_key",
  },
  body: JSON.stringify({
    rowCount: ${rowCount},
    format: "${format}",
    seed: ${settings.seed},
    columns: ${JSON.stringify(schemaPayload, null, 4)},
  }),
});

const result = await response.json();
console.log("Synthetic dataset ready:", result);`;

  const currentSnippet =
    activeSnippetTab === 'curl'
      ? curlSnippet
      : activeSnippetTab === 'python'
      ? pythonSnippet
      : javascriptSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopiedSnippet(true);
    toast.success('Snippet Copied', `Copied ${activeSnippetTab.toUpperCase()} code to clipboard.`);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      const mockResult = {
        status: 200,
        generationTimeMs: 18,
        rowCount,
        format,
        records: [
          columns.reduce((acc, c) => ({ ...acc, [c.name]: c.type === 'integer' ? 42 : c.type === 'email' ? 'test@example.com' : 'synthetic_val' }), {}),
          columns.reduce((acc, c) => ({ ...acc, [c.name]: c.type === 'integer' ? 108 : c.type === 'email' ? 'user2@demo.org' : 'synthetic_val' }), {}),
        ],
      };
      setSimulatedResponse(JSON.stringify(mockResult, null, 2));
      toast.success('Simulation Succeeded', 'HTTP 200 OK simulated.');
    }, 400);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[var(--bg-canvas)]">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                REST API & SDK Code Snippets
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Programmatic integration snippets reflecting your live schema configurations and privacy transformations.
            </p>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border bg-[var(--bg-surface)] flex flex-col gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs font-semibold text-[var(--text-primary)]">API Endpoint</span>
            <span className="text-xs font-mono text-emerald-400 bg-[var(--bg-surface-elevated)] p-2 rounded-lg border border-[var(--border-subtle)] truncate">
              POST /api/v1/generate
            </span>
          </div>

          <div className="p-4 rounded-xl border bg-[var(--bg-surface)] flex flex-col gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[var(--text-primary)]">Row Count</span>
              <span className="font-mono text-sky-400 font-bold">{rowCount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10"
              max="5000"
              step="50"
              value={rowCount}
              onChange={(e) => setRowCount(parseInt(e.target.value, 10))}
              className="accent-sky-500 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl border bg-[var(--bg-surface)] flex flex-col gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs font-semibold text-[var(--text-primary)]">Response Format</span>
            <div className="grid grid-cols-3 gap-1">
              {['csv', 'json', 'sql'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`py-1 rounded text-xs font-bold uppercase transition-all cursor-pointer ${
                    format === fmt
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Code Snippets Viewer */}
        <div
          className="rounded-2xl border bg-[var(--bg-surface)] overflow-hidden shadow-xs flex flex-col"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Snippet Header Tabs */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b bg-[var(--bg-surface-elevated)]"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveSnippetTab('curl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSnippetTab === 'curl'
                    ? 'bg-sky-500 text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                cURL
              </button>
              <button
                type="button"
                onClick={() => setActiveSnippetTab('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSnippetTab === 'python'
                    ? 'bg-emerald-500 text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Python (requests)
              </button>
              <button
                type="button"
                onClick={() => setActiveSnippetTab('javascript')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSnippetTab === 'javascript'
                    ? 'bg-purple-500 text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                JavaScript (fetch)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-sky-500 hover:text-sky-400 transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 text-sky-400" />
                <span>Test Request</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-colors cursor-pointer"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Snippet Code View */}
          <div className="p-4 bg-[var(--bg-canvas)] overflow-x-auto">
            <pre className="text-xs font-mono text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {currentSnippet}
            </pre>
          </div>

          {/* Simulated API Output View */}
          {simulatedResponse && (
            <div className="p-4 border-t bg-[var(--bg-surface-elevated)] flex flex-col gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Simulated API Response (HTTP 200 OK)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSimulatedResponse(null)}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Dismiss
                </button>
              </div>
              <pre className="text-[11px] font-mono p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] max-h-48 overflow-y-auto">
                {simulatedResponse}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
