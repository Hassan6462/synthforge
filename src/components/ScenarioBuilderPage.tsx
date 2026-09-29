import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Scale,
  TrendingUp,
  GitCommit,
  AlertTriangle,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Database,
  Calendar,
  Layers,
} from 'lucide-react';
import { ScenarioPreset, ColumnDefinition, GenerationSettings, TimeSeriesSettings } from '../types';
import { SCENARIO_PRESETS } from '../data/scenarioPresets';
import { useToast } from '../context/ToastContext';

interface ScenarioBuilderPageProps {
  onApplyTabularScenario: (columns: ColumnDefinition[], settingsPatch: Partial<GenerationSettings>) => void;
  onApplyTimeSeriesScenario: (timeSeriesPatch: Partial<TimeSeriesSettings>) => void;
  onNavigateTab: (tab: any) => void;
}

export const ScenarioBuilderPage: React.FC<ScenarioBuilderPageProps> = ({
  onApplyTabularScenario,
  onApplyTimeSeriesScenario,
  onNavigateTab,
}) => {
  const toast = useToast();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioPreset>(SCENARIO_PRESETS[0]);

  const handleApply = (scenario: ScenarioPreset) => {
    if (scenario.config.type === 'tabular') {
      if (scenario.config.columns) {
        onApplyTabularScenario(scenario.config.columns, scenario.config.settingsPatch || {});
        toast.success('Scenario Applied', `Configured "${scenario.title}" in Tabular Generator.`);
        onNavigateTab('tabular');
      }
    } else if (scenario.config.type === 'timeseries') {
      if (scenario.config.timeSeriesPatch) {
        onApplyTimeSeriesScenario(scenario.config.timeSeriesPatch);
        toast.success('Scenario Applied', `Configured "${scenario.title}" in Time Series Generator.`);
        onNavigateTab('timeseries');
      }
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'Scale':
        return <Scale className="w-5 h-5 text-indigo-400" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-amber-400" />;
      case 'GitCommit':
        return <GitCommit className="w-5 h-5 text-sky-400" />;
      case 'AlertTriangle':
      default:
        return <AlertTriangle className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[var(--bg-canvas)]">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                Scenario Builder & Stress Testing
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Curated empirical simulation presets to stress-test anomaly detectors, downstream classifiers, and ETL pipelines.
            </p>
          </div>
        </div>

        {/* Scenarios Grid & Detail Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Preset Cards List */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {SCENARIO_PRESETS.map((scenario) => {
              const isSelected = selectedScenario.id === scenario.id;
              return (
                <div
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                        {getIcon(scenario.iconName)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">{scenario.title}</h3>
                        <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                          {scenario.tag}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      {scenario.config.type.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Detailed Inspector & Live Apply Card */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div
              className="p-5 sm:p-6 rounded-2xl border bg-[var(--bg-surface)] flex flex-col gap-5 shadow-xs"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                    {getIcon(selectedScenario.iconName)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">{selectedScenario.title}</h2>
                    <span className="text-xs text-purple-400 font-semibold">{selectedScenario.tag}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApply(selectedScenario)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all cursor-pointer hover:scale-102"
                >
                  <span>Apply Scenario</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Scenario Narrative */}
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-1">Scenario Dynamics</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {selectedScenario.description}
                </p>
              </div>

              {/* Business & Model Impact */}
              <div className="p-3.5 rounded-xl border bg-purple-500/5 border-purple-500/20 text-xs">
                <span className="font-bold text-purple-400 block mb-0.5">Downstream Impact & Testing Target:</span>
                <span className="text-[var(--text-secondary)]">{selectedScenario.impact}</span>
              </div>

              {/* Configured Columns Preview */}
              {selectedScenario.config.type === 'tabular' && selectedScenario.config.columns && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-sky-400" />
                      <span>Injected Tabular Columns ({selectedScenario.config.columns.length})</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      Target: {selectedScenario.config.settingsPatch?.rowCount || 500} rows
                    </span>
                  </div>

                  <div className="rounded-xl border overflow-hidden bg-[var(--bg-surface-elevated)]" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="max-h-52 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[var(--text-muted)] border-b bg-[var(--bg-surface)] text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                          <tr>
                            <th className="py-2 px-3">Column Name</th>
                            <th className="py-2 px-3">Data Type</th>
                            <th className="py-2 px-3">Null %</th>
                            <th className="py-2 px-3">Constraints</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y font-mono text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                          {selectedScenario.config.columns.map((c) => (
                            <tr key={c.id} className="hover:bg-[var(--bg-canvas)]">
                              <td className="py-2 px-3 font-semibold text-[var(--text-primary)]">{c.name}</td>
                              <td className="py-2 px-3 text-sky-400">{c.type}</td>
                              <td className="py-2 px-3 text-[var(--text-secondary)]">{c.nullPercentage}%</td>
                              <td className="py-2 px-3 text-[var(--text-muted)] text-[10px]">
                                {c.min !== undefined && c.max !== undefined
                                  ? `[${c.min}..${c.max}]`
                                  : c.categoryWeights
                                  ? `${c.categoryWeights.length} classes`
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Series Patch Preview */}
              {selectedScenario.config.type === 'timeseries' && selectedScenario.config.timeSeriesPatch && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Time Series Generator Configuration</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border bg-[var(--bg-surface-elevated)] font-mono text-xs flex flex-col gap-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Frequency:</span>
                      <span className="text-amber-400 font-bold">{selectedScenario.config.timeSeriesPatch.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Length:</span>
                      <span className="text-[var(--text-primary)]">{selectedScenario.config.timeSeriesPatch.length} points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Anomaly Rate:</span>
                      <span className="text-red-400 font-bold">{selectedScenario.config.timeSeriesPatch.anomalies?.rate}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
