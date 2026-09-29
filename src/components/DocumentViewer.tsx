import React, { useState, useTransition } from 'react';
import {
  FileText,
  Code,
  Table as TableIcon,
  Download,
  Archive,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Building2,
  Landmark,
  Globe,
  DollarSign,
  Calendar,
  CreditCard,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Percent,
  X,
  Loader2,
} from 'lucide-react';
import {
  InvoiceDocument,
  BankStatementDocument,
  DocumentRegion,
} from '../types';
import { formatCurrency } from '../utils/documentGenerators';
import { downloadBlob, downloadFile } from '../utils/export';

interface DocumentViewerProps {
  documents: any[];
  onSelectRegion?: (region: DocumentRegion) => void;
  selectedRegion?: DocumentRegion;
  onUpdateBulkCount?: (count: number) => void;
  bulkCount?: number;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documents,
  onSelectRegion,
  selectedRegion = 'US',
  onUpdateBulkCount,
  bulkCount = 50,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'visual' | 'json' | 'table'>('visual');
  const [copied, setCopied] = useState<boolean>(false);

  // Bulk ZIP Export states
  const [isBulkExporting, setIsBulkExporting] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [isCancelled, setIsCancelled] = useState<boolean>(false);

  const selectedDoc = documents[selectedIndex] || documents[0] || {};
  const isInvoice = selectedDoc?.type === 'invoice';
  const isBankStatement = selectedDoc?.type === 'bank_statement';

  // Copy single document JSON
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedDoc, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export Single PDF using jsPDF
  const handleDownloadSinglePdf = async () => {
    const { generateInvoicePdf, generateBankStatementPdf } = await import('../utils/pdfExport');
    if (isInvoice) {
      const inv = selectedDoc as InvoiceDocument;
      const pdf = generateInvoicePdf(inv);
      pdf.save(`${inv.invoiceNumber}.pdf`);
    } else if (isBankStatement) {
      const stmt = selectedDoc as BankStatementDocument;
      const pdf = generateBankStatementPdf(stmt);
      pdf.save(`${stmt.statementId}.pdf`);
    } else {
      // Fallback text download
      downloadFile(JSON.stringify(selectedDoc, null, 2), `document_${selectedIndex + 1}.json`, 'application/json');
    }
  };

  // Export Direct JSON
  const handleDownloadJson = () => {
    const filename = isInvoice
      ? `synthforge_invoices_${Date.now()}.json`
      : isBankStatement
      ? `synthforge_bank_statements_${Date.now()}.json`
      : `synthforge_documents_${Date.now()}.json`;
    downloadFile(JSON.stringify(documents, null, 2), filename, 'application/json');
  };

