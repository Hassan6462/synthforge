import { faker } from '@faker-js/faker';
import type { ColumnDefinition, CategoryWeight, SqlDialect, GenerationSettings } from '../types';
import { applyPrivacyTransform, applyEdgeCaseInjection } from './privacyAndEdgeCases';

/**
 * Weighted category random selection using faker
 */
export function sampleWeightedCategory(weights?: CategoryWeight[]): string {
  if (!weights || weights.length === 0) return 'Default';
  const totalWeight = weights.reduce((acc, w) => acc + Math.max(0, Number(w.weight) || 0), 0);
  if (totalWeight <= 0) return weights[0]?.value || 'Default';

  const threshold = faker.number.float({ min: 0, max: totalWeight });
  let cumulative = 0;
  for (const item of weights) {
    cumulative += Math.max(0, Number(item.weight) || 0);
    if (threshold <= cumulative) {
      return item.value;
    }
  }
  return weights[weights.length - 1].value;
}

/**
 * Generate a single raw value for a column definition
 */
export function generateRawValue(col: ColumnDefinition, rowIndex: number): string | number | boolean {
  switch (col.type) {
    case 'integer': {
      const min = col.min ?? 1;
      const max = col.max ?? 1000;
      return faker.number.int({ min, max });
    }

    case 'float': {
      const min = col.min ?? 0;
      const max = col.max ?? 100;
      const precision = col.precision ?? 2;
      return faker.number.float({ min, max, fractionDigits: precision });
    }

    case 'string': {
      const min = Math.max(1, col.min ?? 2);
      const max = Math.max(min, col.max ?? 5);
      return faker.lorem.words({ min, max });
    }

    case 'boolean':
      return faker.datatype.boolean();

    case 'date': {
      const minD = col.minDate || '2020-01-01';
      const maxD = col.maxDate || '2026-12-31';
      const d = faker.date.between({ from: minD, to: maxD });
      return d.toISOString().split('T')[0];
    }

    case 'category':
      return sampleWeightedCategory(col.categoryWeights);

    case 'uuid':
      return faker.string.uuid();

    case 'email':
      return faker.internet.email();

    case 'full name':
      return faker.person.fullName();

    case 'phone':
      return faker.phone.number();

    case 'address':
      return `${faker.location.streetAddress()}, ${faker.location.city()}`;

    case 'company':
      return faker.company.name();

    default:
      return `Item_${rowIndex + 1}`;
  }
}

/**
 * Escapes CSV field value conforming to RFC 4180
 */
export function escapeCsv(val: any, delimiter: string = ','): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Map column data type to SQL column type
 */
export function mapSqlType(type: string, dialect: SqlDialect): string {
  switch (type) {
    case 'uuid':
      return dialect === 'postgresql' ? 'UUID' : 'VARCHAR(36)';
    case 'float':
      return 'NUMERIC(12, 2)';
    case 'integer':
      return 'INTEGER';
    case 'boolean':
      return dialect === 'sqlite' ? 'INTEGER' : 'BOOLEAN';
    case 'date':
      return 'DATE';
    default:
      return 'VARCHAR(255)';
  }
}

/**
 * Generate preview rows deterministically using faker with seed
 */
export function generateTabularPreview(
  schema: ColumnDefinition[],
  rowCount: number,
  seed: number,
  previewLimit: number = 50,
  settings?: GenerationSettings
): { rows: Record<string, any>[]; nullCount: number; durationMs: number } {
  const startTime = performance.now();
  faker.seed(seed);

  const uniqueSets: Map<string, Set<any>> = new Map();
  schema.forEach((col) => {
    if (col.isUnique) uniqueSets.set(col.id, new Set());
  });

  const targetCount = Math.min(Math.max(1, rowCount), previewLimit || 50);
  const rows: Record<string, any>[] = [];
  let nullCount = 0;

  for (let r = 0; r < targetCount; r++) {
    const row: Record<string, any> = {};
    const prevRow = r > 0 ? rows[r - 1] : undefined;

    for (const col of schema) {
      const nullPct = Number(col.nullPercentage) || 0;
      if (nullPct > 0 && faker.number.float({ min: 0, max: 100 }) < nullPct) {
        row[col.name] = null;
        nullCount++;
        continue;
      }

      let val: any;
      if (col.isUnique) {
        const uSet = uniqueSets.get(col.id)!;
        let attempts = 0;
        do {
          val = generateRawValue(col, r);
          attempts++;
        } while (uSet.has(val) && attempts < 25);

        if (uSet.has(val)) {
          val = typeof val === 'number' ? val + r + 1 : `${val}_${r + 1}`;
        }
        uSet.add(val);
      } else {
        val = generateRawValue(col, r);
      }

      // Apply Privacy transforms (mask, hash, laplace noise)
      val = applyPrivacyTransform(val, col);

      // Apply Edge cases if settings enabled
      if (settings?.injectEdgeCases) {
        val = applyEdgeCaseInjection(val, col, r, settings, prevRow?.[col.name]);
      }

      if (val === null) nullCount++;
      row[col.name] = val;
    }
    rows.push(row);
  }

  const durationMs = Math.round(performance.now() - startTime);
  return { rows, nullCount, durationMs };
}

