import type {
  TimeSeriesSettings,
  TimeSeriesDataPoint,
  TimeSeriesMetricConfig,
} from '../types';

/**
 * Standard default metrics for Time Series generation
 */
export const DEFAULT_TIME_SERIES_METRICS: TimeSeriesMetricConfig[] = [
  {
    id: 'm_traffic',
    name: 'Web Traffic (req/s)',
    baseValue: 1250,
    trend: 'linear_up',
    noiseLevel: 18,
    color: '#38bdf8', // sky-400
    enabled: true,
    unit: 'req/s',
  },
  {
    id: 'm_orders',
    name: 'Completed Orders',
    baseValue: 85,
    trend: 'linear_up',
    noiseLevel: 22,
    color: '#10b981', // emerald-500
    enabled: true,
    unit: 'orders',
  },
  {
    id: 'm_latency',
    name: 'P99 Latency (ms)',
    baseValue: 42,
    trend: 'flat',
    noiseLevel: 12,
    color: '#f59e0b', // amber-500
    enabled: true,
    unit: 'ms',
  },
  {
    id: 'm_error_rate',
    name: 'Error Rate (%)',
    baseValue: 0.85,
    trend: 'flat',
    noiseLevel: 15,
    color: '#ef4444', // red-500
    enabled: false,
    unit: '%',
  },
];

export const DEFAULT_TIME_SERIES_SETTINGS: TimeSeriesSettings = {
  frequency: 'hour',
  length: 168, // 1 week of hourly data
  startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
  seasonality: {
    daily: true,
    weekly: true,
    yearly: false,
  },
  anomalies: {
    enabled: true,
    rate: 3, // 3% of points
    magnitude: 2.8,
    type: 'mixed',
  },
  metrics: DEFAULT_TIME_SERIES_METRICS,
};

/**
 * Box-Muller transform for standard Gaussian random values
 */
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Generate synthetic time series data based on mathematical decomposition:
 * Y(t) = Base * Trend(t) * Seasonality(t) + Noise(t) + Anomaly(t)
 */