  // Export Direct CSV
  const handleDownloadCsv = async () => {
    const { convertInvoicesToCsv, convertBankStatementsToCsv } = await import('../utils/pdfExport');
    if (isInvoice) {
      const csv = convertInvoicesToCsv(documents as InvoiceDocument[]);
      downloadFile(csv, `synthforge_invoices_ledger_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    } else if (isBankStatement) {
      const csv = convertBankStatementsToCsv(documents as BankStatementDocument[]);
      downloadFile(csv, `synthforge_bank_statements_ledger_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    } else {
      downloadFile(JSON.stringify(documents, null, 2), `documents_${Date.now()}.json`, 'application/json');
    }
  };

  // Bulk Export as ZIP (up to 1,000 documents)
  const handleExportBulkZip = async () => {
    if (!isInvoice && !isBankStatement) return;
    setIsBulkExporting(true);
    setIsCancelled(false);
    setBulkProgress({ current: 0, total: documents.length });

    try {
      const { exportBulkDocumentsZip } = await import('../utils/pdfExport');
      const docType = isInvoice ? 'invoice' : 'bank_statement';
      const zipBlob = await exportBulkDocumentsZip(documents, docType, (cur, tot) => {
        setBulkProgress({ current: cur, total: tot });
      });

      const filename = isInvoice
        ? `synthforge_invoices_bulk_${documents.length}_pkgs.zip`
        : `synthforge_bank_statements_bulk_${documents.length}_pkgs.zip`;
      downloadBlob(zipBlob, filename);
    } catch (err) {
      console.error('Bulk ZIP export failed:', err);
    } finally {
      setIsBulkExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Document Toolbar */}
      <div
        className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Document Selector & Region Badge */}
        <div className="flex items-center gap-3">
          {/* Document Pagination Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-xs sm:max-w-md py-0.5">
            {documents.slice(0, 10).map((doc, idx) => {
              const label = doc?.invoiceNumber || doc?.statementId ? `#${idx + 1}` : `#${idx + 1}`;
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'text-[var(--accent-foreground)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)',
                  }}
                  title={`View document ${idx + 1}`}
                >
                  {label}
                </button>
              );
            })}
            {documents.length > 10 && (
              <span className="text-xs text-[var(--text-muted)] font-mono px-1">
                +{documents.length - 10} more ({documents.length} total)
              </span>
            )}
          </div>

          {/* Region Template Selector Buttons */}
          {onSelectRegion && (isInvoice || isBankStatement) && (
            <div className="hidden lg:flex items-center p-0.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
              {(['US', 'UK', 'PK', 'EU'] as DocumentRegion[]).map((r) => {
                const isCur = (selectedDoc?.region || selectedRegion) === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onSelectRegion(r)}
                    className={`px-2 py-0.5 rounded font-mono font-medium cursor-pointer transition-colors ${
                      isCur ? 'bg-[var(--accent-primary)] text-[var(--accent-foreground)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    title={`Switch region template to ${r}`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* View Mode & Export Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggles */}
          <div className="flex items-center p-0.5 rounded-lg border text-xs" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                viewMode === 'visual' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
              }`}
              title="Visual Document Preview"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span className="hidden sm:inline">Visual Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                viewMode === 'table' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
              }`}
              title="Table / Ledger View"
            >
              <TableIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Ledger Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('json')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                viewMode === 'json' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-secondary)]'
              }`}
              title="Raw JSON Payload"
            >
              <Code className="w-3.5 h-3.5 text-amber-500" />
              <span>JSON</span>
            </button>
          </div>

          {/* Download Single PDF Button */}
          {(isInvoice || isBankStatement) && (
            <button
              type="button"
              onClick={handleDownloadSinglePdf}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold text-[var(--accent-foreground)] cursor-pointer transition-all shadow-xs hover:brightness-105"
              style={{ backgroundColor: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
              title="Download current document as clean vector PDF via jsPDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          )}

          {/* Bulk ZIP Export Button (Up to 1000) */}
          {(isInvoice || isBankStatement) && (
            <button
              type="button"
              onClick={handleExportBulkZip}
              disabled={isBulkExporting}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] cursor-pointer transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
              title={`Export all ${documents.length} documents as a bulk ZIP (PDFs + JSON + CSV)`}
            >
              {isBulkExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-primary)]" />
              ) : (
                <Archive className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="hidden md:inline">Bulk ZIP ({documents.length})</span>
            </button>
          )}

          {/* CSV Download */}
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
            title="Download full dataset as CSV"
          >
            <span>CSV</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-lg border text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}
            title="Copy document JSON to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bulk Progress Modal Overlay */}
      {isBulkExporting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Archive className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Packing Bulk ZIP Archive</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Generating vector PDFs with jsPDF and bundling dataset...
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--text-muted)]">Progress</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {bulkProgress.current} / {bulkProgress.total} documents ({Math.round((bulkProgress.current / Math.max(1, bulkProgress.total)) * 100)}%)
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[var(--bg-surface-subtle)]">
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${Math.round((bulkProgress.current / Math.max(1, bulkProgress.total)) * 100)}%`,
                    backgroundColor: 'var(--accent-primary)',
                  }}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBulkExporting(false)}
                className="px-4 py-1.5 rounded-lg border text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6" style={{ backgroundColor: 'var(--bg-canvas)' }}>
        {/* VIEW MODE 1: JSON */}
        {viewMode === 'json' ? (
          <div
            className="max-w-4xl mx-auto p-5 rounded-2xl border font-mono text-xs overflow-x-auto leading-relaxed shadow-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <pre className="whitespace-pre">{JSON.stringify(selectedDoc, null, 2)}</pre>
          </div>
        ) : viewMode === 'table' ? (
          /* VIEW MODE 2: TABLE / LEDGER BREAKDOWN */
          <div className="max-w-5xl mx-auto space-y-4">
            <div
              className="rounded-2xl border overflow-hidden shadow-xs"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  {isInvoice ? 'Invoice Line Items Ledger' : isBankStatement ? 'Bank Transaction History Ledger' : 'Document Records Table'}
                </h4>
                <span className="text-xs font-mono text-[var(--accent-primary)] font-semibold">
                  {isInvoice
                    ? `${(selectedDoc as InvoiceDocument).items?.length || 0} Line Items`
                    : isBankStatement
                    ? `${(selectedDoc as BankStatementDocument).transactions?.length || 0} Transactions`
                    : `${documents.length} Records`}
                </span>
              </div>

              {isInvoice ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b text-[var(--text-muted)] font-mono font-medium" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4 text-center">Qty</th>
                        <th className="py-2.5 px-4 text-right">Unit Price</th>
                        <th className="py-2.5 px-4 text-right">Discount</th>
                        <th className="py-2.5 px-4 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
                      {(selectedDoc as InvoiceDocument).items?.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-[var(--table-row-hover)]">
                          <td className="py-2.5 px-4 text-[var(--text-muted)]">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-sans font-medium text-[var(--text-primary)]">{item.description}</td>
                          <td className="py-2.5 px-4 text-center">{item.quantity}</td>
                          <td className="py-2.5 px-4 text-right">
                            {formatCurrency(item.unitPrice, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-rose-500">
                            {item.discountPercent > 0 ? `${item.discountPercent}% (-${formatCurrency(item.discountAmount, selectedDoc.currencySymbol, selectedDoc.currencyCode)})` : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-[var(--text-primary)]">
                            {formatCurrency(item.lineTotal, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : isBankStatement ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b text-[var(--text-muted)] font-mono font-medium" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Merchant / Narrative</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4 text-right">Debits (-)</th>
                        <th className="py-2.5 px-4 text-right">Credits (+)</th>
                        <th className="py-2.5 px-4 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
                      {(selectedDoc as BankStatementDocument).transactions?.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[var(--table-row-hover)]">
                          <td className="py-2.5 px-4 text-[var(--text-muted)] whitespace-nowrap">{tx.date}</td>
                          <td className="py-2.5 px-4 font-sans font-medium text-[var(--text-primary)]">{tx.description}</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-rose-500">
                            {tx.type === 'debit' ? `-${formatCurrency(tx.amount, selectedDoc.currencySymbol, selectedDoc.currencyCode)}` : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right text-emerald-500 font-semibold">
                            {tx.type === 'credit' ? `+${formatCurrency(tx.amount, selectedDoc.currencySymbol, selectedDoc.currencyCode)}` : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-[var(--text-primary)]">
                            {formatCurrency(tx.runningBalance, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-xs font-mono">
                  <pre>{JSON.stringify(selectedDoc, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        ) : isInvoice ? (
          /* VIEW MODE 3A: VISUAL INVOICE */
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Reconciliation Confirmation Pill */}
            <div
              className="p-3 rounded-xl border flex items-center justify-between text-xs shadow-xs"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
            >
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Totals 100% Mathematically Reconciled: Subtotal ({formatCurrency((selectedDoc as InvoiceDocument).subtotal, selectedDoc.currencySymbol, selectedDoc.currencyCode)}) - Discount ({formatCurrency((selectedDoc as InvoiceDocument).totalDiscount, selectedDoc.currencySymbol, selectedDoc.currencyCode)}) + {(selectedDoc as InvoiceDocument).taxName} ({formatCurrency((selectedDoc as InvoiceDocument).taxAmount, selectedDoc.currencySymbol, selectedDoc.currencyCode)}) = Total Due ({formatCurrency((selectedDoc as InvoiceDocument).total, selectedDoc.currencySymbol, selectedDoc.currencyCode)})
                </span>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-white">
                RECONCILED
              </span>
            </div>

            {/* Realistic Paper Invoice Container */}
            <div
              className="p-6 sm:p-10 rounded-2xl border shadow-sm space-y-8"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Header: Company & Invoice Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-xs text-white"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                        {(selectedDoc as InvoiceDocument).issuer.name}
                      </h2>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {(selectedDoc as InvoiceDocument).issuer.taxId}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] space-y-0.5 pt-1">
                    <p>{(selectedDoc as InvoiceDocument).issuer.address}</p>
                    <p>{(selectedDoc as InvoiceDocument).issuer.city}, {(selectedDoc as InvoiceDocument).issuer.country}</p>
                    <p className="text-[var(--text-muted)]">{(selectedDoc as InvoiceDocument).issuer.email}</p>
                  </div>
                </div>

                <div className="sm:text-right space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor:
                        (selectedDoc as InvoiceDocument).paymentStatus === 'PAID'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : (selectedDoc as InvoiceDocument).paymentStatus === 'OVERDUE'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        (selectedDoc as InvoiceDocument).paymentStatus === 'PAID'
                          ? '#10b981'
                          : (selectedDoc as InvoiceDocument).paymentStatus === 'OVERDUE'
                          ? '#ef4444'
                          : '#f59e0b',
                    }}
                  >
                    <span>{(selectedDoc as InvoiceDocument).paymentStatus}</span>
                  </div>
                  <h1 className="text-2xl font-black font-mono tracking-tight text-[var(--text-primary)]">
                    {(selectedDoc as InvoiceDocument).invoiceNumber}
                  </h1>
                  <div className="text-xs font-mono text-[var(--text-secondary)] space-y-1">
                    <p>Issue Date: <span className="text-[var(--text-primary)] font-semibold">{(selectedDoc as InvoiceDocument).date}</span></p>
                    <p>Due Date: <span className="text-[var(--text-primary)] font-semibold">{(selectedDoc as InvoiceDocument).dueDate}</span></p>
                    <p>Region Template: <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-surface-subtle)] text-[var(--accent-primary)]">{(selectedDoc as InvoiceDocument).region} ({(selectedDoc as InvoiceDocument).currencyCode})</span></p>
                  </div>
                </div>
              </div>

              {/* Billed To / Payable To Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Billed To */}
                <div
                  className="p-4 rounded-xl border text-xs space-y-2"
                  style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}
                >
                  <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-[var(--accent-primary)] block">
                    Billed To / Client
                  </span>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {(selectedDoc as InvoiceDocument).client.name}
                  </h4>
                  {(selectedDoc as InvoiceDocument).client.contactPerson && (
                    <p className="text-[var(--text-secondary)]">Attn: {(selectedDoc as InvoiceDocument).client.contactPerson}</p>
                  )}
                  <p className="text-[var(--text-muted)]">{(selectedDoc as InvoiceDocument).client.address}</p>
                  <p className="text-[var(--text-muted)]">{(selectedDoc as InvoiceDocument).client.city}, {(selectedDoc as InvoiceDocument).client.country}</p>
                  <p className="font-mono text-[var(--text-secondary)]">{(selectedDoc as InvoiceDocument).client.email}</p>
                </div>

                {/* Payment & Terms */}
                <div
                  className="p-4 rounded-xl border text-xs space-y-2"
                  style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}
                >
                  <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-[var(--accent-primary)] block">
                    Remittance & Payment Terms
                  </span>
                  <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">Payment Terms:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{(selectedDoc as InvoiceDocument).paymentTerms}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">Currency:</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">{(selectedDoc as InvoiceDocument).currencyCode} ({(selectedDoc as InvoiceDocument).currencySymbol})</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[var(--text-muted)]">Tax Category:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{(selectedDoc as InvoiceDocument).taxName} ({(selectedDoc as InvoiceDocument).taxRate}%)</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b text-[var(--text-secondary)] font-mono font-semibold" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Description / Service</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Discount</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
                    {(selectedDoc as InvoiceDocument).items?.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-[var(--table-row-hover)]">
                        <td className="py-3 px-4 text-[var(--text-muted)]">{idx + 1}</td>
                        <td className="py-3 px-4 font-sans font-medium text-[var(--text-primary)]">{item.description}</td>
                        <td className="py-3 px-4 text-center">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(item.unitPrice, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-500">
                          {item.discountPercent > 0 ? `${item.discountPercent}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                          {formatCurrency(item.lineTotal, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Reconciliation Box */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
                <div className="space-y-2 max-w-sm text-xs">
                  <h5 className="font-semibold text-[var(--text-primary)]">Notes & Payment Instructions</h5>
                  <p className="text-[var(--text-muted)] leading-relaxed">
                    {(selectedDoc as InvoiceDocument).notes}
                  </p>
                  <p className="text-[var(--text-muted)] font-mono text-[11px] pt-1">
                    Direct wire and SEPA remittance accepted. Please include invoice number {(selectedDoc as InvoiceDocument).invoiceNumber} in payment reference.
                  </p>
                </div>

                {/* Subtotal, Discount, Tax, Total Card */}
                <div
                  className="w-full sm:w-72 p-4 rounded-xl border text-xs space-y-2.5"
                  style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex justify-between items-center text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {formatCurrency((selectedDoc as InvoiceDocument).subtotal, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                    </span>
                  </div>

                  {(selectedDoc as InvoiceDocument).totalDiscount > 0 && (
                    <div className="flex justify-between items-center text-rose-500">
                      <span>Total Discounts</span>
                      <span className="font-mono font-medium">
                        -{formatCurrency((selectedDoc as InvoiceDocument).totalDiscount, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[var(--text-secondary)]">
                    <span>Net Taxable Base</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {formatCurrency((selectedDoc as InvoiceDocument).netTaxableAmount, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[var(--text-secondary)]">
                    <span>{(selectedDoc as InvoiceDocument).taxName} ({(selectedDoc as InvoiceDocument).taxRate}%)</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      +{formatCurrency((selectedDoc as InvoiceDocument).taxAmount, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                    </span>
                  </div>

                  <div className="pt-2 border-t flex justify-between items-baseline" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-sm font-bold text-[var(--text-primary)]">Total Due</span>
                    <span className="text-lg font-black font-mono text-[var(--accent-primary)]">
                      {formatCurrency((selectedDoc as InvoiceDocument).total, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : isBankStatement ? (
          /* VIEW MODE 3B: VISUAL BANK STATEMENT */
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Balance Reconciliation Confirmation Banner */}
            <div
              className="p-3 rounded-xl border flex items-center justify-between text-xs shadow-xs"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
            >
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Running Balance 100% Reconciled: Starting ({formatCurrency((selectedDoc as BankStatementDocument).openingBalance, selectedDoc.currencySymbol, selectedDoc.currencyCode)}) + Credits ({formatCurrency((selectedDoc as BankStatementDocument).totalCredits, selectedDoc.currencySymbol, selectedDoc.currencyCode)}) - Debits ({formatCurrency((selectedDoc as BankStatementDocument).totalDebits, selectedDoc.currencySymbol, selectedDoc.currencyCode)}) = Ending ({formatCurrency((selectedDoc as BankStatementDocument).closingBalance, selectedDoc.currencySymbol, selectedDoc.currencyCode)})
                </span>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-white">
                AUDITED
              </span>
            </div>

            {/* Paper Bank Statement Container */}
            <div
              className="p-6 sm:p-10 rounded-2xl border shadow-sm space-y-8"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Bank Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-xs text-white"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                        {(selectedDoc as BankStatementDocument).bank.name}
                      </h2>
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        SWIFT/BIC: {(selectedDoc as BankStatementDocument).bank.swiftBic} · {(selectedDoc as BankStatementDocument).bank.branch}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {(selectedDoc as BankStatementDocument).bank.address}
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--bg-surface-subtle)] text-[var(--accent-primary)] uppercase tracking-wider">
                    Official Account Statement
                  </span>
                  <h1 className="text-lg font-bold font-mono text-[var(--text-primary)]">
                    {(selectedDoc as BankStatementDocument).statementId}
                  </h1>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Statement Period: <span className="text-[var(--text-primary)] font-semibold">{(selectedDoc as BankStatementDocument).period.startDate} - {(selectedDoc as BankStatementDocument).period.endDate}</span>
                  </p>
                </div>
              </div>

              {/* Account Holder Information Card */}
              <div
                className="p-4 rounded-xl border text-xs grid grid-cols-1 sm:grid-cols-3 gap-4"
                style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}
              >
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] block">
                    Account Holder
                  </span>
                  <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                    {(selectedDoc as BankStatementDocument).accountHolder.name}
                  </p>
                  <p className="text-[var(--text-secondary)] text-[11px]">
                    {(selectedDoc as BankStatementDocument).accountHolder.address}
                  </p>
                  <p className="text-[var(--text-muted)] text-[11px]">
                    {(selectedDoc as BankStatementDocument).accountHolder.city}, {(selectedDoc as BankStatementDocument).accountHolder.country}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] block">
                    Account Number
                  </span>
                  <p className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5">
                    {(selectedDoc as BankStatementDocument).accountHolder.accountNumber}
                  </p>
                  <p className="text-[var(--text-secondary)] text-[11px]">
                    Type: {(selectedDoc as BankStatementDocument).accountHolder.accountType}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)] block">
                    {(selectedDoc as BankStatementDocument).accountHolder.routingLabel}
                  </span>
                  <p className="text-sm font-bold font-mono text-[var(--text-primary)] mt-0.5">
                    {(selectedDoc as BankStatementDocument).accountHolder.routingOrSortCode}
                  </p>
                  <p className="text-[var(--text-muted)] text-[11px]">
                    Currency: {(selectedDoc as BankStatementDocument).currencyCode} ({(selectedDoc as BankStatementDocument).currencySymbol})
                  </p>
                </div>
              </div>

              {/* 4 Financial Balance Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                  <span className="text-[10px] uppercase font-mono font-medium text-[var(--text-muted)] block">
                    Starting Balance
                  </span>
                  <p className="text-base font-bold font-mono text-[var(--text-primary)] mt-1">
                    {formatCurrency((selectedDoc as BankStatementDocument).openingBalance, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                  <span className="text-[10px] uppercase font-mono font-medium text-emerald-500 block">
                    Total Deposits (+)
                  </span>
                  <p className="text-base font-bold font-mono text-emerald-500 mt-1">
                    +{formatCurrency((selectedDoc as BankStatementDocument).totalCredits, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                  <span className="text-[10px] uppercase font-mono font-medium text-rose-500 block">
                    Total Withdrawals (-)
                  </span>
                  <p className="text-base font-bold font-mono text-rose-500 mt-1">
                    -{formatCurrency((selectedDoc as BankStatementDocument).totalDebits, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                  <span className="text-[10px] uppercase font-mono font-medium text-[var(--accent-primary)] block">
                    Ending Balance
                  </span>
                  <p className="text-base font-black font-mono text-[var(--accent-primary)] mt-1">
                    {formatCurrency((selectedDoc as BankStatementDocument).closingBalance, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                  </p>
                </div>
              </div>

              {/* Transactions Ledger Table with Running Balance */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b text-[var(--text-secondary)] font-mono font-semibold" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Transaction / Merchant</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Debits (-)</th>
                      <th className="py-3 px-4 text-right">Credits (+)</th>
                      <th className="py-3 px-4 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
                    {(selectedDoc as BankStatementDocument).transactions?.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[var(--table-row-hover)]">
                        <td className="py-3 px-4 text-[var(--text-muted)] whitespace-nowrap">{tx.date}</td>
                        <td className="py-3 px-4 font-sans font-medium text-[var(--text-primary)]">{tx.description}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-rose-500">
                          {tx.type === 'debit' ? `-${formatCurrency(tx.amount, selectedDoc.currencySymbol, selectedDoc.currencyCode)}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-500 font-semibold">
                          {tx.type === 'credit' ? `+${formatCurrency(tx.amount, selectedDoc.currencySymbol, selectedDoc.currencyCode)}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[var(--text-primary)]">
                          {formatCurrency(tx.runningBalance, selectedDoc.currencySymbol, selectedDoc.currencyCode)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Note */}
              <div className="pt-2 border-t flex flex-col sm:flex-row justify-between items-center text-xs text-[var(--text-muted)] gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                <span>Customer Assistance Line: {(selectedDoc as BankStatementDocument).bank.supportPhone}</span>
                <span className="font-mono text-[11px]">Electronic Statement Generated via SynthForge Engine</span>
              </div>
            </div>
          </div>
        ) : (
          /* FALLBACK GENERIC DOCUMENT VIEWER */
          <div className="max-w-3xl mx-auto space-y-4">
            <div
              className="p-5 rounded-xl border shadow-xs space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] block uppercase tracking-wider">
                    Synthetic Document Payload
                  </span>
                  <h4 className="text-base font-bold text-[var(--text-primary)] font-mono mt-0.5">
                    {selectedDoc.eventId || selectedDoc.ticketId || selectedDoc.encounterId || `Record #${selectedIndex + 1}`}
                  </h4>
                </div>
                {selectedDoc.timestamp && (
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {selectedDoc.timestamp}
                  </span>
                )}
              </div>

              <div className="space-y-3 font-mono text-xs">
                {Object.entries(selectedDoc).map(([key, value]) => (
                  <div key={key} className="p-2.5 rounded-lg border flex flex-col gap-1" style={{ backgroundColor: 'var(--bg-surface-subtle)', borderColor: 'var(--border-subtle)' }}>
                    <span className="font-bold text-[var(--accent-primary)]">{key}:</span>
                    <pre className="text-[11px] whitespace-pre-wrap">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
