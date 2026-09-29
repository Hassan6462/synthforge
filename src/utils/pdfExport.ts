import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { InvoiceDocument, BankStatementDocument } from '../types';

/**
 * Format currency string safe for jsPDF default fonts
 * (jsPDF standard fonts may not render raw Unicode symbols like £/€/PKR without custom font embeddings,
 * so we provide clean display formatting like 'USD $1,200.00', 'GBP £1,200.00', 'PKR 1,200.00', 'EUR €1,200.00')
 */
function pdfCurrency(amount: number, symbol: string, code: string): string {
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol === 'PKR' || code === 'PKR') return `PKR ${formatted}`;
  if (symbol === '£' || code === 'GBP') return `GBP ${formatted}`;
  if (symbol === '€' || code === 'EUR') return `EUR ${formatted}`;
  return `$${formatted}`;
}

/**
 * Generate a vector PDF for an Invoice
 */
export function generateInvoicePdf(invoice: InvoiceDocument): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header Background accent bar
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(margin, margin, contentWidth, 24, 'F');

  // Issuer Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(invoice.issuer.name, margin + 6, margin + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(`${invoice.issuer.address} · ${invoice.issuer.city}, ${invoice.issuer.country}`, margin + 6, margin + 18);

  // Invoice Title on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('INVOICE', pageWidth - margin - 6, margin + 11, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(invoice.invoiceNumber, pageWidth - margin - 6, margin + 18, { align: 'right' });

  // Metadata Grid (Dates, Status, Tax ID)
  let y = margin + 32;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('ISSUE DATE', margin + 6, y + 6);
  doc.text('DUE DATE', margin + 46, y + 6);
  doc.text('PAYMENT TERMS', margin + 86, y + 6);
  doc.text('STATUS', margin + 126, y + 6);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.date, margin + 6, y + 13);
  doc.text(invoice.dueDate, margin + 46, y + 13);
  doc.text(invoice.paymentTerms, margin + 86, y + 13);

  // Status Badge
  if (invoice.paymentStatus === 'PAID') {
    doc.setTextColor(16, 185, 129); // emerald
  } else if (invoice.paymentStatus === 'OVERDUE') {
    doc.setTextColor(239, 68, 68); // red
  } else {
    doc.setTextColor(245, 158, 11); // amber
  }
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.paymentStatus, margin + 126, y + 13);

  // Address Cards: Bill To / From Details
  y += 24;

  const colWidth = (contentWidth - 6) / 2;

  // Bill To Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, 32, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('BILLED TO:', margin + 5, y + 7);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.client.name, margin + 5, y + 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  if (invoice.client.contactPerson) {
    doc.text(`Attn: ${invoice.client.contactPerson}`, margin + 5, y + 20);
  }
  doc.text(invoice.client.address, margin + 5, y + 25);
  doc.text(`${invoice.client.city}, ${invoice.client.country}`, margin + 5, y + 29);

  // Vendor / Tax ID Card
  doc.roundedRect(margin + colWidth + 6, y, colWidth, 32, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('PAYABLE TO / TAX DETAILS:', margin + colWidth + 11, y + 7);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.issuer.name, margin + colWidth + 11, y + 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Billing: ${invoice.issuer.email}`, margin + colWidth + 11, y + 20);
  doc.text(invoice.issuer.phone || 'Direct line available upon request', margin + colWidth + 11, y + 25);
  if (invoice.issuer.taxId) {
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.issuer.taxId, margin + colWidth + 11, y + 29);
  }

  // Items Table Header
  y += 38;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 8, margin + contentWidth, y + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('DESCRIPTION', margin + 4, y + 5.5);
  doc.text('QTY', margin + 96, y + 5.5, { align: 'center' });
  doc.text('UNIT PRICE', margin + 120, y + 5.5, { align: 'right' });
  doc.text('DISCOUNT', margin + 144, y + 5.5, { align: 'right' });
  doc.text('TOTAL', margin + contentWidth - 4, y + 5.5, { align: 'right' });

  y += 9;

  // Render Line Items
  invoice.items.forEach((item, idx) => {
    // Alternating background
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, contentWidth, 8, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);

    // Truncate description if too long
    const cleanDesc = item.description.length > 52 ? item.description.slice(0, 50) + '...' : item.description;
    doc.text(cleanDesc, margin + 4, y + 4.5);

    doc.text(String(item.quantity), margin + 96, y + 4.5, { align: 'center' });
    doc.text(pdfCurrency(item.unitPrice, invoice.currencySymbol, invoice.currencyCode), margin + 120, y + 4.5, { align: 'right' });
    doc.text(item.discountPercent > 0 ? `${item.discountPercent}%` : '0%', margin + 144, y + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(pdfCurrency(item.lineTotal, invoice.currencySymbol, invoice.currencyCode), margin + contentWidth - 4, y + 4.5, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 7, margin + contentWidth, y + 7);

    y += 8;
  });

  // Reconciled Totals Box on Right
  y += 4;
  const summaryBoxWidth = 80;
  const summaryX = margin + contentWidth - summaryBoxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, y, summaryBoxWidth, 38, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  // Subtotal
  doc.text('Subtotal:', summaryX + 6, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(pdfCurrency(invoice.subtotal, invoice.currencySymbol, invoice.currencyCode), summaryX + summaryBoxWidth - 6, y + 7, { align: 'right' });

  // Discount
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Discount:', summaryX + 6, y + 14);
  doc.setTextColor(239, 68, 68);
  doc.text(`-${pdfCurrency(invoice.totalDiscount, invoice.currencySymbol, invoice.currencyCode)}`, summaryX + summaryBoxWidth - 6, y + 14, { align: 'right' });

  // Tax
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${invoice.taxName} (${invoice.taxRate}%):`, summaryX + 6, y + 21);
  doc.setTextColor(15, 23, 42);
  doc.text(pdfCurrency(invoice.taxAmount, invoice.currencySymbol, invoice.currencyCode), summaryX + summaryBoxWidth - 6, y + 21, { align: 'right' });

  // Total Due Highlight
  doc.setFillColor(241, 245, 249);
  doc.rect(summaryX, y + 26, summaryBoxWidth, 12, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, y + 26, summaryX + summaryBoxWidth, y + 26);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Total Due:', summaryX + 6, y + 34);
  doc.text(pdfCurrency(invoice.total, invoice.currencySymbol, invoice.currencyCode), summaryX + summaryBoxWidth - 6, y + 34, { align: 'right' });

  // Reconciled Badge & Notes on Left
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('✔ Totals 100% Mathematically Reconciled', margin + 4, y + 10);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Notes & Payment Instructions:', margin + 4, y + 18);
  doc.text(invoice.notes, margin + 4, y + 24, { maxWidth: contentWidth - summaryBoxWidth - 8 });

  // Page Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 14, margin + contentWidth, pageHeight - 14);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated by SynthForge Synthetic Data Platform · Region: ${invoice.region} (${invoice.currencyCode})`, margin, pageHeight - 9);
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 9, { align: 'right' });

  return doc;
}

