import {
  ColumnDefinition,
  TableSchema,
  GenerationSettings,
  TabType,
  DocumentRegion,
  InvoiceDocument,
} from '../types';
import { generateInvoices } from './documentGenerators';

export interface ForeignKeyAuditItem {
  fkName: string;
  childTable: string;
  fkColumn: string;
  parentTable: string;
  parentColumn: string;
  totalReferences: number;
  orphanCount: number; // MUST BE 0
  orphans: any[];
  status: 'pass' | 'fail';
}

export interface ForeignKeyAuditResult {
  totalForeignKeys: number;
  totalReferences: number;
  totalOrphans: number; // must be 0
  status: 'pass' | 'fail';
  items: ForeignKeyAuditItem[];
  message: string;
}

export interface UniqueColumnAuditItem {
  tableName: string;
  columnName: string;
  totalRows: number;
  distinctCount: number;
  duplicateCount: number;
  duplicates: { value: string; count: number }[];
  status: 'pass' | 'fail';
}

export interface UniqueColumnAuditResult {
  totalUniqueColumnsChecked: number;
  totalDuplicates: number;
  status: 'pass' | 'fail';
  items: UniqueColumnAuditItem[];
  message: string;
}

export interface ColumnNullAuditItem {
  columnName: string;
  tableName: string;
  totalRows: number;
  nullCount: number;
  nullPercentage: number;
  configuredNullPercentage: number;
  isUnique: boolean;
  status: 'pass' | 'fail' | 'warn';
}

export interface ColumnNullAuditResult {
  totalColumns: number;
  totalNullCount: number;
  overallNullPercentage: number;
  status: 'pass' | 'fail';
  items: ColumnNullAuditItem[];
  message: string;
}

export interface InvoiceReconciliationItem {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  subtotal: number;
  totalDiscount: number;
  netTaxableAmount: number;
  taxAmount: number;
  total: number;
  calculatedTotal: number;
  discrepancy: number; // Absolute difference in currency units
  itemsCount: number;
  isReconciled: boolean;
  status: 'pass' | 'fail';
}

export interface InvoiceReconciliationAuditResult {
  totalInvoicesChecked: number;
  reconciledCount: number;
  unreconciledCount: number;
  reconciliationRate: number; // percentage (100 = 100%)
  maxDiscrepancy: number;
  status: 'pass' | 'fail';
  items: InvoiceReconciliationItem[];
  message: string;
  waterfallTotals: {
    grossSubtotal: number;
    totalDiscounts: number;
    netTaxable: number;
    totalTax: number;
    grandTotal: number;
  };
}

export interface QualityScoreDimension {
  name: string;
  score: number; // 0 to 25
  maxScore: number; // 25
  status: 'pass' | 'fail';
  weightPct: number;
  summary: string;
}

export interface ValidationReport {
  timestamp: string;
  qualityScore: number; // 0 to 100
  qualityGrade: 'A+' | 'A' | 'B' | 'C';
  qualityVerdict: string;
  dimensions: {
    referentialIntegrity: QualityScoreDimension;
    uniqueness: QualityScoreDimension;
    completeness: QualityScoreDimension;
    reconciliation: QualityScoreDimension;
  };
  foreignKeys: ForeignKeyAuditResult;
  uniqueColumns: UniqueColumnAuditResult;
  nullDistribution: ColumnNullAuditResult;
  invoiceReconciliation: InvoiceReconciliationAuditResult;
  overallStatus: 'pass' | 'fail';
}

interface ValidateDatasetParams {
  activeTab: TabType;
  tabularRows: Record<string, any>[];
  tabularColumns: ColumnDefinition[];
  relationalTables: TableSchema[];
  relationalData: Record<string, Record<string, any>[]>;
  documentsData: any[];
  settings: GenerationSettings;
  documentRegion?: DocumentRegion;
}

/**
 * Perform a rigorous comprehensive data quality validation suite:
 * 1. Orphan foreign keys (must be 0)
 * 2. Duplicate values in unique columns
 * 3. Null percentage per column
 * 4. Total-reconciliation check for invoices
 * 5. Quality score out of 100
 */