export function generateTimeSeriesData(
  settings: TimeSeriesSettings = DEFAULT_TIME_SERIES_SETTINGS,
  seed: number = 42
): TimeSeriesDataPoint[] {
  const points: TimeSeriesDataPoint[] = [];
  const start = new Date(settings.startDate || '2026-01-01');
  const activeMetrics = settings.metrics.filter((m) => m.enabled);

  if (activeMetrics.length === 0) {
    return [];
  }

  // Frequency step in milliseconds
  let stepMs = 3600 * 1000;
  if (settings.frequency === 'minute') stepMs = 60 * 1000;
  if (settings.frequency === 'day') stepMs = 24 * 3600 * 1000;

  for (let i = 0; i < settings.length; i++) {
    const currentTime = new Date(start.getTime() + i * stepMs);
    const isoTimestamp = currentTime.toISOString();

    // Human-friendly time label for chart axis
    let timeLabel = '';
    if (settings.frequency === 'minute') {
      timeLabel = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (settings.frequency === 'hour') {
      timeLabel = `${currentTime.getMonth() + 1}/${currentTime.getDate()} ${currentTime.getHours()}:00`;
    } else {
      timeLabel = currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    // Determine if this point has a global injected anomaly
    const isAnomalyCandidate = settings.anomalies.enabled && Math.random() * 100 < settings.anomalies.rate;
    let anomalyType: 'spike' | 'drop' | undefined = undefined;
    if (isAnomalyCandidate) {
      if (settings.anomalies.type === 'mixed') {
        anomalyType = Math.random() > 0.35 ? 'spike' : 'drop';
      } else {
        anomalyType = settings.anomalies.type;
      }
    }

    const point: TimeSeriesDataPoint = {
      timestamp: isoTimestamp,
      timeLabel,
      isAnomaly: !!anomalyType,
      anomalyType,
    };

    // Calculate normalized progress t in [0, 1]
    const t = i / Math.max(1, settings.length - 1);

    // Compute seasonality factors
    let seasonalMult = 1.0;

    // Daily seasonality (24-hour cycle)
    if (settings.seasonality.daily) {
      const hourOfDay = currentTime.getHours() + currentTime.getMinutes() / 60;
      // Peak around 14:00 (2 PM), dip at 04:00 (4 AM)
      const dailyAngle = ((hourOfDay - 4) / 24) * 2 * Math.PI;
      const dailyWave = Math.sin(dailyAngle);
      seasonalMult *= 1.0 + 0.35 * dailyWave;
    }

    // Weekly seasonality (7-day cycle)
    if (settings.seasonality.weekly) {
      const dayOfWeek = currentTime.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      seasonalMult *= isWeekend ? 0.65 : 1.15;
    }

    // Yearly seasonality (365-day cycle)
    if (settings.seasonality.yearly) {
      const dayOfYear = Math.floor((currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) / 86400000);
      const yearlyAngle = (dayOfYear / 365) * 2 * Math.PI;
      // Winter holiday peak + summer peak
      seasonalMult *= 1.0 + 0.25 * Math.sin(yearlyAngle);
    }

    for (const metric of activeMetrics) {
      // 1. Trend Factor
      let trendMult = 1.0;
      switch (metric.trend) {
        case 'linear_up':
          trendMult = 1.0 + 0.8 * t; // +80% over duration
          break;
        case 'linear_down':
          trendMult = 1.0 - 0.45 * t; // -45% over duration
          break;
        case 'exponential':
          trendMult = Math.exp(1.1 * t); // Exponential surge
          break;
        case 'damped':
          // S-curve / logistic adoption
          trendMult = 0.5 + 1.0 / (1 + Math.exp(-8 * (t - 0.5)));
          break;
        case 'flat':
        default:
          trendMult = 1.0;
          break;
      }

      // 2. Base + Seasonality + Trend
      let value = metric.baseValue * trendMult * seasonalMult;

      // 3. Gaussian Noise
      const noiseSigma = (metric.noiseLevel / 100) * 0.25 * metric.baseValue;
      value += gaussianRandom() * noiseSigma;

      // 4. Anomaly Injection
      if (anomalyType) {
        const mag = Math.max(1.5, settings.anomalies.magnitude);
        if (anomalyType === 'spike') {
          value *= mag + (Math.random() * 0.5);
        } else {
          value *= Math.max(0.05, 1.0 / mag - Math.random() * 0.1);
        }
      }

      // Safeguard against negative values for count/latency metrics
      if (metric.baseValue >= 0 && value < 0) {
        value = Math.max(0, Math.random() * 0.05 * metric.baseValue);
      }

      // Precision rounding
      point[metric.id] = Number(value.toFixed(2));
    }

    points.push(point);
  }

  return points;
}

/**
 * Format Time Series data to CSV
 */
export function exportTimeSeriesCsv(data: TimeSeriesDataPoint[], metrics: TimeSeriesMetricConfig[]): string {
  if (data.length === 0) return '';
  const activeMetrics = metrics.filter((m) => m.enabled);
  const headers = ['timestamp', ...activeMetrics.map((m) => m.name), 'is_anomaly'];

  const rows = data.map((dp) => {
    const vals = [
      dp.timestamp,
      ...activeMetrics.map((m) => dp[m.id] ?? ''),
      dp.isAnomaly ? 'TRUE' : 'FALSE',
    ];
    return vals.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Format Time Series data to JSON
 */
export function exportTimeSeriesJson(data: TimeSeriesDataPoint[], metrics: TimeSeriesMetricConfig[]): string {
  const activeMetrics = metrics.filter((m) => m.enabled);
  const formatted = data.map((dp) => {
    const row: Record<string, any> = {
      timestamp: dp.timestamp,
      is_anomaly: !!dp.isAnomaly,
    };
    for (const m of activeMetrics) {
      row[m.id] = dp[m.id];
    }
    return row;
  });
  return JSON.stringify(formatted, null, 2);
}
