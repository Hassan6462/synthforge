import { PRNG } from './prng';
import {
  DocumentRegion,
  InvoiceDocument,
  InvoiceLineItem,
  BankStatementDocument,
  BankTransaction,
  GenerationSettings,
} from '../types';

// Realistic Regional Data Pools

export interface RegionMetadata {
  region: DocumentRegion;
  currencySymbol: string;
  currencyCode: string;
  taxName: string;
  defaultTaxRate: number;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'DD.MM.YYYY';
  routingLabel: string;
  banks: { name: string; branch: string; swift: string; address: string; phone: string }[];
  cities: { city: string; statePostal: string; country: string }[];
  taxIdPrefix: string;
  companySuffixes: string[];
}

export const REGION_CONFIGS: Record<DocumentRegion, RegionMetadata> = {
  US: {
    region: 'US',
    currencySymbol: '$',
    currencyCode: 'USD',
    taxName: 'Sales Tax',
    defaultTaxRate: 8.25,
    dateFormat: 'MM/DD/YYYY',
    routingLabel: 'Routing Number',
    banks: [
      { name: 'JPMorgan Chase Bank, N.A.', branch: 'Manhattan Commercial Branch', swift: 'CHASUS33', address: '270 Park Ave, New York, NY 10017', phone: '+1 (800) 935-9935' },
      { name: 'Bank of America, N.A.', branch: 'Charlotte Corporate Center', swift: 'BOFAUS3N', address: '100 N Tryon St, Charlotte, NC 28255', phone: '+1 (800) 432-1000' },
      { name: 'Wells Fargo Bank, N.A.', branch: 'San Francisco Financial Center', swift: 'WFBIUS6S', address: '420 Montgomery St, San Francisco, CA 94104', phone: '+1 (800) 869-3557' },
      { name: 'Silicon Valley Commercial Bank', branch: 'Sand Hill Tech Hub', swift: 'SVBIUS66', address: '3003 Tasman Dr, Santa Clara, CA 95054', phone: '+1 (408) 654-7400' },
    ],
    cities: [
      { city: 'New York', statePostal: 'NY 10001', country: 'United States' },
      { city: 'San Francisco', statePostal: 'CA 94105', country: 'United States' },
      { city: 'Austin', statePostal: 'TX 78701', country: 'United States' },
      { city: 'Seattle', statePostal: 'WA 98101', country: 'United States' },
      { city: 'Chicago', statePostal: 'IL 60601', country: 'United States' },
      { city: 'Boston', statePostal: 'MA 02110', country: 'United States' },
    ],
    taxIdPrefix: 'EIN',
    companySuffixes: ['Inc.', 'LLC', 'Corp.', 'Technologies Inc.', 'Solutions LLC'],
  },
  UK: {
    region: 'UK',
    currencySymbol: '£',
    currencyCode: 'GBP',
    taxName: 'VAT',
    defaultTaxRate: 20.0,
    dateFormat: 'DD/MM/YYYY',
    routingLabel: 'Sort Code',
    banks: [
      { name: 'Barclays Bank UK PLC', branch: 'Canary Wharf Business Hub', swift: 'BARCGB22', address: '1 Churchill Place, London E14 5HP', phone: '+44 345 734 5345' },
      { name: 'HSBC UK Bank plc', branch: 'City of London Corporate', swift: 'HBUKGB41', address: '8 Canada Square, London E14 5HQ', phone: '+44 345 740 4404' },
      { name: 'NatWest Group plc', branch: 'Bishopsgate Premier Branch', swift: 'NWBKGB2L', address: '250 Bishopsgate, London EC2M 4AA', phone: '+44 345 788 8444' },
      { name: 'Lloyds Bank plc', branch: 'Edinburgh & Lothian Office', swift: 'LOYDGB2L', address: '25 Gresham Street, London EC2V 7HN', phone: '+44 345 300 0000' },
    ],
    cities: [
      { city: 'London', statePostal: 'EC2A 4NE', country: 'United Kingdom' },
      { city: 'Manchester', statePostal: 'M1 4BT', country: 'United Kingdom' },
      { city: 'Edinburgh', statePostal: 'EH1 2NG', country: 'United Kingdom' },
      { city: 'Birmingham', statePostal: 'B3 3AG', country: 'United Kingdom' },
      { city: 'Cambridge', statePostal: 'CB2 1TN', country: 'United Kingdom' },
    ],
    taxIdPrefix: 'GB VAT',
    companySuffixes: ['Ltd', 'PLC', 'Group Ltd', 'Enterprises PLC', 'Systems UK'],
  },
  PK: {
    region: 'PK',
    currencySymbol: 'PKR',
    currencyCode: 'PKR',
    taxName: 'GST',
    defaultTaxRate: 18.0,
    dateFormat: 'DD/MM/YYYY',
    routingLabel: 'IBAN',
    banks: [
      { name: 'Habib Bank Limited (HBL)', branch: 'I.I. Chundrigar Corporate Center', swift: 'HABBPKKA', address: 'HBL Plaza, I.I. Chundrigar Rd, Karachi 74000', phone: '+92 (021) 111-111-425' },
      { name: 'Meezan Bank Limited', branch: 'Gulberg Islamic Banking Hub', swift: 'MEZNPKKA', address: 'Meezan House, C-25 Estate Ave, SITE, Karachi', phone: '+92 (021) 111-331-331' },
      { name: 'MCB Bank Limited', branch: 'Jail Road Commercial Plaza', swift: 'MUCBPKKA', address: 'MCB House, 15 Main Gulberg, Lahore 54000', phone: '+92 (042) 111-000-622' },
      { name: 'Allied Bank Limited (ABL)', branch: 'Blue Area Central Branch', swift: 'ABBLPKKA', address: 'Allied Bank Tower, Blue Area, Islamabad 44000', phone: '+92 (051) 111-225-225' },
    ],
    cities: [
      { city: 'Karachi', statePostal: 'Sindh 74200', country: 'Pakistan' },
      { city: 'Lahore', statePostal: 'Punjab 54000', country: 'Pakistan' },
      { city: 'Islamabad', statePostal: 'ICT 44000', country: 'Pakistan' },
      { city: 'Rawalpindi', statePostal: 'Punjab 46000', country: 'Pakistan' },
      { city: 'Faisalabad', statePostal: 'Punjab 38000', country: 'Pakistan' },
    ],
    taxIdPrefix: 'NTN / STRN',
    companySuffixes: ['(Pvt.) Ltd', 'Enterprises Pvt Ltd', 'Industries Ltd', 'Technologies (Pvt.) Ltd'],
  },
  EU: {
    region: 'EU',
    currencySymbol: '€',
    currencyCode: 'EUR',
    taxName: 'VAT',
    defaultTaxRate: 19.0,
    dateFormat: 'DD.MM.YYYY',
    routingLabel: 'IBAN & BIC',
    banks: [
      { name: 'Deutsche Bank AG', branch: 'Frankfurt Financial District', swift: 'DEUTDEDD', address: 'Taunusanlage 12, 60325 Frankfurt am Main, Germany', phone: '+49 69 910-00' },
      { name: 'BNP Paribas S.A.', branch: 'Paris Opéra Corporate Branch', swift: 'BNPAFRPP', address: '16 Boulevard des Italiens, 75009 Paris, France', phone: '+33 1 40 14 40 00' },
      { name: 'ING Bank N.V.', branch: 'Amsterdam Zuidas Innovation Hub', swift: 'INGBNL2A', address: 'Bijlmerdreef 106, 1102 CT Amsterdam, Netherlands', phone: '+31 20 563 9111' },
      { name: 'Banco Santander S.A.', branch: 'Madrid Castellana Plaza', swift: 'BSCHESMM', address: 'Paseo de la Castellana 24, 28046 Madrid, Spain', phone: '+34 915 123 123' },
    ],
    cities: [
      { city: 'Berlin', statePostal: '10115', country: 'Germany' },
      { city: 'Paris', statePostal: '75008', country: 'France' },
      { city: 'Amsterdam', statePostal: '1082 MD', country: 'Netherlands' },
      { city: 'Dublin', statePostal: 'D02 X285', country: 'Ireland' },
      { city: 'Frankfurt', statePostal: '60313', country: 'Germany' },
    ],
    taxIdPrefix: 'EU VAT',
    companySuffixes: ['GmbH', 'B.V.', 'S.A.S.', 'AG', 'Solutions Europe B.V.'],
  },
};

