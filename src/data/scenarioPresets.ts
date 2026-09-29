import type { ScenarioPreset } from '../types';

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'scenario_fraud_1pct',
    title: 'Fraud Transactions (1% Anomaly)',
    description: 'Simulates a real-world payment stream where 99% of transactions are legitimate and 1% are sophisticated fraudulent operations with extreme amounts, high-risk merchant categories, and midnight spikes.',
    tag: 'Anomaly Detection',
    iconName: 'ShieldAlert',
    difficulty: 'Intermediate',
    impact: 'Tests fraud detection models, ROC-AUC calibration, and cost-sensitive precision-recall trade-offs.',
    config: {
      type: 'tabular',
      settingsPatch: {
        rowCount: 1000,
        injectEdgeCases: true,
        edgeCaseIntensity: 'medium',
      },
      columns: [
        { id: 'sc_tx_id', name: 'transaction_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'sc_amount', name: 'amount_usd', type: 'float', nullPercentage: 0, isUnique: false, min: 5, max: 9500, precision: 2 },
        {
          id: 'sc_category',
          name: 'merchant_category',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 'w1', value: 'Grocery', weight: 45 },
            { id: 'w2', value: 'Fuel/Gas', weight: 25 },
            { id: 'w3', value: 'Electronics (High Risk)', weight: 5 },
            { id: 'w4', value: 'Crypto ATM (High Risk)', weight: 3 },
            { id: 'w5', value: 'Dining', weight: 22 },
          ],
        },
        {
          id: 'sc_is_fraud',
          name: 'is_fraud',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 'f0', value: '0', weight: 99 },
            { id: 'f1', value: '1', weight: 1 },
          ],
        },
        { id: 'sc_device_trust', name: 'device_trust_score', type: 'float', nullPercentage: 1, isUnique: false, min: 0.1, max: 1.0, precision: 3 },
        { id: 'sc_tx_date', name: 'transaction_time', type: 'date', nullPercentage: 0, isUnique: false },
      ],
    },
  },
  {
    id: 'scenario_imbalance_95_5',
    title: 'Severe Class Imbalance (95/5 Skew)',
    description: 'Models rare outcome phenomena such as customer churn (95% active / 5% churned), loan default, or rare medical diagnoses requiring SMOTE or focal loss balancing.',
    tag: 'Machine Learning',
    iconName: 'Scale',
    difficulty: 'Beginner',
    impact: 'Prevents synthetic bias towards majority classes and tests minority-oversampling algorithms.',
    config: {
      type: 'tabular',
      settingsPatch: {
        rowCount: 500,
      },
      columns: [
        { id: 'ci_user_id', name: 'user_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'ci_tenure', name: 'tenure_months', type: 'integer', nullPercentage: 0, isUnique: false, min: 1, max: 72 },
        { id: 'ci_monthly', name: 'monthly_charges', type: 'float', nullPercentage: 0, isUnique: false, min: 19.99, max: 149.99, precision: 2 },
        { id: 'ci_tickets', name: 'support_tickets_30d', type: 'integer', nullPercentage: 0, isUnique: false, min: 0, max: 8 },
        {
          id: 'ci_churn',
          name: 'churn_label',
          type: 'category',
          nullPercentage: 0,
          isUnique: false,
          categoryWeights: [
            { id: 'c0', value: 'Retained (No)', weight: 95 },
            { id: 'c1', value: 'Churned (Yes)', weight: 5 },
          ],
        },
      ],
    },
  },
  {
    id: 'scenario_seasonal_spike',
    title: 'Seasonal Spike & Holiday Surge',
    description: 'Generates dramatic workload, revenue, and traffic surges corresponding to Black Friday, Cyber Monday, or promotional campaign blitzes.',
    tag: 'Time Series & Forecasting',
    iconName: 'TrendingUp',
    difficulty: 'Intermediate',
    impact: 'Evaluates autoscaling triggers, capacity planning limits, and seasonal inventory demand forecasters.',
    config: {
      type: 'timeseries',
      timeSeriesPatch: {
        frequency: 'hour',
        length: 336, // 2 weeks
        seasonality: { daily: true, weekly: true, yearly: true },
        anomalies: { enabled: true, rate: 8, magnitude: 3.5, type: 'spike' },
      },
    },
  },
  {
    id: 'scenario_data_drift',
    title: 'Data Drift & Covariate Shift',
    description: 'Simulates progressive macroeconomic inflation or behavioral drift over multi-month intervals where numerical means and variances systematically shift.',
    tag: 'MLOps & Drift',
    iconName: 'GitCommit',
    difficulty: 'Advanced',
    impact: 'Tests Kolmogorov-Smirnov and Population Stability Index (PSI) drift alarms in production ML monitoring.',
    config: {
      type: 'tabular',
      settingsPatch: {
        rowCount: 800,
        noiseRate: 25,
      },
      columns: [
        { id: 'dd_cust', name: 'customer_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'dd_reg_date', name: 'cohort_date', type: 'date', nullPercentage: 0, isUnique: false, minDate: '2025-01-01', maxDate: '2026-06-30' },
        { id: 'dd_income', name: 'reported_income', type: 'integer', nullPercentage: 3, isUnique: false, min: 28000, max: 145000 },
        { id: 'dd_score', name: 'credit_score', type: 'integer', nullPercentage: 0, isUnique: false, min: 450, max: 850 },
        { id: 'dd_spend', name: 'avg_monthly_spend', type: 'float', nullPercentage: 2, isUnique: false, min: 50, max: 3500, precision: 2 },
      ],
    },
  },
  {
    id: 'scenario_high_missing',
    title: 'High Missing Data (System Degradation)',
    description: 'Simulates degraded IoT sensor telemetry or legacy database ETL partial corruption with 40% to 65% nulls across non-primary key columns.',
    tag: 'Data Robustness',
    iconName: 'AlertTriangle',
    difficulty: 'Intermediate',
    impact: 'Validates missing-value imputation strategies (MICE, KNN, mean/median) under severe data loss.',
    config: {
      type: 'tabular',
      settingsPatch: {
        rowCount: 400,
        globalNullRate: 35,
        injectEdgeCases: true,
        edgeCaseIntensity: 'high',
        edgeCaseTypes: {
          nulls: true,
          extremeValues: true,
          duplicates: false,
          unicodeEmoji: false,
          veryLongText: false,
          invalidFormats: true,
        },
      },
      columns: [
        { id: 'hm_device', name: 'sensor_id', type: 'uuid', nullPercentage: 0, isUnique: true },
        { id: 'hm_temp', name: 'core_temp_celsius', type: 'float', nullPercentage: 55, isUnique: false, min: 18.5, max: 98.2, precision: 1 },
        { id: 'hm_pressure', name: 'hydraulic_pressure_psi', type: 'float', nullPercentage: 45, isUnique: false, min: 800, max: 3200, precision: 0 },
        { id: 'hm_rpm', name: 'motor_rpm', type: 'integer', nullPercentage: 60, isUnique: false, min: 500, max: 4800 },
        { id: 'hm_status', name: 'device_state', type: 'category', nullPercentage: 30, isUnique: false, categoryWeights: [
          { id: 's1', value: 'NORMAL', weight: 40 },
          { id: 's2', value: 'DEGRADED', weight: 40 },
          { id: 's3', value: 'CRITICAL', weight: 20 },
        ]},
      ],
    },
  },
];
