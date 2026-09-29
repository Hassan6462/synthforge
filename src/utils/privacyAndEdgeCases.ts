import type { ColumnDefinition, GenerationSettings } from '../types';

/**
 * Fast deterministic string hash (SHA-256 like hex output)
 */
export function fastDeterministicHash(str: string): string {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  let h3 = 0x811c9dc5;
  let h4 = 0x9e3779b9;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822519);
    h4 = Math.imul(h4 ^ ch, 3266489917);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 1597334677);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2654435761);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}${hex3}${hex4}`;
}

/**
 * Mask value: keeps first letters only and masks remainder with asterisks
 */
export function maskValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.length <= 1) return str;

  // Email masking: user@domain.com -> u***@d***.com
  if (str.includes('@')) {
    const [local, domain] = str.split('@');
    const maskedLocal = local.length > 2 ? `${local.slice(0, 1)}${'*'.repeat(local.length - 2)}${local.slice(-1)}` : `${local[0]}*`;
    const domainParts = domain.split('.');
    const maskedDomain = domainParts.map((part, idx) => {
      if (idx === domainParts.length - 1) return part; // keep .com / .org
      return part.length > 2 ? `${part[0]}${'*'.repeat(part.length - 1)}` : part;
    }).join('.');
    return `${maskedLocal}@${maskedDomain}`;
  }

  // Multi-word name masking: "Johnathan Doe" -> "Jo*** D***"
  if (str.includes(' ')) {
    return str.split(' ').map((word) => {
      if (word.length <= 2) return word;
      return `${word.slice(0, 2)}${'*'.repeat(Math.max(1, word.length - 2))}`;
    }).join(' ');
  }

  // Single word / number masking: "12345678" -> "12******", "Password" -> "Pa******"
  const prefixLen = Math.min(2, Math.max(1, Math.floor(str.length / 4)));
  return `${str.slice(0, prefixLen)}${'*'.repeat(Math.max(1, str.length - prefixLen))}`;
}

/**
 * Laplace noise generator for Differential Privacy (b = sensitivity / epsilon)
 */
export function addLaplaceNoise(val: number, epsilon: number, sensitivity: number = 1): number {
  if (epsilon <= 0) return val;
  const b = sensitivity / Math.max(0.01, epsilon);
  // Uniform draw u in (-0.5, 0.5)
  const u = Math.random() - 0.5;
  const noise = -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  return val + noise;
}

/**
 * Apply privacy transform to a generated column value
 */
export function applyPrivacyTransform(val: any, col: ColumnDefinition): any {
  if (val === null || val === undefined) return val;

  // 1. Laplace noise for numeric columns if laplaceEpsilon configured
  if (typeof val === 'number' && col.laplaceEpsilon && col.laplaceEpsilon > 0) {
    const range = (col.max !== undefined && col.min !== undefined) ? Math.abs(col.max - col.min) : 100;
    const sensitivity = Math.max(1, range / 10);
    const noisy = addLaplaceNoise(val, col.laplaceEpsilon, sensitivity);
    if (col.type === 'integer') {
      val = Math.round(noisy);
    } else {
      const precision = col.precision ?? 2;
      val = Number(noisy.toFixed(precision));
    }
  }

  // 2. Privacy option: none, mask, hash
  if (col.privacy === 'mask') {
    return maskValue(val);
  }
  if (col.privacy === 'hash') {
    return fastDeterministicHash(String(val));
  }

  return val;
}

const UNICODE_EMOJI_SAMPLES = [
  'José 🚀', 'Müller ⚡', '🎉 Null Pointer 💥', '李小龙 🐉',
  'Renée 💎', '⚠️ SQL_INJECT\'--', 'O\'Connor 🍀', 'Böhme 🌟',
  'مرحبا 🌍', 'Søren ☕'
];

const VERY_LONG_TEXT_SAMPLE =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

/**
 * Apply Edge Cases if enabled
 */
export function applyEdgeCaseInjection(
  val: any,
  col: ColumnDefinition,
  rowIndex: number,
  settings: GenerationSettings,
  prevVal?: any
): any {
  if (!settings.injectEdgeCases) return val;

  // Rate by intensity: low = 5%, medium = 15%, high = 30%
  const rate = settings.edgeCaseIntensity === 'high' ? 0.3 : settings.edgeCaseIntensity === 'medium' ? 0.15 : 0.05;
  if (Math.random() >= rate) return val;

  const types = settings.edgeCaseTypes || {
    nulls: true,
    extremeValues: true,
    duplicates: true,
    unicodeEmoji: true,
    veryLongText: true,
    invalidFormats: true,
  };

  const enabledOptions: string[] = [];
  if (types.nulls) enabledOptions.push('nulls');
  if (types.extremeValues) enabledOptions.push('extremeValues');
  if (types.duplicates && prevVal !== undefined) enabledOptions.push('duplicates');
  if (types.unicodeEmoji) enabledOptions.push('unicodeEmoji');
  if (types.veryLongText) enabledOptions.push('veryLongText');
  if (types.invalidFormats) enabledOptions.push('invalidFormats');

  if (enabledOptions.length === 0) return val;

  const chosen = enabledOptions[Math.floor(Math.random() * enabledOptions.length)];

  switch (chosen) {
    case 'nulls': {
      const nullChoices = [null, '', 'NULL', 'N/A', 'undefined'];
      return nullChoices[Math.floor(Math.random() * nullChoices.length)];
    }

    case 'extremeValues': {
      if (typeof val === 'number') {
        const extremes = [-999999, 999999999, 0, -1, 1000000000];
        return extremes[Math.floor(Math.random() * extremes.length)];
      }
      if (col.type === 'date') {
        return Math.random() > 0.5 ? '1800-01-01' : '2999-12-31';
      }
      return '999999999999';
    }

    case 'duplicates':
      return prevVal;

    case 'unicodeEmoji': {
      return UNICODE_EMOJI_SAMPLES[Math.floor(Math.random() * UNICODE_EMOJI_SAMPLES.length)];
    }

    case 'veryLongText':
      return VERY_LONG_TEXT_SAMPLE;

    case 'invalidFormats': {
      if (col.type === 'email') return 'invalid@@broken-domain';
      if (col.type === 'phone') return 'NOT-A-PHONE-000';
      if (col.type === 'uuid') return 'not-a-valid-uuid-string';
      if (col.type === 'date') return '99/99/9999';
      if (col.type === 'integer' || col.type === 'float') return -9999;
      return '###INVALID###';
    }

    default:
      return val;
  }
}
