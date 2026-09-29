import React from 'react';
import { Sun, Moon, Droplets, Sunset } from 'lucide-react';
import { Theme } from '../types';

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const THEMES: { id: Theme; label: string; icon: React.FC<{ className?: string }>; colorClass: string }[] = [
  {
    id: 'light',
    label: 'Light',
    icon: Sun,
    colorClass: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    id: 'dark',
    label: 'Dark',
    icon: Moon,
    colorClass: 'bg-slate-800 text-slate-200 border-slate-700',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    icon: Droplets,
    colorClass: 'bg-teal-950 text-teal-300 border-teal-700',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    icon: Sunset,
    colorClass: 'bg-orange-950 text-orange-300 border-orange-700',
  },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
  return (
    <div
      className="inline-flex items-center p-1 rounded-lg border transition-all"
      style={{
        backgroundColor: 'var(--bg-surface-subtle)',
        borderColor: 'var(--border-subtle)',
      }}
      role="radiogroup"
      aria-label="Color Theme Selection"
    >
      {THEMES.map((t) => {
        const IconComponent = t.icon;
        const isActive = currentTheme === t.id;

        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onThemeChange(t.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? 'shadow-sm text-[var(--accent-foreground)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{
              backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
            }}
            title={`Switch to ${t.label} theme`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
