import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, LogOut, Settings, ShieldCheck, ChevronDown, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from './ProfileModal';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isOpen]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SF';

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label="User account menu"
          className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border transition-all cursor-pointer hover:border-[var(--border-hover)]"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Avatar Initials Badge */}
          <div
            className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shadow-xs"
            style={{
              backgroundColor: user.isGuest ? 'rgba(245, 158, 11, 0.2)' : 'var(--accent-primary)',
              color: user.isGuest ? '#f59e0b' : 'var(--accent-foreground)',
            }}
          >
            {user.isGuest ? 'G' : initials}
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-[var(--text-primary)] leading-none max-w-[120px] truncate">
              {user.name}
            </span>
            {user.isGuest && (
              <span className="text-[9px] font-mono text-amber-400 leading-tight">Guest Mode</span>
            )}
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 flex flex-col space-y-1 animate-in fade-in zoom-in-95 duration-100"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* User Identity Header */}
            <div
              className="p-3 rounded-xl border space-y-0.5"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">{user.name}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono truncate">{user.email}</div>
              {user.isGuest && (
                <div className="pt-1.5 mt-1 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] text-amber-400 font-semibold block">
                    Data saved locally in this browser.
                  </span>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                setIsProfileOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer text-left"
            >
              <Settings className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Profile & Account</span>
            </button>

            {user.isGuest && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer text-left"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Permanent Account</span>
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
};
