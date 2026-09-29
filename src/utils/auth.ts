import type { PasswordStrength } from '../types/auth';

/**
 * Convert buffer to hexadecimal string
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Convert hexadecimal string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Hash password using Web Crypto PBKDF2 with SHA-256 and 150,000 iterations
 */
export async function hashPassword(
  password: string,
  saltHex?: string
): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 150000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 32 bytes
  );

  return {
    hash: bufferToHex(derivedBits),
    salt: bufferToHex(salt),
  };
}

/**
 * Constant-time comparison to protect against timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify a password against stored PBKDF2 hash and salt
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  try {
    const { hash } = await hashPassword(password, storedSalt);
    return constantTimeCompare(hash, storedHash);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

/**
 * Validate password requirements:
 * - At least 8 characters
 * - Contains at least one letter
 * - Contains at least one number
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  return { isValid: true };
}

/**
 * Calculate password strength score and visual feedback
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const minLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isLong = password.length >= 12;

  let score = 0;
  if (minLength) score++;
  if (hasLetter && hasNumber) score++;
  if (hasSpecial) score++;
  if (isLong) score++;

  let label: PasswordStrength['label'] = 'Very Weak';
  let color = '#ef4444'; // red

  switch (score) {
    case 1:
      label = 'Weak';
      color = '#f97316'; // orange
      break;
    case 2:
      label = 'Fair';
      color = '#eab308'; // yellow
      break;
    case 3:
      label = 'Strong';
      color = '#10b981'; // green
      break;
    case 4:
      label = 'Very Strong';
      color = '#06b6d4'; // cyan
      break;
    default:
      label = 'Very Weak';
      color = '#ef4444';
      break;
  }

  return {
    score,
    label,
    color,
    requirements: {
      minLength,
      hasLetter,
      hasNumber,
      hasSpecial,
    },
  };
}

// -------------------------------------------------------------
// Lockout Management (5 failed attempts -> 60s cooldown)
// -------------------------------------------------------------
interface LockoutEntry {
  attempts: number;
  lockedUntil: number | null;
}

const LOCKOUT_KEY = 'synthforge_auth_lockouts';

function getLockoutMap(): Record<string, LockoutEntry> {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLockoutMap(map: Record<string, LockoutEntry>) {
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(map));
  } catch {}
}

export function getLockoutStatus(email: string): {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
} {
  const normEmail = email.trim().toLowerCase();
  const map = getLockoutMap();
  const entry = map[normEmail];

  if (!entry) {
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }

  if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return { isLocked: true, remainingSeconds, attempts: entry.attempts };
  }

  // Lockout expired
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) {
    entry.lockedUntil = null;
    entry.attempts = 0;
    saveLockoutMap(map);
  }

  return { isLocked: false, remainingSeconds: 0, attempts: entry.attempts || 0 };
}

export function recordFailedAttempt(email: string): {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
} {
  const normEmail = email.trim().toLowerCase();
  const map = getLockoutMap();
  const current = map[normEmail] || { attempts: 0, lockedUntil: null };

  current.attempts += 1;

  if (current.attempts >= 5) {
    current.lockedUntil = Date.now() + 60 * 1000; // 60 seconds
  }

  map[normEmail] = current;
  saveLockoutMap(map);

  return getLockoutStatus(normEmail);
}

export function clearFailedAttempts(email: string): void {
  const normEmail = email.trim().toLowerCase();
  const map = getLockoutMap();
  if (map[normEmail]) {
    delete map[normEmail];
    saveLockoutMap(map);
  }
}
