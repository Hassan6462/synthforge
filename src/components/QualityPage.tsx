import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  Printer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  BarChart2,
  RefreshCw,
  Lock,
  Eye,
  Sliders,
  Database,
} from 'lucide-react';
import { QualityReportData } from '../types';
import { evaluateRealVsSynthetic } from '../utils/qualityEvaluator';
import { useToast } from '../context/ToastContext';

interface QualityPageProps {
  realRecords: Record<string, any>[];
  synthRecords: Record<string, any>[];
  datasetName?: string;
  onNavigateTab?: (tab: any) => void;
}

export const QualityPage: React.FC<QualityPageProps> = ({
  realRecords,
  synthRecords,
  datasetName = 'Benchmark Sample',
  onNavigateTab,
}) => {
  const toast = useToast();
  const [filterType, setFilterType] = useState<'all' | 'numeric' | 'categorical'>('all');

  // Compute quality and privacy report
  const report: QualityReportData = useMemo(() => {
    return evaluateRealVsSynthetic(realRecords, synthRecords);
  }, [realRecords, synthRecords]);

  const handlePrint = () => {
    window.print();
  };

  const filteredMetrics = report.metrics.filter((m) => {
    if (filterType === 'all') return true;
    return m.type === filterType;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[var(--bg-canvas)] print:p-0 print:bg-white">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b print:border-none" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400 print:text-emerald-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] print:text-black">
                Fidelity & Quality Assurance Report
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] print:text-gray-600 mt-1">
              Rigorous statistical evaluation comparing real reference dataset against synthetic outputs.
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-400 transition-colors bg-[var(--bg-surface-elevated)] cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Printable Report</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall Fidelity Score */}
          <div
            className="p-4 rounded-xl border bg-[var(--bg-surface)] flex flex-col justify-between print:border-gray-300"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Overall Fidelity</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[var(--text-primary)] print:text-black">
                {report.overallFidelityScore}%
              </span>
              <span className="text-xs text-emerald-400 font-semibold">High Match</span>
            </div>
            <div className="w-full bg-[var(--bg-surface-elevated)] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${report.overallFidelityScore}%` }}
              />
            </div>
          </div>

          {/* Correlation Delta */}
          <div
            className="p-4 rounded-xl border bg-[var(--bg-surface)] flex flex-col justify-between print:border-gray-300"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Covariance Distance (Δ)</span>
              <BarChart2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[var(--text-primary)] print:text-black">
                {report.correlationDiffNorm}
              </span>
              <span className="text-xs text-sky-400 font-semibold">Frobenius Norm</span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">Preserves inter-column correlations</span>
          </div>

          {/* Privacy Risk Assessment */}
          <div
            className="p-4 rounded-xl border bg-[var(--bg-surface)] flex flex-col justify-between print:border-gray-300"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Privacy Risk Level</span>
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span
                className={`text-xl font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  report.privacyRisk === 'low'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : report.privacyRisk === 'medium'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}
              >
                {report.privacyRisk} Risk
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              Nearest Neighbor Distance: {report.nndrScore}
            </span>
          </div>

          {/* Exact Matches (Memorization) */}
          <div
            className="p-4 rounded-xl border bg-[var(--bg-surface)] flex flex-col justify-between print:border-gray-300"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Exact Training Row Matches</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[var(--text-primary)] print:text-black">
                {report.exactMatchCount}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                ({report.exactMatchPct}%)
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">
              {report.exactMatchCount === 0 ? '✓ Zero Memorization' : 'Low Overfitting'}
            </span>
          </div>
        </div>

        {/* Statistical Test Methodology Description */}
        <div
          className="p-4 rounded-xl border bg-[var(--bg-surface-elevated)] text-xs text-[var(--text-secondary)] flex flex-col gap-1.5 print:border-gray-300 print:text-gray-700"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="font-semibold text-[var(--text-primary)] print:text-black flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mathematical Methodology</span>
          </div>
          <p>
            Continuous numeric features are validated using the <strong>Two-Sample Kolmogorov-Smirnov (KS) test</strong>, comparing the empirical cumulative distributions and calculating the supreme distance statistic ($D$). Categorical columns are scored using <strong>Total Variation Distance (TVD)</strong> across normalized category frequencies. Privacy evaluation measures exact row collisions and nearest-neighbor distance (DCR) to prevent training-data leakage.
          </p>
        </div>

        {/* Per-Column Profiling Table */}
        <div
          className="rounded-xl border bg-[var(--bg-surface)] overflow-hidden print:border-gray-300"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--bg-surface-elevated)] print:bg-gray-100"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--text-primary)] print:text-black">
                Per-Column Statistical Fidelity Metrics
              </h2>
              <span className="text-xs text-[var(--text-muted)] font-mono">({filteredMetrics.length} columns)</span>
            </div>

            <div className="flex items-center gap-1 text-xs print:hidden">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2 py-1 rounded font-medium cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('numeric')}
                className={`px-2 py-1 rounded font-medium cursor-pointer ${
                  filterType === 'numeric'
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Numeric (KS)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('categorical')}
                className={`px-2 py-1 rounded font-medium cursor-pointer ${
                  filterType === 'categorical'
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Categorical (TVD)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead
                className="text-[var(--text-muted)] border-b bg-[var(--bg-surface)] font-medium print:text-gray-700"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <tr>
                  <th className="py-2.5 px-4">Feature Column</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">KS Statistic (D)</th>
                  <th className="py-2.5 px-3">TVD</th>
                  <th className="py-2.5 px-3">Real Mean</th>
                  <th className="py-2.5 px-3">Synth Mean</th>
                  <th className="py-2.5 px-3">Fidelity Score</th>
                  <th className="py-2.5 px-4">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                {filteredMetrics.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-surface-elevated)] print:hover:bg-transparent">
                    <td className="py-2.5 px-4 font-semibold text-[var(--text-primary)] print:text-black">
                      {m.column}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="capitalize px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                      {m.ksStatistic !== undefined ? m.ksStatistic : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                      {m.tvd !== undefined ? m.tvd : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                      {m.realMean !== undefined ? m.realMean : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                      {m.synthMean !== undefined ? m.synthMean : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[var(--text-primary)] print:text-black">
                      {m.fidelityScore}%
                    </td>
                    <td className="py-2.5 px-4">
                      {m.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Passed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold font-sans">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Covariance Matrix Comparison */}
        {report.realCorrelationMatrix && report.synthCorrelationMatrix && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-xs font-bold text-[var(--text-primary)] mb-2">Real Correlation Heatmap</h3>
              <div className="overflow-x-auto text-[10px] font-mono">
                <table className="w-full text-center">
                  <thead>
                    <tr>
                      <th></th>
                      {report.realCorrelationMatrix.columns.map((c) => (
                        <th key={c} className="p-1 truncate max-w-[60px]" title={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.realCorrelationMatrix.data.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="font-bold text-left p-1 truncate max-w-[60px]">{report.realCorrelationMatrix!.columns[rIdx]}</td>
                        {row.map((val, cIdx) => (
                          <td
                            key={cIdx}
                            className="p-1 font-semibold"
                            style={{
                              backgroundColor: `rgba(56, 189, 248, ${Math.abs(val) * 0.4})`,
                            }}
                          >
                            {val.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-xs font-bold text-[var(--text-primary)] mb-2">Synthetic Correlation Heatmap</h3>
              <div className="overflow-x-auto text-[10px] font-mono">
                <table className="w-full text-center">
                  <thead>
                    <tr>
                      <th></th>
                      {report.synthCorrelationMatrix.columns.map((c) => (
                        <th key={c} className="p-1 truncate max-w-[60px]" title={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.synthCorrelationMatrix.data.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="font-bold text-left p-1 truncate max-w-[60px]">{report.synthCorrelationMatrix!.columns[rIdx]}</td>
                        {row.map((val, cIdx) => (
                          <td
                            key={cIdx}
                            className="p-1 font-semibold"
                            style={{
                              backgroundColor: `rgba(16, 185, 129, ${Math.abs(val) * 0.4})`,
                            }}
                          >
                            {val.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
