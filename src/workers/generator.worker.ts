import { faker } from '@faker-js/faker';
import type { ColumnDefinition, CategoryWeight, SqlDialect, GenerationSettings, TableSchema, DocumentRegion } from '../types';
import {
  generateRawValue,
  escapeCsv,
  mapSqlType,
  generateTabularPreview,
} from '../utils/tabularFakerGenerator';
import { applyPrivacyTransform, applyEdgeCaseInjection } from '../utils/privacyAndEdgeCases';
import { generateRelationalData, generateDocumentData } from '../utils/generators';

export interface GenerateWorkerMessage {
  taskId: string;
  action: 'GENERATE_PREVIEW' | 'GENERATE_EXPORT_CHUNKED' | 'CANCEL_EXPORT' | 'GENERATE_RELATIONAL' | 'GENERATE_DOCUMENT';
  schema?: ColumnDefinition[];
  rowCount?: number;
  seed?: number;
  previewLimit?: number;
  format?: 'csv' | 'json' | 'sql';
  sqlDialect?: SqlDialect;
  csvDelimiter?: string;
  settings?: GenerationSettings;
  tables?: TableSchema[];
  templateType?: any;
  documentRegion?: DocumentRegion;
}

export interface GenerateWorkerResponse {
  taskId: string;
  type:
    | 'PREVIEW_SUCCESS'
    | 'EXPORT_PROGRESS'
    | 'EXPORT_SUCCESS'
    | 'EXPORT_CANCELLED'
    | 'RELATIONAL_SUCCESS'
    | 'DOCUMENT_SUCCESS'
    | 'ERROR';
  previewRows?: Record<string, any>[];
  relationalResult?: {
    tablesData: Record<string, any[]>;
    relationships: any[];
    stats: any;
  };
  documentResult?: {
    documents: any[];
    stats: any;
  };
  blob?: Blob;
  totalCount?: number;
  currentCount?: number;
  percent?: number;
  rowsPerSec?: number;
  durationMs?: number;
  nullCount?: number;
  filename?: string;
  mimeType?: string;
  error?: string;
}

const cancelledTasks = new Set<string>();

