import type { ColumnDefinition, TableSchema } from '../types';

export interface GeneratedAiSchemaResponse {
  mode: 'tabular' | 'relational';
  summary: string;
  rowCount?: number;
  tabularColumns?: ColumnDefinition[];
  relationalTables?: TableSchema[];
}

/**
 * Intelligent keyword-based fallback schema generator
 */
export function generateKeywordFallbackSchema(prompt: string): GeneratedAiSchemaResponse {
  const p = prompt.toLowerCase();

  // Extract explicit row counts e.g. "1000 customers and 5000 orders"
  const countMatches = Array.from(prompt.matchAll(/(\d[\d,]*)\s*([a-zA-Z_]+)/g)).map((m) => ({
    count: parseInt(m[1].replace(/,/g, ''), 10),
    entity: m[2].toLowerCase(),
  }));

  const getEntityCount = (keywords: string[], defaultCount: number): number => {
    for (const kw of keywords) {
      const found = countMatches.find((m) => m.entity.includes(kw) || kw.includes(m.entity));
      if (found && !isNaN(found.count)) return found.count;
    }
    return defaultCount;
  };

  // 1. E-Commerce / Store / Shop / Marketplace
  if (p.includes('store') || p.includes('shop') || p.includes('ecommerce') || p.includes('e-commerce') || p.includes('order') || p.includes('product') || p.includes('customer')) {
    const customerCount = getEntityCount(['customer', 'user', 'client'], 1000);
    const orderCount = getEntityCount(['order', 'purchase'], 5000);
    const productCount = getEntityCount(['product', 'item'], 200);

    const customersTable: TableSchema = {
      id: 'table_customers',
      name: 'customers',
      description: 'Registered platform customers',
      primaryKey: 'customer_id',
      rowCount: customerCount,
      columns: [
        { id: 'c1', name: 'customer_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'c2', name: 'full_name', type: 'full name', nullPercentage: 0, isUnique: false },
        { id: 'c3', name: 'email', type: 'email', nullPercentage: 0, isUnique: true },
        { id: 'c4', name: 'phone', type: 'phone', nullPercentage: 5, isUnique: false },
        { id: 'c5', name: 'address', type: 'address', nullPercentage: 0, isUnique: false },
        {
          id: 'c6',
          name: 'tier',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 't1', value: 'Bronze', weight: 50 },
            { id: 't2', value: 'Silver', weight: 30 },
            { id: 't3', value: 'Gold', weight: 20 },
          ],
        },
        { id: 'c7', name: 'created_at', type: 'date', nullPercentage: 0, isUnique: false, minDate: '2023-01-01', maxDate: '2026-03-01' },
      ],
    };

    const productsTable: TableSchema = {
      id: 'table_products',
      name: 'products',
      description: 'Catalog items available for purchase',
      primaryKey: 'product_id',
      rowCount: productCount,
      columns: [
        { id: 'p1', name: 'product_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'p2', name: 'title', type: 'string', nullPercentage: 0, isUnique: false, min: 2, max: 4 },
        {
          id: 'p3',
          name: 'category',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 'cat1', value: 'Electronics', weight: 40 },
            { id: 'cat2', value: 'Apparel', weight: 30 },
            { id: 'cat3', value: 'Home & Kitchen', weight: 20 },
            { id: 'cat4', value: 'Books', weight: 10 },
          ],
        },
        { id: 'p4', name: 'unit_price', type: 'float', nullPercentage: 0, isUnique: false, min: 9.99, max: 899.99, precision: 2 },
        { id: 'p5', name: 'stock_quantity', type: 'integer', nullPercentage: 0, isUnique: false, min: 0, max: 500 },
        { id: 'p6', name: 'is_active', type: 'boolean', nullPercentage: 0, isUnique: false },
      ],
    };

    const ordersTable: TableSchema = {
      id: 'table_orders',
      name: 'orders',
      description: 'Placed customer transactions',
      primaryKey: 'order_id',
      rowCount: orderCount,
      columns: [
        { id: 'o1', name: 'order_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'o2', name: 'customer_id', type: 'uuid', nullPercentage: 0, isUnique: false },
        { id: 'o3', name: 'order_date', type: 'date', nullPercentage: 0, isUnique: false, minDate: '2024-01-01', maxDate: '2026-03-15' },
        {
          id: 'o4',
          name: 'order_status',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 's1', value: 'completed', weight: 70 },
            { id: 's2', value: 'pending', weight: 15 },
            { id: 's3', value: 'shipped', weight: 10 },
            { id: 's4', value: 'cancelled', weight: 5 },
          ],
        },
        { id: 'o5', name: 'total_amount', type: 'float', nullPercentage: 0, isUnique: false, min: 19.99, max: 1450.0, precision: 2 },
      ],
      foreignKeys: [
        {
          id: 'fk_orders_customer',
          column: 'customer_id',
          targetTable: 'customers',
          targetColumn: 'customer_id',
          cardinality: '1:N',
        },
      ],
    };

    return {
      mode: 'relational',
      summary: `E-Commerce database configured with ${customerCount} customers, ${productCount} products, and ${orderCount} orders with referential integrity.`,
      relationalTables: [customersTable, productsTable, ordersTable],
    };
  }

  // 2. Banking / Finance / Fintech
  if (p.includes('bank') || p.includes('finance') || p.includes('account') || p.includes('transaction') || p.includes('loan') || p.includes('payment')) {
    const accountCount = getEntityCount(['account', 'client', 'user'], 500);
    const txCount = getEntityCount(['transaction', 'payment', 'transfer'], 3000);

    const accountsTable: TableSchema = {
      id: 'table_accounts',
      name: 'accounts',
      description: 'Bank customer accounts and balances',
      primaryKey: 'account_id',
      rowCount: accountCount,
      columns: [
        { id: 'a1', name: 'account_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'a2', name: 'account_holder', type: 'full name', nullPercentage: 0, isUnique: false },
        { id: 'a3', name: 'email', type: 'email', nullPercentage: 0, isUnique: true },
        {
          id: 'a4',
          name: 'account_type',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 'at1', value: 'Checking', weight: 60 },
            { id: 'at2', value: 'Savings', weight: 30 },
            { id: 'at3', value: 'Investment', weight: 10 },
          ],
        },
        { id: 'a5', name: 'balance', type: 'float', nullPercentage: 0, isUnique: false, min: 50.0, max: 75000.0, precision: 2 },
        { id: 'a6', name: 'opened_date', type: 'date', nullPercentage: 0, isUnique: false, minDate: '2020-01-01', maxDate: '2026-01-01' },
      ],
    };

    const transactionsTable: TableSchema = {
      id: 'table_transactions',
      name: 'transactions',
      description: 'Financial ledger transactions',
      primaryKey: 'transaction_id',
      rowCount: txCount,
      columns: [
        { id: 't1', name: 'transaction_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 't2', name: 'account_id', type: 'uuid', nullPercentage: 0, isUnique: false },
        {
          id: 't3',
          name: 'type',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 'tt1', value: 'debit', weight: 65 },
            { id: 'tt2', value: 'credit', weight: 25 },
            { id: 'tt3', value: 'wire_transfer', weight: 10 },
          ],
        },
        { id: 't4', name: 'amount', type: 'float', nullPercentage: 0, isUnique: false, min: 5.0, max: 4500.0, precision: 2 },
        { id: 't5', name: 'merchant', type: 'company', nullPercentage: 0, isUnique: false },
        { id: 't6', name: 'is_fraud_flagged', type: 'boolean', nullPercentage: 0, isUnique: false },
        { id: 't7', name: 'timestamp', type: 'date', nullPercentage: 0, isUnique: false, minDate: '2024-01-01', maxDate: '2026-03-20' },
      ],
      foreignKeys: [
        {
          id: 'fk_tx_account',
          column: 'account_id',
          targetTable: 'accounts',
          targetColumn: 'account_id',
          cardinality: '1:N',
        },
      ],
    };

    return {
      mode: 'relational',
      summary: `Banking financial system created with ${accountCount} accounts and ${txCount} ledger transactions.`,
      relationalTables: [accountsTable, transactionsTable],
    };
  }

  // 3. HR / Workforce / Payroll / Employees
  if (p.includes('hr') || p.includes('employee') || p.includes('payroll') || p.includes('workforce') || p.includes('staff') || p.includes('salary')) {
    const employeeCount = getEntityCount(['employee', 'staff', 'worker'], 250);

    const departmentsTable: TableSchema = {
      id: 'table_departments',
      name: 'departments',
      description: 'Company organizational divisions',
      primaryKey: 'dept_id',
      rowCount: 8,
      columns: [
        { id: 'd1', name: 'dept_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        {
          id: 'd2',
          name: 'name',
          type: 'category',
          nullPercentage: 0,
          isUnique: true,
          categoryWeights: [
            { id: 'd_eng', value: 'Engineering', weight: 25 },
            { id: 'd_sales', value: 'Sales & Marketing', weight: 25 },
            { id: 'd_prod', value: 'Product & Design', weight: 20 },
            { id: 'd_ops', value: 'Operations & HR', weight: 15 },
            { id: 'd_fin', value: 'Finance & Legal', weight: 15 },
          ],
        },
        { id: 'd3', name: 'budget', type: 'float', nullPercentage: 0, isUnique: false, min: 250000, max: 3500000, precision: 2 },
      ],
    };

    const employeesTable: TableSchema = {
      id: 'table_employees',
      name: 'employees',
      description: 'Workforce records and compensation',
      primaryKey: 'employee_id',
      rowCount: employeeCount,
      columns: [
        { id: 'e1', name: 'employee_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'e2', name: 'dept_id', type: 'uuid', nullPercentage: 0, isUnique: false },
        { id: 'e3', name: 'full_name', type: 'full name', nullPercentage: 0, isUnique: false },
        { id: 'e4', name: 'work_email', type: 'email', nullPercentage: 0, isUnique: true },
        { id: 'e5', name: 'phone', type: 'phone', nullPercentage: 5, isUnique: false },
        { id: 'e6', name: 'hire_date', type: 'date', nullPercentage: 0, isUnique: false, minDate: '2021-01-01', maxDate: '2026-01-15' },
        { id: 'e7', name: 'annual_salary', type: 'integer', nullPercentage: 0, isUnique: false, min: 55000, max: 210000 },
        {
          id: 'e8',
          name: 'performance_rating',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 'pr1', value: 'Exceeds Expectations', weight: 20 },
            { id: 'pr2', value: 'Meets Expectations', weight: 65 },
            { id: 'pr3', value: 'Needs Improvement', weight: 15 },
          ],
        },
      ],
      foreignKeys: [
        {
          id: 'fk_emp_dept',
          column: 'dept_id',
          targetTable: 'departments',
          targetColumn: 'dept_id',
          cardinality: '1:N',
        },
      ],
    };

    return {
      mode: 'relational',
      summary: `HR Workforce schema structured with organizational departments and ${employeeCount} employee records.`,
      relationalTables: [departmentsTable, employeesTable],
    };
  }

  // 4. Healthcare / Hospital / Patients / Clinical
  if (p.includes('hospital') || p.includes('patient') || p.includes('medical') || p.includes('doctor') || p.includes('health') || p.includes('clinic')) {
    const patientCount = getEntityCount(['patient', 'person'], 300);
    const encounterCount = getEntityCount(['appointment', 'visit', 'encounter'], 1200);

    const patientsTable: TableSchema = {
      id: 'table_patients',
      name: 'patients',
      description: 'Hospital patient demographics',
      primaryKey: 'patient_id',
      rowCount: patientCount,
      columns: [
        { id: 'pt1', name: 'patient_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'pt2', name: 'full_name', type: 'full name', nullPercentage: 0, isUnique: false },
        { id: 'pt3', name: 'email', type: 'email', nullPercentage: 5, isUnique: false },
        { id: 'pt4', name: 'phone', type: 'phone', nullPercentage: 2, isUnique: false },
        { id: 'pt5', name: 'dob', type: 'date', nullPercentage: 0, isUnique: false, minDate: '1950-01-01', maxDate: '2015-12-31' },
        {
          id: 'pt6',
          name: 'blood_group',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 'bg1', value: 'O+', weight: 38 },
            { id: 'bg2', value: 'A+', weight: 34 },
            { id: 'bg3', value: 'B+', weight: 15 },
            { id: 'bg4', value: 'AB+', weight: 6 },
            { id: 'bg5', value: 'O-', weight: 7 },
          ],
        },
      ],
    };

    const encountersTable: TableSchema = {
      id: 'table_encounters',
      name: 'clinical_encounters',
      description: 'Clinical visits, vitals, and diagnoses',
      primaryKey: 'encounter_id',
      rowCount: encounterCount,
      columns: [
        { id: 'enc1', name: 'encounter_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'enc2', name: 'patient_id', type: 'uuid', nullPercentage: 0, isUnique: false },
        { id: 'enc3', name: 'encounter_date', type: 'date', nullPercentage: 0, isUnique: false, minDate: '2024-01-01', maxDate: '2026-03-25' },
        {
          id: 'enc4',
          name: 'department',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 'ed1', value: 'Cardiology', weight: 30 },
            { id: 'ed2', value: 'General Medicine', weight: 35 },
            { id: 'ed3', value: 'Emergency', weight: 20 },
            { id: 'ed4', value: 'Neurology', weight: 15 },
          ],
        },
        { id: 'enc5', name: 'heart_rate', type: 'integer', nullPercentage: 0, isUnique: false, min: 55, max: 125 },
        { id: 'enc6', name: 'systolic_bp', type: 'integer', nullPercentage: 0, isUnique: false, min: 100, max: 165 },
        { id: 'enc7', name: 'billed_amount', type: 'float', nullPercentage: 0, isUnique: false, min: 120.0, max: 6500.0, precision: 2 },
      ],
      foreignKeys: [
        {
          id: 'fk_enc_patient',
          column: 'patient_id',
          targetTable: 'patients',
          targetColumn: 'patient_id',
          cardinality: '1:N',
        },
      ],
    };

    return {
      mode: 'relational',
      summary: `Hospital Clinical management schema created with ${patientCount} patient demographics and ${encounterCount} clinical encounters.`,
      relationalTables: [patientsTable, encountersTable],
    };
  }

  // Generic Tabular fallback
  const rowCount = countMatches[0]?.count || 100;
  return {
    mode: 'tabular',
    summary: `Configured synthetic tabular schema for "${prompt}" with ${rowCount} rows.`,
    rowCount,
    tabularColumns: [
      { id: 'g1', name: 'id', type: 'uuid', nullPercentage: 0, isUnique: true },
      { id: 'g2', name: 'name', type: 'full name', nullPercentage: 0, isUnique: false },
      { id: 'g3', name: 'email', type: 'email', nullPercentage: 0, isUnique: true },
      { id: 'g4', name: 'company', type: 'company', nullPercentage: 0, isUnique: false },
      { id: 'g5', name: 'address', type: 'address', nullPercentage: 0, isUnique: false },
      {
        id: 'g6',
        name: 'status',
        type: 'category',
        nullPercentage: 0,
        isUnique: false,
        categoryWeights: [
          { id: 'st1', value: 'Active', weight: 70 },
          { id: 'st2', value: 'Pending', weight: 20 },
          { id: 'st3', value: 'Inactive', weight: 10 },
        ],
      },
      { id: 'g7', name: 'score', type: 'float', nullPercentage: 0, isUnique: false, min: 10, max: 99.9, precision: 1 },
      { id: 'g8', name: 'created_at', type: 'date', nullPercentage: 0, isUnique: false, minDate: '2023-01-01', maxDate: '2026-03-01' },
    ],
  };
}
