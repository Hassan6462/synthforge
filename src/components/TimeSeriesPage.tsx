import React, { useState, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from 'recharts';
import {
  Play,
  RotateCcw,
  Download,
  Calendar,
  Clock,
  Sparkles,
  Layers,
  Sliders,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  TimeSeriesSettings,
  TimeSeriesMetricConfig,
  TimeSeriesFrequency,
  TimeSeriesTrend,
} from '../types';
import {
  DEFAULT_TIME_SERIES_SETTINGS,
  generateTimeSeriesData,
  exportTimeSeriesCsv,
  exportTimeSeriesJson,
} from '../utils/timeSeriesGenerator';
import { downloadFile } from '../utils/export';
import { useToast } from '../context/ToastContext';

interface TimeSeriesPageProps {
  onAddJobLog?: (rowCount: number, colCount: number, durationMs: number) => void;
}

export const TimeSeriesPage: React.FC<TimeSeriesPageProps> = ({ onAddJobLog }) => {
  const toast = useToast();
  const [settings, setSettings] = useState<TimeSeriesSettings>(DEFAULT_TIME_SERIES_SETTINGS);
  const [seed, setSeed] = useState<number>(1042);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  // Generate data based on current settings & seed
  const timeSeriesData = useMemo(() => {
    const start = performance.now();
    const data = generateTimeSeriesData(settings, seed);
    const duration = performance.now() - start;
    if (onAddJobLog && data.length > 0) {
      onAddJobLog(data.length, settings.metrics.filter((m) => m.enabled).length, Math.round(duration));
    }
    return data;
  }, [settings, seed, onAddJobLog]);

  // Total anomalies detected in current slice
  const anomalyCount = useMemo(() => {
    return timeSeriesData.filter((d) => d.isAnomaly).length;
  }, [timeSeriesData]);

  const handleUpdateSettings = (partial: Partial<TimeSeriesSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleToggleMetric = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    }));
  };

  const handleUpdateMetric = (id: string, partial: Partial<TimeSeriesMetricConfig>) => {
    setSettings((prev) => ({
      ...prev,
      metrics: prev.metrics.map((m) => (m.id === id ? { ...m, ...partial } : m)),
    }));
  };

  const handleAddMetric = () => {
    const newId = `m_custom_${Date.now()}`;
    const colors = ['#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#f97316'];
    const color = colors[settings.metrics.length % colors.length];
    const newMetric: TimeSeriesMetricConfig = {
      id: newId,
      name: `Metric ${settings.metrics.length + 1}`,
      baseValue: 100,
      trend: 'linear_up',
      noiseLevel: 15,
      color,
      enabled: true,
      unit: 'val',
    };
    setSettings((prev) => ({
      ...prev,
      metrics: [...prev.metrics, newMetric],
    }));
    toast.info('Metric Added', `Added ${newMetric.name}`);
  };

  const handleDeleteMetric = (id: string) => {
    if (settings.metrics.length <= 1) {
      toast.warning('Cannot Delete', 'At least one metric must remain.');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((m) => m.id !== id),
    }));
  };

  // Re-roll random seed
  const handleRegenerate = () => {
    const newSeed = Math.floor(Math.random() * 900000) + 100000;
    setSeed(newSeed);
    toast.success('Regenerated', `Generated time series with seed #${newSeed}`);
  };

  // Export handlers
  const handleExportCsv = () => {
    const csv = exportTimeSeriesCsv(timeSeriesData, settings.metrics);
    downloadFile(csv, `timeseries_${settings.frequency}_${Date.now()}.csv`, 'text/csv');
    toast.success('Export Complete', 'Downloaded CSV dataset.');
  };

  const handleExportJson = () => {
    const json = exportTimeSeriesJson(timeSeriesData, settings.metrics);
    downloadFile(json, `timeseries_${settings.frequency}_${Date.now()}.json`, 'application/json');
    toast.success('Export Complete', 'Downloaded JSON dataset.');
  };

  // Presets
  const applyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName === 'traffic_surge') {
      setSettings({
        frequency: 'hour',
        length: 240, // 10 days
        startDate: '2026-03-01',
        seasonality: { daily: true, weekly: true, yearly: false },
        anomalies: { enabled: true, rate: 5, magnitude: 3.2, type: 'spike' },
        metrics: [
          {
            id: 'm_traffic',
            name: 'API Requests (req/s)',
            baseValue: 2400,
            trend: 'exponential',
            noiseLevel: 18,
            color: '#38bdf8',
            enabled: true,
            unit: 'req/s',
          },
          {
            id: 'm_latency',
            name: 'P95 Latency (ms)',
            baseValue: 48,
            trend: 'linear_up',
            noiseLevel: 25,
            color: '#f59e0b',
            enabled: true,
            unit: 'ms',
          },
        ],
      });
      toast.success('Preset Applied', 'E-commerce Traffic Surge configured.');
    } else if (presetName === 'iot_sensor') {
      setSettings({
        frequency: 'minute',
        length: 300, // 5 hours of minute data
        startDate: '2026-03-29',
        seasonality: { daily: true, weekly: false, yearly: false },
        anomalies: { enabled: true, rate: 3, magnitude: 2.2, type: 'drop' },
        metrics: [
          {
            id: 'm_temp',
            name: 'Chamber Temp (°C)',
            baseValue: 22.4,
            trend: 'flat',
            noiseLevel: 8,
            color: '#10b981',
            enabled: true,
            unit: '°C',
          },
          {
            id: 'm_pressure',
            name: 'Vessel Pressure (bar)',
            baseValue: 6.2,
            trend: 'damped',
            noiseLevel: 12,
            color: '#8b5cf6',
            enabled: true,
            unit: 'bar',
          },
        ],
      });
      toast.success('Preset Applied', 'IoT Sensor Telemetry configured.');
    } else if (presetName === 'financial_stock') {
      setSettings({
        frequency: 'day',
        length: 365, // 1 year
        startDate: '2025-01-01',
        seasonality: { daily: false, weekly: true, yearly: true },
        anomalies: { enabled: true, rate: 4, magnitude: 2.0, type: 'mixed' },
        metrics: [
          {
            id: 'm_stock',
            name: 'Asset Price ($)',
            baseValue: 145,
            trend: 'linear_up',
            noiseLevel: 28,
            color: '#06b6d4',
            enabled: true,
            unit: '$',
          },
          {
            id: 'm_volume',
            name: 'Daily Volume (k)',
            baseValue: 850,
            trend: 'flat',
            noiseLevel: 35,
            color: '#ec4899',
            enabled: true,
            unit: 'k',
          },
        ],
      });
      toast.success('Preset Applied', 'Financial Asset Drift configured.');
    }
  };

  const activeMetrics = settings.metrics.filter((m) => m.enabled);

  return (
    <div className="flex-1 flex flex-col xl:flex-row overflow-hidden bg-[var(--bg-canvas)]">
      {/* Left Control Sidebar */}
      <div
        className="w-full xl:w-96 border-b xl:border-b-0 xl:border-r p-4 sm:p-5 flex flex-col gap-5 overflow-y-auto shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Time Series Generator</span>
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20">
              Recharts Live
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Decomposed synthetic series with frequency, trend, seasonality, and anomaly injections.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--text-primary)]">Quick Scenario Presets</label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('traffic_surge')}
              className={`p-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                selectedPreset === 'traffic_surge'
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-semibold'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              🚀 Traffic Surge
            </button>
            <button
              type="button"
              onClick={() => applyPreset('iot_sensor')}
              className={`p-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                selectedPreset === 'iot_sensor'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              📡 IoT Sensor
            </button>
            <button
              type="button"
              onClick={() => applyPreset('financial_stock')}
              className={`p-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                selectedPreset === 'financial_stock'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-semibold'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              📈 Asset Drift
            </button>
          </div>
        </div>

        {/* Frequency & Points Length */}
        <div className="flex flex-col gap-3 p-3.5 rounded-xl border bg-[var(--bg-surface-elevated)]" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Sampling Frequency</span>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg border bg-[var(--bg-canvas)]" style={{ borderColor: 'var(--border-subtle)' }}>
            {(['minute', 'hour', 'day'] as TimeSeriesFrequency[]).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => handleUpdateSettings({ frequency: freq })}
                className={`py-1.5 text-xs font-semibold rounded capitalize transition-all cursor-pointer ${
                  settings.frequency === freq
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Sample Points (Length)</span>
              <span className="font-mono font-bold text-sky-400">{settings.length} points</span>
            </div>
            <input
              type="range"
              min="24"
              max="1000"
              step="12"
              value={settings.length}
              onChange={(e) => handleUpdateSettings({ length: parseInt(e.target.value, 10) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
              <span>24 pts</span>
              <span>250 pts</span>
              <span>500 pts</span>
              <span>1,000 pts</span>
            </div>
          </div>
        </div>

        {/* Seasonality Configuration */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl border bg-[var(--bg-surface-elevated)]" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Seasonality Harmonics</span>
          </span>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <label className="flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]">
              <input
                type="checkbox"
                checked={settings.seasonality.daily}
                onChange={(e) =>
                  handleUpdateSettings({
                    seasonality: { ...settings.seasonality, daily: e.target.checked },
                  })
                }
                className="rounded accent-sky-500"
              />
              <span className="font-medium text-[var(--text-primary)]">Daily (24h)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]">
              <input
                type="checkbox"
                checked={settings.seasonality.weekly}
                onChange={(e) =>
                  handleUpdateSettings({
                    seasonality: { ...settings.seasonality, weekly: e.target.checked },
                  })
                }
                className="rounded accent-sky-500"
              />
              <span className="font-medium text-[var(--text-primary)]">Weekly (7d)</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]">
              <input
                type="checkbox"
                checked={settings.seasonality.yearly}
                onChange={(e) =>
                  handleUpdateSettings({
                    seasonality: { ...settings.seasonality, yearly: e.target.checked },
                  })
                }
                className="rounded accent-sky-500"
              />
              <span className="font-medium text-[var(--text-primary)]">Yearly (365d)</span>
            </label>
          </div>
        </div>

        {/* Random Anomalies */}
        <div className="flex flex-col gap-3 p-3.5 rounded-xl border bg-[var(--bg-surface-elevated)]" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Random Anomalies</span>
            </span>
            <input
              type="checkbox"
              checked={settings.anomalies.enabled}
              onChange={(e) =>
                handleUpdateSettings({
                  anomalies: { ...settings.anomalies, enabled: e.target.checked },
                })
              }
              className="rounded accent-amber-500 cursor-pointer"
            />
          </div>

          {settings.anomalies.enabled && (
            <div className="flex flex-col gap-3 pt-1 border-t border-[var(--border-subtle)]">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>Anomaly Rate</span>
                  <span className="font-mono font-bold text-amber-400">{settings.anomalies.rate}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={settings.anomalies.rate}
                  onChange={(e) =>
                    handleUpdateSettings({
                      anomalies: { ...settings.anomalies, rate: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                  <span>Magnitude Multiplier</span>
                  <span className="font-mono font-bold text-amber-400">{settings.anomalies.magnitude}x</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="5.0"
                  step="0.1"
                  value={settings.anomalies.magnitude}
                  onChange={(e) =>
                    handleUpdateSettings({
                      anomalies: { ...settings.anomalies, magnitude: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-[var(--text-secondary)] mr-1">Pattern:</span>
                {(['spike', 'drop', 'mixed'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      handleUpdateSettings({
                        anomalies: { ...settings.anomalies, type },
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border capitalize cursor-pointer ${
                      settings.anomalies.type === type
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold'
                        : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metrics List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Metrics / Series ({settings.metrics.length})</span>
            </span>
            <button
              type="button"
              onClick={handleAddMetric}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border border-sky-500/30 text-sky-400 hover:bg-sky-500/10 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Series</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {settings.metrics.map((metric) => (
              <div
                key={metric.id}
                className="p-2.5 rounded-lg border bg-[var(--bg-surface-elevated)] flex flex-col gap-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={metric.enabled}
                      onChange={() => handleToggleMetric(metric.id)}
                      className="rounded accent-sky-500 cursor-pointer"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    <input
                      type="text"
                      value={metric.name}
                      onChange={(e) => handleUpdateMetric(metric.id, { name: e.target.value })}
                      className="text-xs font-semibold bg-transparent text-[var(--text-primary)] border-b border-transparent hover:border-[var(--border-subtle)] focus:border-sky-500 focus:outline-hidden px-0.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMetric(metric.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-red-400 cursor-pointer"
                    title="Remove series"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {metric.enabled && (
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--border-subtle)] text-[11px]">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Trend</span>
                      <select
                        value={metric.trend}
                        onChange={(e) => handleUpdateMetric(metric.id, { trend: e.target.value as TimeSeriesTrend })}
                        className="w-full bg-[var(--bg-canvas)] border rounded px-1 py-0.5 text-[var(--text-primary)] text-[10px]"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <option value="linear_up">Linear ↗</option>
                        <option value="linear_down">Linear ↘</option>
                        <option value="exponential">Exponential 📈</option>
                        <option value="damped">S-Curve 〰</option>
                        <option value="flat">Flat ➔</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Base Val</span>
                      <input
                        type="number"
                        value={metric.baseValue}
                        onChange={(e) => handleUpdateMetric(metric.id, { baseValue: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[var(--bg-canvas)] border rounded px-1 py-0.5 text-[var(--text-primary)] text-[10px] font-mono"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      />
                    </div>

                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px]">Noise ({metric.noiseLevel}%)</span>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={metric.noiseLevel}
                        onChange={(e) => handleUpdateMetric(metric.id, { noiseLevel: parseInt(e.target.value, 10) })}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-2 mt-auto">
          <button
            type="button"
            onClick={handleRegenerate}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-roll Seed</span>
          </button>
        </div>
      </div>

      {/* Main Chart & Data Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-secondary)]">
              Showing <strong className="text-[var(--text-primary)]">{timeSeriesData.length}</strong> points from{' '}
              <span className="font-mono text-xs">{timeSeriesData[0]?.timeLabel}</span> to{' '}
              <span className="font-mono text-xs">{timeSeriesData[timeSeriesData.length - 1]?.timeLabel}</span>
            </span>

            {anomalyCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                <AlertTriangle className="w-3 h-3" />
                <span>{anomalyCount} anomalies injected</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-[var(--text-primary)] hover:border-sky-500 hover:text-sky-400 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-[var(--text-primary)] hover:border-sky-500 hover:text-sky-400 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Live Recharts Canvas */}
        <div className="flex-1 p-5 min-h-[380px] flex flex-col">
          <div className="flex-1 w-full bg-[var(--bg-surface-elevated)] p-4 rounded-xl border flex flex-col" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">Interactive Time Series Visualization</span>
              <span className="text-[10px] text-[var(--text-muted)]">Use bottom brush slider to zoom & pan</span>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    tickLine={{ stroke: 'var(--border-subtle)' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    tickLine={{ stroke: 'var(--border-subtle)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  {activeMetrics.map((metric) => (
                    <Line
                      key={metric.id}
                      type="monotone"
                      dataKey={metric.id}
                      name={metric.name}
                      stroke={metric.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                  <Brush
                    dataKey="timeLabel"
                    height={30}
                    stroke="#38bdf8"
                    fill="var(--bg-surface)"
                    travellerWidth={10}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Raw Data Preview Table */}
          <div className="mt-4 border rounded-xl overflow-hidden bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="px-4 py-2 border-b flex items-center justify-between bg-[var(--bg-surface-elevated)]" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-xs font-semibold text-[var(--text-primary)]">Preview Records (First 5 Points)</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">UTC Timestamps</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[var(--text-muted)] border-b bg-[var(--bg-surface)]" style={{ borderColor: 'var(--border-subtle)' }}>
                  <tr>
                    <th className="py-2 px-3">Timestamp</th>
                    {activeMetrics.map((m) => (
                      <th key={m.id} className="py-2 px-3">
                        <span style={{ color: m.color }}>●</span> {m.name}
                      </th>
                    ))}
                    <th className="py-2 px-3">Anomaly</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
                  {timeSeriesData.slice(0, 5).map((point, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-surface-elevated)]">
                      <td className="py-1.5 px-3 text-[var(--text-secondary)]">{point.timestamp}</td>
                      {activeMetrics.map((m) => (
                        <td key={m.id} className="py-1.5 px-3 text-[var(--text-primary)]">
                          {point[m.id]}
                        </td>
                      ))}
                      <td className="py-1.5 px-3">
                        {point.isAnomaly ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-500/20 text-amber-400">
                            {point.anomalyType?.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
