import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Lock, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Danger zone confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsUpdating(true);
    const res = await updateProfile(
      name !== user.name ? name : undefined,
      newPassword || undefined,
      currentPassword || undefined
    );
    setIsUpdating(false);

    if (res.success) {
      toast.success('Profile Updated', 'Your account settings have been saved.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } else {
      setError(res.error || 'Failed to update profile.');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.info('Account Deleted', 'All local data and account credentials were removed.');
      onClose();
    } catch {
      toast.error('Deletion Failed', 'Unable to delete local account.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--bg-surface-elevated)] border text-[var(--accent-primary)]" style={{ borderColor: 'var(--border-subtle)' }}>
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-base font-bold text-[var(--text-primary)]">
                Account & Profile Settings
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">Manage your local credentials and preferences</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User Info Overview */}
          <div className="p-3.5 rounded-xl border flex items-center gap-3" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-subtle)' }}>
            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] text-[var(--accent-foreground)] font-bold text-sm flex items-center justify-center">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">{user.name}</div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono">{user.email}</div>
              {user.isGuest && (
                <span className="inline-block mt-1 text-[10px] font-semibold text-amber-400">
                  Guest Session · Temporary Local Access
                </span>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Password Change (for non-guests) */}
          {!user.isGuest && (
            <div className="pt-3 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Change Password (optional)</span>
              </span>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Required only if changing password"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                  style={{
                    backgroundColor: 'var(--bg-canvas)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border outline-hidden transition-all focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 rounded-xl border text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-foreground)',
              }}
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save Changes</span>}
            </button>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Danger Zone</span>
            </span>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Permanently erase this account and all associated local datasets, schemas, and history stored in this browser.
            </p>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2 px-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                Delete Account & All Local Data
              </button>
            ) : (
              <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 space-y-2">
                <span className="text-xs font-bold text-rose-300">Are you sure? This cannot be undone.</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="py-1.5 px-3 rounded-lg border text-xs font-semibold text-[var(--text-secondary)] cursor-pointer"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Yes, Erase Everything</span>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
