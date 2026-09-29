import type { ColumnDefinition, ColumnDataType, CategoryWeight } from '../types';

export interface ParsedDataResult {
  headers: string[];
  records: Record<string, any>[];
  columns: ColumnDefinition[];
  format: 'csv' | 'json' | 'xlsx' | 'tsv';
}

/**
 * Robust RFC 4180 compliant CSV / TSV line parser
 */
export function parseDelimitedText(text: string, delimiter?: string): { headers: string[]; rows: string[][] } {
  const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n');

  if (!delimiter) {
    const firstLine = lines[0] || '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    delimiter = tabCount > commaCount && tabCount > semiCount ? '\t' : semiCount > commaCount ? ';' : ',';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].map((h, i) => h.replace(/^["']|["']$/g, '').trim() || `column_${i + 1}`);
  const dataRows = rows.slice(1);

  return { headers, rows: dataRows };
}

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_PATTERN = /^(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Infer column definitions and empirical distributions from sample data rows
 */
export function inferSchemaFromData(headers: string[], records: Record<string, any>[]): ColumnDefinition[] {
  const totalRows = records.length;
  if (totalRows === 0) {
    return headers.map((h, i) => ({
      id: `col_${i}_${Date.now()}`,
      name: h,
      type: 'string',
      nullPercentage: 0,
      isUnique: i === 0,
    }));
  }

  return headers.map((h, colIndex) => {
    let emptyCount = 0;
    const nonNullValues: any[] = [];
    const valueCounts = new Map<string, number>();

    for (let r = 0; r < totalRows; r++) {
      const val = records[r][h];
      if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') {
        emptyCount++;
      } else {
        nonNullValues.push(val);
        const strKey = String(val).trim();
        valueCounts.set(strKey, (valueCounts.get(strKey) || 0) + 1);
      }
    }

    const nullPercentage = Math.round((emptyCount / totalRows) * 100);
    const validCount = nonNullValues.length;
    const isUnique = validCount > 5 && valueCounts.size === validCount;

    // Check patterns on sample
    const sample = nonNullValues.slice(0, 300);
    let integerCount = 0;
    let floatCount = 0;
    let boolCount = 0;
    let dateCount = 0;
    let emailCount = 0;
    let phoneCount = 0;
    let uuidCount = 0;

    let minNum = Infinity;
    let maxNum = -Infinity;
    let maxPrecision = 0;
    let minDateMs = Infinity;
    let maxDateMs = -Infinity;

    for (const v of sample) {
      const s = String(v).trim();
      const num = Number(s);

      if (v === true || v === false || s === 'true' || s === 'false' || s === 'TRUE' || s === 'FALSE') {
        boolCount++;
      } else if (!isNaN(num) && s !== '') {
        if (Number.isInteger(num)) {
          integerCount++;
        } else {
          floatCount++;
          const parts = s.split('.');
          if (parts[1]) maxPrecision = Math.max(maxPrecision, parts[1].length);
        }
        if (num < minNum) minNum = num;
        if (num > maxNum) maxNum = num;
      } else if (s.length >= 8 && !isNaN(Date.parse(s))) {
        dateCount++;
        const ms = Date.parse(s);
        if (ms < minDateMs) minDateMs = ms;
        if (ms > maxDateMs) maxDateMs = ms;
      } else if (EMAIL_PATTERN.test(s)) {
        emailCount++;
      } else if (PHONE_PATTERN.test(s)) {
        phoneCount++;
      } else if (UUID_PATTERN.test(s)) {
        uuidCount++;
      }
    }

    const count = sample.length || 1;
    let inferredType: ColumnDataType = 'string';
    let min: number | undefined = undefined;
    let max: number | undefined = undefined;
    let precision: number | undefined = undefined;
    let minDate: string | undefined = undefined;
    let maxDate: string | undefined = undefined;
    let categoryWeights: CategoryWeight[] | undefined = undefined;

    if (uuidCount / count > 0.6) {
      inferredType = 'uuid';
    } else if (emailCount / count > 0.6) {
      inferredType = 'email';
    } else if (phoneCount / count > 0.6) {
      inferredType = 'phone';
    } else if (boolCount / count > 0.7) {
      inferredType = 'boolean';
    } else if ((integerCount + floatCount) / count > 0.8) {
      if (floatCount > 0 || maxPrecision > 0) {
        inferredType = 'float';
        min = Math.floor(minNum);
        max = Math.ceil(maxNum);
        precision = Math.min(4, Math.max(1, maxPrecision));
      } else {
        inferredType = 'integer';
        min = Math.floor(minNum);
        max = Math.ceil(maxNum);
      }
    } else if (dateCount / count > 0.6) {
      inferredType = 'date';
      minDate = !isNaN(minDateMs) && minDateMs !== Infinity ? new Date(minDateMs).toISOString().split('T')[0] : '2020-01-01';
      maxDate = !isNaN(maxDateMs) && maxDateMs !== -Infinity ? new Date(maxDateMs).toISOString().split('T')[0] : '2026-12-31';
    } else if (valueCounts.size <= Math.min(15, count * 0.25) && valueCounts.size > 1) {
      inferredType = 'category';
      const sorted = Array.from(valueCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      categoryWeights = sorted.map(([val, freq], idx) => ({
        id: `cw_${idx}`,
        value: val,
        weight: Math.max(1, Math.round((freq / validCount) * 100)),
      }));
    } else {
      const lowerHeader = h.toLowerCase();
      if (lowerHeader.includes('name') && !lowerHeader.includes('file')) {
        inferredType = 'full name';
      } else if (lowerHeader.includes('address') || lowerHeader.includes('city') || lowerHeader.includes('street')) {
        inferredType = 'address';
      } else if (lowerHeader.includes('company') || lowerHeader.includes('org')) {
        inferredType = 'company';
      } else {
        inferredType = 'string';
        min = 2;
        max = 5;
      }
    }

    return {
      id: `col_${colIndex}_${Date.now()}`,
      name: h.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
      type: inferredType,
      nullPercentage,
      isUnique,
      min,
      max,
      precision,
      minDate,
      maxDate,
      categoryWeights,
    };
  });
}

/**
 * Parses File object into headers, records, and auto-inferred schema
 */
export async function parseUploadedDataFile(file: File): Promise<ParsedDataResult> {
  const fileName = file.name.toLowerCase();

  // 1. JSON File
  if (fileName.endsWith('.json')) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const records = Array.isArray(parsed) ? parsed : [parsed];
    const headers = Object.keys(records[0] || {});
    const columns = inferSchemaFromData(headers, records);
    return { headers, records, columns, format: 'json' };
  }

  // 2. Excel File (.xlsx, .xls)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Spreadsheet file exceeds the 10 MB limit. Please upload a smaller file.');
    }
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });
    const headers = rawJson.length > 0 ? Object.keys(rawJson[0]) : [];
    const columns = inferSchemaFromData(headers, rawJson);
    return { headers, records: rawJson, columns, format: 'xlsx' };
  }

  // 3. Delimited Text (.csv, .tsv, .txt)
  const text = await file.text();
  const delimiter = fileName.endsWith('.tsv') ? '\t' : undefined;
  const { headers, rows } = parseDelimitedText(text, delimiter);

  const records: Record<string, any>[] = rows.map((row) => {
    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] !== undefined && row[idx] !== '' ? row[idx] : null;
    });
    return obj;
  });

  const columns = inferSchemaFromData(headers, records);
  return {
    headers,
    records,
    columns,
    format: fileName.endsWith('.tsv') ? 'tsv' : 'csv',
  };
}
