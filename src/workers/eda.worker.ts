import type { ColumnEDAStats, DatasetEDAReport } from '../types';

export interface EdaWorkerMessage {
  action: 'ANALYZE_DATASET';
  datasetId: string;
  datasetName: string;
  records: Record<string, any>[];
  headers: string[];
}

export interface EdaWorkerResponse {
  type: 'EDA_SUCCESS' | 'EDA_ERROR';
  datasetId: string;
  report?: DatasetEDAReport;
  error?: string;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/;
const IP_REGEX = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;

self.onmessage = (e: MessageEvent<EdaWorkerMessage>) => {
  const { action, datasetId, datasetName, records, headers } = e.data;

  if (action !== 'ANALYZE_DATASET') return;

  try {
    const rowCount = records.length;
    const columnCount = headers.length;
    const rawJsonStr = JSON.stringify(records);
    const sizeBytes = new Blob([rawJsonStr]).size;

    let totalMissingCells = 0;
    const columnStatsList: ColumnEDAStats[] = [];
    const numericColsData: { name: string; values: number[] }[] = [];

    // Analyze duplicate rows by hash
    const seenRowHashes = new Set<string>();
    let duplicateRowsCount = 0;
    const sampleLimit = Math.min(records.length, 5000);

    for (let i = 0; i < sampleLimit; i++) {
      const rowKey = JSON.stringify(records[i]);
      if (seenRowHashes.has(rowKey)) {
        duplicateRowsCount++;
      } else {
        seenRowHashes.add(rowKey);
      }
    }
    // Scale duplicate count if sampled
    if (records.length > sampleLimit) {
      duplicateRowsCount = Math.round((duplicateRowsCount / sampleLimit) * records.length);
    }

    // Process each column
    for (const colName of headers) {
      let missingCount = 0;
      const validValues: any[] = [];
      const valueFrequency = new Map<string, number>();

      let piiType: 'email' | 'phone' | 'credit_card' | 'ssn' | 'ip' | null = null;
      let samplePiiMatch: string | undefined = undefined;

      for (let r = 0; r < rowCount; r++) {
        const val = records[r]?.[colName];

        if (val === null || val === undefined || val === '' || String(val).trim().toLowerCase() === 'nan' || String(val).trim().toLowerCase() === 'null') {
          missingCount++;
          totalMissingCells++;
          continue;
        }

        validValues.push(val);
        const strVal = String(val);
        valueFrequency.set(strVal, (valueFrequency.get(strVal) || 0) + 1);

        // Check PII on first matches
        if (!piiType && r < 200) {
          if (EMAIL_REGEX.test(strVal)) {
            piiType = 'email';
            samplePiiMatch = strVal;
          } else if (SSN_REGEX.test(strVal)) {
            piiType = 'ssn';
            samplePiiMatch = strVal;
          } else if (CREDIT_CARD_REGEX.test(strVal) && strVal.replace(/\D/g, '').length >= 13) {
            piiType = 'credit_card';
            samplePiiMatch = strVal;
          } else if (PHONE_REGEX.test(strVal) && strVal.replace(/\D/g, '').length >= 10) {
            piiType = 'phone';
            samplePiiMatch = strVal;
          } else if (IP_REGEX.test(strVal)) {
            piiType = 'ip';
            samplePiiMatch = strVal;
          }
        }
      }

      const missingPercentage = rowCount > 0 ? Number(((missingCount / rowCount) * 100).toFixed(1)) : 0;
      const uniqueCount = valueFrequency.size;
      const uniquePercentage = validValues.length > 0 ? Number(((uniqueCount / validValues.length) * 100).toFixed(1)) : 0;

      // Inferred Type Detection
      let numericCount = 0;
      let dateCount = 0;
      let boolCount = 0;
      const parsedNumbers: number[] = [];

      const sampleSize = Math.min(validValues.length, 500);
      for (let i = 0; i < sampleSize; i++) {
        const v = validValues[i];
        if (typeof v === 'boolean' || v === 'true' || v === 'false' || v === 'TRUE' || v === 'FALSE') {
          boolCount++;
        }
        const num = typeof v === 'number' ? v : Number(v);
        if (!isNaN(num) && typeof v !== 'boolean' && String(v).trim() !== '') {
          numericCount++;
        }
        if (typeof v === 'string' && v.length >= 8 && !isNaN(Date.parse(v)) && isNaN(Number(v))) {
          dateCount++;
        }
      }

      let inferredType: ColumnEDAStats['inferredType'] = 'text';

      if (boolCount / sampleSize > 0.8) {
        inferredType = 'boolean';
      } else if (numericCount / sampleSize > 0.85) {
        inferredType = 'numeric';
        for (const v of validValues) {
          const n = Number(v);
          if (!isNaN(n)) parsedNumbers.push(n);
        }
      } else if (dateCount / sampleSize > 0.7) {
        inferredType = 'datetime';
      } else if (uniqueCount <= Math.min(25, validValues.length * 0.2)) {
        inferredType = 'categorical';
      } else if (uniquePercentage > 95 && validValues.length > 50) {
        inferredType = 'id';
      }

      // Column Stats for Numeric
      let stats: ColumnEDAStats['stats'] = undefined;
      if (inferredType === 'numeric' && parsedNumbers.length > 0) {
        parsedNumbers.sort((a, b) => a - b);
        const count = parsedNumbers.length;
        const min = parsedNumbers[0];
        const max = parsedNumbers[count - 1];
        const sum = parsedNumbers.reduce((acc, curr) => acc + curr, 0);
        const mean = Number((sum / count).toFixed(3));

        const getQuantile = (q: number) => {
          const pos = (count - 1) * q;
          const base = Math.floor(pos);
          const rest = pos - base;
          if (parsedNumbers[base + 1] !== undefined) {
            return parsedNumbers[base] + rest * (parsedNumbers[base + 1] - parsedNumbers[base]);
          }
          return parsedNumbers[base];
        };

        const median = Number(getQuantile(0.5).toFixed(3));
        const q1 = Number(getQuantile(0.25).toFixed(3));
        const q3 = Number(getQuantile(0.75).toFixed(3));
        const iqr = Number((q3 - q1).toFixed(3));

        const variance = parsedNumbers.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
        const stdDev = Number(Math.sqrt(variance).toFixed(3));

        // Outlier detection using IQR
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const outliers = parsedNumbers.filter((n) => n < lowerBound || n > upperBound);
        const outlierCount = outliers.length;
        const sampleOutliers = outliers.slice(0, 5);

        // 10-bin histogram
        const binCount = 10;
        const binStep = (max - min) / binCount || 1;
        const bins: { binStart: number; binEnd: number; count: number }[] = [];

        for (let b = 0; b < binCount; b++) {
          const bStart = Number((min + b * binStep).toFixed(2));
          const bEnd = Number((min + (b + 1) * binStep).toFixed(2));
          bins.push({ binStart: bStart, binEnd: bEnd, count: 0 });
        }

        for (const num of parsedNumbers) {
          const idx = Math.min(Math.floor((num - min) / (binStep || 1)), binCount - 1);
          if (idx >= 0 && idx < binCount) {
            bins[idx].count++;
          }
        }

        stats = {
          min,
          max,
          mean,
          median,
          stdDev,
          q1,
          q3,
          iqr,
          outlierCount,
          sampleOutliers,
          histogram: bins,
        };

        numericColsData.push({ name: colName, values: parsedNumbers });
      }

      // Top categories
      let topCategories: ColumnEDAStats['topCategories'] = undefined;
      if (inferredType === 'categorical' || inferredType === 'boolean' || inferredType === 'text') {
        const sortedCats = Array.from(valueFrequency.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        const totalValid = validValues.length || 1;
        topCategories = sortedCats.map(([val, freq]) => ({
          value: val,
          count: freq,
          percentage: Number(((freq / totalValid) * 100).toFixed(1)),
        }));
      }

      columnStatsList.push({
        name: colName,
        inferredType,
        missingCount,
        missingPercentage,
        uniqueCount,
        uniquePercentage,
        stats,
        topCategories,
        pii: piiType ? { detected: true, type: piiType, sampleMatch: samplePiiMatch } : undefined,
      });
    }

    // Correlation Heatmap calculation for numeric columns
    let correlationMatrix: DatasetEDAReport['correlationMatrix'] = undefined;
    const numCols = numericColsData.map((c) => c.name);

    if (numCols.length >= 2) {
      const matrix: number[][] = [];
      const colVectors: { mean: number; values: number[] }[] = [];

      for (const col of numericColsData) {
        const vals: number[] = [];
        for (let i = 0; i < rowCount; i++) {
          const raw = Number(records[i]?.[col.name]);
          vals.push(isNaN(raw) ? 0 : raw);
        }
        const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
        colVectors.push({ mean, values: vals });
      }

      for (let i = 0; i < colVectors.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < colVectors.length; j++) {
          if (i === j) {
            matrix[i][j] = 1.0;
            continue;
          }
          if (j < i) {
            matrix[i][j] = matrix[j][i];
            continue;
          }

          const vecA = colVectors[i];
          const vecB = colVectors[j];
          let num = 0;
          let denA = 0;
          let denB = 0;

          for (let k = 0; k < rowCount; k++) {
            const diffA = vecA.values[k] - vecA.mean;
            const diffB = vecB.values[k] - vecB.mean;
            num += diffA * diffB;
            denA += diffA * diffA;
            denB += diffB * diffB;
          }

          const den = Math.sqrt(denA * denB);
          const r = den === 0 ? 0 : num / den;
          matrix[i][j] = Number(Math.max(-1, Math.min(1, r)).toFixed(3));
        }
      }

      correlationMatrix = {
        numericColumns: numCols,
        matrix,
      };
    }

    const totalCells = Math.max(1, rowCount * columnCount);
    const missingPercentage = Number(((totalMissingCells / totalCells) * 100).toFixed(1));

    const report: DatasetEDAReport = {
      datasetId,
      datasetName,
      rowCount,
      columnCount,
      sizeBytes,
      duplicateRowsCount,
      totalMissingCells,
      missingPercentage,
      columns: columnStatsList,
      correlationMatrix,
      computedAt: Date.now(),
    };

    self.postMessage({
      type: 'EDA_SUCCESS',
      datasetId,
      report,
    });
  } catch (err: any) {
    self.postMessage({
      type: 'EDA_ERROR',
      datasetId,
      error: err?.message || 'EDA analysis failed in Web Worker',
    });
  }
};
