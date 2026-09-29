import type { NotebookDocument } from '../types';

export const DEFAULT_NOTEBOOK_TEMPLATES: NotebookDocument[] = [
  {
    id: 'nb_compare_distributions',
    title: 'Compare Distributions',
    description: 'Statistical summary comparisons, mean/variance shifts, and percentile divergences between real and synthetic dataframes.',
    updatedAt: Date.now(),
    cells: [
      {
        id: 'cell_md_1',
        type: 'markdown',
        content: `### 📊 Distribution Comparison: Real vs Synthetic

This notebook computes marginal summary metrics, mean absolute deviations, and variance preservation across \`real_df\` and \`synth_df\`.`,
      },
      {
        id: 'cell_code_1',
        type: 'code',
        content: `# Verify loaded DataFrames
print(f"✅ real_df loaded: {real_df.shape[0]} rows × {real_df.shape[1]} columns")
print(f"✅ synth_df loaded: {synth_df.shape[0]} rows × {synth_df.shape[1]} columns")

print("\\nSample Synthetic Records:")
synth_df.head(3)`,
      },
      {
        id: 'cell_code_2',
        type: 'code',
        content: `# Compare numeric column statistics
numeric_cols = [c for c in real_df.columns if pd.api.types.is_numeric_dtype(real_df[c]) and c in synth_df.columns]

if numeric_cols:
    real_desc = real_df[numeric_cols].describe().T[['mean', 'std', 'min', '50%', 'max']]
    synth_desc = synth_df[numeric_cols].describe().T[['mean', 'std', 'min', '50%', 'max']]
    
    comp_df = pd.DataFrame({
        'Real Mean': real_desc['mean'].round(2),
        'Synth Mean': synth_desc['mean'].round(2),
        'Mean Diff %': (((synth_desc['mean'] - real_desc['mean']) / (real_desc['mean'].abs() + 1e-9)) * 100).round(1),
        'Real Std': real_desc['std'].round(2),
        'Synth Std': synth_desc['std'].round(2),
    })
    comp_df
else:
    print("No shared numeric columns found. Checking string/categorical columns...")
    synth_df.describe()`,
      },
      {
        id: 'cell_code_3',
        type: 'code',
        content: `# Display ASCII distribution comparison
for col in numeric_cols[:2]:
    r_vals = real_df[col].dropna()
    s_vals = synth_df[col].dropna()
    print(f"\\n--- Feature: {col} ---")
    print(f"Real   -> Min: {r_vals.min():.2f} | Median: {r_vals.median():.2f} | Max: {r_vals.max():.2f}")
    print(f"Synth  -> Min: {s_vals.min():.2f} | Median: {s_vals.median():.2f} | Max: {s_vals.max():.2f}")`,
      },
    ],
  },
  {
    id: 'nb_correlation_check',
    title: 'Correlation Check',
    description: 'Computes Pearson correlation matrices for both datasets and calculates the Frobenius norm delta to quantify feature covariance preservation.',
    updatedAt: Date.now(),
    cells: [
      {
        id: 'cell_md_corr_1',
        type: 'markdown',
        content: `### 🔗 Covariance & Correlation Preservation Check

Evaluates whether synthetic data preserves inter-column dependency structures without memorizing exact combinations.`,
      },
      {
        id: 'cell_code_corr_1',
        type: 'code',
        content: `# Compute Pearson Correlation for shared numeric columns
numeric_cols = [c for c in real_df.columns if pd.api.types.is_numeric_dtype(real_df[c]) and c in synth_df.columns]

if len(numeric_cols) >= 2:
    real_corr = real_df[numeric_cols].corr()
    synth_corr = synth_df[numeric_cols].corr()
    
    print("Real Correlation Matrix:")
    print(real_corr.round(3))
    
    print("\\nSynthetic Correlation Matrix:")
    print(synth_corr.round(3))
else:
    print(f"Identified {len(numeric_cols)} numeric columns. Need at least 2 for correlation analysis.")`,
      },
      {
        id: 'cell_code_corr_2',
        type: 'code',
        content: `# Calculate Correlation Difference Matrix (Real - Synth)
if len(numeric_cols) >= 2:
    corr_diff = (real_corr - synth_corr).abs()
    frobenius = np.linalg.norm(corr_diff.values) / len(numeric_cols)
    print(f"Normalized Frobenius Norm Delta: {frobenius:.4f} (Lower = Better fidelity)")
    
    print("\\nAbsolute Correlation Differences:")
    corr_diff.round(3)
else:
    print("Skipping correlation diff calculation.")`,
      },
    ],
  },
  {
    id: 'nb_model_tstr',
    title: 'Train a simple model on synthetic vs real',
    description: 'TSTR (Train on Synthetic, Test on Real) benchmark: trains a predictive baseline model on synthetic data and tests generalization on real data.',
    updatedAt: Date.now(),
    cells: [
      {
        id: 'cell_md_model_1',
        type: 'markdown',
        content: `### 🤖 Train on Synthetic, Test on Real (TSTR) Benchmark

Tests the downstream machine learning utility of your synthetic data:
1. **TRTR Baseline**: Train on Real (split 80%), Test on Real (split 20%)
2. **TSTR Experiment**: Train on Synthetic, Test on Real (split 20%)
3. **Fidelity Ratio**: Relative ML performance metric.`,
      },
      {
        id: 'cell_code_model_1',
        type: 'code',
        content: `# Identify target feature for regression/prediction
numeric_cols = [c for c in real_df.columns if pd.api.types.is_numeric_dtype(real_df[c]) and c in synth_df.columns]

if len(numeric_cols) >= 2:
    target_col = numeric_cols[-1]
    feature_cols = numeric_cols[:-1]
    print(f"Target Variable: {target_col}")
    print(f"Input Features:  {feature_cols}")
    
    # Simple Ordinary Least Squares (OLS) via numpy
    def fit_and_eval(X_train, y_train, X_test, y_test):
        # Add bias column
        X_tr = np.c_[np.ones(X_train.shape[0]), X_train]
        X_te = np.c_[np.ones(X_test.shape[0]), X_test]
        # Solve (X^T X)^-1 X^T y
        try:
            w = np.linalg.pinv(X_tr) @ y_train
            y_pred = X_te @ w
            rmse = np.sqrt(np.mean((y_test - y_pred) ** 2))
            # R^2 score
            ss_tot = np.sum((y_test - np.mean(y_test)) ** 2) + 1e-9
            ss_res = np.sum((y_test - y_pred) ** 2)
            r2 = 1.0 - (ss_res / ss_tot)
            return rmse, max(-1.0, r2)
        except Exception as e:
            return 0.0, 0.0

    # Clean missing values for benchmark
    r_clean = real_df[numeric_cols].dropna()
    s_clean = synth_df[numeric_cols].dropna()
    
    split_idx = int(len(r_clean) * 0.8)
    real_train = r_clean.iloc[:split_idx]
    real_test = r_clean.iloc[split_idx:]
    
    X_test_real = real_test[feature_cols].values
    y_test_real = real_test[target_col].values
    
    # 1. TRTR (Train Real, Test Real)
    rmse_trtr, r2_trtr = fit_and_eval(
        real_train[feature_cols].values,
        real_train[target_col].values,
        X_test_real,
        y_test_real
    )
    
    # 2. TSTR (Train Synth, Test Real)
    rmse_tstr, r2_tstr = fit_and_eval(
        s_clean[feature_cols].values,
        s_clean[target_col].values,
        X_test_real,
        y_test_real
    )
    
    print("=" * 45)
    print("BENCHMARK RESULTS (Downstream Utility):")
    print(f"TRTR (Train Real, Test Real)  -> RMSE: {rmse_trtr:.3f} | R²: {r2_trtr:.3f}")
    print(f"TSTR (Train Synth, Test Real) -> RMSE: {rmse_tstr:.3f} | R²: {r2_tstr:.3f}")
    utility_score = max(0, min(100, (1 - abs(rmse_tstr - rmse_trtr) / (rmse_trtr + 1e-9)) * 100))
    print(f"Synthetic ML Utility Score: {utility_score:.1f}%")
    print("=" * 45)
else:
    print("Insufficient numeric columns to train a predictive model.")`,
      },
    ],
  },
];
