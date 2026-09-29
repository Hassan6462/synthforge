export type Theme = 'light' | 'dark' | 'ocean' | 'sunset';

export type TabType =
  | 'home'
  | 'tabular'
  | 'relational'
  | 'documents'
  | 'timeseries'
  | 'datasources'
  | 'eda'
  | 'quality'
  | 'notebooks'
  | 'scenarios'
  | 'jobs'
  | 'api';

export type ExportFormat = 'csv' | 'json' | 'sql' | 'ndjson' | 'zip_csv';

export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite';

export type RelationshipCardinality = '1:1' | '1:N' | 'N:N';

export type ComputedAggregationType = 'sum' | 'count' | 'avg' | 'min' | 'max';

export type ColumnPrivacyOption = 'none' | 'mask' | 'hash';

export interface EdgeCaseTypesConfig {
  nulls: boolean;
  extremeValues: boolean;
  duplicates: boolean;
  unicodeEmoji: boolean;
  veryLongText: boolean;
  invalidFormats: boolean;
}

export type EdgeCaseIntensity = 'low' | 'medium' | 'high';

export interface ComputedColumnConfig {
  aggregation: ComputedAggregationType;
  targetChildTable: string; // e.g. 'order_items'
  targetChildColumn: string; // e.g. 'line_total'
  foreignKeyColumn: string; // foreign key in child referencing this table's PK (e.g. 'order_id')
}

export type ColumnDataType =
  | 'integer'
  | 'float'
  | 'string'
  | 'boolean'
  | 'date'
  | 'category'
  | 'uuid'
  | 'email'
  | 'full name'
  | 'phone'
  | 'address'
  | 'company';

export interface CategoryWeight {
  id: string;
  value: string;
  weight: number; // relative weight e.g. 50, 30, 20
}

export interface ColumnDefinition {
  id: string;
  name: string;
  type: ColumnDataType;
  nullPercentage: number; // 0 to 100%
  isUnique: boolean; // Unique toggle
  min?: number; // for integer, float, or string min length
  max?: number; // for integer, float, or string max length
  precision?: number; // for float
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  categoryWeights?: CategoryWeight[]; // for category
  isComputed?: boolean;
  computedConfig?: ComputedColumnConfig;
  // Privacy & Differential Privacy settings
  privacy?: ColumnPrivacyOption; // none, mask, hash
  laplaceEpsilon?: number; // for numeric Laplace differential privacy noise (e.g. 0.1 to 10.0)
}

export interface TabularPreset {
  id: string;
  name: string;
  description: string;
  columns: ColumnDefinition[];
}

export interface ForeignKeyDefinition {
  id: string;
  column: string;
  targetTable: string;
  targetColumn: string;
  cardinality: RelationshipCardinality;
  ratioMin?: number;
  ratioMax?: number;
}

export interface TableSchema {
  id: string;
  name: string;
  description: string;
  primaryKey: string;
  columns: ColumnDefinition[];
  foreignKeys?: ForeignKeyDefinition[];
  rowCount?: number;
}

export interface RelationalPreset {
  id: string;
  name: string;
  description: string;
  tables: TableSchema[];
}

export * from './documents';
import { DocumentRegion } from './documents';

export interface DocumentPreset {
  id: string;
  name: string;
  description: string;
  templateType: 'invoice' | 'bank_statement' | 'audit_log' | 'support_ticket' | 'clinical_encounter' | 'invoice_receipt';
  region?: DocumentRegion;
}

export interface GenerationSettings {
  rowCount: number;
  seed: number;
  seedLocked: boolean;
  globalNullRate: number; // 0 to 100
  noiseRate: number; // 0 to 100
  anonymizePII: boolean;
  exportFormat: ExportFormat;
  sqlDialect: SqlDialect;
  csvDelimiter: ',' | ';' | '\t';
  includeDropTable: boolean;
  prettifyJson: boolean;
  documentRegion?: DocumentRegion;
  // Edge cases injection
  injectEdgeCases?: boolean;
  edgeCaseIntensity?: EdgeCaseIntensity; // low (5%), medium (15%), high (30%)
  edgeCaseTypes?: EdgeCaseTypesConfig;
}

export interface GeneratedDataStats {
  totalRows: number;
  generationTimeMs: number;
  estimatedSizeBytes: number;
  columnCount: number;
  nullCount: number;
}

// Stored Dataset for Data Sources
export interface StoredDataset {
  id: string;
  userId?: string;
  name: string;
  format: 'csv' | 'json' | 'xlsx' | 'tsv';
  sizeBytes: number;
  rowCount: number;
  columnCount: number;
  headers: string[];
  records: Record<string, any>[];
  uploadedAt: number;
}

