import JSZip from 'jszip';
import {
  ColumnDefinition,
  ExportFormat,
  GenerationSettings,
  SqlDialect,
  TableSchema,
  InvoiceDocument,
  BankStatementDocument,
} from '../types';

/**
 * Escapes CSV values conforming to RFC 4180
 */
function escapeCsvValue(val: any, delimiter: string): string {
  if (val === null || val === undefined) {
    return '';
  }
  const str = String(val);
  if (
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert tabular rows to CSV string
 */
export function convertToCsv(
  rows: Record<string, any>[],
  columns?: ColumnDefinition[],
  delimiter: string = ','
): string {
  if (rows.length === 0) return '';
  const headers = columns && columns.length > 0 ? columns.map((c) => c.name) : Object.keys(rows[0]);
  const headerLine = headers.map((h) => escapeCsvValue(h, delimiter)).join(delimiter);

  const dataLines = rows.map((row) => {
    return headers.map((h) => escapeCsvValue(row[h], delimiter)).join(delimiter);
  });

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Convert data to JSON string
 */
export function convertToJson(data: any, prettify: boolean = true): string {
  return prettify ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/**
 * Convert data array to NDJSON (Newline Delimited JSON)
 */
export function convertToNdjson(items: any[]): string {
  return items.map((item) => JSON.stringify(item)).join('\n');
}

/**
 * Maps synthetic column data type to SQL column type
 */
function mapToSqlType(type: string, dialect: SqlDialect): string {
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
    case 'category':
    case 'string':
    case 'email':
    case 'full name':
    case 'phone':
    case 'address':
    case 'company':
    default:
      return 'VARCHAR(255)';
  }
}

/**
 * Convert rows to SQL DDL and INSERT statements
 */
export function convertToSql(
  tableName: string,
  rows: Record<string, any>[],
  columns: ColumnDefinition[],
  dialect: SqlDialect = 'postgresql',
  includeDropTable: boolean = true,
  tableSchema?: TableSchema
): string {
  if (rows.length === 0) return `-- Empty dataset for ${tableName}`;

  const quoteChar = dialect === 'mysql' ? '`' : '"';
  const q = (str: string) => `${quoteChar}${str}${quoteChar}`;
  const tableIdent = q(tableName);

  const lines: string[] = [
    `-- SynthForge Synthetic Export: ${tableName}`,
    `-- Target Engine: ${dialect.toUpperCase()} | Generated: ${new Date().toISOString()}`,
    '',
  ];

  if (includeDropTable) {
    lines.push(`DROP TABLE IF EXISTS ${tableIdent} CASCADE;`);
  }

  // CREATE TABLE
  const colDefs = columns.map((col) => {
    const colType = mapToSqlType(col.type, dialect);
    const isPk = col.name === (tableSchema?.primaryKey || 'id');
    const pkSuffix = isPk ? ' PRIMARY KEY' : '';
    return `  ${q(col.name)} ${colType}${pkSuffix}`;
  });

  // Append FOREIGN KEY constraints if present
  if (tableSchema?.foreignKeys) {
    tableSchema.foreignKeys.forEach((fk) => {
      colDefs.push(
        `  CONSTRAINT ${q(`fk_${tableName}_${fk.column}`)} FOREIGN KEY (${q(fk.column)}) REFERENCES ${q(fk.targetTable)} (${q(fk.targetColumn)})`
      );
    });
  }

  lines.push(`CREATE TABLE ${tableIdent} (`);
  lines.push(colDefs.join(',\n'));
  lines.push(');');
  lines.push('');

  // INSERT STATEMENTS
  const colNames = columns.map((c) => q(c.name)).join(', ');
  const batchSize = dialect === 'sqlite' ? 50 : 100;

  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const valueTuples = chunk.map((row) => {
      const vals = columns.map((col) => {
        const val = row[col.name];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return String(val);
        if (typeof val === 'boolean') {
          if (dialect === 'sqlite') return val ? '1' : '0';
          return val ? 'TRUE' : 'FALSE';
        }
        const escaped = String(val).replace(/'/g, "''");
        return `'${escaped}'`;
      });
      return `  (${vals.join(', ')})`;
    });

    lines.push(`INSERT INTO ${tableIdent} (${colNames}) VALUES`);
    lines.push(valueTuples.join(',\n') + ';');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Triggers a real browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Triggers download of a Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export Relational Schema & Datasets as a ZIP of individual CSV files
 */
export async function exportRelationalAsZip(
  tablesData: Record<string, Record<string, any>[]>,
  tables: TableSchema[],
  delimiter: string = ','
): Promise<Blob> {
  const zip = new JSZip();

  // Add CSV for each table
  for (const table of tables) {
    const rows = tablesData[table.name] || [];
    const csvContent = convertToCsv(rows, table.columns, delimiter);
    zip.file(`${table.name}.csv`, csvContent);
  }

  // Add schema manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    generator: 'SynthForge Synthetic Data Platform',
    tables: tables.map((t) => ({
      name: t.name,
      primaryKey: t.primaryKey,
      rowCount: (tablesData[t.name] || []).length,
      columns: t.columns.map((c) => ({
        name: c.name,
        type: c.type,
        isComputed: !!c.isComputed,
      })),
      foreignKeys: t.foreignKeys || [],
    })),
  };
  zip.file('schema_manifest.json', JSON.stringify(manifest, null, 2));

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Export complete Relational schema as a comprehensive SQL dump with DDL and INSERT statements
 */
export function exportRelationalAsSqlDump(
  tablesData: Record<string, Record<string, any>[]>,
  tables: TableSchema[],
  dialect: SqlDialect = 'postgresql'
): string {
  const timestamp = new Date().toISOString();
  const sqlParts: string[] = [
    `-- ==========================================================`,
    `-- SynthForge Relational Schema & Data Dump`,
    `-- Generated: ${timestamp}`,
    `-- Dialect: ${dialect.toUpperCase()}`,
    `-- Referential Integrity: Guaranteed (Zero Orphan Rows)`,
    `-- ==========================================================`,
    '',
  ];

  if (dialect === 'postgresql') {
    sqlParts.push('SET check_function_bodies = false;');
    sqlParts.push('SET client_min_messages = warning;');
    sqlParts.push('');
  } else if (dialect === 'mysql') {
    sqlParts.push('SET FOREIGN_KEY_CHECKS = 0;');
    sqlParts.push('');
  }

  for (const table of tables) {
    const rows = tablesData[table.name] || [];
    sqlParts.push(convertToSql(table.name, rows, table.columns, dialect, true, table));
    sqlParts.push('\n');
  }

  if (dialect === 'mysql') {
    sqlParts.push('SET FOREIGN_KEY_CHECKS = 1;');
  }

  return sqlParts.join('\n');
}

/**
 * Convert Invoices to CSV (Flattened line items with header fields)
 */
export function convertInvoicesToCsv(invoices: InvoiceDocument[]): string {
  const headers = [
    'InvoiceNumber',
    'Date',
    'DueDate',
    'Region',
    'Currency',
    'IssuerName',
    'IssuerTaxId',
    'ClientName',
    'ClientContact',
    'ItemDescription',
    'Quantity',
    'UnitPrice',
    'DiscountPercent',
    'DiscountAmount',
    'LineTotal',
    'Subtotal',
    'TotalDiscount',
    'TaxName',
    'TaxRate',
    'TaxAmount',
    'TotalDue',
    'PaymentStatus',
  ];

  const rows: string[] = [headers.join(',')];

  for (const inv of invoices) {
    for (const item of inv.items) {
      const line = [
        `"${inv.invoiceNumber}"`,
        `"${inv.date}"`,
        `"${inv.dueDate}"`,
        `"${inv.region}"`,
        `"${inv.currencyCode}"`,
        `"${inv.issuer.name.replace(/"/g, '""')}"`,
        `"${(inv.issuer.taxId || '').replace(/"/g, '""')}"`,
        `"${inv.client.name.replace(/"/g, '""')}"`,
        `"${(inv.client.contactPerson || '').replace(/"/g, '""')}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        item.quantity,
        item.unitPrice.toFixed(2),
        item.discountPercent,
        item.discountAmount.toFixed(2),
        item.lineTotal.toFixed(2),
        inv.subtotal.toFixed(2),
        inv.totalDiscount.toFixed(2),
        `"${inv.taxName}"`,
        inv.taxRate,
        inv.taxAmount.toFixed(2),
        inv.total.toFixed(2),
        `"${inv.paymentStatus}"`,
      ];
      rows.push(line.join(','));
    }
  }

  return rows.join('\r\n');
}

/**
 * Convert Bank Statements to CSV (Flattened transaction ledger with statement header fields)
 */
export function convertBankStatementsToCsv(statements: BankStatementDocument[]): string {
  const headers = [
    'StatementId',
    'BankName',
    'Region',
    'Currency',
    'AccountHolder',
    'AccountNumber',
    'RoutingOrIBAN',
    'StatementPeriodStart',
    'StatementPeriodEnd',
    'OpeningBalance',
    'TxDate',
    'MerchantOrDescription',
    'Category',
    'TxType',
    'Amount',
    'RunningBalance',
    'TotalCredits',
    'TotalDebits',
    'ClosingBalance',
  ];

  const rows: string[] = [headers.join(',')];

  for (const stmt of statements) {
    for (const tx of stmt.transactions) {
      const line = [
        `"${stmt.statementId}"`,
        `"${stmt.bank.name.replace(/"/g, '""')}"`,
        `"${stmt.region}"`,
        `"${stmt.currencyCode}"`,
        `"${stmt.accountHolder.name.replace(/"/g, '""')}"`,
        `"${stmt.accountHolder.accountNumber}"`,
        `"${stmt.accountHolder.routingOrSortCode}"`,
        `"${stmt.period.startDate}"`,
        `"${stmt.period.endDate}"`,
        stmt.openingBalance.toFixed(2),
        `"${tx.date}"`,
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${tx.category}"`,
        `"${tx.type}"`,
        tx.amount.toFixed(2),
        tx.runningBalance.toFixed(2),
        stmt.totalCredits.toFixed(2),
        stmt.totalDebits.toFixed(2),
        stmt.closingBalance.toFixed(2),
      ];
      rows.push(line.join(','));
    }
  }

  return rows.join('\r\n');
}

/**
 * Export execution orchestrator based on settings and format
 */
export function executeExport(
  activeTab: 'tabular' | 'relational' | 'documents',
  data: any,
  columns: ColumnDefinition[],
  settings: GenerationSettings,
  activeTableName?: string,
  tablesList?: TableSchema[]
): { filename: string; mimeType: string; content: string } {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  let content = '';
  let filename = '';
  let mimeType = 'text/plain';

  const format = settings.exportFormat;

  if (activeTab === 'tabular') {
    const baseName = `synthforge_tabular_${timestamp}`;
    switch (format) {
      case 'csv':
        content = convertToCsv(data, columns, settings.csvDelimiter);
        filename = `${baseName}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        break;
      case 'json':
        content = convertToJson(data, settings.prettifyJson);
        filename = `${baseName}.json`;
        mimeType = 'application/json;charset=utf-8;';
        break;
      case 'ndjson':
        content = convertToNdjson(data);
        filename = `${baseName}.ndjson`;
        mimeType = 'application/x-ndjson;charset=utf-8;';
        break;
      case 'sql':
        content = convertToSql('synth_data', data, columns, settings.sqlDialect, settings.includeDropTable);
        filename = `${baseName}.sql`;
        mimeType = 'application/sql;charset=utf-8;';
        break;
    }
  } else if (activeTab === 'relational') {
    const tblName = activeTableName || Object.keys(data)[0] || 'dataset';
    const rows = data[tblName] || [];

    switch (format) {
      case 'csv':
        content = convertToCsv(rows, columns, settings.csvDelimiter);
        filename = `synthforge_relational_${tblName}_${timestamp}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        break;
      case 'json':
        content = convertToJson(data, settings.prettifyJson);
        filename = `synthforge_relational_all_${timestamp}.json`;
        mimeType = 'application/json;charset=utf-8;';
        break;
      case 'ndjson':
        content = convertToNdjson(rows);
        filename = `synthforge_relational_${tblName}_${timestamp}.ndjson`;
        mimeType = 'application/x-ndjson;charset=utf-8;';
        break;
      case 'sql': {
        // Output full relational dump with foreign key constraints
        content = exportRelationalAsSqlDump(data, tablesList || [], settings.sqlDialect);
        filename = `synthforge_relational_dump_${timestamp}.sql`;
        mimeType = 'application/sql;charset=utf-8;';
        break;
      }
    }
  } else {
    // Documents
    const isInvoice = Array.isArray(data) && data[0]?.type === 'invoice';
    const isBankStatement = Array.isArray(data) && data[0]?.type === 'bank_statement';
    const baseName = isInvoice
      ? `synthforge_invoices_${timestamp}`
      : isBankStatement
      ? `synthforge_bank_statements_${timestamp}`
      : `synthforge_documents_${timestamp}`;

    switch (format) {
      case 'json':
        content = convertToJson(data, settings.prettifyJson);
        filename = `${baseName}.json`;
        mimeType = 'application/json;charset=utf-8;';
        break;
      case 'ndjson':
        content = convertToNdjson(data);
        filename = `${baseName}.ndjson`;
        mimeType = 'application/x-ndjson;charset=utf-8;';
        break;
      case 'csv':
        if (isInvoice) {
          content = convertInvoicesToCsv(data);
        } else if (isBankStatement) {
          content = convertBankStatementsToCsv(data);
        } else {
          content = convertToCsv(data, undefined, settings.csvDelimiter);
        }
        filename = `${baseName}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        break;
      case 'sql': {
        const sqlCols: ColumnDefinition[] = [
          { id: '1', name: 'id', type: 'uuid', nullPercentage: 0, isUnique: true },
          { id: '2', name: 'document_payload', type: 'string', nullPercentage: 0, isUnique: false },
        ];
        const flatRows = (data as any[]).map((doc, idx) => ({
          id: `DOC-${1000 + idx}`,
          document_payload: JSON.stringify(doc),
        }));
        content = convertToSql('synthetic_documents', flatRows, sqlCols, settings.sqlDialect, settings.includeDropTable);
        filename = `${baseName}.sql`;
        mimeType = 'application/sql;charset=utf-8;';
        break;
      }
    }
  }

  return { filename, mimeType, content };
}
