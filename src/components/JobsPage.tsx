import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  GitCompare,
  Trash2,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  Sliders,
  FileCode,
  FileSpreadsheet,
  Search,
  X,
} from 'lucide-react';
import { GenerationJobLog } from '../types';
import { useToast } from '../context/ToastContext';

interface JobsPageProps {
  jobs: GenerationJobLog[];
  onRerunJob: (job: GenerationJobLog) => void;
  onClearJobs: () => void;
}

export const JobsPage: React.FC<JobsPageProps> = ({ jobs, onRerunJob, onClearJobs }) => {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  const filteredJobs = jobs.filter((j) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      j.type.toLowerCase().includes(term) ||
      j.format.toLowerCase().includes(term) ||
      String(j.seed).includes(term) ||
      String(j.rowCount).includes(term)
    );
  });

  const handleToggleSelect = (id: string) => {
    setSelectedJobIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const job1 = jobs.find((j) => j.id === selectedJobIds[0]);
  const job2 = jobs.find((j) => j.id === selectedJobIds[1]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[var(--bg-canvas)]">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header Bar */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-sky-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                Generation Jobs & Execution History
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Audit log of synthetic generation runs, export tasks, execution latency, and reproducible seeds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedJobIds.length === 2 && (
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-all cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare Selected Runs</span>
              </button>
            )}

            {jobs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClearJobs();
                  setSelectedJobIds([]);
                  toast.info('History Cleared', 'All job logs removed.');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-[var(--text-muted)] hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Selection Guide */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by format, seed, type..."
              className="w-full bg-[var(--bg-surface)] border rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-sky-500"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          <span className="text-xs text-[var(--text-muted)]">
            Select 2 runs to activate side-by-side comparison ({selectedJobIds.length}/2 selected)
          </span>
        </div>

        {/* Jobs Table */}
        <div
          className="rounded-2xl border bg-[var(--bg-surface)] overflow-hidden shadow-xs"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <Clock className="w-10 h-10 text-[var(--text-muted)] opacity-40" />
              <div className="text-sm font-semibold text-[var(--text-primary)]">No Generation Jobs Recorded</div>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                Generated datasets and chunked export jobs will automatically appear here with execution metrics.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead
                  className="text-[var(--text-muted)] border-b bg-[var(--bg-surface-elevated)] font-medium"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <tr>
                    <th className="py-3 px-4 w-10">Select</th>
                    <th className="py-3 px-4">Status & Type</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Rows</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Throughput</th>
                    <th className="py-3 px-4">Seed</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                  {filteredJobs.map((job) => {
                    const isSelected = selectedJobIds.includes(job.id);
                    const throughput = Math.round((job.rowCount / Math.max(1, job.durationMs)) * 1000);
                    return (
                      <tr
                        key={job.id}
                        className={`hover:bg-[var(--bg-surface-elevated)] transition-colors ${
                          isSelected ? 'bg-sky-500/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(job.id)}
                            className="rounded accent-sky-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="capitalize text-[var(--text-primary)]">{job.type}</span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {new Date(job.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-primary)] font-bold">
                          {job.rowCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">{job.durationMs}ms</td>
                        <td className="py-3 px-4 text-sky-400 font-bold">{throughput.toLocaleString()} r/s</td>
                        <td className="py-3 px-4 text-[var(--text-muted)] font-mono">#{job.seed}</td>
                        <td className="py-3 px-4 uppercase text-[var(--text-secondary)]">{job.format}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              onRerunJob(job);
                              toast.info('Re-running Job', `Re-executing with seed #${job.seed}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border text-sky-400 border-sky-500/30 hover:bg-sky-500/10 transition-colors cursor-pointer font-sans"
                            title="Restore parameters and re-run"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Re-run</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Compare Modal */}
        {isCompareModalOpen && job1 && job2 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div
              className="w-full max-w-2xl bg-[var(--bg-surface)] border rounded-2xl p-6 shadow-2xl flex flex-col gap-5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Compare Generation Runs</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                {/* Run A */}
                <div className="p-4 rounded-xl border bg-[var(--bg-surface-elevated)] flex flex-col gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="font-sans font-bold text-sky-400 uppercase tracking-wider text-[11px]">Run A (First)</span>
                  <div className="flex justify-between border-b pb-1 border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Type:</span>
                    <span className="font-semibold text-[var(--text-primary)] capitalize">{job1.type}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Row Count:</span>
                    <span className="font-bold text-[var(--text-primary)]">{job1.rowCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Duration:</span>
                    <span className="text-[var(--text-primary)]">{job1.durationMs}ms</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Throughput:</span>
                    <span className="text-emerald-400 font-bold">
                      {Math.round((job1.rowCount / Math.max(1, job1.durationMs)) * 1000).toLocaleString()} rows/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Seed:</span>
                    <span className="text-[var(--text-primary)]">#{job1.seed}</span>
                  </div>
                </div>

                {/* Run B */}
                <div className="p-4 rounded-xl border bg-[var(--bg-surface-elevated)] flex flex-col gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="font-sans font-bold text-purple-400 uppercase tracking-wider text-[11px]">Run B (Second)</span>
                  <div className="flex justify-between border-b pb-1 border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Type:</span>
                    <span className="font-semibold text-[var(--text-primary)] capitalize">{job2.type}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Row Count:</span>
                    <span className="font-bold text-[var(--text-primary)]">{job2.rowCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Duration:</span>
                    <span className="text-[var(--text-primary)]">{job2.durationMs}ms</span>
                  </div>
                  <div className="flex justify-between border-b pb-1 border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Throughput:</span>
                    <span className="text-emerald-400 font-bold">
                      {Math.round((job2.rowCount / Math.max(1, job2.durationMs)) * 1000).toLocaleString()} rows/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Seed:</span>
                    <span className="text-[var(--text-primary)]">#{job2.seed}</span>
                  </div>
                </div>
              </div>

              {/* Delta Summary */}
              <div className="p-3.5 rounded-xl border bg-[var(--bg-canvas)] text-xs flex justify-around text-center" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px]">Row Count Delta</span>
                  <span className="font-mono font-bold text-sky-400">
                    {job2.rowCount >= job1.rowCount ? `+${job2.rowCount - job1.rowCount}` : `${job2.rowCount - job1.rowCount}`}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px]">Latency Delta</span>
                  <span className="font-mono font-bold text-amber-400">
                    {job2.durationMs - job1.durationMs > 0 ? `+${job2.durationMs - job1.durationMs}ms` : `${job2.durationMs - job1.durationMs}ms`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
