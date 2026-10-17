import React, { useState } from 'react';
import { Lock, Unlock, X, ShieldAlert, KeyRound, Loader2 } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (token?: string) => void;
  onShowToast: (msg: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  onShowToast,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPin = pin.trim();
    if (!trimmedPin) {
      setErrorMsg('Please enter the security PIN.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: trimmedPin }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPin('');
        setErrorMsg('');
        onUnlock(data.token);
        onClose();
        onShowToast('Master Admin Console successfully unlocked!');
      } else {
        setErrorMsg(data.error || 'Invalid master security credentials.');
      }
    } catch {
      setErrorMsg('Unable to reach authentication server. Please check connection.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <div className="glass-card max-w-md w-full rounded-3xl p-5 sm:p-6 border border-cyan-400/40 shadow-2xl space-y-4 bg-slate-950/95">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-[#00f2fe] flex items-center justify-center border border-cyan-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 id="admin-modal-title" className="font-black text-sm sm:text-base text-white">Security Clearance Required</h3>
              <p className="text-[11px] text-slate-400">Master Editorial & Console Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Admin Modal"
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="admin-pin" className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#00f2fe]" /> Enter Master Security Key
            </label>
            <input
              id="admin-pin"
              type="password"
              placeholder="••••••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-xl bg-black border border-white/20 px-4 py-3 text-sm text-white focus:border-[#00f2fe] outline-none"
              autoFocus
            />
            {errorMsg && (
              <p className="text-xs text-red-400 font-semibold mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> {errorMsg}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="grad-btn px-5 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock Console</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