export function runValidationSuite({
  activeTab,
  tabularRows,
  tabularColumns,
  relationalTables,
  relationalData,
  documentsData,
  settings,
  documentRegion = 'US',
}: ValidateDatasetParams): ValidationReport {
  // -------------------------------------------------------------
  // 1. Orphan Foreign Keys Audit (Target: Must be 0)
  // -------------------------------------------------------------
  const fkAuditItems: ForeignKeyAuditItem[] = [];
  let totalFkRefs = 0;
  let totalOrphans = 0;

  for (const table of relationalTables) {
    if (!table.foreignKeys || table.foreignKeys.length === 0) continue;

    const childRows = relationalData[table.name] || [];

    for (const fk of table.foreignKeys) {
      const parentRows = relationalData[fk.targetTable] || [];
      const parentPkSet = new Set(
        parentRows
          .map((r) => r[fk.targetColumn])
          .filter((v) => v !== null && v !== undefined && v !== '')
      );

      const orphansFound: any[] = [];
      let referencesCount = 0;

      for (const row of childRows) {
        const val = row[fk.column];
        referencesCount++;

        // A foreign key must point to an existing parent PK
        if (val === null || val === undefined || val === '') {
          // If FK is null and orphans check requires valid relation
          orphansFound.push({ rowId: row[table.primaryKey] || 'unknown', value: 'NULL' });
        } else if (!parentPkSet.has(val)) {
          orphansFound.push({ rowId: row[table.primaryKey] || 'unknown', value: val });
        }
      }

      totalFkRefs += referencesCount;
      totalOrphans += orphansFound.length;

      fkAuditItems.push({
        fkName: `${table.name}.${fk.column} → ${fk.targetTable}.${fk.targetColumn}`,
        childTable: table.name,
        fkColumn: fk.column,
        parentTable: fk.targetTable,
        parentColumn: fk.targetColumn,
        totalReferences: referencesCount,
        orphanCount: orphansFound.length,
        orphans: orphansFound.slice(0, 5),
        status: orphansFound.length === 0 ? 'pass' : 'fail',
      });
    }
  }

  const fkStatus: 'pass' | 'fail' = totalOrphans === 0 ? 'pass' : 'fail';
  const fkMessage =
    totalOrphans === 0
      ? `0 orphan foreign keys across ${fkAuditItems.length} relationship constraint${fkAuditItems.length === 1 ? '' : 's'} (${totalFkRefs.toLocaleString()} references checked). Full referential integrity verified.`
      : `${totalOrphans} orphan foreign key${totalOrphans === 1 ? '' : 's'} detected violating referential integrity constraints.`;

  const foreignKeysResult: ForeignKeyAuditResult = {
    totalForeignKeys: fkAuditItems.length,
    totalReferences: totalFkRefs,
    totalOrphans,
    status: fkStatus,
    items: fkAuditItems,
    message: fkMessage,
  };

  // -------------------------------------------------------------
  // 2. Duplicate Values in Unique Columns Audit
  // -------------------------------------------------------------
  const uniqueAuditItems: UniqueColumnAuditItem[] = [];
  let totalDuplicates = 0;

  // Audit Tabular unique columns if in tabular mode or generally
  if (activeTab === 'tabular' || relationalTables.length === 0) {
    const targetCols = tabularColumns.filter(
      (c) => c.isUnique || c.type === 'uuid' || c.name.toLowerCase() === 'id'
    );

    for (const col of targetCols) {
      const values = tabularRows.map((r) => r[col.name]);
      const nonNulls = values.filter((v) => v !== null && v !== undefined && v !== '');
      const freq: Record<string, number> = {};

      for (const val of nonNulls) {
        const k = String(val);
        freq[k] = (freq[k] || 0) + 1;
      }

      const dupes = Object.entries(freq)
        .filter(([, count]) => count > 1)
        .map(([value, count]) => ({ value, count }));

      const colDupesCount = dupes.reduce((acc, d) => acc + (d.count - 1), 0);
      totalDuplicates += colDupesCount;

      uniqueAuditItems.push({
        tableName: 'tabular_dataset',
        columnName: col.name,
        totalRows: tabularRows.length,
        distinctCount: Object.keys(freq).length,
        duplicateCount: colDupesCount,
        duplicates: dupes.slice(0, 5),
        status: colDupesCount === 0 ? 'pass' : 'fail',
      });
    }
  }

  // Audit Relational unique columns (PKs and explicit unique columns)
  for (const table of relationalTables) {
    const rows = relationalData[table.name] || [];
    const pkCol = table.columns.find((c) => c.name === table.primaryKey);
    const uniqueCols = table.columns.filter((c) => c.isUnique || c.name === table.primaryKey);

    for (const col of uniqueCols) {
      const values = rows.map((r) => r[col.name]);
      const nonNulls = values.filter((v) => v !== null && v !== undefined && v !== '');
      const freq: Record<string, number> = {};

      for (const val of nonNulls) {
        const k = String(val);
        freq[k] = (freq[k] || 0) + 1;
      }

      const dupes = Object.entries(freq)
        .filter(([, count]) => count > 1)
        .map(([value, count]) => ({ value, count }));

      const colDupesCount = dupes.reduce((acc, d) => acc + (d.count - 1), 0);
      totalDuplicates += colDupesCount;

      uniqueAuditItems.push({
        tableName: table.name,
        columnName: col.name,
        totalRows: rows.length,
        distinctCount: Object.keys(freq).length,
        duplicateCount: colDupesCount,
        duplicates: dupes.slice(0, 5),
        status: colDupesCount === 0 ? 'pass' : 'fail',
      });
    }
  }

  const uniqueStatus: 'pass' | 'fail' = totalDuplicates === 0 ? 'pass' : 'fail';
  const uniqueMessage =
    totalDuplicates === 0
      ? `0 duplicate values detected across ${uniqueAuditItems.length} unique column constraint${uniqueAuditItems.length === 1 ? '' : 's'}. 100% key uniqueness preserved.`
      : `${totalDuplicates} duplicate value${totalDuplicates === 1 ? '' : 's'} identified across unique/primary key columns.`;

  const uniqueColumnsResult: UniqueColumnAuditResult = {
    totalUniqueColumnsChecked: uniqueAuditItems.length,
    totalDuplicates,
    status: uniqueStatus,
    items: uniqueAuditItems,
    message: uniqueMessage,
  };

  // -------------------------------------------------------------
  // 3. Null Percentage Per Column Audit
  // -------------------------------------------------------------
  const nullAuditItems: ColumnNullAuditItem[] = [];
  let aggregateRows = 0;
  let aggregateNulls = 0;

  // Active dataset columns
  if (activeTab === 'tabular' || relationalTables.length === 0) {
    const totalR = tabularRows.length;
    for (const col of tabularColumns) {
      const values = tabularRows.map((r) => r[col.name]);
      const nulls = values.filter((v) => v === null || v === undefined || v === '').length;
      const pct = totalR > 0 ? Number(((nulls / totalR) * 100).toFixed(1)) : 0;
      const cfgPct = (col.nullPercentage || 0) + (settings.globalNullRate || 0);

      aggregateRows += totalR;
      aggregateNulls += nulls;

      // If column is unique/PK and has nulls -> failure!
      const isUniqueCol = col.isUnique || col.name.toLowerCase() === 'id';
      let colStatus: 'pass' | 'fail' | 'warn' = 'pass';
      if (isUniqueCol && nulls > 0) {
        colStatus = 'fail';
      } else if (Math.abs(pct - cfgPct) > 20 && totalR > 30) {
        colStatus = 'warn';
      }

      nullAuditItems.push({
        columnName: col.name,
        tableName: 'tabular',
        totalRows: totalR,
        nullCount: nulls,
        nullPercentage: pct,
        configuredNullPercentage: cfgPct,
        isUnique: isUniqueCol,
        status: colStatus,
      });
    }
  } else {
    // Relational mode: evaluate all active relational tables
    for (const table of relationalTables) {
      const rows = relationalData[table.name] || [];
      const totalR = rows.length;

      for (const col of table.columns) {
        const values = rows.map((r) => r[col.name]);
        const nulls = values.filter((v) => v === null || v === undefined || v === '').length;
        const pct = totalR > 0 ? Number(((nulls / totalR) * 100).toFixed(1)) : 0;
        const cfgPct = (col.nullPercentage || 0) + (settings.globalNullRate || 0);

        aggregateRows += totalR;
        aggregateNulls += nulls;

        const isUniqueCol = col.isUnique || col.name === table.primaryKey;
        let colStatus: 'pass' | 'fail' | 'warn' = 'pass';
        if (isUniqueCol && nulls > 0) {
          colStatus = 'fail';
        } else if (Math.abs(pct - cfgPct) > 20 && totalR > 30) {
          colStatus = 'warn';
        }

        nullAuditItems.push({
          columnName: col.name,
          tableName: table.name,
          totalRows: totalR,
          nullCount: nulls,
          nullPercentage: pct,
          configuredNullPercentage: cfgPct,
          isUnique: isUniqueCol,
          status: colStatus,
        });
      }
    }
  }

  const overallNullPct = aggregateRows > 0 ? Number(((aggregateNulls / aggregateRows) * 100).toFixed(1)) : 0;
  const hasNullInUnique = nullAuditItems.some((item) => item.status === 'fail');
  const nullStatus: 'pass' | 'fail' = hasNullInUnique ? 'fail' : 'pass';
  const nullMessage = hasNullInUnique
    ? `Violation: NULL or empty values detected in primary key or unique columns.`
    : `Average null rate: ${overallNullPct}% across ${nullAuditItems.length} active columns. Zero nulls in primary keys or unique columns.`;

  const nullDistributionResult: ColumnNullAuditResult = {
    totalColumns: nullAuditItems.length,
    totalNullCount: aggregateNulls,
    overallNullPercentage: overallNullPct,
    status: nullStatus,
    items: nullAuditItems,
    message: nullMessage,
  };

  // -------------------------------------------------------------
  // 4. Total-Reconciliation Check for Invoices Audit
  // -------------------------------------------------------------
  // Extract invoices from documentsData if present, or generate an audit set
  let invoicesToAudit: InvoiceDocument[] = [];

  if (activeTab === 'documents' && Array.isArray(documentsData) && documentsData.length > 0) {
    if (documentsData[0]?.type === 'invoice') {
      invoicesToAudit = documentsData as InvoiceDocument[];
    }
  }

  // If no active invoices in view, generate a dedicated audit suite of invoices
  if (invoicesToAudit.length === 0) {
    invoicesToAudit = generateInvoices(Math.min(settings.rowCount, 50), documentRegion, settings);
  }

  const invoiceItems: InvoiceReconciliationItem[] = [];
  let reconciledInvoicesCount = 0;
  let maxDiscrepancyCents = 0;

  let sumGrossSubtotal = 0;
  let sumDiscounts = 0;
  let sumNetTaxable = 0;
  let sumTax = 0;
  let sumGrandTotal = 0;

  for (const inv of invoicesToAudit) {
    // 1. Calculate line total sum in cents
    let calcSubtotalCents = 0;
    let calcDiscountCents = 0;

    for (const item of inv.items) {
      const grossLineCents = Math.round(item.quantity * item.unitPrice * 100);
      const discountLineCents = Math.round((grossLineCents * item.discountPercent) / 100);
      calcSubtotalCents += grossLineCents;
      calcDiscountCents += discountLineCents;
    }

    const netTaxableCents = calcSubtotalCents - calcDiscountCents;
    const taxCents = Math.round((netTaxableCents * inv.taxRate) / 100);
    const calculatedTotalCents = netTaxableCents + taxCents;

    const actualTotalCents = Math.round(inv.total * 100);
    const discrepancyCents = Math.abs(calculatedTotalCents - actualTotalCents);

    if (discrepancyCents > maxDiscrepancyCents) {
      maxDiscrepancyCents = discrepancyCents;
    }

    const isReconciled = discrepancyCents === 0;
    if (isReconciled) {
      reconciledInvoicesCount++;
    }

    sumGrossSubtotal += inv.subtotal;
    sumDiscounts += inv.totalDiscount;
    sumNetTaxable += inv.netTaxableAmount;
    sumTax += inv.taxAmount;
    sumGrandTotal += inv.total;

    invoiceItems.push({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      subtotal: inv.subtotal,
      totalDiscount: inv.totalDiscount,
      netTaxableAmount: inv.netTaxableAmount,
      taxAmount: inv.taxAmount,
      total: inv.total,
      calculatedTotal: calculatedTotalCents / 100,
      discrepancy: discrepancyCents / 100,
      itemsCount: inv.items.length,
      isReconciled,
      status: isReconciled ? 'pass' : 'fail',
    });
  }

  const reconciliationRate =
    invoicesToAudit.length > 0
      ? Number(((reconciledInvoicesCount / invoicesToAudit.length) * 100).toFixed(1))
      : 100;

  const invoiceStatus: 'pass' | 'fail' = reconciliationRate === 100 ? 'pass' : 'fail';
  const invoiceMessage =
    reconciliationRate === 100
      ? `100% mathematical reconciliation verified across all ${invoicesToAudit.length} invoices. Line items, discounts, and regional taxes reconcile to the exact cent ($0.00 discrepancy).`
      : `${invoicesToAudit.length - reconciledInvoicesCount} invoices show rounding drift or total discrepancies. Max error: $${(maxDiscrepancyCents / 100).toFixed(2)}.`;

  const invoiceReconciliationResult: InvoiceReconciliationAuditResult = {
    totalInvoicesChecked: invoicesToAudit.length,
    reconciledCount: reconciledInvoicesCount,
    unreconciledCount: invoicesToAudit.length - reconciledInvoicesCount,
    reconciliationRate,
    maxDiscrepancy: maxDiscrepancyCents / 100,
    status: invoiceStatus,
    items: invoiceItems,
    message: invoiceMessage,
    waterfallTotals: {
      grossSubtotal: Number(sumGrossSubtotal.toFixed(2)),
      totalDiscounts: Number(sumDiscounts.toFixed(2)),
      netTaxable: Number(sumNetTaxable.toFixed(2)),
      totalTax: Number(sumTax.toFixed(2)),
      grandTotal: Number(sumGrandTotal.toFixed(2)),
    },
  };

  // -------------------------------------------------------------
  // 5. Synthesize Quality Score Out of 100
  // -------------------------------------------------------------
  // 4 Dimensions, each weighted 25 points:
  // Dimension 1: Referential Integrity (Orphan foreign keys must be 0)
  let refScore = 25;
  if (totalOrphans > 0) {
    refScore = Math.max(0, Math.round(25 * (1 - totalOrphans / Math.max(1, totalFkRefs))));
  }

  // Dimension 2: Uniqueness Integrity (Duplicate values in unique columns)
  let uniqScore = 25;
  if (totalDuplicates > 0) {
    const totalUniqueChecked = uniqueAuditItems.reduce((acc, i) => acc + i.totalRows, 0);
    uniqScore = Math.max(0, Math.round(25 * (1 - totalDuplicates / Math.max(1, totalUniqueChecked))));
  }

  // Dimension 3: Completeness & Null Distribution
  let compScore = 25;
  if (hasNullInUnique) {
    compScore -= 15;
  }
  const excessiveWarns = nullAuditItems.filter((i) => i.status === 'warn').length;
  if (excessiveWarns > 0) {
    compScore = Math.max(5, compScore - Math.min(10, excessiveWarns * 2));
  }

  // Dimension 4: Total-Reconciliation Check for Invoices
  let reconScore = 25;
  if (reconciliationRate < 100) {
    reconScore = Math.round(25 * (reconciliationRate / 100));
  }

  const qualityScore = Math.min(100, Math.max(0, refScore + uniqScore + compScore + reconScore));

  let qualityGrade: 'A+' | 'A' | 'B' | 'C' = 'A+';
  let qualityVerdict = 'Optimal / Production-Grade Synthetic Quality';

  if (qualityScore >= 95) {
    qualityGrade = 'A+';
    qualityVerdict = 'Optimal / Production-Grade Synthetic Quality';
  } else if (qualityScore >= 85) {
    qualityGrade = 'A';
    qualityVerdict = 'High Quality / Verified Referential Integrity';
  } else if (qualityScore >= 70) {
    qualityGrade = 'B';
    qualityVerdict = 'Moderate Quality / Minor Discrepancies';
  } else {
    qualityGrade = 'C';
    qualityVerdict = 'Action Required / Schema Constraints Breached';
  }

  const dimensions = {
    referentialIntegrity: {
      name: 'Referential Integrity (Zero Orphans)',
      score: refScore,
      maxScore: 25,
      status: (totalOrphans === 0 ? 'pass' : 'fail') as 'pass' | 'fail',
      weightPct: 25,
      summary: totalOrphans === 0 ? '0 orphan foreign keys (100% parent-child linkage)' : `${totalOrphans} orphan keys detected`,
    },
    uniqueness: {
      name: 'Key Uniqueness & Deduplication',
      score: uniqScore,
      maxScore: 25,
      status: (totalDuplicates === 0 ? 'pass' : 'fail') as 'pass' | 'fail',
      weightPct: 25,
      summary: totalDuplicates === 0 ? '0 duplicates in unique / primary key columns' : `${totalDuplicates} duplicates found`,
    },
    completeness: {
      name: 'Null Rate & Schema Invariants',
      score: compScore,
      maxScore: 25,
      status: (!hasNullInUnique ? 'pass' : 'fail') as 'pass' | 'fail',
      weightPct: 25,
      summary: !hasNullInUnique ? 'Zero nulls in primary keys; distribution compliant' : 'Nulls found in unique/PK columns',
    },
    reconciliation: {
      name: 'Invoice Financial Reconciliation',
      score: reconScore,
      maxScore: 25,
      status: (reconciliationRate === 100 ? 'pass' : 'fail') as 'pass' | 'fail',
      weightPct: 25,
      summary: reconciliationRate === 100 ? '100% balanced totals down to exact cent' : `${100 - reconciliationRate}% unbalanced`,
    },
  };

  const overallStatus: 'pass' | 'fail' =
    qualityScore >= 85 && totalOrphans === 0 && totalDuplicates === 0 && reconciliationRate === 100
      ? 'pass'
      : 'fail';

  return {
    timestamp: new Date().toISOString(),
    qualityScore,
    qualityGrade,
    qualityVerdict,
    dimensions,
    foreignKeys: foreignKeysResult,
    uniqueColumns: uniqueColumnsResult,
    nullDistribution: nullDistributionResult,
    invoiceReconciliation: invoiceReconciliationResult,
    overallStatus,
  };
}
