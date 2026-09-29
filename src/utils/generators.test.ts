import { describe, it, expect } from 'vitest';
import { generateTabularData, generateRelationalData } from './generators';
import { generateInvoices, generateBankStatements } from './documentGenerators';
import { TABULAR_PRESETS, RELATIONAL_PRESETS } from '../data/presets';
import { GenerationSettings, DocumentRegion } from '../types';

const defaultSettings: GenerationSettings = {
  rowCount: 30,
  seed: 94821,
  seedLocked: true,
  globalNullRate: 0,
  noiseRate: 0,
  anonymizePII: false,
  exportFormat: 'csv',
  sqlDialect: 'postgresql',
  csvDelimiter: ',',
  includeDropTable: true,
  prettifyJson: true,
  injectEdgeCases: false,
  edgeCaseIntensity: 'low',
  edgeCaseTypes: {
    nulls: false,
    extremeValues: false,
    duplicates: false,
    unicodeEmoji: false,
    veryLongText: false,
    invalidFormats: false,
  },
};

describe('Synthetic Data Generators Verification', () => {
  // Test 1: Deterministic generation with same seed
  it('same seed gives identical tabular output', () => {
    const columns = TABULAR_PRESETS[0].columns;
    const run1 = generateTabularData(columns, { ...defaultSettings, seed: 12345 });
    const run2 = generateTabularData(columns, { ...defaultSettings, seed: 12345 });
    const runDifferentSeed = generateTabularData(columns, { ...defaultSettings, seed: 54321 });

    expect(run1.rows.length).toBe(defaultSettings.rowCount);
    expect(run2.rows.length).toBe(defaultSettings.rowCount);

    // Identical seeds must match exactly
    expect(run1.rows).toEqual(run2.rows);

    // Different seed should not match
    expect(run1.rows).not.toEqual(runDifferentSeed.rows);
  });

  // Test 2: Relational generation has zero orphan foreign keys
  it('relational output has zero orphan foreign keys', () => {
    for (const preset of RELATIONAL_PRESETS) {
      const result = generateRelationalData(preset.tables, { ...defaultSettings, rowCount: 40 });
      const { tablesData } = result;

      // Check each table with foreign keys
      for (const table of preset.tables) {
        if (!table.foreignKeys || table.foreignKeys.length === 0) continue;

        const childRows = tablesData[table.name] || [];
        expect(childRows.length).toBeGreaterThan(0);

        for (const fk of table.foreignKeys) {
          const parentRows = tablesData[fk.targetTable] || [];
          expect(parentRows.length).toBeGreaterThan(0);

          const parentPks = new Set(parentRows.map((p) => p[fk.targetColumn]));

          let orphanCount = 0;
          for (const childRow of childRows) {
            const foreignKeyValue = childRow[fk.column];
            if (!parentPks.has(foreignKeyValue)) {
              orphanCount++;
            }
          }

          expect(orphanCount, `Found ${orphanCount} orphan foreign keys in ${table.name}.${fk.column} referencing ${fk.targetTable}.${fk.targetColumn}`).toBe(0);
        }
      }
    }
  });

  // Test 3: Invoice totals equal sum(line items) - discount + tax
  it('invoice totals equal sum(line items) - discount + tax', () => {
    const regions: DocumentRegion[] = ['US', 'UK', 'PK', 'EU'];

    for (const region of regions) {
      const invoices = generateInvoices(10, region, defaultSettings);

      expect(invoices.length).toBe(10);

      for (const inv of invoices) {
        // Calculate sum of line item gross and discounts
        let itemGrossSum = 0;
        let itemDiscountSum = 0;

        for (const item of inv.items) {
          itemGrossSum += item.quantity * item.unitPrice;
          itemDiscountSum += item.discountAmount;
          // Each line item total should be quantity * unitPrice - discountAmount
          const expectedLineTotal = item.quantity * item.unitPrice - item.discountAmount;
          expect(Math.abs(item.lineTotal - expectedLineTotal)).toBeLessThanOrEqual(0.02);
        }

        // Subtotal equals sum of line items gross
        expect(Math.abs(inv.subtotal - itemGrossSum)).toBeLessThanOrEqual(0.05);

        // Total discount equals sum of line item discounts
        expect(Math.abs(inv.totalDiscount - itemDiscountSum)).toBeLessThanOrEqual(0.05);

        // Crucial test: total equals sum(line items) - discount + tax
        const computedTotal = inv.subtotal - inv.totalDiscount + inv.taxAmount;
        expect(Math.abs(inv.total - computedTotal)).toBeLessThanOrEqual(0.02);
        expect(inv.isReconciled).toBe(true);
      }
    }
  });

  // Test 4: Bank statement running balance is correct
  it('bank statement running balance is correct', () => {
    const regions: DocumentRegion[] = ['US', 'UK', 'PK', 'EU'];

    for (const region of regions) {
      const statements = generateBankStatements(10, region, defaultSettings);

      expect(statements.length).toBe(10);

      for (const stmt of statements) {
        let currentBalance = stmt.openingBalance;
        let creditsTotal = 0;
        let debitsTotal = 0;

        for (const tx of stmt.transactions) {
          if (tx.type === 'credit') {
            currentBalance += tx.amount;
            creditsTotal += tx.amount;
          } else {
            currentBalance -= tx.amount;
            debitsTotal += tx.amount;
          }

          // Each transaction's running balance must match current calculated balance
          expect(Math.abs(tx.runningBalance - currentBalance)).toBeLessThanOrEqual(0.02);
        }

        // Total credits and total debits match sum of individual transactions
        expect(Math.abs(stmt.totalCredits - creditsTotal)).toBeLessThanOrEqual(0.02);
        expect(Math.abs(stmt.totalDebits - debitsTotal)).toBeLessThanOrEqual(0.02);

        // Closing balance matches final running balance and formula opening + credits - debits
        expect(Math.abs(stmt.closingBalance - currentBalance)).toBeLessThanOrEqual(0.02);
        const expectedClosing = stmt.openingBalance + stmt.totalCredits - stmt.totalDebits;
        expect(Math.abs(stmt.closingBalance - expectedClosing)).toBeLessThanOrEqual(0.02);
        expect(stmt.isReconciled).toBe(true);
      }
    }
  });
});