// Item Catalogues for Invoices
const INVOICE_SERVICES = [
  { desc: 'Cloud Infrastructure Architecture & Kubernetes Orchestration', minPrice: 1200, maxPrice: 4500 },
  { desc: 'Enterprise SaaS Enterprise License (Monthly Seat Allocation)', minPrice: 45, maxPrice: 220 },
  { desc: 'Cybersecurity Penetration Testing & Vulnerability Audit', minPrice: 2800, maxPrice: 8500 },
  { desc: 'Custom Machine Learning Pipeline Development', minPrice: 3500, maxPrice: 9500 },
  { desc: 'Frontend UI/UX Design System Specification', minPrice: 800, maxPrice: 3200 },
  { desc: 'High-Throughput Distributed Database Optimization', minPrice: 1500, maxPrice: 4200 },
  { desc: 'SOC2 Type II Compliance Readiness Assessment', minPrice: 4000, maxPrice: 11000 },
  { desc: 'Dedicated Site Reliability Engineering (SRE) Retainer', minPrice: 2000, maxPrice: 5000 },
  { desc: 'REST & GraphQL API Gateway Integration', minPrice: 650, maxPrice: 2400 },
  { desc: 'Continuous Integration / Continuous Delivery Automation', minPrice: 900, maxPrice: 2800 },
];