self.onmessage = async (e: MessageEvent<GenerateWorkerMessage>) => {
  const {
    taskId,
    action,
    schema = [],
    rowCount = 50,
    seed = 42,
    previewLimit = 50,
    format = 'csv',
    sqlDialect = 'postgresql',
    csvDelimiter = ',',
    settings,
    tables = [],
    templateType = 'invoice',
    documentRegion = 'US',
  } = e.data;

  // Handle Cancel
  if (action === 'CANCEL_EXPORT') {
    cancelledTasks.add(taskId);
    self.postMessage({ taskId, type: 'EXPORT_CANCELLED' });
    return;
  }

  // Handle Relational Generation
  if (action === 'GENERATE_RELATIONAL') {
    try {
      const res = generateRelationalData(tables, settings || ({} as any));
      self.postMessage({
        taskId,
        type: 'RELATIONAL_SUCCESS',
        relationalResult: res,
      });
    } catch (err: any) {
      self.postMessage({
        taskId,
        type: 'ERROR',
        error: err?.message || 'Relational generation failed in Web Worker',
      });
    }
    return;
  }

  // Handle Document Generation
  if (action === 'GENERATE_DOCUMENT') {
    try {
      const res = generateDocumentData(templateType, settings || ({} as any), documentRegion);
      self.postMessage({
        taskId,
        type: 'DOCUMENT_SUCCESS',
        documentResult: res,
      });
    } catch (err: any) {
      self.postMessage({
        taskId,
        type: 'ERROR',
        error: err?.message || 'Document generation failed in Web Worker',
      });
    }
    return;
  }

  // Handle Preview Generation
  if (action === 'GENERATE_PREVIEW') {
    try {
      const { rows, nullCount, durationMs } = generateTabularPreview(
        schema,
        rowCount,
        seed,
        previewLimit || 50,
        settings
      );

      self.postMessage({
        taskId,
        type: 'PREVIEW_SUCCESS',
        previewRows: rows,
        totalCount: rowCount,
        durationMs,
        nullCount,
      });
    } catch (err: any) {
      self.postMessage({
        taskId,
        type: 'ERROR',
        error: err?.message || 'Preview generation error in Web Worker',
      });
    }
    return;
  }

  // Handle Chunked Export (up to 1,000,000 rows)
  if (action === 'GENERATE_EXPORT_CHUNKED') {
    const startTime = performance.now();
    cancelledTasks.delete(taskId);

    try {
      faker.seed(seed);
      const uniqueSets: Map<string, Set<any>> = new Map();
      schema.forEach((col) => {
        if (col.isUnique) uniqueSets.set(col.id, new Set());
      });

      const totalRows = Math.min(Math.max(1, rowCount), 1000000);
      const chunkSize = totalRows > 100000 ? 10000 : 5000;
      const blobParts: string[] = [];

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      let filename = `synthforge_${format}_${totalRows}_rows_${timestamp}.${format}`;
      let mimeType = 'text/plain';

      // 1. Initialize format headers
      if (format === 'csv') {
        mimeType = 'text/csv;charset=utf-8;';
        const headers = schema.map((c) => escapeCsv(c.name, csvDelimiter)).join(csvDelimiter);
        blobParts.push(headers + '\n');
      } else if (format === 'json') {
        mimeType = 'application/json;charset=utf-8;';
        blobParts.push('[\n');
      } else if (format === 'sql') {
        mimeType = 'application/sql;charset=utf-8;';
        filename = `synthforge_insert_${totalRows}_rows_${timestamp}.sql`;

        const q = (s: string) => (sqlDialect === 'mysql' ? `\`${s}\`` : `"${s}"`);
        const tableIdent = q('synth_data');

        blobParts.push(`-- SynthForge SQL INSERT Export\n`);
        blobParts.push(`-- Dialect: ${sqlDialect.toUpperCase()} | Total Rows: ${totalRows} | Seed: ${seed}\n\n`);
        blobParts.push(`DROP TABLE IF EXISTS ${tableIdent};\n`);
        blobParts.push(`CREATE TABLE ${tableIdent} (\n`);
        const colSqlDefs = schema.map((col, idx) => {
          const sqlType = mapSqlType(col.type, sqlDialect);
          const isPk = idx === 0 || col.isUnique;
          return `  ${q(col.name)} ${sqlType}${isPk && idx === 0 ? ' PRIMARY KEY' : ''}`;
        });
        blobParts.push(colSqlDefs.join(',\n') + '\n);\n\n');
      }

      let generated = 0;
      let sqlBatchValues: string[] = [];
      const colNamesSql = schema.map((c) => (sqlDialect === 'mysql' ? `\`${c.name}\`` : `"${c.name}"`)).join(', ');
      const sqlBatchLimit = sqlDialect === 'sqlite' ? 250 : 500;

      while (generated < totalRows) {
        if (cancelledTasks.has(taskId)) {
          self.postMessage({ taskId, type: 'EXPORT_CANCELLED' });
          return;
        }

        const currentChunkTarget = Math.min(generated + chunkSize, totalRows);
        let chunkText = '';

        let prevRowVals: any[] | undefined = undefined;

        for (let r = generated; r < currentChunkTarget; r++) {
          const rowValues: any[] = [];

          for (let colIdx = 0; colIdx < schema.length; colIdx++) {
            const col = schema[colIdx];
            const nullPct = Number(col.nullPercentage) || 0;
            if (nullPct > 0 && faker.number.float({ min: 0, max: 100 }) < nullPct) {
              rowValues.push(null);
              continue;
            }

            let val: any;
            if (col.isUnique) {
              const uSet = uniqueSets.get(col.id)!;
              let attempts = 0;
              do {
                val = generateRawValue(col, r);
                attempts++;
              } while (uSet.has(val) && attempts < 20);

              if (uSet.has(val)) {
                val = typeof val === 'number' ? val + r + 1 : `${val}_${r + 1}`;
              }
              uSet.add(val);
            } else {
              val = generateRawValue(col, r);
            }

            // Apply privacy transforms
            val = applyPrivacyTransform(val, col);

            // Apply edge cases if settings enabled
            if (settings?.injectEdgeCases) {
              val = applyEdgeCaseInjection(val, col, r, settings, prevRowVals?.[colIdx]);
            }

            rowValues.push(val);
          }

          prevRowVals = rowValues;

          if (format === 'csv') {
            const line = rowValues.map((v) => escapeCsv(v, csvDelimiter)).join(csvDelimiter);
            chunkText += line + '\n';
          } else if (format === 'json') {
            const rowObj: Record<string, any> = {};
            schema.forEach((col, idx) => {
              rowObj[col.name] = rowValues[idx];
            });
            const isLast = r === totalRows - 1;
            chunkText += '  ' + JSON.stringify(rowObj) + (isLast ? '\n' : ',\n');
          } else if (format === 'sql') {
            const sqlVals = rowValues.map((val) => {
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'number') return String(val);
              if (typeof val === 'boolean') {
                if (sqlDialect === 'sqlite') return val ? '1' : '0';
                return val ? 'TRUE' : 'FALSE';
              }
              const escaped = String(val).replace(/'/g, "''");
              return `'${escaped}'`;
            });
            sqlBatchValues.push(`  (${sqlVals.join(', ')})`);

            if (sqlBatchValues.length >= sqlBatchLimit || r === totalRows - 1) {
              const tableIdent = sqlDialect === 'mysql' ? '`synth_data`' : '"synth_data"';
              chunkText += `INSERT INTO ${tableIdent} (${colNamesSql}) VALUES\n${sqlBatchValues.join(',\n')};\n\n`;
              sqlBatchValues = [];
            }
          }
        }

        blobParts.push(chunkText);
        generated = currentChunkTarget;

        const elapsedSec = (performance.now() - startTime) / 1000;
        const rowsPerSec = elapsedSec > 0 ? Math.round(generated / elapsedSec) : 0;
        const percent = Math.round((generated / totalRows) * 100);

        self.postMessage({
          taskId,
          type: 'EXPORT_PROGRESS',
          currentCount: generated,
          totalCount: totalRows,
          percent,
          rowsPerSec,
        });

        // Yield to event loop
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (format === 'json') {
        blobParts.push(']');
      }

      const totalDurationMs = Math.round(performance.now() - startTime);
      const finalBlob = new Blob(blobParts, { type: mimeType });

      self.postMessage({
        taskId,
        type: 'EXPORT_SUCCESS',
        blob: finalBlob,
        totalCount: totalRows,
        durationMs: totalDurationMs,
        filename,
        mimeType,
      });
    } catch (err: any) {
      self.postMessage({
        taskId,
        type: 'ERROR',
        error: err?.message || 'Export generation failed in Web Worker',
      });
    }
  }
};
