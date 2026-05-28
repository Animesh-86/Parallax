import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  requireInput?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  requireInput,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState('');

  // Reset input when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="relative bg-[#09090B]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 border-b border-white/5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                      isDanger 
                        ? 'bg-gradient-to-br from-[#EF6461]/20 to-[#9A3412]/20 border-[#EF6461]/30' 
                        : 'bg-gradient-to-br from-[#D4AF37]/20 to-[#A1A1AA]/20 border-[#D4AF37]/30'
                    }`}>
                      <AlertTriangle className={`w-6 h-6 ${isDanger ? 'text-[#EF6461]' : 'text-[#D4AF37]'}`} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                      {title}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all group"
              >
                <X className="w-5 h-5 text-white/60 group-hover:text-white" />
              </button>
            </div>
          </div>

          {/* Form / Content */}
          <div className="px-8 py-6 space-y-6">
            <p className="text-white/70 text-sm leading-relaxed">
              {message}
            </p>

            {requireInput && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/80">
                  Please type <span className="font-bold text-white select-all">{requireInput}</span> to confirm.
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full bg-[#18181B] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-mono text-sm"
                  placeholder={requireInput}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                {cancelText}
              </button>
              <button
                type="button"
                disabled={requireInput ? inputValue !== requireInput : false}
                onClick={() => {
                  if (requireInput && inputValue !== requireInput) return;
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-6 py-3 rounded-xl font-medium text-white transition-all ${
                  requireInput && inputValue !== requireInput
                    ? 'opacity-50 cursor-not-allowed bg-white/5 text-white/40 border border-white/10'
                    : isDanger
                    ? 'bg-[#EF6461]/10 border border-[#EF6461]/30 text-[#EF6461] hover:bg-[#EF6461]/20'
                    : 'bg-[#D4AF37] border border-[#D4AF37] text-black hover:bg-[#D4AF37]/90'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