const INVOICE_HARDWARE = [
  { desc: '1U Rackmount High-Density Compute Node (64-Core AMD EPYC)', minPrice: 3200, maxPrice: 6800 },
  { desc: 'NVMe Enterprise Solid State Drive Array (15.36TB)', minPrice: 1100, maxPrice: 2400 },
  { desc: 'Managed 48-Port 100GbE Optical Spine Switch', minPrice: 4200, maxPrice: 9800 },
  { desc: 'Hardware Security Module (HSM) Cryptographic Key Vault', minPrice: 5500, maxPrice: 12500 },
  { desc: 'Uninterruptible Power Supply (UPS) Dual-Conversion 10kVA', minPrice: 1800, maxPrice: 3900 },
];

// Merchants for Bank Statements by Region
const REGIONAL_MERCHANTS: Record<DocumentRegion, { name: string; category: BankTransaction['category']; type: 'debit' | 'credit'; min: number; max: number }[]> = {
  US: [
    { name: 'Amazon.com Marketplace Purchase', category: 'Shopping', type: 'debit', min: 14.99, max: 285.50 },
    { name: 'Direct Deposit Payroll - ACME Global Tech', category: 'Income', type: 'credit', min: 3800, max: 7500 },
    { name: 'AWS Cloud Hosting Services', category: 'Services', type: 'debit', min: 85, max: 620 },
    { name: 'Whole Foods Market Organic Groceries', category: 'Shopping', type: 'debit', min: 42, max: 195 },
    { name: 'Chevron Gas & Convenience #4091', category: 'Travel', type: 'debit', min: 35, max: 78 },
    { name: 'Starbucks Coffee Reserve #114', category: 'Entertainment', type: 'debit', min: 5.75, max: 24.50 },
    { name: 'Stripe Merchant Payout Batch #892', category: 'Income', type: 'credit', min: 1200, max: 4800 },
    { name: 'Consolidated Edison Power & Utility', category: 'Utilities', type: 'debit', min: 95, max: 240 },
    { name: 'Netflix Premium 4K Streaming Subscription', category: 'Entertainment', type: 'debit', min: 22.99, max: 22.99 },
    { name: 'Chase ATM Cash Withdrawal', category: 'Transfer', type: 'debit', min: 60, max: 300 },
    { name: 'Apple Store Online Hardware Purchase', category: 'Shopping', type: 'debit', min: 99, max: 1299 },
    { name: 'Uber Technologies Rideshare Trip', category: 'Travel', type: 'debit', min: 18.50, max: 65.00 },
    { name: 'City Hospital Urgent Medical Care Co-pay', category: 'Healthcare', type: 'debit', min: 50, max: 150 },
    { name: 'High-Yield Savings Monthly Interest Credit', category: 'Income', type: 'credit', min: 28.50, max: 94.20 },
  ],
  UK: [
    { name: 'Sainsbury’s Supermarkets Ltd London', category: 'Shopping', type: 'debit', min: 18.50, max: 145.00 },
    { name: 'BACS Payroll Direct Credit - Vertex UK Ltd', category: 'Income', type: 'credit', min: 2900, max: 5400 },
    { name: 'Transport for London (TfL) Contactless Travel', category: 'Travel', type: 'debit', min: 3.40, max: 14.80 },
    { name: 'British Gas Residential Dual Fuel Energy', category: 'Utilities', type: 'debit', min: 85.00, max: 210.00 },
    { name: 'Amazon UK Digital & Goods Orders', category: 'Shopping', type: 'debit', min: 12.99, max: 199.00 },
    { name: 'Pret A Manger Artisan Coffee & Lunch', category: 'Entertainment', type: 'debit', min: 4.85, max: 18.20 },
    { name: 'Faster Payments Inward - Consulting Retainer', category: 'Income', type: 'credit', min: 950, max: 3200 },
    { name: 'EE Mobile Telecom High-Speed 5G', category: 'Utilities', type: 'debit', min: 35.00, max: 65.00 },
    { name: 'Barclays ATM Cash Dispenser Canary Wharf', category: 'Transfer', type: 'debit', min: 40, max: 250 },
    { name: 'Marks & Spencer Food Hall', category: 'Shopping', type: 'debit', min: 22.00, max: 88.50 },
  ],
  PK: [
    { name: 'Direct Salary Credit - PakTech Solutions', category: 'Income', type: 'credit', min: 180000, max: 450000 },
    { name: 'Imtiaz Super Market Grocery Billing', category: 'Shopping', type: 'debit', min: 12500, max: 48000 },
    { name: 'K-Electric / LESCO Monthly Power Bill', category: 'Utilities', type: 'debit', min: 18500, max: 65000 },
    { name: 'Shell Pakistan Fuel Station Petroleum', category: 'Travel', type: 'debit', min: 4500, max: 16500 },
    { name: 'Raast Instant Peer-to-Peer Interbank Transfer', category: 'Income', type: 'credit', min: 35000, max: 120000 },
    { name: 'Daraz.pk Online E-Commerce Order', category: 'Shopping', type: 'debit', min: 2400, max: 18500 },
    { name: 'Nayatel / PTCL High-Speed Fiber Internet', category: 'Utilities', type: 'debit', min: 4200, max: 8900 },
    { name: 'Careem / Indrive Executive Rideshare', category: 'Travel', type: 'debit', min: 850, max: 3200 },
    { name: '1Link ATM 24/7 Cash Withdrawal', category: 'Transfer', type: 'debit', min: 10000, max: 50000 },
    { name: 'Gloria Jean’s Coffees & Patisserie', category: 'Entertainment', type: 'debit', min: 1200, max: 4500 },
    { name: 'Shaukat Khanum Diagnostic Lab Tests', category: 'Healthcare', type: 'debit', min: 3500, max: 14000 },
  ],
  EU: [
    { name: 'SEPA Überweisung / Gehalt Tech GmbH', category: 'Income', type: 'credit', min: 3200, max: 6800 },
    { name: 'Carrefour Hypermarket Groceries', category: 'Shopping', type: 'debit', min: 25.50, max: 185.00 },
    { name: 'Stadtwerke Strom & Gas Utility Energie', category: 'Utilities', type: 'debit', min: 75.00, max: 230.00 },
    { name: 'Deutsche Bahn ICE Fernverkehr Ticket', category: 'Travel', type: 'debit', min: 38.00, max: 145.00 },
    { name: 'Amazon EU S.à r.l. Marketplace Order', category: 'Shopping', type: 'debit', min: 18.00, max: 240.00 },
    { name: 'TotalEnergies Station Service Carburant', category: 'Travel', type: 'debit', min: 45.00, max: 92.00 },
    { name: 'Spotify AB Premium Family Streaming', category: 'Entertainment', type: 'debit', min: 17.99, max: 17.99 },
    { name: 'Kunde Honorar / Invoice Wire Transfer', category: 'Income', type: 'credit', min: 1100, max: 3800 },
    { name: 'Geldautomat ATM Bargeldabhebung', category: 'Transfer', type: 'debit', min: 50, max: 300 },
    { name: 'Apotheke / Pharmacie Santé Care', category: 'Healthcare', type: 'debit', min: 15.00, max: 68.00 },
  ],
};

