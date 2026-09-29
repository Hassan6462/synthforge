import { ColumnDefinition, GenerationSettings, TableSchema, CategoryWeight } from '../types';
import { PRNG } from './prng';

// Realistic Seed Datasets
const FIRST_NAMES = [
  'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Amelia', 'Elijah', 'Sophia',
  'Mateo', 'Isabella', 'Lucas', 'Mia', 'Aiden', 'Harper', 'Kaito', 'Aoi',
  'Ren', 'Yuki', 'Zara', 'Fatima', 'Tariq', 'Elena', 'Dmitri', 'Carlos',
  'Lucia', 'Chioma', 'Kwame', 'Ananya', 'Arjun', 'Mei-Ling', 'Chen', 'Soren'
];

const LAST_NAMES = [
  'Vance', 'Lindqvist', 'Nakamura', 'Chen', 'Patel', 'Okonkwo', 'Garcia',
  'Novak', 'Al-Mansoor', 'Kowalski', 'Dubois', 'Mendoza', 'Schmidt', 'Svensson',
  'Rossi', 'Kim', 'Bauer', 'Tanaka', 'Hassan', 'Goldman', 'Thornton', 'Mercer'
];

const COMPANIES = [
  'Nexus Dynamic', 'Aetheric Systems', 'Vanguard Data', 'Helios Robotics',
  'Quantix Analytics', 'Solace Cloud', 'Terran Dynamics', 'Cortex Automations',
  'Meridian Logistics', 'Hyperion Aerospace', 'Catalyst Media', 'Pulse Healthtech'
];

const CITIES = [
  { city: 'San Francisco', country: 'United States', postal: '94107' },
  { city: 'Stockholm', country: 'Sweden', postal: '111 22' },
  { city: 'Tokyo', country: 'Japan', postal: '100-0001' },
  { city: 'Berlin', country: 'Germany', postal: '10115' },
  { city: 'Singapore', country: 'Singapore', postal: '018989' },
  { city: 'Toronto', country: 'Canada', postal: 'M5H 2N2' },
  { city: 'London', country: 'United Kingdom', postal: 'EC2A 4NE' },
  { city: 'Austin', country: 'United States', postal: '78701' },
];

const STREET_NAMES = [
  'Market Street', 'Kaufingerstrasse', 'Champs-Élysées', 'Queen Street',
  'Kitsilano Way', 'Brandenburg Boulevard', 'Orchard Road', 'King William St',
  'Shinagawa Avenue', 'Battery Park Esplanade'
];

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/125.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) Mobile/15E148',
  'SynthForge-Worker/2.4 (compatible; internal-engine)'
];

export function generateUUID(prng: PRNG): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = prng.nextInt(0, 15);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function sampleCategory(weights?: CategoryWeight[], prng?: PRNG): string {
  if (!weights || weights.length === 0) return 'Standard';
  const total = weights.reduce((acc, w) => acc + Math.max(0, w.weight), 0);
  if (total <= 0) return weights[0].value;
  const p = prng ? prng.nextFloat(0, total, 2) : Math.random() * total;
  let acc = 0;
  for (const w of weights) {
    acc += Math.max(0, w.weight);
    if (p <= acc) return w.value;
  }
  return weights[weights.length - 1].value;
}

