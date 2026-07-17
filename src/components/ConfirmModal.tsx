import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
}: ConfirmModalProps) {
  // Prevent scrolling on background when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-50 text-red-600 border border-red-100',
          confirmBtn: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500 shadow-sm shadow-red-100',
          accentBorder: 'border-red-500',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white focus:ring-amber-500 shadow-sm shadow-amber-100',
          accentBorder: 'border-amber-500',
        };
      default:
        return {
          iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
          confirmBtn: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white focus:ring-indigo-500 shadow-sm shadow-indigo-100',
          accentBorder: 'border-indigo-500',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-100 overflow-hidden z-10 space-y-4"
          >
            {/* Top decorative line */}
            <div className={`absolute top-0 inset-x-0 h-1.5 border-t-2 ${styles.accentBorder}`} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              aria-label="Fechar modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Icon / Title */}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
                {variant === 'danger' ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-slate-950 text-lg leading-tight">
                  {title}
                </h3>
                <div className="text-slate-500 text-sm leading-relaxed pr-2">
                  {message}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer text-center"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full sm:w-auto px-5 py-2 rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 cursor-pointer text-center ${styles.confirmBtn}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