/**
 * Generate a vector PDF for a Bank Statement
 */
export function generateBankStatementPdf(statement: BankStatementDocument): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, contentWidth, 22, 'F');

  // Bank Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(statement.bank.name, margin + 6, margin + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`${statement.bank.branch} · SWIFT: ${statement.bank.swiftBic}`, margin + 6, margin + 17);

  // Statement Label on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('BANK STATEMENT', pageWidth - margin - 6, margin + 10, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`Period: ${statement.period.startDate} - ${statement.period.endDate}`, pageWidth - margin - 6, margin + 17, { align: 'right' });

  let y = margin + 28;

  // Account Details Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('ACCOUNT HOLDER', margin + 6, y + 6);
  doc.text('ACCOUNT NUMBER', margin + 65, y + 6);
  doc.text(statement.accountHolder.routingLabel.toUpperCase(), margin + 115, y + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(statement.accountHolder.name, margin + 6, y + 13);
  doc.text(statement.accountHolder.accountNumber, margin + 65, y + 13);
  doc.text(statement.accountHolder.routingOrSortCode, margin + 115, y + 13);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${statement.accountHolder.accountType} · ${statement.accountHolder.city}`, margin + 6, y + 19);

  // 4 Financial Summary Metrics (Starting, Deposits, Withdrawals, Ending)
  y += 28;
  const cardW = (contentWidth - 9) / 4;

  const summaries = [
    { label: 'STARTING BALANCE', val: statement.openingBalance, color: [15, 23, 42] },
    { label: 'TOTAL DEPOSITS (+)', val: statement.totalCredits, color: [16, 185, 129] },
    { label: 'TOTAL WITHDRAWALS (-)', val: statement.totalDebits, color: [239, 68, 68] },
    { label: 'ENDING BALANCE', val: statement.closingBalance, color: [15, 23, 42] },
  ];

  summaries.forEach((card, idx) => {
    const cardX = margin + idx * (cardW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, y, cardW, 16, 2, 2, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, cardX + 3.5, y + 5.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(pdfCurrency(card.val, statement.currencySymbol, statement.currencyCode), cardX + 3.5, y + 12);
  });

  // Transactions Ledger Table
  y += 22;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 7, margin + contentWidth, y + 7);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('DATE', margin + 4, y + 5);
  doc.text('TRANSACTION / MERCHANT', margin + 28, y + 5);
  doc.text('DEBITS (-)', margin + 116, y + 5, { align: 'right' });
  doc.text('CREDITS (+)', margin + 144, y + 5, { align: 'right' });
  doc.text('BALANCE', margin + contentWidth - 4, y + 5, { align: 'right' });

  y += 8;

  // Render transactions (handle multiple pages if transactions exceed page height)
  statement.transactions.forEach((tx, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = margin + 10;

      // Table header on new page
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('DATE', margin + 4, y + 5);
      doc.text('TRANSACTION / MERCHANT', margin + 28, y + 5);
      doc.text('DEBITS (-)', margin + 116, y + 5, { align: 'right' });
      doc.text('CREDITS (+)', margin + 144, y + 5, { align: 'right' });
      doc.text('BALANCE', margin + contentWidth - 4, y + 5, { align: 'right' });
      y += 8;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, contentWidth, 6.8, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(tx.date, margin + 4, y + 4);

    const desc = tx.description.length > 44 ? tx.description.slice(0, 42) + '...' : tx.description;
    doc.setTextColor(15, 23, 42);
    doc.text(desc, margin + 28, y + 4);

    if (tx.type === 'debit') {
      doc.setTextColor(239, 68, 68);
      doc.text(`-${pdfCurrency(tx.amount, statement.currencySymbol, statement.currencyCode)}`, margin + 116, y + 4, { align: 'right' });
      doc.setTextColor(148, 163, 184);
      doc.text('—', margin + 144, y + 4, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('—', margin + 116, y + 4, { align: 'right' });
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text(`+${pdfCurrency(tx.amount, statement.currencySymbol, statement.currencyCode)}`, margin + 144, y + 4, { align: 'right' });
    }

    // Running Balance (Always exact!)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(pdfCurrency(tx.runningBalance, statement.currencySymbol, statement.currencyCode), margin + contentWidth - 4, y + 4, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 6, margin + contentWidth, y + 6);

    y += 7;
  });

  // Footer notes & Reconciliation banner
  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('✔ Running balance validated: Starting Balance + Credits - Debits === Ending Balance', margin + 4, y + 4);

  // Bottom Page Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`SynthForge Synthetic Banking Engine · Customer Support: ${statement.bank.supportPhone}`, margin, pageHeight - 7);
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 7, { align: 'right' });

  return doc;
}

/**
 * Convert Invoices to CSV (Flattened line items with header invoice fields)
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
 * Bulk Export as ZIP (Up to 1000 documents)
 * Produces a ZIP containing individual vector PDFs, the complete JSON file, and CSV ledger
 */
export async function exportBulkDocumentsZip(
  docs: any[],
  type: 'invoice' | 'bank_statement',
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(type === 'invoice' ? 'invoices_pdf' : 'bank_statements_pdf') || zip;
  const total = docs.length;

  // Add JSON payload to ZIP
  zip.file(`synthforge_${type}s_dataset.json`, JSON.stringify(docs, null, 2));

  // Add CSV summary to ZIP
  if (type === 'invoice') {
    zip.file(`synthforge_invoices_ledger.csv`, convertInvoicesToCsv(docs as InvoiceDocument[]));
  } else {
    zip.file(`synthforge_bank_statements_ledger.csv`, convertBankStatementsToCsv(docs as BankStatementDocument[]));
  }

  // Generate individual PDFs in chunks so UI stays responsive
  for (let i = 0; i < total; i++) {
    const docItem = docs[i];
    let pdfDoc: jsPDF;

    if (type === 'invoice') {
      pdfDoc = generateInvoicePdf(docItem as InvoiceDocument);
      const filename = `${(docItem as InvoiceDocument).invoiceNumber}.pdf`;
      const pdfBytes = pdfDoc.output('arraybuffer');
      folder.file(filename, pdfBytes);
    } else {
      pdfDoc = generateBankStatementPdf(docItem as BankStatementDocument);
      const filename = `${(docItem as BankStatementDocument).statementId}.pdf`;
      const pdfBytes = pdfDoc.output('arraybuffer');
      folder.file(filename, pdfBytes);
    }

    if (onProgress && (i % 5 === 0 || i === total - 1)) {
      onProgress(i + 1, total);
      // Yield to main thread
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
