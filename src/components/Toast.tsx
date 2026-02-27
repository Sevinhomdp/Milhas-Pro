import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  key?: React.Key;
}

export default function Toast({ message, type }: ToastProps) {
  const typeStyles = {
    info: 'border-amber-500',
    success: 'border-green-500',
    error: 'border-red-500',
    warning: 'border-amber-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border-l-4 text-sm pointer-events-auto max-w-xs",
        typeStyles[type]
      )}
    >
      {message}
    </motion.div>
  );
}