const COMPANY_ROOT_NAMES = [
  'AcroNexus', 'QuantumPeak', 'HyperScale', 'AuraLogix', 'StratumCore',
  'SynapseGrid', 'Velocita', 'OmniVector', 'BlueHarbor', 'CyberMatrix',
  'ApexForge', 'PulseDynamic', 'TerraByte', 'InfiniStream', 'Luminary'
];

const FIRST_NAMES = ['Alexander', 'Sophia', 'Muhammad', 'Fatima', 'Liam', 'Emma', 'Tariq', 'Elena', 'Lucas', 'Zainab', 'Julian', 'Amara'];
const LAST_NAMES = ['Vance', 'Sterling', 'Khan', 'Ahmed', 'Dubois', 'Schneider', 'Malik', 'Rossi', 'Jensen', 'Qureshi', 'Nakamura'];

/**
 * Format date according to region standard
 */
export function formatDateByRegion(date: Date, region: DocumentRegion): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  switch (region) {
    case 'US':
      return `${mm}/${dd}/${yyyy}`;
    case 'UK':
    case 'PK':
      return `${dd}/${mm}/${yyyy}`;
    case 'EU':
      return `${dd}.${mm}.${yyyy}`;
  }
}

/**
 * Format currency amount cleanly
 */
export function formatCurrency(amount: number, symbol: string, code: string): string {
  if (symbol === 'PKR') {
    return `PKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate synthetic Invoices with strictly reconciled arithmetic
 */
export function generateInvoices(
  count: number,
  region: DocumentRegion,
  settings: GenerationSettings
): InvoiceDocument[] {
  const prng = new PRNG(settings.seed);
  const regionConfig = REGION_CONFIGS[region];
  const invoices: InvoiceDocument[] = [];

  for (let i = 0; i < count; i++) {
    const issuerRoot = prng.nextItem(COMPANY_ROOT_NAMES);
    const issuerSuffix = prng.nextItem(regionConfig.companySuffixes);
    const issuerName = `${issuerRoot} ${issuerSuffix}`;

    const clientRoot = prng.nextItem(COMPANY_ROOT_NAMES.filter((c) => c !== issuerRoot));
    const clientSuffix = prng.nextItem(regionConfig.companySuffixes);
    const clientName = `${clientRoot} ${clientSuffix}`;

    const issuerCityObj = prng.nextItem(regionConfig.cities);
    const clientCityObj = prng.nextItem(regionConfig.cities);

    const clientContact = `${prng.nextItem(FIRST_NAMES)} ${prng.nextItem(LAST_NAMES)}`;

    // Invoice dates
    const invoiceYear = 2026;
    const invoiceMonth = prng.nextInt(0, 11);
    const invoiceDay = prng.nextInt(1, 28);
    const baseDate = new Date(invoiceYear, invoiceMonth, invoiceDay);
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + prng.nextItem([15, 30, 45]));

    const dateStr = formatDateByRegion(baseDate, region);
    const dueDateStr = formatDateByRegion(dueDate, region);

    // Number of line items: 2 to 6
    const itemCount = prng.nextInt(2, 6);
    const items: InvoiceLineItem[] = [];
    const itemCatalog = prng.nextBoolean(0.7) ? INVOICE_SERVICES : INVOICE_HARDWARE;
    const shuffledItems = prng.shuffle([...itemCatalog]);

    let runningSubtotalCents = 0;
    let runningDiscountCents = 0;

    for (let j = 0; j < itemCount; j++) {
      const catalogItem = shuffledItems[j % shuffledItems.length];
      const quantity = prng.nextInt(1, 8);
      // For Pakistan PKR scale amounts up realistically
      const scaleMultiplier = region === 'PK' ? 70 : 1;
      const unitPrice = Math.round(prng.nextFloat(catalogItem.minPrice, catalogItem.maxPrice, 2) * scaleMultiplier * 100) / 100;

      // Discount: 0%, 5%, 10%, or 15%
      const discountPercent = prng.nextItem([0, 0, 5, 10, 15]);
      const grossCents = Math.round(quantity * unitPrice * 100);
      const discountCents = Math.round((grossCents * discountPercent) / 100);
      const lineTotalCents = grossCents - discountCents;

      runningSubtotalCents += grossCents;
      runningDiscountCents += discountCents;

      items.push({
        id: `item_${i + 1}_${j + 1}`,
        description: catalogItem.desc,
        quantity,
        unitPrice,
        discountPercent,
        discountAmount: discountCents / 100,
        taxRate: regionConfig.defaultTaxRate,
        lineTotal: lineTotalCents / 100,
      });
    }

    // STRICT RECONCILIATION CALCULATION IN CENTS TO PREVENT FLOATING POINT ROUNDING DRIFT
    const subtotal = runningSubtotalCents / 100;
    const totalDiscount = runningDiscountCents / 100;
    const netTaxableCents = runningSubtotalCents - runningDiscountCents;
    const taxRate = regionConfig.defaultTaxRate;
    const taxCents = Math.round((netTaxableCents * taxRate) / 100);
    const totalCents = netTaxableCents + taxCents;

    const netTaxableAmount = netTaxableCents / 100;
    const taxAmount = taxCents / 100;
    const total = totalCents / 100;

    // Verify mathematical reconciliation down to exact penny
    const isReconciled = (subtotal - totalDiscount + taxAmount - total) < 0.001;

    // Format tax ID
    const randomDigits = prng.nextInt(1000000, 9999999);
    const taxId = `${regionConfig.taxIdPrefix}: ${randomDigits}`;

    invoices.push({
      id: `inv_${i + 1}`,
      type: 'invoice',
      invoiceNumber: `INV-${invoiceYear}-${String(10000 + i + (settings.seed % 90000)).padStart(5, '0')}`,
      date: dateStr,
      dueDate: dueDateStr,
      region,
      currencySymbol: regionConfig.currencySymbol,
      currencyCode: regionConfig.currencyCode,
      taxName: regionConfig.taxName,
      taxRate,
      issuer: {
        name: issuerName,
        address: `${prng.nextInt(10, 999)} Commerce Parkway, Suite ${prng.nextInt(100, 500)}`,
        city: `${issuerCityObj.city}, ${issuerCityObj.statePostal}`,
        country: issuerCityObj.country,
        phone: `+1 (${prng.nextInt(200, 999)}) ${prng.nextInt(200, 999)}-${prng.nextInt(1000, 9999)}`,
        email: `billing@${issuerRoot.toLowerCase()}.com`,
        taxId,
      },
      client: {
        name: clientName,
        contactPerson: clientContact,
        address: `${prng.nextInt(10, 999)} Financial Way, Tower ${prng.nextInt(1, 9)}`,
        city: `${clientCityObj.city}, ${clientCityObj.statePostal}`,
        country: clientCityObj.country,
        email: `accounts@${clientRoot.toLowerCase()}.org`,
      },
      items,
      subtotal,
      totalDiscount,
      netTaxableAmount,
      taxAmount,
      total,
      paymentStatus: prng.nextItem(['PAID', 'DUE', 'PAID', 'OVERDUE']),
      paymentTerms: prng.nextItem(['Net 30 Days', 'Due on Receipt', 'Net 15 Days']),
      notes: 'Thank you for your business. Remittance via electronic wire transfer or ACH direct debit.',
      isReconciled,
    });
  }

  return invoices;
}

/**
 * Generate synthetic Bank Statements with 100% accurate running balances
 */
export function generateBankStatements(
  count: number,
  region: DocumentRegion,
  settings: GenerationSettings
): BankStatementDocument[] {
  const prng = new PRNG(settings.seed);
  const regionConfig = REGION_CONFIGS[region];
  const statements: BankStatementDocument[] = [];
  const merchantsList = REGIONAL_MERCHANTS[region];

  for (let i = 0; i < count; i++) {
    const bank = prng.nextItem(regionConfig.banks);
    const holderFirst = prng.nextItem(FIRST_NAMES);
    const holderLast = prng.nextItem(LAST_NAMES);
    const holderCity = prng.nextItem(regionConfig.cities);
    const accountType = prng.nextItem([
      'Commercial Checking Account',
      'Premier Business Checking',
      'Corporate Treasury Ledger',
      'Personal Premier Checking',
    ]);

    // Account identifiers
    const accountNumber = `**** ${prng.nextInt(1000, 9999)}`;
    let routingOrSortCode = '';
    if (region === 'US') {
      routingOrSortCode = String(prng.nextInt(100000000, 999999999));
    } else if (region === 'UK') {
      routingOrSortCode = `${prng.nextInt(10, 99)}-${prng.nextInt(10, 99)}-${prng.nextInt(10, 99)}`;
    } else if (region === 'PK') {
      routingOrSortCode = `PK${prng.nextInt(10, 99)}HABB000${prng.nextInt(10000000, 99999999)}`;
    } else {
      routingOrSortCode = `DE${prng.nextInt(10, 99)} 3704 0044 ${prng.nextInt(1000, 9999)} 01`;
    }

    // Statement Period (30 Days)
    const year = 2026;
    const month = (i % 12);
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // last day of month

    const startDateStr = formatDateByRegion(startDate, region);
    const endDateStr = formatDateByRegion(endDate, region);
    const statementDateStr = formatDateByRegion(new Date(year, month + 1, 1), region);

    // Initial Starting Balance
    const scale = region === 'PK' ? 80 : 1;
    let currentBalanceCents = Math.round(prng.nextInt(3500, 18500) * scale * 100);
    const openingBalance = currentBalanceCents / 100;

    // Generate 12 to 24 transactions chronologically
    const txCount = prng.nextInt(12, 22);
    const transactions: BankTransaction[] = [];
    let runningCreditsCents = 0;
    let runningDebitsCents = 0;

    // Generate ordered day offsets across the month
    const days: number[] = [];
    for (let k = 0; k < txCount; k++) {
      days.push(prng.nextInt(1, endDate.getDate()));
    }
    days.sort((a, b) => a - b);

    for (let k = 0; k < txCount; k++) {
      const txDay = days[k];
      const txDate = new Date(year, month, txDay);
      const txDateStr = formatDateByRegion(txDate, region);

      // Select merchant template
      const merchantTemplate = prng.nextItem(merchantsList);
      let isCredit = merchantTemplate.type === 'credit';

      // Safeguard: If balance is getting low, force a credit (deposit/payroll)
      if (currentBalanceCents < 500 * scale * 100) {
        isCredit = true;
      }

      const txScale = region === 'PK' ? 1 : 1;
      const amountVal = prng.nextFloat(merchantTemplate.min, merchantTemplate.max, 2) * txScale;
      const amountCents = Math.round(amountVal * 100);

      if (isCredit) {
        currentBalanceCents += amountCents;
        runningCreditsCents += amountCents;
      } else {
        currentBalanceCents -= amountCents;
        runningDebitsCents += amountCents;
      }

      transactions.push({
        id: `tx_${i + 1}_${k + 1}`,
        date: txDateStr,
        description: merchantTemplate.name,
        merchant: merchantTemplate.name.split(' - ')[0] || merchantTemplate.name,
        category: merchantTemplate.category,
        type: isCredit ? 'credit' : 'debit',
        amount: amountCents / 100,
        runningBalance: currentBalanceCents / 100,
        referenceNumber: `REF-${year}${String(month + 1).padStart(2, '0')}-${prng.nextInt(100000, 999999)}`,
      });
    }

    const totalCredits = runningCreditsCents / 100;
    const totalDebits = runningDebitsCents / 100;
    const closingBalance = currentBalanceCents / 100;
    const netChange = (runningCreditsCents - runningDebitsCents) / 100;

    // Strict Reconciliation Verification: opening + credits - debits === closing
    const calculatedClosing = Math.round((openingBalance * 100 + runningCreditsCents - runningDebitsCents)) / 100;
    const isReconciled = Math.abs(calculatedClosing - closingBalance) < 0.001;

    statements.push({
      id: `stmt_${i + 1}`,
      type: 'bank_statement',
      statementId: `STMT-${year}-${String(50000 + i + (settings.seed % 40000)).padStart(5, '0')}`,
      region,
      currencySymbol: regionConfig.currencySymbol,
      currencyCode: regionConfig.currencyCode,
      bank: {
        name: bank.name,
        branch: bank.branch,
        swiftBic: bank.swift,
        address: bank.address,
        supportPhone: bank.phone,
      },
      accountHolder: {
        name: `${holderFirst} ${holderLast}`,
        accountNumber,
        routingOrSortCode,
        routingLabel: regionConfig.routingLabel,
        accountType,
        address: `${prng.nextInt(10, 850)} Maple Avenue, Apt ${prng.nextInt(1, 40)}`,
        city: `${holderCity.city}, ${holderCity.statePostal}`,
        country: holderCity.country,
      },
      period: {
        startDate: startDateStr,
        endDate: endDateStr,
        statementDate: statementDateStr,
        daysCount: endDate.getDate(),
      },
      openingBalance,
      totalCredits,
      totalDebits,
      closingBalance,
      netChange,
      transactionCount: transactions.length,
      transactions,
      isReconciled,
    });
  }

  return statements;
}
