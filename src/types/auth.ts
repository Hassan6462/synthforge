export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  isGuest?: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: number;
}

export interface AuthSession {
  token: string;
  userId: string;
  expiresAt: number;
  rememberMe: boolean;
  isGuest: boolean;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  requirements: {
    minLength: boolean;
    hasLetter: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}
