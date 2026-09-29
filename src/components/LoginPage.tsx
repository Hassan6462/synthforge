import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  ShieldCheck,
  Cpu,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  KeyRound,
  RotateCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Theme } from '../types';
import { calculatePasswordStrength, getLockoutStatus } from '../utils/auth';

interface LoginPageProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ currentTheme, onThemeChange }) => {
  const { login, register, guest, forgotPasswordReset } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register' | 'forgot'>('signin');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Lockout Countdown State
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotFullName, setForgotFullName] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Dynamic Lockout Timer
  useEffect(() => {
    if (!signInEmail) {
      setLockoutRemaining(0);
      return;
    }
    const status = getLockoutStatus(signInEmail);
    setLockoutRemaining(status.remainingSeconds);

    if (status.isLocked) {
      const interval = setInterval(() => {
        const updated = getLockoutStatus(signInEmail);
        setLockoutRemaining(updated.remainingSeconds);
        if (!updated.isLocked) {
          clearInterval(interval);
          setSignInError(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [signInEmail]);

  // Password strength calculation
  const strength = calculatePasswordStrength(regPassword);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    const lock = getLockoutStatus(signInEmail);
    if (lock.isLocked) {
      setSignInError(`Account locked. Try again in ${lock.remainingSeconds} seconds.`);
      return;
    }

    setIsSigningIn(true);
    const res = await login(signInEmail, signInPassword, rememberMe);
    setIsSigningIn(false);

    if (!res.success) {
      setSignInError(res.error || 'Incorrect email or password.');
      const updatedLock = getLockoutStatus(signInEmail);
      if (updatedLock.isLocked) {
        setLockoutRemaining(updatedLock.remainingSeconds);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setIsRegistering(true);
    const res = await register(regName, regEmail, regPassword);
    setIsRegistering(false);

    if (!res.success) {
      setRegError(res.error || 'Failed to create account.');
    }
  };

  const handleDemoFill = () => {
    setMode('signin');
    setSignInEmail('demo@synthforge.app');
    setSignInPassword('Demo12345');
    setSignInError(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    setIsResetting(true);
    const res = await forgotPasswordReset(forgotEmail, forgotFullName, forgotNewPassword);
    setIsResetting(false);

    if (res.success) {
      setForgotSuccess('Password updated successfully! You can now sign in.');
      setTimeout(() => {
        setSignInEmail(forgotEmail);
        setSignInPassword('');
        setMode('signin');
        setForgotSuccess(null);
      }, 2000);
    } else {
      setForgotError(res.error || 'Failed to reset password.');
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col md:flex-row relative font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Floating Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeSwitcher currentTheme={currentTheme} onThemeChange={onThemeChange} />
      </div>

      {/* Left Branded Hero Panel (Hidden on Mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 p-10 xl:p-14 flex-col justify-between border-r relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Subtle background glow */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white font-black text-lg">
            S
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              SynthForge
            </h1>
            <span className="text-xs text-[var(--text-muted)] font-mono">v2.4 Synthetic Engine</span>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="my-auto max-w-lg space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--accent-primary)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>High-Fidelity Synthetic Intelligence</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-[var(--text-primary)]">
            Real-looking data.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
              Zero real records.
            </span>
          </h2>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Generate production-grade tabular datasets, multi-table relational schemas with referential
            integrity, and penny-perfect financial documents—all executed 100% locally in your browser.
          </p>

          {/* 3 Short Feature Highlights */}
          <div className="grid grid-cols-1 gap-4 pt-2">
            <div
              className="p-3.5 rounded-xl border flex items-start gap-3.5 transition-all"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/20 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[var(--text-primary)]">
                  High-Fidelity Tabular & Relational
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Zero orphan foreign keys, realistic distributions, differential privacy noise, and edge case injection.
                </p>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border flex items-start gap-3.5 transition-all"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[var(--text-primary)]">
                  Penny-Perfect Reconciled Docs
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Invoices, bank statements, and audit ledgers computed with exact cent arithmetic and vector PDF rendering.
                </p>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border flex items-start gap-3.5 transition-all"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[var(--text-primary)]">
                  100% Client-Side Privacy
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  PBKDF2 Web Crypto, multi-threaded Web Workers, and in-browser Pyodide Python without external servers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-xs text-[var(--text-muted)] font-mono relative z-10">
          Synthetic Engine · AES/PBKDF2 Security · Offline-First
        </div>
      </div>

      {/* Right Form Card Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-y-auto">
        <div
          className="w-full max-w-md rounded-2xl border shadow-xl p-6 sm:p-8 flex flex-col space-y-6 my-auto"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center gap-2.5 pb-2 border-b border-[var(--border-subtle)]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              S
            </div>
            <div>
              <span className="text-base font-bold text-[var(--text-primary)]">SynthForge</span>
              <span className="block text-[10px] text-[var(--text-muted)]">Local Synthetic Data Studio</span>
            </div>
          </div>

          {/* Form Tabs (Sign in / Create account) */}
          {mode !== 'forgot' && (
            <div
              className="flex items-center p-1 rounded-xl border text-xs font-semibold"
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                onClick={() => {
                  setMode('signin');
                  setSignInError(null);
                  setRegError(null);
                }}
                className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-foreground)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => {
                  setMode('register');
                  setSignInError(null);
                  setRegError(null);
                }}
                className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-foreground)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Create account
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. SIGN IN FORM */}
          {/* ========================================================= */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Welcome back</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Sign in to access your local schemas and generation jobs.
                </p>
              </div>

              {/* Lockout Warning Banner */}
              {lockoutRemaining > 0 && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <div>
                    <span className="font-semibold">Too many failed attempts!</span>
                    <p className="text-[11px] text-red-300">
                      Email locked. Try again in{' '}
                      <span className="font-mono font-bold">{lockoutRemaining}s</span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {signInError && lockoutRemaining <= 0 && (
                <div
                  id="signin-error"
                  role="alert"
                  className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{signInError}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="signin-email"
                  className="text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
                  <input
                    id="signin-email"
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@example.com"
                    aria-invalid={!!signInError}
                    aria-describedby={signInError ? 'signin-error' : undefined}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="signin-password"
                    className="text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotEmail(signInEmail);
                    }}
                    className="text-xs text-[var(--accent-primary)] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
                  <input
                    id="signin-password"
                    type={showSignInPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    aria-invalid={!!signInError}
                    aria-describedby={signInError ? 'signin-error' : undefined}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-2.5 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[var(--border-subtle)] text-[var(--accent-primary)] focus:ring-[var(--border-focus)]"
                  />
                  <span>Remember me (30 days)</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSigningIn || lockoutRemaining > 0}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-foreground)',
                }}
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to SynthForge</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 2. CREATE ACCOUNT FORM */}
          {/* ========================================================= */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Create your account</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Stored securely inside your browser's IndexedDB.
                </p>
              </div>

              {regError && (
                <div
                  id="reg-error"
                  role="alert"
                  className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="reg-name" className="text-xs font-semibold text-[var(--text-secondary)]">
                  Full name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Elena Vance"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="text-xs font-semibold text-[var(--text-secondary)]">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="elena@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-password"
                  className="text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Password (min 8 chars, 1 letter, 1 number)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-2.5 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {regPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Strength:</span>
                      <span className="font-semibold" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className="rounded-full transition-all"
                          style={{
                            backgroundColor: bar <= strength.score ? strength.color : 'var(--border-subtle)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-confirm-password"
                  className="text-xs font-semibold text-[var(--text-secondary)]"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
                  <input
                    id="reg-confirm-password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-foreground)',
                }}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 3. FORGOT PASSWORD (LOCAL DEMO FLOW) */}
          {/* ========================================================= */}
          {mode === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Reset password</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Confirm your registered full name to set a new password locally.
                </p>
              </div>

              {forgotSuccess && (
                <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotError && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Registered email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Your full name (identity verification)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={forgotFullName}
                    onChange={(e) => setForgotFullName(e.target.value)}
                    placeholder="Enter the full name on the account"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  New password (min 8 chars, 1 letter, 1 number)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setForgotError(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-foreground)',
                  }}
                >
                  {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Update Password</span>}
                </button>
              </div>
            </form>
          )}

          {/* Quick Action Helpers (Try Demo / Continue as Guest) */}
          <div className="pt-2 border-t space-y-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDemoFill}
                className="flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Try demo account</span>
              </button>

              <button
                type="button"
                onClick={guest}
                className="flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-emerald-500 hover:text-emerald-400"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Continue as guest</span>
              </button>
            </div>

            {/* Disclaimer */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] text-center pt-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Demo authentication: accounts are stored only in this browser.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
