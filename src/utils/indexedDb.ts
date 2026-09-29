import type { StoredDataset } from '../types';

const DB_NAME = 'synthforge_datasets_db';
const DB_VERSION = 1;
const STORE_NAME = 'datasets';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDatasetToDb(dataset: StoredDataset): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(dataset);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllDatasetsFromDb(): Promise<StoredDataset[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getDatasetByIdFromDb(id: string): Promise<StoredDataset | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDatasetFromDb(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Seed 2 sample datasets if store is empty so user can explore Data Sources and EDA immediately
 */
export async function seedDefaultDatasets(): Promise<void> {
  try {
    const existing = await getAllDatasetsFromDb();
    if (existing.length > 0) return;

    // Sample 1: Customer Churn & Transactions
    const customerRecords: Record<string, any>[] = [];
    const segments = ['Enterprise', 'Mid-Market', 'Startup', 'Pro'];
    const plans = ['Monthly', 'Annual', 'PayAsYouGo'];

    for (let i = 1; i <= 150; i++) {
      const churnProb = Math.random();
      customerRecords.push({
        customer_id: `CUST-${1000 + i}`,
        full_name: ['Elena Vance', 'Mateo Rossi', 'Chen Wei', 'Zara Patel', 'Lucas Lindqvist', 'Sophia Kim', 'Amelia Dubois'][i % 7] + ` ${i}`,
        email: `client_${i}@enterprise-node.io`,
        plan_type: plans[i % plans.length],
        segment: segments[i % segments.length],
        monthly_spend: Number((Math.random() * 450 + 50).toFixed(2)),
        support_tickets: Math.floor(Math.random() * 8),
        satisfaction_score: Math.floor(Math.random() * 5) + 1,
        is_churned: churnProb < 0.18,
        signup_date: `2024-0${(i % 9) + 1}-15`,
      });
    }

    const dataset1: StoredDataset = {
      id: 'sample_customer_churn',
      name: 'Customer_Telemetry_Churn_Sample.csv',
      format: 'csv',
      sizeBytes: new Blob([JSON.stringify(customerRecords)]).size,
      rowCount: customerRecords.length,
      columnCount: Object.keys(customerRecords[0]).length,
      headers: Object.keys(customerRecords[0]),
      records: customerRecords,
      uploadedAt: Date.now() - 3600000 * 24,
    };

    // Sample 2: Hospital Patient Vitals
    const hospitalRecords: Record<string, any>[] = [];
    const departments = ['Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Emergency'];
    for (let i = 1; i <= 120; i++) {
      hospitalRecords.push({
        patient_mrn: `MRN-${90000 + i}`,
        age: Math.floor(Math.random() * 65) + 18,
        systolic_bp: Math.floor(Math.random() * 50) + 100,
        heart_rate: Math.floor(Math.random() * 40) + 60,
        department: departments[i % departments.length],
        admission_type: i % 3 === 0 ? 'Urgent' : i % 2 === 0 ? 'Emergency' : 'Elective',
        stay_days: Math.floor(Math.random() * 10) + 1,
        total_charges: Number((Math.random() * 8500 + 1200).toFixed(2)),
        readmitted_30d: Math.random() < 0.12,
      });
    }

    const dataset2: StoredDataset = {
      id: 'sample_hospital_vitals',
      name: 'Clinical_Patient_Admissions_Sample.csv',
      format: 'csv',
      sizeBytes: new Blob([JSON.stringify(hospitalRecords)]).size,
      rowCount: hospitalRecords.length,
      columnCount: Object.keys(hospitalRecords[0]).length,
      headers: Object.keys(hospitalRecords[0]),
      records: hospitalRecords,
      uploadedAt: Date.now() - 3600000 * 12,
    };

    await saveDatasetToDb(dataset1);
    await saveDatasetToDb(dataset2);
  } catch (err) {
    console.warn('Could not seed sample datasets into IndexedDB:', err);
  }
}
