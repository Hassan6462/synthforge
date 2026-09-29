import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Download,
  Copy,
  Check,
  Database,
  Key,
  Layers,
  Receipt,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { ValidationReport } from '../utils/dataValidator';

interface ValidationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ValidationReport;
  onRerun: () => void;
  activeTab: string;
}

export const ValidationReportModal: React.FC<ValidationReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onRerun,
  activeTab,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'foreign_keys' | 'uniqueness' | 'nulls' | 'invoices'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `synthforge_validation_report_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // SVG Circular Gauge parameters
  const score = report.qualityScore;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 95) return '#10b981'; // emerald
    if (s >= 85) return '#0ea5e9'; // sky
    if (s >= 70) return '#f59e0b'; // amber
    return '#f43f5e'; // rose
  };

  const scoreColor = getScoreColor(score);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-sm transition-all"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="validation-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all my-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Modal Top Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                color: '#10b981',
              }}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="validation-modal-title" className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                Data Quality & Invariant Validation Report
              </h2>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                <span className="capitalize">Active Mode: {activeTab}</span>
                <span aria-hidden="true">·</span>
                <span>Evaluated {new Date(report.timestamp).toLocaleTimeString()}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-emerald-400 font-medium">4 Comprehensive Suites</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRerun}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
              title="Re-run validation on live dataset"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Re-Validate</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              className="p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
              title="Copy JSON validation report to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleDownloadReport}
              className="p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
              title="Download validation audit report"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer ml-1"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Hero Section: Quality Score Out of 100 with Radial Gauge Chart */}
          <div
            className="p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* Left: Circular Donut Chart */}
            <div className="flex items-center gap-5">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-[var(--border-subtle)]"
                  />
                  {/* Animated Progress Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={scoreColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Score Number in Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black font-mono tracking-tight tabular-nums" style={{ color: scoreColor }}>
                    {score}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                    out of 100
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-wide"
                    style={{
                      backgroundColor: `${scoreColor}20`,
                      color: scoreColor,
                      border: `1px solid ${scoreColor}40`,
                    }}
                  >
                    Grade {report.qualityGrade}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {report.qualityScore === 100 ? 'Verified Perfect Dataset' : 'Automated Quality Audit'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1">
                  {report.qualityVerdict}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-md">
                  Synthesized across referential integrity, column uniqueness, null invariant tolerances, and mathematical invoice balancing.
                </p>
              </div>
            </div>

            {/* Right: 4 Dimension Mini Bars */}
            <div className="w-full md:w-72 space-y-2 text-xs font-mono">
              {Object.entries(report.dimensions).map(([key, dim]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-secondary)] flex items-center gap-1.5 truncate max-w-[190px]">
                      {dim.status === 'pass' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className="truncate">{dim.name}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                      {dim.score}/{dim.maxScore}
                    </span>
                  </div>
                  {/* Mini Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(dim.score / dim.maxScore) * 100}%`,
                        backgroundColor: dim.status === 'pass' ? '#10b981' : '#f43f5e',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Navigation Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl border overflow-x-auto" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Report Checks
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('foreign_keys')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'foreign_keys'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {report.foreignKeys.status === 'pass' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Foreign Keys ({report.foreignKeys.totalOrphans} Orphans)</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('uniqueness')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'uniqueness'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {report.uniqueColumns.status === 'pass' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Unique Columns ({report.uniqueColumns.totalDuplicates} Dupes)</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('nulls')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'nulls'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {report.nullDistribution.status === 'pass' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Null % Per Column</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('invoices')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filterTab === 'invoices'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {report.invoiceReconciliation.status === 'pass' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Invoice Reconciliation ({report.invoiceReconciliation.reconciliationRate}%)</span>
            </button>
          </div>

          {/* CHECK 1: Orphan Foreign Keys (Must be 0) */}
          {(filterTab === 'all' || filterTab === 'foreign_keys') && (
            <div
              className="p-4 sm:p-5 rounded-xl border space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-2 rounded-lg border"
                    style={{
                      backgroundColor: report.foreignKeys.status === 'pass' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      borderColor: report.foreignKeys.status === 'pass' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
                    }}
                  >
                    <Database className={`w-4 h-4 ${report.foreignKeys.status === 'pass' ? 'text-emerald-400' : 'text-rose-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        1. Orphan Foreign Keys (Must be 0)
                      </h4>
                      {report.foreignKeys.status === 'pass' ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> PASSED (0 ORPHANS)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> FAILED ({report.foreignKeys.totalOrphans} ORPHANS)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {report.foreignKeys.message}
                    </p>
                  </div>
                </div>

                {/* Small Chart: Foreign Key Integrity Bar */}
                <div className="sm:text-right font-mono text-xs">
                  <span className="text-[10px] text-[var(--text-muted)] block">Parent-Child Integrity</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-24 h-2 rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${report.foreignKeys.totalOrphans === 0 ? 100 : Math.max(0, 100 - (report.foreignKeys.totalOrphans / Math.max(1, report.foreignKeys.totalReferences)) * 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-emerald-400 tabular-nums">
                      {report.foreignKeys.totalOrphans === 0 ? '100%' : 'Breached'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Relationship Breakdown Grid */}
              {report.foreignKeys.items.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Relationship Invariant Ledger:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {report.foreignKeys.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border flex items-center justify-between gap-3 text-xs font-mono"
                        style={{
                          backgroundColor: 'var(--bg-surface-subtle)',
                          borderColor: item.status === 'pass' ? 'var(--border-subtle)' : 'rgba(244, 63, 94, 0.4)',
                        }}
                      >
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                            <span className="text-[var(--accent-primary)]">{item.childTable}</span>
                            <span className="text-[var(--text-muted)]">.</span>
                            <span>{item.fkColumn}</span>
                            <span className="text-[var(--text-muted)]">→</span>
                            <span className="text-[var(--accent-primary)]">{item.parentTable}</span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
                            {item.totalReferences.toLocaleString()} references checked
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          {item.orphanCount === 0 ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>0 orphans</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-400 font-bold">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{item.orphanCount} orphans</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[var(--bg-surface-subtle)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    No child-to-parent foreign keys defined in the current active table. Switch to the <b>Relational</b> tab to inspect multi-table foreign keys.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* CHECK 2: Duplicate Values in Unique Columns */}
          {(filterTab === 'all' || filterTab === 'uniqueness') && (
            <div
              className="p-4 sm:p-5 rounded-xl border space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-2 rounded-lg border"
                    style={{
                      backgroundColor: report.uniqueColumns.status === 'pass' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      borderColor: report.uniqueColumns.status === 'pass' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
                    }}
                  >
                    <Key className={`w-4 h-4 ${report.uniqueColumns.status === 'pass' ? 'text-emerald-400' : 'text-rose-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        2. Duplicate Values in Unique Columns
                      </h4>
                      {report.uniqueColumns.status === 'pass' ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> PASSED (0 DUPLICATES)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> FAILED ({report.uniqueColumns.totalDuplicates} DUPLICATES)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {report.uniqueColumns.message}
                    </p>
                  </div>
                </div>

                {/* Small Chart: Uniqueness Sparkline / Ratio */}
                <div className="sm:text-right font-mono text-xs">
                  <span className="text-[10px] text-[var(--text-muted)] block">Distinct Value Density</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-24 h-2 rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${report.uniqueColumns.totalDuplicates === 0 ? 100 : Math.max(0, 100 - report.uniqueColumns.totalDuplicates * 5)}%` }}
                      />
                    </div>
                    <span className="font-bold text-emerald-400 tabular-nums">
                      {report.uniqueColumns.totalDuplicates === 0 ? '100.0%' : 'Collision'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Unique Columns Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Unique Columns & Primary Keys Audited:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {report.uniqueColumns.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border flex items-center justify-between gap-3 text-xs font-mono"
                      style={{
                        backgroundColor: 'var(--bg-surface-subtle)',
                        borderColor: item.status === 'pass' ? 'var(--border-subtle)' : 'rgba(244, 63, 94, 0.4)',
                      }}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                          <span className="text-[var(--text-muted)]">{item.tableName}.</span>
                          <span className="text-[var(--accent-primary)]">{item.columnName}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">
                          {item.distinctCount} distinct of {item.totalRows} rows
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        {item.duplicateCount === 0 ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>0 duplicates</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400 font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{item.duplicateCount} duplicates</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHECK 3: Null Percentage Per Column with Small Charts */}
          {(filterTab === 'all' || filterTab === 'nulls') && (
            <div
              className="p-4 sm:p-5 rounded-xl border space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-2 rounded-lg border"
                    style={{
                      backgroundColor: report.nullDistribution.status === 'pass' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      borderColor: report.nullDistribution.status === 'pass' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
                    }}
                  >
                    <Layers className={`w-4 h-4 ${report.nullDistribution.status === 'pass' ? 'text-emerald-400' : 'text-rose-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        3. Null Percentage Per Column
                      </h4>
                      {report.nullDistribution.status === 'pass' ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> PASSED (INVARIANTS COMPLIANT)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> FAILED (NULLS IN UNIQUE COLS)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {report.nullDistribution.message}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right font-mono text-xs">
                  <span className="text-[10px] text-[var(--text-muted)] block">Dataset Null Density</span>
                  <span className="font-bold text-[var(--text-primary)] tabular-nums">
                    {report.nullDistribution.overallNullPercentage}% avg null rate
                  </span>
                </div>
              </div>

              {/* Small Chart: Per-Column Horizontal Stacked Bar Charts */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Column Null Distribution Charts ({report.nullDistribution.items.length} Columns):
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                  {report.nullDistribution.items.map((col, idx) => {
                    const populatedPct = 100 - col.nullPercentage;
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border space-y-2"
                        style={{
                          backgroundColor: 'var(--bg-surface-subtle)',
                          borderColor: col.status === 'fail' ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[var(--text-primary)] truncate max-w-[160px] flex items-center gap-1.5">
                            {col.status === 'pass' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : col.status === 'warn' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                            <span className="truncate">{col.columnName}</span>
                          </span>

                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-[var(--text-muted)]">
                              {col.nullCount} / {col.totalRows} nulls
                            </span>
                            <span className={`font-bold tabular-nums ${col.nullPercentage > 0 ? (col.status === 'fail' ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'}`}>
                              {col.nullPercentage}% null
                            </span>
                          </div>
                        </div>

                        {/* Small Chart: Proportional Stacked Bar */}
                        <div className="h-2.5 w-full rounded-md bg-[var(--bg-surface)] overflow-hidden flex border" style={{ borderColor: 'var(--border-subtle)' }}>
                          {/* Populated portion */}
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${populatedPct}%` }}
                            title={`Populated: ${populatedPct}%`}
                          />
                          {/* Null portion */}
                          {col.nullPercentage > 0 && (
                            <div
                              className={`h-full ${col.status === 'fail' ? 'bg-rose-500' : 'bg-amber-500'} transition-all duration-500`}
                              style={{ width: `${col.nullPercentage}%` }}
                              title={`Null: ${col.nullPercentage}%`}
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                          <span>Target Config: {col.configuredNullPercentage}%</span>
                          <span>{col.isUnique ? 'Unique / PK (0% allowed)' : 'Nullable Field'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CHECK 4: Total-Reconciliation Check for Invoices with Mini Waterfall Chart */}
          {(filterTab === 'all' || filterTab === 'invoices') && (
            <div
              className="p-4 sm:p-5 rounded-xl border space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-2 rounded-lg border"
                    style={{
                      backgroundColor: report.invoiceReconciliation.status === 'pass' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                      borderColor: report.invoiceReconciliation.status === 'pass' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
                    }}
                  >
                    <Receipt className={`w-4 h-4 ${report.invoiceReconciliation.status === 'pass' ? 'text-emerald-400' : 'text-rose-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        4. Total-Reconciliation Check for Invoices
                      </h4>
                      {report.invoiceReconciliation.status === 'pass' ? (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> PASSED (100% RECONCILED)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> FAILED (ROUNDING DRIFT)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {report.invoiceReconciliation.message}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right font-mono text-xs">
                  <span className="text-[10px] text-[var(--text-muted)] block">Cent Reconciliation Rate</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-24 h-2 rounded-full bg-[var(--bg-surface-subtle)] overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${report.invoiceReconciliation.reconciliationRate}%` }}
                      />
                    </div>
                    <span className="font-bold text-emerald-400 tabular-nums">
                      {report.invoiceReconciliation.reconciliationRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Small Chart: Invoice Mathematical Balance Waterfall Ledger */}
              <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
                  <span>Aggregate Financial Flow Balance Chart</span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Exact Cent Discrepancy: $0.00</span>
                  </span>
                </div>

                {/* Waterfall Visual Flow */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono text-center">
                  <div className="p-2.5 rounded-lg border bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Gross Subtotal</span>
                    <span className="font-bold text-[var(--text-primary)] tabular-nums block mt-1">
                      ${report.invoiceReconciliation.waterfallTotals.grossSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">(-) Discounts</span>
                    <span className="font-bold text-amber-400 tabular-nums block mt-1">
                      -${report.invoiceReconciliation.waterfallTotals.totalDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">Net Taxable</span>
                    <span className="font-bold text-[var(--text-primary)] tabular-nums block mt-1">
                      ${report.invoiceReconciliation.waterfallTotals.netTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase">(+) Regional Tax</span>
                    <span className="font-bold text-sky-400 tabular-nums block mt-1">
                      +${report.invoiceReconciliation.waterfallTotals.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-[var(--bg-surface)] col-span-2 sm:col-span-1" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                    <span className="text-[10px] text-emerald-400 block uppercase font-bold">(=) Reconciled Grand Total</span>
                    <span className="font-bold text-emerald-400 tabular-nums block mt-1">
                      ${report.invoiceReconciliation.waterfallTotals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Audited Invoices Table */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Sample Audited Invoices ({Math.min(6, report.invoiceReconciliation.items.length)} of {report.invoiceReconciliation.totalInvoicesChecked}):
                </span>

                <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <table className="w-full text-left text-xs font-mono">
                    <thead style={{ backgroundColor: 'var(--bg-surface-elevated)' }}>
                      <tr className="border-b text-[10px] text-[var(--text-muted)] uppercase tracking-wider" style={{ borderColor: 'var(--border-subtle)' }}>
                        <th className="py-2 px-3">Invoice #</th>
                        <th className="py-2 px-3">Client Entity</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                        <th className="py-2 px-3 text-right">Tax</th>
                        <th className="py-2 px-3 text-right">Audited Total</th>
                        <th className="py-2 px-3 text-right">Discrepancy</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      {report.invoiceReconciliation.items.slice(0, 6).map((item) => (
                        <tr key={item.invoiceId} className="hover:bg-[var(--bg-surface-subtle)] transition-colors">
                          <td className="py-2 px-3 font-bold text-[var(--accent-primary)]">
                            {item.invoiceNumber}
                          </td>
                          <td className="py-2 px-3 text-[var(--text-primary)] truncate max-w-[160px]">
                            {item.clientName}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-[var(--text-secondary)]">
                            ${item.subtotal.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-[var(--text-secondary)]">
                            ${item.taxAmount.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-bold text-[var(--text-primary)]">
                            ${item.total.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums font-bold text-emerald-400">
                            ${item.discrepancy.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {item.isReconciled ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                                <XCircle className="w-3.5 h-3.5" /> Discrepant
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t shrink-0 text-xs"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2 text-[var(--text-muted)] font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span>Strict Zero-Orphan & Deterministic Invariant Guard</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
