import React from 'react';
import { LucideIcon, FolderSearch } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderSearch,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border shadow-sm"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--accent-primary)',
        }}
      >
        <Icon className="w-7 h-7" />
      </div>

      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">{description}</p>

      {(actionText || secondaryActionText) && (
        <div className="flex items-center gap-3">
          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {secondaryActionText}
            </button>
          )}

          {actionText && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-[var(--accent-foreground)] shadow-xs transition-transform active:scale-95 cursor-pointer hover:brightness-105"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
