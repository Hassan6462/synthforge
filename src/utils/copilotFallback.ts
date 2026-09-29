import type { ColumnDefinition, GenerationSettings, SchemaPatch, CopilotResponse } from '../types';

/**
 * Intelligent keyword-based Copilot fallback when Gemini is offline or rate-limited
 */
export function generateCopilotFallbackPatch(
  prompt: string,
  currentColumns: ColumnDefinition[],
  currentSettings: GenerationSettings
): CopilotResponse {
  const p = prompt.toLowerCase();
  const patches: SchemaPatch[] = [];
  const explanations: string[] = [];

  // 1. Credit Score
  if (p.includes('credit score') || p.includes('credit_score') || p.includes('fico')) {
    const colId = `col_credit_score_${Date.now()}`;
    patches.push({
      action: 'add_column',
      column: {
        id: colId,
        name: 'credit_score',
        type: 'integer',
        nullPercentage: 2,
        isUnique: false,
        min: 300,
        max: 850,
      },
      explanation: 'Added "credit_score" integer column bounded from 300 to 850 with standard credit bureau range.',
    });
    explanations.push('Added credit score column (300-850)');
  }

  // 2. Fraud Flag / Risk Score
  if (p.includes('fraud') || p.includes('risk') || p.includes('anomal')) {
    patches.push({
      action: 'add_column',
      column: {
        id: `col_is_fraud_${Date.now()}`,
        name: 'is_fraud',
        type: 'boolean',
        nullPercentage: 0,
        isUnique: false,
      },
      explanation: 'Added "is_fraud" boolean flag for simulated anomalous/fraudulent transaction labeling.',
    });

    patches.push({
      action: 'add_column',
      column: {
        id: `col_risk_score_${Date.now() + 1}`,
        name: 'risk_score',
        type: 'float',
        nullPercentage: 1,
        isUnique: false,
        min: 0,
        max: 1,
        precision: 4,
      },
      explanation: 'Added "risk_score" float column (0.0 to 1.0) calibrated for risk modeling.',
    });
    explanations.push('Added fraud & risk score indicators');
  }

  // 3. Privacy & Masking
  if (p.includes('mask') || p.includes('pii') || p.includes('anonymize') || p.includes('privacy')) {
    currentColumns.forEach((col) => {
      if (['full name', 'email', 'phone', 'address'].includes(col.type)) {
        patches.push({
          action: 'modify_column',
          columnId: col.id,
          column: { privacy: 'mask' },
          explanation: `Applied privacy masking to PII column "${col.name}" (${col.type}).`,
        });
      }
    });
    patches.push({
      action: 'update_settings',
      settings: { anonymizePII: true },
      explanation: 'Enabled global anonymize PII flag in generation settings.',
    });
    explanations.push('Masked sensitive PII columns and enabled anonymization');
  }

  // 4. Hash sensitive identifiers
  if (p.includes('hash') || p.includes('sha-256') || p.includes('sha256')) {
    currentColumns.forEach((col) => {
      if (['uuid', 'email', 'string'].includes(col.type)) {
        patches.push({
          action: 'modify_column',
          columnId: col.id,
          column: { privacy: 'hash' },
          explanation: `Applied cryptographic SHA-256 hashing to "${col.name}".`,
        });
      }
    });
    explanations.push('Applied deterministic hashing to identifier columns');
  }

  // 5. Differential Privacy Laplace Noise
  if (p.includes('laplace') || p.includes('epsilon') || p.includes('noise')) {
    currentColumns.forEach((col) => {
      if (col.type === 'integer' || col.type === 'float') {
        patches.push({
          action: 'modify_column',
          columnId: col.id,
          column: { laplaceEpsilon: 1.0 },
          explanation: `Added differential privacy Laplace noise (ε = 1.0) to numeric column "${col.name}".`,
        });
      }
    });
    explanations.push('Added Laplace differential privacy noise (ε = 1.0) to numeric columns');
  }

  // 6. Edge cases injection
  if (p.includes('edge case') || p.includes('dirty') || p.includes('corrupt') || p.includes('stress test')) {
    patches.push({
      action: 'update_settings',
      settings: {
        injectEdgeCases: true,
        edgeCaseIntensity: 'high',
        edgeCaseTypes: {
          nulls: true,
          extremeValues: true,
          duplicates: true,
          unicodeEmoji: true,
          veryLongText: true,
          invalidFormats: true,
        },
      },
      explanation: 'Configured high-intensity edge cases injection (extreme values, Unicode, duplicates, invalid formats).',
    });
    explanations.push('Activated high-intensity synthetic edge case injection');
  }

  // 7. Add Phone / Address / Location
  if (p.includes('phone') && !currentColumns.some((c) => c.type === 'phone')) {
    patches.push({
      action: 'add_column',
      column: {
        id: `col_phone_${Date.now()}`,
        name: 'phone_number',
        type: 'phone',
        nullPercentage: 5,
        isUnique: false,
      },
      explanation: 'Added "phone_number" column with realistic international/local phone formatting.',
    });
    explanations.push('Added phone_number column');
  }

  if (p.includes('address') && !currentColumns.some((c) => c.type === 'address')) {
    patches.push({
      action: 'add_column',
      column: {
        id: `col_address_${Date.now()}`,
        name: 'street_address',
        type: 'address',
        nullPercentage: 2,
        isUnique: false,
      },
      explanation: 'Added "street_address" column with street names and city/zip codes.',
    });
    explanations.push('Added street_address column');
  }

  // 8. Row Count modifier
  const countMatch = p.match(/(\d+[\d,]*)\s*(rows|records|samples)/);
  if (countMatch) {
    const rows = parseInt(countMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(rows) && rows > 0) {
      patches.push({
        action: 'update_settings',
        settings: { rowCount: Math.min(rows, 100000) },
        explanation: `Updated target row count to ${rows.toLocaleString()}.`,
      });
      explanations.push(`Set row count to ${rows.toLocaleString()}`);
    }
  }

  // Default fallback if no specific keywords matched: add a recommended attribute
  if (patches.length === 0) {
    patches.push({
      action: 'add_column',
      column: {
        id: `col_custom_${Date.now()}`,
        name: prompt.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().slice(0, 20) || 'custom_field',
        type: 'string',
        nullPercentage: 5,
        isUnique: false,
        min: 3,
        max: 25,
      },
      explanation: `Added custom column based on prompt: "${prompt}"`,
    });
    explanations.push('Added generated column according to specification');
  }

  return {
    summary: explanations.join('; ') || 'Suggested schema optimizations based on prompt.',
    patches,
    source: 'fallback',
  };
}
