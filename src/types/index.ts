export type Theme = 'light' | 'dark' | 'ocean' | 'sunset';

export type TabType = 'tabular' | 'relational' | 'documents';

export type ExportFormat = 'csv' | 'json' | 'sql' | 'ndjson' | 'zip_csv';

export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite';

export type RelationshipCardinality = '1:1' | '1:N' | 'N:N';

export type ComputedAggregationType = 'sum' | 'count' | 'avg' | 'min' | 'max';

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
}

export interface GeneratedDataStats {
  totalRows: number;
  generationTimeMs: number;
  estimatedSizeBytes: number;
  columnCount: number;
  nullCount: number;
}
