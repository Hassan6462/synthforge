import React from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['⌘/Ctrl', 'Enter'], description: 'Regenerate synthetic dataset (re-rolls seed)' },
  { keys: ['⌘/Ctrl', 'E'], description: 'Open Export Options dialog' },
  { keys: ['⌘/Ctrl', 'S'], description: 'Save current workspace project as JSON' },
  { keys: ['⌘/Ctrl', 'O'], description: 'Load project JSON file' },
  { keys: ['⌘/Ctrl', 'K'], description: 'Open Keyboard Shortcuts cheat sheet' },
  { keys: ['1'], description: 'Switch to Home Dashboard' },
  { keys: ['2'], description: 'Switch to Tabular Generator' },
  { keys: ['3'], description: 'Switch to Relational Database' },
  { keys: ['4'], description: 'Switch to Complex Documents' },
  { keys: ['5'], description: 'Switch to Data Sources (Upload)' },
  { keys: ['6'], description: 'Switch to EDA Profiler' },
  { keys: ['Esc'], description: 'Close any active modal or drawer' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--bg-surface-elevated)] border text-[var(--accent-primary)]" style={{ borderColor: 'var(--border-subtle)' }}>
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
              <p className="text-xs text-[var(--text-secondary)]">Accelerate your workflow with quick keystrokes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 divide-y divide-[var(--border-subtle)] max-h-[70vh] overflow-y-auto">
          {SHORTCUTS.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5">
              <span className="text-xs text-[var(--text-secondary)]">{item.description}</span>
              <div className="flex items-center gap-1">
                {item.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="px-2 py-1 text-[11px] font-mono font-semibold rounded-md border text-[var(--text-primary)] shadow-2xs"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg text-[var(--accent-foreground)] cursor-pointer"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