// EDA Profile Types
export interface ColumnEDAStats {
  name: string;
  inferredType: 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text' | 'id';
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  uniquePercentage: number;
  stats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    q1: number;
    q3: number;
    iqr: number;
    outlierCount: number;
    sampleOutliers: number[];
    histogram: { binStart: number; binEnd: number; count: number }[];
  };
  topCategories?: { value: string; count: number; percentage: number }[];
  pii?: {
    detected: boolean;
    type: 'email' | 'phone' | 'credit_card' | 'ssn' | 'ip' | null;
    sampleMatch?: string;
  };
}

export interface DatasetEDAReport {
  datasetId: string;
  datasetName: string;
  rowCount: number;
  columnCount: number;
  sizeBytes: number;
  duplicateRowsCount: number;
  totalMissingCells: number;
  missingPercentage: number;
  columns: ColumnEDAStats[];
  correlationMatrix?: {
    numericColumns: string[];
    matrix: number[][]; // values between -1 and 1
  };
  computedAt: number;
}

// Project export/import
export interface SynthForgeProject {
  version: 1;
  name: string;
  savedAt: string;
  settings: GenerationSettings;
  customColumns: ColumnDefinition[];
  relationalTables: TableSchema[];
  activeTab: TabType;
}

// Recent Job Log for Home Dashboard
export interface GenerationJobLog {
  id: string;
  timestamp: number;
  type: TabType;
  rowCount: number;
  columnCount: number;
  durationMs: number;
  seed: number;
  format: string;
  status?: 'completed' | 'in-progress' | 'failed';
  datasetName?: string;
}

// Time Series Generator Types
export type TimeSeriesFrequency = 'minute' | 'hour' | 'day';
export type TimeSeriesTrend = 'linear_up' | 'linear_down' | 'exponential' | 'damped' | 'flat';

export interface TimeSeriesSeasonality {
  daily: boolean;
  weekly: boolean;
  yearly: boolean;
}

export interface TimeSeriesAnomalyConfig {
  enabled: boolean;
  rate: number; // 0 to 15%
  magnitude: number; // multiplier e.g. 1.5 to 5.0
  type: 'spike' | 'drop' | 'mixed';
}

export interface TimeSeriesMetricConfig {
  id: string;
  name: string;
  baseValue: number;
  trend: TimeSeriesTrend;
  noiseLevel: number; // 0 to 100
  color: string;
  enabled: boolean;
  unit?: string;
}

export interface TimeSeriesSettings {
  frequency: TimeSeriesFrequency;
  length: number; // points count
  startDate: string; // ISO string or YYYY-MM-DD
  seasonality: TimeSeriesSeasonality;
  anomalies: TimeSeriesAnomalyConfig;
  metrics: TimeSeriesMetricConfig[];
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  timeLabel: string;
  isAnomaly?: boolean;
  anomalyType?: 'spike' | 'drop';
  [metricKey: string]: any;
}

// Quality & Fidelity Evaluation Types
export interface ColumnQualityMetric {
  column: string;
  type: 'numeric' | 'categorical';
  ksStatistic?: number;
  ksPValue?: number;
  tvd?: number;
  fidelityScore: number; // 0 - 100%
  passed: boolean;
  realMean?: number;
  synthMean?: number;
  realStd?: number;
  synthStd?: number;
}

export interface QualityReportData {
  overallFidelityScore: number; // 0 - 100%
  correlationDiffNorm: number; // 0 - 1 lower is better
  exactMatchCount: number;
  exactMatchPct: number; // percentage of synthetic records matching real exactly
  nndrScore: number; // Nearest Neighbor Distance Ratio
  privacyRisk: 'low' | 'medium' | 'high';
  metrics: ColumnQualityMetric[];
  realCorrelationMatrix?: { columns: string[]; data: number[][] };
  synthCorrelationMatrix?: { columns: string[]; data: number[][] };
  computedAt: number;
}

// Python Notebooks with Pyodide Types
export interface NotebookCell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: {
    type: 'text' | 'html' | 'image' | 'error';
    content: string;
  };
  isRunning?: boolean;
  executionCount?: number;
}

export interface NotebookDocument {
  id: string;
  title: string;
  description: string;
  cells: NotebookCell[];
  updatedAt: number;
}

// Scenario Builder Types
export interface ScenarioPreset {
  id: string;
  title: string;
  description: string;
  tag: string;
  iconName: string;
  impact: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  config: {
    type: 'tabular' | 'timeseries';
    columns?: ColumnDefinition[];
    settingsPatch?: Partial<GenerationSettings>;
    timeSeriesPatch?: Partial<TimeSeriesSettings>;
  };
}

// AI Copilot Types
export interface SchemaPatch {
  action: 'add_column' | 'modify_column' | 'remove_column' | 'update_settings';
  column?: Partial<ColumnDefinition>;
  columnId?: string;
  settings?: Partial<GenerationSettings>;
  explanation: string;
}

export interface CopilotResponse {
  summary: string;
  patches: SchemaPatch[];
  source?: 'gemini' | 'fallback';
}

