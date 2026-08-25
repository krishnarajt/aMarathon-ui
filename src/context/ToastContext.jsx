import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, Info, PartyPopper, X } from 'lucide-react';

const ToastContext = createContext({ toast: () => {} });

const TONES = {
  success: { icon: CircleCheck, bar: 'bg-acid', ink: 'text-acid-text' },
  error: { icon: CircleAlert, bar: 'bg-bad', ink: 'text-bad' },
  info: { icon: Info, bar: 'bg-steel-bright', ink: 'text-ink-2' },
  win: { icon: PartyPopper, bar: 'bg-brand-glow', ink: 'text-brand-glow' },
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message, tone = 'info', { duration = 3600 } = {}) => {
      if (!message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Top on mobile so the bottom tab bar never covers it; bottom-right on
          desktop where there is nothing to collide with. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:inset-auto sm:right-5 sm:bottom-5 sm:top-auto sm:items-end sm:pt-0">
        <AnimatePresence initial={false}>
          {toasts.map(({ id, message, tone }) => {
            const { icon: Icon, bar, ink } = TONES[tone] ?? TONES.info;
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: -18, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.16 } }}
                transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface-2/95 p-3 pr-2 shadow-[var(--shadow-soft)] backdrop-blur-xl"
                role="status"
              >
                <span className={`h-full w-1 shrink-0 self-stretch rounded-full ${bar}`} />
                <Icon size={18} className={`mt-0.5 shrink-0 ${ink}`} aria-hidden />
                <p className="flex-1 text-sm leading-snug text-ink">{message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  className="rounded-lg p-1 text-ink-3 transition-colors hover:text-ink"
                  aria-label="Dismiss"
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
