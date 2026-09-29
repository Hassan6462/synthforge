export type DocumentRegion = 'US' | 'UK' | 'PK' | 'EU';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  lineTotal: number;
}

export interface InvoiceParty {
  name: string;
  contactPerson?: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email: string;
  taxId?: string; // EIN, VAT No, NTN/STRN
}

export interface InvoiceDocument {
  id: string;
  type: 'invoice';
  invoiceNumber: string;
  date: string;
  dueDate: string;
  region: DocumentRegion;
  currencySymbol: string;
  currencyCode: string;
  taxName: string;
  taxRate: number;
  issuer: InvoiceParty;
  client: InvoiceParty;
  items: InvoiceLineItem[];
  subtotal: number;
  totalDiscount: number;
  netTaxableAmount: number;
  taxAmount: number;
  total: number;
  paymentStatus: 'PAID' | 'DUE' | 'OVERDUE';
  paymentTerms: string;
  notes: string;
  isReconciled: boolean;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  merchant: string;
  category: 'Shopping' | 'Utilities' | 'Income' | 'Entertainment' | 'Travel' | 'Transfer' | 'Services' | 'Healthcare';
  type: 'credit' | 'debit';
  amount: number;
  runningBalance: number;
  referenceNumber: string;
}

export interface BankStatementDocument {
  id: string;
  type: 'bank_statement';
  statementId: string;
  region: DocumentRegion;
  currencySymbol: string;
  currencyCode: string;
  bank: {
    name: string;
    branch: string;
    swiftBic: string;
    address: string;
    supportPhone: string;
  };
  accountHolder: {
    name: string;
    accountNumber: string;
    routingOrSortCode: string;
    routingLabel: string; // "Routing Number" | "Sort Code" | "IBAN"
    accountType: string;
    address: string;
    city: string;
    country: string;
  };
  period: {
    startDate: string;
    endDate: string;
    statementDate: string;
    daysCount: number;
  };
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  closingBalance: number;
  netChange: number;
  transactionCount: number;
  transactions: BankTransaction[];
  isReconciled: boolean;
}