export function generateColumnValue(
  col: ColumnDefinition,
  rowIndex: number,
  prng: PRNG,
  settings: GenerationSettings
): string | number | boolean | null {
  // Check null injection
  const effectiveNullRate = (col.nullPercentage ?? 0) + (settings.globalNullRate || 0);
  if (effectiveNullRate > 0 && prng.next() * 100 < effectiveNullRate) {
    return null;
  }

  const isDirty = settings.noiseRate > 0 && prng.next() * 100 < settings.noiseRate;
  let val: string | number | boolean = '';

  switch (col.type) {
    case 'uuid':
      val = generateUUID(prng);
      break;

    case 'full name': {
      if (settings.anonymizePII) {
        val = `Subject_${(rowIndex + 100).toString().padStart(4, '0')}`;
      } else {
        const first = prng.nextItem(FIRST_NAMES);
        const last = prng.nextItem(LAST_NAMES);
        val = `${first} ${last}`;
      }
      break;
    }

    case 'email': {
      if (settings.anonymizePII) {
        val = `user_${rowIndex + 100}@synthetic.internal`;
      } else {
        const first = prng.nextItem(FIRST_NAMES).toLowerCase().replace(/[^a-z]/g, '');
        const last = prng.nextItem(LAST_NAMES).toLowerCase().replace(/[^a-z]/g, '');
        const domain = prng.nextItem(['synthforge.io', 'apexdata.dev', 'cloudmatrix.co', 'acmecorp.org']);
        val = `${first}.${last}${prng.nextInt(1, 99)}@${domain}`;
      }
      break;
    }

    case 'phone': {
      if (settings.anonymizePII) {
        val = '+1-555-01' + prng.nextInt(10, 99).toString();
      } else {
        const area = prng.nextInt(200, 989);
        const mid = prng.nextInt(200, 899);
        const end = prng.nextInt(1000, 9999);
        val = `+1 (${area}) ${mid}-${end}`;
      }
      break;
    }

    case 'address': {
      const num = prng.nextInt(12, 1400);
      const street = prng.nextItem(STREET_NAMES);
      const loc = prng.nextItem(CITIES);
      val = `${num} ${street}, ${loc.city}`;
      break;
    }

    case 'company':
      val = prng.nextItem(COMPANIES);
      break;

    case 'integer': {
      const min = col.min ?? 1;
      const max = col.max ?? 1000;
      val = prng.nextInt(min, max);
      break;
    }

    case 'float': {
      const min = col.min ?? 0;
      const max = col.max ?? 100;
      const precision = col.precision ?? 2;
      val = prng.nextFloat(min, max, precision);
      break;
    }

    case 'string': {
      const wordsCount = prng.nextInt(col.min ?? 2, col.max ?? 5);
      const sampleWords = ['data', 'pipeline', 'metric', 'stream', 'cluster', 'node', 'index', 'record', 'model', 'cache'];
      val = Array.from({ length: wordsCount }, () => prng.nextItem(sampleWords)).join(' ');
      break;
    }

    case 'boolean':
      val = prng.nextBoolean(0.5);
      break;

    case 'date': {
      const minD = col.minDate ? new Date(col.minDate).getTime() : Date.now() - 365 * 86400 * 1000;
      const maxD = col.maxDate ? new Date(col.maxDate).getTime() : Date.now();
      const randTime = minD + prng.next() * (maxD - minD);
      val = new Date(randTime).toISOString().split('T')[0];
      break;
    }

    case 'category':
      val = sampleCategory(col.categoryWeights, prng);
      break;

    default:
      val = `Item_${rowIndex + 1}`;
  }

  if (isDirty) {
    if (typeof val === 'string') {
      const noiseVariant = prng.nextInt(1, 3);
      if (noiseVariant === 1) val = `  ${val}  `;
      else if (noiseVariant === 2) val = val.toLowerCase();
      else val = 'N/A';
    } else if (typeof val === 'number') {
      val = -999;
    }
  }

  return val;
}

export function generateTabularData(
  columns: ColumnDefinition[],
  settings: GenerationSettings
): { rows: Record<string, any>[]; stats: any } {
  const startTime = performance.now();
  const prng = new PRNG(settings.seed);
  const rows: Record<string, any>[] = [];
  let nullCounter = 0;

  for (let r = 0; r < settings.rowCount; r++) {
    const row: Record<string, any> = {};
    for (const col of columns) {
      const val = generateColumnValue(col, r, prng, settings);
      if (val === null) nullCounter++;
      row[col.name] = val;
    }
    rows.push(row);
  }

  const durationMs = Math.round(performance.now() - startTime);
  const rawJson = JSON.stringify(rows);

  return {
    rows,
    stats: {
      totalRows: rows.length,
      generationTimeMs: durationMs,
      estimatedSizeBytes: rawJson.length,
      columnCount: columns.length,
      nullCount: nullCounter,
    },
  };
}

/**
 * Sort tables topologically so parents are always generated before children
 */
