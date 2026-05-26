import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isDeleting?: boolean;
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message, isDeleting = false }: ConfirmDeleteModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0D0D0F] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#EF6461]/10 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-[#EF6461]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white/90 truncate">{title}</h3>
                                <button
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    className="p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="mt-2 text-sm text-white/60 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-[#09090B] border-t border-white/5 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-[#EF6461] hover:bg-[#D95552] text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDeleting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
