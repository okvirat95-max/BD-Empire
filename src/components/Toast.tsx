import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'premium';
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export default function Toast({ toasts, removeToast }: ToastProps) {
  return (
    <div id="toast-container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              layout
              className={`p-4 rounded-xl border backdrop-blur-md flex items-start gap-3 shadow-2xl relative overflow-hidden ${
                toast.type === 'success'
                  ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-100'
                  : toast.type === 'error'
                  ? 'bg-brand-crimson/10 border-brand-crimson/30 text-red-200'
                  : toast.type === 'premium'
                  ? 'bg-amber-950/85 border-brand-gold/30 text-amber-100'
                  : 'bg-slate-900/90 border-brand-blue/30 text-brand-cyan'
              }`}
            >
              {/* Scanline pattern for tech feel */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/[0.02] pointer-events-none" />
              
              <div className="mt-0.5 flex-shrink-0">
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-brand-crimson" />}
                {toast.type === 'premium' && <Zap className="w-5 h-5 text-brand-gold text-neon-glow-cyan" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-brand-cyan" />}
              </div>

              <div className="flex-grow">
                <div className="text-xs font-mono opacity-50 uppercase tracking-widest mb-0.5">
                  {toast.type === 'premium' ? 'SYSTEM PRESTIGE' : 'SYSTEM STATUS'}
                </div>
                <p className="text-sm font-sans font-medium">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/40 hover:text-white/80 transition-colors p-0.5 rounded-md hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress Bar timer indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: 0 }}
                  transition={{ duration: 4, ease: 'linear' }}
                  className={`h-full ${
                    toast.type === 'success'
                      ? 'bg-emerald-400'
                      : toast.type === 'error'
                      ? 'bg-brand-crimson'
                      : toast.type === 'premium'
                      ? 'bg-brand-gold'
                      : 'bg-brand-blue'
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
