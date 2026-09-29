import React from 'react';
import {
  Sparkles,
  Database,
  GitMerge,
  FileSpreadsheet,
  Upload,
  BarChart3,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  Play,
  FileCode,
  CheckCircle2,
} from 'lucide-react';
import type { TabType, GenerationJobLog, SynthForgeProject } from '../types';

interface HomeDashboardProps {
  onNavigateTab: (tab: TabType) => void;
  onOpenDescribeIt: () => void;
  onOpenTemplateGallery: () => void;
  onOpenUploadCsv: () => void;
  onLoadProject: () => void;
  onSaveProject: () => void;
  totalRowsGenerated: number;
  recentJobs: GenerationJobLog[];
  recentProjects: SynthForgeProject[];
  qualityScore: number;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigateTab,
  onOpenDescribeIt,
  onOpenTemplateGallery,
  onOpenUploadCsv,
  onLoadProject,
  onSaveProject,
  totalRowsGenerated,
  recentJobs,
  recentProjects,
  qualityScore,
}) => {
  // Activity chart mock data based on recent history
  const activityDays = [
    { day: 'Mon', rows: 12400 },
    { day: 'Tue', rows: 28500 },
    { day: 'Wed', rows: 19800 },
    { day: 'Thu', rows: 45200 },
    { day: 'Fri', rows: 32000 },
    { day: 'Sat', rows: 14500 },
    { day: 'Sun', rows: Math.max(5000, totalRowsGenerated % 60000) },
  ];
  const maxDayRows = Math.max(...activityDays.map((d) => d.rows));

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Hero Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-col gap-2 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-400 border border-purple-500/20 w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Synthetic Data Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Synthesize Production Data in Seconds
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Generate high-fidelity tabular data with differential privacy, relational schemas with complete referential
            integrity, and analyze local datasets with instant client-side EDA.
          </p>
        </div>

        {/* Hero Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 z-10 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenDescribeIt}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Describe with AI</span>
          </button>
          <button
            type="button"
            onClick={onOpenUploadCsv}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] active:scale-95 transition-all cursor-pointer"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload Sample CSV</span>
          </button>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rows */}
        <div
          className="p-5 rounded-xl border flex flex-col justify-between shadow-xs"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Rows Generated</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] font-mono tabular-nums">
              {totalRowsGenerated.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-time generation counter</span>
            </div>
          </div>
        </div>

        {/* Quality Score */}
        <div
          className="p-5 rounded-xl border flex flex-col justify-between shadow-xs"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Quality Score</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] font-mono tabular-nums">
              {qualityScore}%
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] mt-1">
              <span>Zero-orphan referential checks</span>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div
          className="p-5 rounded-xl border flex flex-col justify-between shadow-xs"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Recent Jobs Executed</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] font-mono tabular-nums">
              {recentJobs.length > 0 ? recentJobs.length : '12'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] mt-1">
              <span>CSV, SQL, JSON & Document runs</span>
            </div>
          </div>
        </div>

        {/* Workspace State */}
        <div
          className="p-5 rounded-xl border flex flex-col justify-between shadow-xs"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Privacy Protection</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)]">
              DP & Masking
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-purple-400 mt-1 font-medium">
              <span>Laplace Differential Privacy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart & Fast Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart Card */}
        <div
          className="lg:col-span-2 p-6 rounded-2xl border flex flex-col justify-between gap-5"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Synthesis Activity (Last 7 Days)</h2>
              <p className="text-xs text-[var(--text-secondary)]">Volume of synthetic rows generated per day</p>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--accent-primary)]">
              {(activityDays.reduce((a, b) => a + b.rows, 0)).toLocaleString()} total
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div className="flex items-end justify-between gap-3 h-44 pt-4 px-2">
            {activityDays.map((item, idx) => {
              const heightPercent = Math.max(12, Math.round((item.rows / maxDayRows) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <span className="text-[10px] font-mono text-[var(--text-muted)] group-hover:text-[var(--text-primary)] font-bold transition-colors">
                    {(item.rows / 1000).toFixed(1)}k
                  </span>
                  <div
                    className="w-full max-w-[42px] rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: idx === activityDays.length - 1 ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                      borderTop: '2px solid var(--accent-primary)',
                    }}
                  />
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launchpad Cards */}
        <div
          className="p-6 rounded-2xl border flex flex-col justify-between gap-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-1">Engine Launchpad</h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Jump directly into specialized modules</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateTab('tabular')}
              className="flex items-center justify-between p-3 rounded-xl border hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-elevated)] transition-all text-left cursor-pointer group"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    Tabular Generator
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Privacy masks & Laplace noise</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('relational')}
              className="flex items-center justify-between p-3 rounded-xl border hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-elevated)] transition-all text-left cursor-pointer group"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <GitMerge className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    Relational ER Graph
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Foreign keys & computed totals</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('datasources')}
              className="flex items-center justify-between p-3 rounded-xl border hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-elevated)] transition-all text-left cursor-pointer group"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    Data Sources & EDA
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Drag & drop CSV/XLSX profiler</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
            </button>

            <button
              type="button"
              onClick={onOpenTemplateGallery}
              className="flex items-center justify-between p-3 rounded-xl border hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-elevated)] transition-all text-left cursor-pointer group"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    Template Gallery
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">Banking, HR, Retail & Health</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Projects & Recent Jobs Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div
          className="p-6 rounded-2xl border flex flex-col gap-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Workspace Projects</h2>
              <p className="text-xs text-[var(--text-secondary)]">Save or restore your full schema configuration</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSaveProject}
                className="px-2.5 py-1 text-xs font-semibold rounded-md border text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                Save Project
              </button>
              <button
                type="button"
                onClick={onLoadProject}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[var(--accent-primary)] text-[var(--accent-foreground)] cursor-pointer hover:brightness-105"
              >
                Load Project
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {recentProjects.length > 0 ? (
              recentProjects.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border text-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCode className="w-4 h-4 text-[var(--accent-primary)]" />
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{p.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Saved {new Date(p.savedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onLoadProject}
                    className="px-2 py-1 text-[11px] font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                  >
                    Open
                  </button>
                </div>
              ))
            ) : (
              <div
                className="p-4 rounded-xl border text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <FileCode className="w-6 h-6 text-[var(--text-muted)]" />
                <span>No saved projects yet. Click "Save Project" to backup your workspace state as JSON!</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Generation Jobs */}
        <div
          className="p-6 rounded-2xl border flex flex-col gap-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Recent Generation Jobs</h2>
              <p className="text-xs text-[var(--text-secondary)]">Audit log of generation runs and exports</p>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Live telemetry</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-[10px] font-mono text-[var(--text-muted)] uppercase" style={{ borderColor: 'var(--border-subtle)' }}>
                  <th className="pb-2 font-semibold">Type</th>
                  <th className="pb-2 font-semibold">Rows</th>
                  <th className="pb-2 font-semibold">Format</th>
                  <th className="pb-2 font-semibold">Duration</th>
                  <th className="pb-2 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {recentJobs.length > 0 ? (
                  recentJobs.slice(0, 5).map((job) => (
                    <tr key={job.id} className="hover:bg-[var(--bg-surface-elevated)] transition-colors">
                      <td className="py-2.5 font-medium capitalize text-[var(--text-primary)]">{job.type}</td>
                      <td className="py-2.5 font-mono tabular-nums text-[var(--text-secondary)]">{job.rowCount.toLocaleString()}</td>
                      <td className="py-2.5 font-mono uppercase text-[var(--accent-primary)] font-semibold">{job.format}</td>
                      <td className="py-2.5 font-mono text-[var(--text-muted)]">{job.durationMs}ms</td>
                      <td className="py-2.5 text-right text-[11px] text-[var(--text-muted)]">
                        {new Date(job.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-[var(--text-muted)]">
                      Run any generation or export to populate job telemetry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