function sortTablesTopologically(tables: TableSchema[]): TableSchema[] {
  const visited = new Set<string>();
  const result: TableSchema[] = [];
  const tableMap = new Map<string, TableSchema>(tables.map((t) => [t.name, t]));

  function visit(table: TableSchema) {
    if (visited.has(table.name)) return;
    visited.add(table.name);

    if (table.foreignKeys) {
      for (const fk of table.foreignKeys) {
        const parentTable = tableMap.get(fk.targetTable);
        if (parentTable && parentTable.name !== table.name) {
          visit(parentTable);
        }
      }
    }
    result.push(table);
  }

  tables.forEach(visit);
  return result;
}

export function generateRelationalData(
  tables: TableSchema[],
  settings: GenerationSettings
): {
  tablesData: Record<string, Record<string, any>[]>;
  stats: any;
  relationships: {
    id: string;
    parentTable: string;
    childTable: string;
    fkCol: string;
    pkCol: string;
    cardinality: string;
    linkCount: number;
  }[];
} {
  const startTime = performance.now();
  const prng = new PRNG(settings.seed);
  const tablesData: Record<string, Record<string, any>[]> = {};
  const relationshipsSummary: {
    id: string;
    parentTable: string;
    childTable: string;
    fkCol: string;
    pkCol: string;
    cardinality: string;
    linkCount: number;
  }[] = [];

  let totalRowsGenerated = 0;
  let totalNulls = 0;

  // 1. Sort tables topologically: parents generated first!
  const sortedTables = sortTablesTopologically(tables);

  // 2. Generate each table in dependency order
  for (const table of sortedTables) {
    const generatedRows: Record<string, any>[] = [];
    const baseCount = Math.min(Math.max(10, settings.rowCount), 60);

    const fks = table.foreignKeys || [];

    if (fks.length === 0) {
      // Standalone Root Parent Table
      for (let r = 0; r < baseCount; r++) {
        const row: Record<string, any> = {};
        for (const col of table.columns) {
          if (col.isComputed) continue; // Will be computed after children
          const val = generateColumnValue(col, r, prng, settings);
          if (val === null) totalNulls++;
          row[col.name] = val;
        }
        generatedRows.push(row);
      }
    } else if (fks.length === 1) {
      // Standard 1:1 or 1:N Child Table
      const fk = fks[0];
      const parentRows = tablesData[fk.targetTable] || [];
      const cardinality = fk.cardinality || '1:N';
      let childIndex = 0;

      if (cardinality === '1:1') {
        // Exactly one child row per parent row
        for (const parent of parentRows) {
          const parentPk = parent[fk.targetColumn];
          const row: Record<string, any> = {};
          for (const col of table.columns) {
            if (col.name === fk.column) {
              row[col.name] = parentPk; // Pick existing parent ID - zero orphans!
            } else if (col.name === 'line_total' && row['quantity'] && row['unit_price']) {
              row['line_total'] = Number((Number(row['quantity']) * Number(row['unit_price'])).toFixed(2));
            } else {
              const val = generateColumnValue(col, childIndex, prng, settings);
              if (val === null) totalNulls++;
              row[col.name] = val;
            }
          }
          if (row['quantity'] && row['unit_price']) {
            row['line_total'] = Number((Number(row['quantity']) * Number(row['unit_price'])).toFixed(2));
          }
          generatedRows.push(row);
          childIndex++;
        }
      } else {
        // 1:N Cardinality
        const minRatio = fk.ratioMin ?? 1;
        const maxRatio = fk.ratioMax ?? 4;

        for (const parent of parentRows) {
          const parentPk = parent[fk.targetColumn];
          const numChildren = prng.nextInt(minRatio, maxRatio);

          for (let c = 0; c < numChildren; c++) {
            const row: Record<string, any> = {};
            for (const col of table.columns) {
              if (col.name === fk.column) {
                row[col.name] = parentPk; // Pick existing parent ID!
              } else {
                const val = generateColumnValue(col, childIndex, prng, settings);
                if (val === null) totalNulls++;
                row[col.name] = val;
              }
            }
            if (row['quantity'] && row['unit_price']) {
              row['line_total'] = Number((Number(row['quantity']) * Number(row['unit_price'])).toFixed(2));
            }
            generatedRows.push(row);
            childIndex++;
          }
        }
      }

      relationshipsSummary.push({
        id: fk.id || `rel_${fk.targetTable}_${table.name}`,
        parentTable: fk.targetTable,
        childTable: table.name,
        fkCol: fk.column,
        pkCol: fk.targetColumn,
        cardinality,
        linkCount: generatedRows.length,
      });
    } else {
      // Junction Table (N:N or multi-FK)
      const primaryFk = fks[0];
      const secondaryFk = fks[1];
      const parentARows = tablesData[primaryFk.targetTable] || [];
      const parentBRows = tablesData[secondaryFk.targetTable] || [];
      let childIndex = 0;

      for (const parentA of parentARows) {
        const pkA = parentA[primaryFk.targetColumn];
        const numLinks = prng.nextInt(primaryFk.ratioMin || 1, primaryFk.ratioMax || 3);
        const shuffledB = prng.shuffle(parentBRows);
        const selectedB = shuffledB.slice(0, Math.min(numLinks, shuffledB.length));

        for (const parentB of selectedB) {
          const pkB = parentB[secondaryFk.targetColumn];
          const row: Record<string, any> = {};

          for (const col of table.columns) {
            if (col.name === primaryFk.column) {
              row[col.name] = pkA;
            } else if (col.name === secondaryFk.column) {
              row[col.name] = pkB;
            } else {
              const val = generateColumnValue(col, childIndex, prng, settings);
              if (val === null) totalNulls++;
              row[col.name] = val;
            }
          }
          generatedRows.push(row);
          childIndex++;
        }
      }

      fks.forEach((fk) => {
        relationshipsSummary.push({
          id: fk.id || `rel_${fk.targetTable}_${table.name}`,
          parentTable: fk.targetTable,
          childTable: table.name,
          fkCol: fk.column,
          pkCol: fk.targetColumn,
          cardinality: 'N:N',
          linkCount: generatedRows.length,
        });
      });
    }

    tablesData[table.name] = generatedRows;
    totalRowsGenerated += generatedRows.length;
  }

  // 3. Post-Process Computed Columns (e.g. orders.total_amount = sum(order_items.line_total))
  for (const table of sortedTables) {
    const computedCols = table.columns.filter((c) => c.isComputed && c.computedConfig);
    if (computedCols.length === 0) continue;

    const parentRows = tablesData[table.name] || [];

    for (const col of computedCols) {
      const config = col.computedConfig!;
      const childRows = tablesData[config.targetChildTable] || [];

      for (const parentRow of parentRows) {
        const parentPk = parentRow[table.primaryKey];
        // Filter child rows referencing this parent
        const matchingChildren = childRows.filter(
          (cr) => cr[config.foreignKeyColumn] === parentPk
        );

        let result: number = 0;
        if (config.aggregation === 'count') {
          result = matchingChildren.length;
        } else if (matchingChildren.length === 0) {
          result = 0;
        } else {
          const values = matchingChildren
            .map((cr) => Number(cr[config.targetChildColumn]) || 0)
            .filter((v) => !isNaN(v));

          if (config.aggregation === 'sum') {
            result = values.reduce((acc, v) => acc + v, 0);
          } else if (config.aggregation === 'avg') {
            result = values.reduce((acc, v) => acc + v, 0) / Math.max(1, values.length);
          } else if (config.aggregation === 'min') {
            result = Math.min(...values);
          } else if (config.aggregation === 'max') {
            result = Math.max(...values);
          }
        }

        parentRow[col.name] = col.type === 'float' ? Number(result.toFixed(2)) : Math.round(result);
      }
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
  const rawSize = JSON.stringify(tablesData).length;

  return {
    tablesData,
    relationships: relationshipsSummary,
    stats: {
      totalRows: totalRowsGenerated,
      generationTimeMs: durationMs,
      estimatedSizeBytes: rawSize,
      columnCount: tables.reduce((acc, t) => acc + t.columns.length, 0),
      nullCount: totalNulls,
    },
  };
}

import { generateInvoices, generateBankStatements } from './documentGenerators';
import { DocumentRegion } from '../types/documents';

export function generateDocumentData(
  templateType: 'invoice' | 'bank_statement' | 'audit_log' | 'support_ticket' | 'clinical_encounter' | 'invoice_receipt',
  settings: GenerationSettings,
  selectedRegion?: DocumentRegion
): { documents: any[]; stats: any } {
  const startTime = performance.now();
  const region: DocumentRegion = selectedRegion || settings.documentRegion || 'US';
  const count = Math.min(Math.max(1, settings.rowCount), 1000);

  if (templateType === 'invoice' || templateType === 'invoice_receipt') {
    const invoices = generateInvoices(count, region, settings);
    const durationMs = Math.round(performance.now() - startTime);
    const rawSize = JSON.stringify(invoices).length;
    return {
      documents: invoices,
      stats: {
        totalRows: invoices.length,
        generationTimeMs: durationMs,
        estimatedSizeBytes: rawSize,
        columnCount: 16,
        nullCount: 0,
      },
    };
  }

  if (templateType === 'bank_statement') {
    const statements = generateBankStatements(count, region, settings);
    const durationMs = Math.round(performance.now() - startTime);
    const rawSize = JSON.stringify(statements).length;
    return {
      documents: statements,
      stats: {
        totalRows: statements.length,
        generationTimeMs: durationMs,
        estimatedSizeBytes: rawSize,
        columnCount: 18,
        nullCount: 0,
      },
    };
  }

  const prng = new PRNG(settings.seed);
  const docs: any[] = [];
  const previewCount = Math.min(count, 100);

  for (let i = 0; i < previewCount; i++) {
    switch (templateType) {
      case 'audit_log': {
        const first = prng.nextItem(FIRST_NAMES);
        const last = prng.nextItem(LAST_NAMES);
        docs.push({
          eventId: generateUUID(prng),
          timestamp: new Date(Date.now() - prng.nextInt(10, 86400 * 7) * 1000).toISOString(),
          eventType: 'audit.activity',
          severity: prng.nextItem(['NOTICE', 'INFO', 'WARNING', 'CRITICAL']),
          actor: {
            principalId: `usr_${1000 + i}`,
            email: settings.anonymizePII ? `masked_user_${i}@internal` : `${first.toLowerCase()}.${last.toLowerCase()}@synthforge.cloud`,
            ipAddress: `${prng.nextInt(40, 192)}.${prng.nextInt(1, 240)}.${prng.nextInt(1, 250)}.${prng.nextInt(1, 254)}`,
            userAgent: prng.nextItem(USER_AGENTS),
          },
          status: { code: 200, message: 'Operation executed successfully' },
        });
        break;
      }

      case 'support_ticket': {
        const custFirst = prng.nextItem(FIRST_NAMES);
        const custLast = prng.nextItem(LAST_NAMES);
        docs.push({
          ticketId: `TICK-${20000 + i}`,
          createdAt: new Date(Date.now() - prng.nextInt(3600, 86400 * 14) * 1000).toISOString(),
          subject: prng.nextItem([
            'Webhook payload signature verification failed on high throughput',
            'Latency degradation on postgres replica cluster in eu-west-1',
            'Feature request: SCIM automated provisioning support for Okta',
          ]),
          priority: prng.nextItem(['Low', 'Normal', 'High', 'Urgent']),
          customer: {
            name: `${custFirst} ${custLast}`,
            email: `${custFirst.toLowerCase()}@client.org`,
          },
        });
        break;
      }

      case 'clinical_encounter': {
        const docLast = prng.nextItem(LAST_NAMES);
        docs.push({
          encounterId: `ENC-${8000 + i}`,
          patientId: `MRN-${100000 + i}`,
          attendingPhysician: `Dr. ${docLast}, M.D.`,
          visitDate: new Date(Date.now() - prng.nextInt(1, 180) * 86400 * 1000).toISOString().split('T')[0],
          bloodPressure: `${prng.nextInt(110, 150)}/${prng.nextInt(70, 95)} mmHg`,
          heartRateBpm: prng.nextInt(60, 100),
          bloodType: prng.nextItem(BLOOD_TYPES),
        });
        break;
      }
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
  const rawSize = JSON.stringify(docs).length;

  return {
    documents: docs,
    stats: {
      totalRows: docs.length,
      generationTimeMs: durationMs,
      estimatedSizeBytes: rawSize,
      columnCount: Object.keys(docs[0] || {}).length,
      nullCount: 0,
    },
  };
}
